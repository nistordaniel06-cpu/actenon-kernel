import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function icsEscape(value: unknown) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  try {
    const supabase = getSupabaseAdminClient();
    const { data: connection, error: connectionError } = await supabase
      .from("calendar_connections")
      .select("barber_id")
      .eq("provider", "apple_ics")
      .eq("subscription_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (connectionError) throw connectionError;
    if (!connection) return new NextResponse("Calendar inexistent", { status: 404 });

    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .select("id, name, salon_id")
      .eq("id", connection.barber_id)
      .single();
    if (barberError) throw barberError;

    const [{ data: salon, error: salonError }, { data: appointments, error: appointmentsError }] =
      await Promise.all([
        supabase.from("salons").select("name, address").eq("id", barber.salon_id).single(),
        supabase
          .from("appointments")
          .select("id, client_name, service_id, start_at, end_at, status")
          .eq("barber_id", barber.id)
          .not("status", "in", '("anulat","no-show")')
          .gte("end_at", new Date(Date.now() - 30 * 86_400_000).toISOString())
          .lte("start_at", new Date(Date.now() + 370 * 86_400_000).toISOString())
          .order("start_at", { ascending: true }),
      ]);

    if (salonError || appointmentsError) throw salonError ?? appointmentsError;

    const serviceIds = [...new Set((appointments ?? []).map((item) => item.service_id))];
    const serviceNames = new Map<string, string>();
    if (serviceIds.length) {
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("id, name")
        .in("id", serviceIds);
      if (servicesError) throw servicesError;
      for (const service of services ?? []) serviceNames.set(service.id, service.name);
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NearCut//Barber Calendar//RO",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${icsEscape(`${salon?.name ?? "NearCut"} — ${barber.name}`)}`,
      ...((appointments ?? []).flatMap((appointment) => [
        "BEGIN:VEVENT",
        `UID:${icsEscape(`${appointment.id}@nearcut`)}`,
        `DTSTAMP:${toIcsDate(new Date())}`,
        `DTSTART:${toIcsDate(appointment.start_at)}`,
        `DTEND:${toIcsDate(appointment.end_at)}`,
        `SUMMARY:${icsEscape(`${serviceNames.get(appointment.service_id) ?? "Programare"} — ${appointment.client_name}`)}`,
        `DESCRIPTION:${icsEscape(`Programare NearCut • ${appointment.status}`)}`,
        `LOCATION:${icsEscape(salon?.address ?? "")}`,
        "END:VEVENT",
      ])),
      "END:VCALENDAR",
    ];

    return new NextResponse(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="nearcut-calendar.ics"',
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[calendar:apple]", error);
    return new NextResponse("Calendar indisponibil", { status: 503 });
  }
}
