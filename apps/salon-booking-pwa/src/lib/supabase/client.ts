import { createBrowserClient } from "@supabase/ssr";

import { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./config";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Client Supabase pentru componente client. Aruncă eroare dacă e apelat fără
 * variabilele de mediu setate — verifică mereu `isSupabaseConfigured()` întâi.
 */
export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase nu este configurat (lipsesc variabilele de mediu).");
  }
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
