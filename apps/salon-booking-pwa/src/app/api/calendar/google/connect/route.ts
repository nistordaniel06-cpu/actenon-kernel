import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { buildGoogleOAuthUrl } from "@/lib/calendar/google";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const barberId = request.nextUrl.searchParams.get("barberId");
  if (!barberId) return NextResponse.json({ error: "barberId lipsește." }, { status: 400 });

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });

  const { data: barber } = await supabase
    .from("barbers")
    .select("id, salon_id, profile_id")
    .eq("id", barberId)
    .maybeSingle();
  if (!barber) return NextResponse.json({ error: "Frizer inexistent." }, { status: 404 });

  const { data: salon } = await supabase
    .from("salons")
    .select("owner_id")
    .eq("id", barber.salon_id)
    .single();
  if (barber.profile_id !== user.id && salon?.owner_id !== user.id) {
    return NextResponse.json({ error: "Nu ai acces la calendarul acestui frizer." }, { status: 403 });
  }

  const state = randomUUID();
  const cookiePayload = Buffer.from(JSON.stringify({ state, barberId }), "utf8").toString("base64url");
  const response = NextResponse.redirect(buildGoogleOAuthUrl(state));
  response.cookies.set("nearcut_google_oauth", cookiePayload, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/calendar/google",
    maxAge: 10 * 60,
  });
  return response;
}
