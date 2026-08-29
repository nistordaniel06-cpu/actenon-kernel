import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./config";
import { fetchWithTimeout } from "./fetch-with-timeout";

/**
 * Client Supabase pentru Server Components / Route Handlers. Aruncă eroare
 * dacă e apelat fără variabilele de mediu setate — verifică mereu
 * `isSupabaseConfigured()` întâi.
 */
export async function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase nu este configurat (lipsesc variabilele de mediu).");
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // apelat dintr-un Server Component fără voie să seteze cookie-uri;
          // sesiunea tot va fi împrospătată de middleware la request-ul următor
        }
      },
    },
  });
}
