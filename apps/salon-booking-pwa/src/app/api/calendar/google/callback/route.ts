import { NextRequest, NextResponse } from "next/server";

import { exchangeGoogleCode } from "@/lib/calendar/google";
import { encryptSecret } from "@/lib/security/secrets";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function redirectToApp(request: NextRequest, result: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
  return NextResponse.redirect(`${base}/salon-pro?google=${encodeURIComponent(result)}`);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthCookie = request.cookies.get("nearcut_google_oauth")?.value;
  if (!code || !state || !oauthCookie) return redirectToApp(request, "invalid_state");

  let cookieState: { state: string; barberId: string };
  try {
    cookieState = JSON.parse(Buffer.from(oauthCookie, "base64url").toString("utf8"));
  } catch {
    return redirectToApp(request, "invalid_state");
  }
  if (cookieState.state !== state || !cookieState.barberId) {
    return redirectToApp(request, "invalid_state");
  }

  try {
    const userClient = await getSupabaseServerClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return redirectToApp(request, "unauthorized");

    const { data: barber } = await userClient
      .from("barbers")
      .select("id, salon_id, profile_id")
      .eq("id", cookieState.barberId)
      .maybeSingle();
    if (!barber) return redirectToApp(request, "barber_not_found");

    const { data: salon } = await userClient
      .from("salons")
      .select("owner_id")
      .eq("id", barber.salon_id)
      .single();
    if (barber.profile_id !== user.id && salon?.owner_id !== user.id) {
      return redirectToApp(request, "forbidden");
    }

    const tokens = await exchangeGoogleCode(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return redirectToApp(request, "missing_refresh_token");
    }

    const admin = getSupabaseAdminClient();
    const { error } = await admin.from("calendar_connections").upsert(
      {
        barber_id: barber.id,
        provider: "google",
        calendar_id: "primary",
        access_token_encrypted: encryptSecret(tokens.access_token),
        refresh_token_encrypted: encryptSecret(tokens.refresh_token),
        expires_at: new Date(Date.now() + Number(tokens.expires_in ?? 3600) * 1000).toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barber_id,provider" },
    );
    if (error) throw error;

    const response = redirectToApp(request, "connected");
    response.cookies.delete("nearcut_google_oauth");
    return response;
  } catch (error) {
    console.error("[calendar:google:callback]", error);
    return redirectToApp(request, "error");
  }
}
