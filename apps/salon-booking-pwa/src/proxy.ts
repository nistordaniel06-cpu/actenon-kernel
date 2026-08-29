import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";

// Împrospătează sesiunea Supabase pe fiecare request. Dacă aplicația nu are
// încă variabilele de mediu setate, nu face nimic — comportamentul actual pe
// date mock rămâne neschimbat.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    console.warn("[supabase] împrospătarea sesiunii a eșuat, cererea continuă neschimbată:", error);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|manifest.webmanifest).*)"],
};
