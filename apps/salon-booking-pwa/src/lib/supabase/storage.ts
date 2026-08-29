"use client";

import { getSupabaseBrowserClient } from "./client";

const BUCKET = "media";

/**
 * Încarcă o imagine în bucket-ul public `media` și întoarce URL-ul public.
 * Aruncă eroare la eșec — apelantul decide fallback-ul (de regulă, același
 * mesaj afișat înainte de conectarea Supabase Storage).
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split(".").pop() || "jpg";
  const key = `${path}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}
