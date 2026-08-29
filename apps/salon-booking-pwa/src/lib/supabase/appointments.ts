"use client";

import { Appointment, AppointmentStatus } from "@/lib/types";
import { getSupabaseBrowserClient } from "./client";
import { isSupabaseConfigured } from "./config";

// Oglindește cele patru mutații de programări din store-ul Zustand către
// Supabase, când e configurat. Eșuează silențios (doar console.warn) — starea
// locală rămâne mereu sursa de adevăr pentru UI, indiferent dacă backend-ul
// real e disponibil sau dacă utilizatorul nu e încă autentificat (RLS respinge
// scrierea fără sesiune, ceea ce e comportamentul corect, nu o eroare de fixat).

function warn(action: string, error: unknown) {
  console.warn(`[supabase] ${action} a eșuat, starea locală rămâne neschimbată:`, error);
}

export async function mirrorCreateAppointment(appointment: Appointment) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("appointments").insert({
      id: appointment.id,
      salon_id: appointment.salonId,
      barber_id: appointment.barberId,
      service_id: appointment.serviceId,
      client_id: user.id,
      client_name: appointment.clientName,
      client_avatar: appointment.clientAvatar,
      start_at: appointment.startIso,
      end_at: appointment.endIso,
      status: appointment.status,
      price: appointment.price,
      is_home_service: appointment.isHomeService ?? false,
      address: appointment.address,
      travel_fee: appointment.travelFee,
    });
  } catch (error) {
    warn("crearea programării", error);
  }
}

export async function mirrorAppointmentStatus(id: string, status: AppointmentStatus) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("appointments").update({ status }).eq("id", id);
  } catch (error) {
    warn("actualizarea statusului", error);
  }
}

export async function mirrorAppointmentReschedule(id: string, startIso: string, endIso: string) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from("appointments")
      .update({ start_at: startIso, end_at: endIso, status: "confirmat" })
      .eq("id", id);
  } catch (error) {
    warn("reprogramarea", error);
  }
}
