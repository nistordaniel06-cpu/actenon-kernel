"use client";

import { getSupabaseBrowserClient } from "./client";
import { isSupabaseConfigured } from "./config";

// Oglindește, best-effort, actualizările de fotografii (copertă/galerie salon,
// portofoliu frizer) către Postgres — la fel ca mirror-ul programărilor din
// src/lib/supabase/appointments.ts. Starea locală rămâne sursa de adevăr pentru UI.

function warn(action: string, error: unknown) {
  console.warn(`[supabase] ${action} a eșuat, starea locală rămâne neschimbată:`, error);
}

export async function mirrorSalonCoverImage(salonId: string, coverImage: string) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("salons").update({ cover_image: coverImage }).eq("id", salonId);
  } catch (error) {
    warn("actualizarea copertei salonului", error);
  }
}

export async function mirrorSalonGallery(salonId: string, gallery: string[]) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("salons").update({ gallery }).eq("id", salonId);
  } catch (error) {
    warn("actualizarea galeriei salonului", error);
  }
}

export async function mirrorBarberGallery(barberId: string, gallery: string[]) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("barbers").update({ gallery }).eq("id", barberId);
  } catch (error) {
    warn("actualizarea portofoliului frizerului", error);
  }
}
