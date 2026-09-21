import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseUrl } from "./config";
import type { Database } from "./types";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Service-role client for trusted server routes only (WhatsApp webhooks,
 * public guest booking and calendar feeds). Never import this module from a
 * Client Component and never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server config lipsește (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  if (!adminClient) {
    adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
