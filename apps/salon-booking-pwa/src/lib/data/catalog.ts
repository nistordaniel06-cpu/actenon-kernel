import { cache } from "react";

import { Barber, BusinessClient, Salon } from "@/lib/types";
import { salons as mockSalons, getSalon as getMockSalon } from "@/lib/mock/salons";
import { getBarbersForSalon as getMockBarbersForSalon } from "@/lib/mock/barbers";
import { shopProducts as mockShopProducts } from "@/lib/mock/shop";
import { staff as mockStaff } from "@/lib/mock/staff";
import { businessClients as mockBusinessClients } from "@/lib/mock/business";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { mapBarber, mapBusinessClient, mapSalon, mapService, mapShopProduct, mapStaff } from "./mappers";

// Strat de citire pentru catalog (saloane, frizeri, servicii, magazin,
// personal, clienți): dacă Supabase e configurat, interoghează Postgres;
// altfel cade pe datele mock existente. Funcțiile sunt înfășurate în
// `cache()` din React — o pagină și layout-ul ei pot cere același salon fără
// să dubleze cererea către Postgres în cadrul aceluiași randament de request.

export const getSalons = cache(async (): Promise<Salon[]> => {
  if (!isSupabaseConfigured()) return mockSalons;
  try {
    const supabase = await getSupabaseServerClient();
    const [{ data: salonRows, error: salonsError }, { data: barberRows }, { data: serviceRows }] =
      await Promise.all([
        supabase.from("salons").select("*"),
        supabase.from("barbers").select("*"),
        supabase.from("services").select("*").eq("active", true),
      ]);
    if (salonsError || !salonRows) throw salonsError ?? new Error("Fără saloane");

    return salonRows.map((row) =>
      mapSalon(
        row,
        (serviceRows ?? []).filter((s) => s.salon_id === row.id).map(mapService),
        (barberRows ?? []).filter((b) => b.salon_id === row.id).map(mapBarber),
      ),
    );
  } catch (error) {
    console.warn("[supabase] citirea saloanelor a eșuat, folosesc datele mock:", error);
    return mockSalons;
  }
});

// Salonul și echipa lui sunt aproape mereu cerute împreună (profil, rezervare);
// o singură funcție evită un al doilea drum dus-întors pentru frizeri.
export const getSalonWithBarbers = cache(
  async (id: string): Promise<{ salon: Salon; barbers: Barber[] } | undefined> => {
    if (!isSupabaseConfigured()) {
      const salon = getMockSalon(id);
      if (!salon) return undefined;
      return { salon, barbers: getMockBarbersForSalon(id) };
    }
    try {
      const supabase = await getSupabaseServerClient();
      const { data: salonRow, error } = await supabase.from("salons").select("*").eq("id", id).single();
      if (error || !salonRow) throw error ?? new Error("Salon inexistent");

      const [{ data: barberRows }, { data: serviceRows }] = await Promise.all([
        supabase.from("barbers").select("*").eq("salon_id", id),
        supabase.from("services").select("*").eq("salon_id", id).eq("active", true),
      ]);

      const barbers = (barberRows ?? []).map(mapBarber);
      const salon = mapSalon(salonRow, (serviceRows ?? []).map(mapService), barbers);
      return { salon, barbers };
    } catch (error) {
      console.warn(`[supabase] citirea salonului ${id} a eșuat, folosesc datele mock:`, error);
      const salon = getMockSalon(id);
      if (!salon) return undefined;
      return { salon, barbers: getMockBarbersForSalon(id) };
    }
  },
);

export const getShopProducts = cache(async () => {
  if (!isSupabaseConfigured()) return mockShopProducts;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from("shop_products").select("*");
    if (error || !data) throw error ?? new Error("Fără produse");
    return data.map(mapShopProduct);
  } catch (error) {
    console.warn("[supabase] citirea magazinului a eșuat, folosesc datele mock:", error);
    return mockShopProducts;
  }
});

export const getStaffForSalon = cache(async (salonId: string) => {
  if (!isSupabaseConfigured()) return mockStaff;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from("staff").select("*").eq("salon_id", salonId);
    if (error || !data) throw error ?? new Error("Fără personal");
    return data.map(mapStaff);
  } catch (error) {
    console.warn(`[supabase] citirea personalului pentru ${salonId} a eșuat, folosesc datele mock:`, error);
    return mockStaff;
  }
});

// Lista de clienți e derivată din programări (view-ul salon_clients), nu
// stocată separat — pe un proiect Supabase nou, fără programări reale încă,
// va fi goală. Asta e corect: nu inventăm clienți.
export const getBusinessClients = cache(async (salonId: string): Promise<BusinessClient[]> => {
  if (!isSupabaseConfigured()) return mockBusinessClients;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: rows, error } = await supabase.from("salon_clients").select("*").eq("salon_id", salonId);
    if (error || !rows) throw error ?? new Error("Fără clienți");

    const { data: serviceRows } = await supabase.from("services").select("*").eq("salon_id", salonId);
    const serviceNameById = new Map((serviceRows ?? []).map((s) => [s.id, s.name]));

    return rows.map((row) =>
      mapBusinessClient(row, (row.favorite_service_id && serviceNameById.get(row.favorite_service_id)) || "—"),
    );
  } catch (error) {
    console.warn(`[supabase] citirea clienților pentru ${salonId} a eșuat, folosesc datele mock:`, error);
    return mockBusinessClients;
  }
});
