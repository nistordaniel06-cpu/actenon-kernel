"use client";

import { getSupabaseBrowserClient } from "./client";
import { AppRole } from "./types";

export async function signInWithEmail(email: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function signOutSupabase() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

export async function getCurrentProfile() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function setProfileRole(role: AppRole) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ role }).eq("id", user.id);
}
