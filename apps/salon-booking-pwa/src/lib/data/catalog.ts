import { Barber, Salon, Service } from "@/lib/types";
import { salons as mockSalons, getSalon as getMockSalon } from "@/lib/mock/salons";
import { getBarbersForSalon as getMockBarbersForSalon } from "@/lib/mock/barbers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BarberRow, SalonRow, ServiceRow } from "@/lib/supabase/types";

// Strat de citire pentru catalog (saloane, frizeri, servicii): dacă Supabase e
// configurat, interoghează Postgres; altfel cade pe datele mock existente.
// Distanța nu are încă geolocație reală a device-ului — e calculată față de
// un punct fix din centrul Bucureștiului, ca aproximare până la acea etapă.

const BUCHAREST_REFERENCE = { lat: 44.4325, lng: 26.1039 };

function distanceKmFrom(lat: number, lng: number) {
  const R = 6371;
  const dLat = ((lat - BUCHAREST_REFERENCE.lat) * Math.PI) / 180;
  const dLng = ((lng - BUCHAREST_REFERENCE.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((BUCHAREST_REFERENCE.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    durationMin: row.duration_min,
    price: Number(row.price),
    description: row.description ?? undefined,
  };
}

function mapBarber(row: BarberRow): Barber {
  return {
    id: row.id,
    salonId: row.salon_id,
    name: row.name,
    avatar: row.avatar ?? "",
    title: row.title ?? "",
    rating: Number(row.rating),
    reviewCount: row.review_count,
    yearsExperience: row.years_experience,
    specialties: row.specialties,
    availableNow: row.available_now,
    nextSlotIso: row.next_slot_at ?? undefined,
  };
}

function mapSalon(row: SalonRow, services: Service[], barbers: Barber[]): Salon {
  const availableNow = barbers.some((b) => b.availableNow);
  const nextAvailableIso =
    barbers
      .map((b) => b.nextSlotIso)
      .filter((iso): iso is string => Boolean(iso))
      .sort()[0] ?? new Date().toISOString();

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    coverImage: row.cover_image ?? "",
    gallery: row.gallery,
    logo: row.logo ?? "",
    rating: Number(row.rating),
    reviewCount: row.review_count,
    distanceKm: distanceKmFrom(row.lat, row.lng),
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    priceLevel: row.price_level,
    availableNow,
    nextAvailableIso,
    openNowUntil: row.open_now_until ?? "",
    tags: row.tags,
    services,
    barberIds: barbers.map((b) => b.id),
    hasHotDeal: row.has_hot_deal,
  };
}

export async function getSalons(): Promise<Salon[]> {
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
}

// Salonul și echipa lui sunt aproape mereu cerute împreună (profil, rezervare);
// o singură funcție evită un al doilea drum dus-întors pentru frizeri.
export async function getSalonWithBarbers(
  id: string,
): Promise<{ salon: Salon; barbers: Barber[] } | undefined> {
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
}
