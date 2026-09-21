import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  formatDateInTimeZone,
  generateAvailableSlots,
  localDateTimeToUtc,
} from "@/lib/booking/availability";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  salonId: z.string().min(1),
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  customerPhone: z.string().min(6).max(32),
  customerName: z.string().trim().min(1).max(120),
  startAt: z.string().datetime({ offset: true }),
  source: z.enum(["whatsapp", "app", "manual"]).default("whatsapp"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datele programării sunt invalide." }, { status: 400 });
  }

  const input = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();
    const [{ data: salon }, { data: barber }, { data: service }] = await Promise.all([
      supabase.from("salons").select("id, timezone").eq("id", input.salonId).maybeSingle(),
      supabase
        .from("barbers")
        .select("id, salon_id")
        .eq("id", input.barberId)
        .eq("salon_id", input.salonId)
        .maybeSingle(),
      supabase
        .from("services")
        .select(
          "id, salon_id, duration_min, price, active, buffer_before_min, buffer_after_min",
        )
        .eq("id", input.serviceId)
        .eq("salon_id", input.salonId)
        .eq("active", true)
        .maybeSingle(),
    ]);

    if (!salon || !barber || !service) {
      return NextResponse.json({ error: "Salon, frizer sau serviciu invalid." }, { status: 404 });
    }

    const { data: mappings, error: mappingsError } = await supabase
      .from("barber_services")
      .select("service_id")
      .eq("barber_id", input.barberId);
    if (mappingsError) throw mappingsError;
    if (mappings?.length && !mappings.some((row) => row.service_id === input.serviceId)) {
      return NextResponse.json(
        { error: "Frizerul selectat nu oferă acest serviciu." },
        { status: 409 },
      );
    }

    const timezone = String(salon.timezone || "Europe/Bucharest");
    const requestedStart = new Date(input.startAt);
    const localDate = formatDateInTimeZone(requestedStart, timezone);
    const weekday = new Date(`${localDate}T12:00:00Z`).getUTCDay();
    const dayStart = localDateTimeToUtc(localDate, "00:00:00", timezone);
    const tomorrowProbe = new Date(dayStart.getTime() + 36 * 60 * 60 * 1000);
    const nextLocalDate = formatDateInTimeZone(tomorrowProbe, timezone);
    const dayEnd = localDateTimeToUtc(nextLocalDate, "00:00:00", timezone);

    const [hoursResult, timeOffResult, appointmentsResult, whatsappResult] = await Promise.all([
      supabase
        .from("working_hours")
        .select("start_time, end_time")
        .eq("barber_id", input.barberId)
        .eq("weekday", weekday)
        .eq("active", true),
      supabase
        .from("time_off")
        .select("start_at, end_at")
        .eq("barber_id", input.barberId)
        .lt("start_at", dayEnd.toISOString())
        .gt("end_at", dayStart.toISOString()),
      supabase
        .from("appointments")
        .select("start_at, end_at, status")
        .eq("barber_id", input.barberId)
        .lt("start_at", dayEnd.toISOString())
        .gt("end_at", dayStart.toISOString())
        .not("status", "in", '("anulat","no-show")'),
      supabase
        .from("whatsapp_accounts")
        .select("minimum_notice_minutes, booking_horizon_days")
        .eq("salon_id", input.salonId)
        .maybeSingle(),
    ]);

    const firstError =
      hoursResult.error ?? timeOffResult.error ?? appointmentsResult.error ?? whatsappResult.error;
    if (firstError) throw firstError;

    const now = new Date();
    const minimumNotice = Number(whatsappResult.data?.minimum_notice_minutes ?? 0);
    const notBefore = new Date(now.getTime() + minimumNotice * 60_000);
    const horizonDays = Number(whatsappResult.data?.booking_horizon_days ?? 60);
    if (requestedStart.getTime() > now.getTime() + horizonDays * 86_400_000) {
      return NextResponse.json({ error: "Data depășește perioada maximă de rezervare." }, { status: 409 });
    }

    const blocked = [
      ...(timeOffResult.data ?? []).map((row) => ({
        start: new Date(row.start_at),
        end: new Date(row.end_at),
      })),
      ...(appointmentsResult.data ?? []).map((row) => ({
        start: new Date(row.start_at),
        end: new Date(row.end_at),
      })),
    ];

    const validSlots = generateAvailableSlots({
      date: localDate,
      timezone,
      workingWindows: (hoursResult.data ?? []).map((row) => ({
        startTime: row.start_time,
        endTime: row.end_time,
      })),
      blocked,
      durationMinutes: Number(service.duration_min),
      bufferBeforeMinutes: Number(service.buffer_before_min ?? 0),
      bufferAfterMinutes: Number(service.buffer_after_min ?? 0),
      slotStepMinutes: 10,
      notBefore,
    });

    const selected = validSlots.find(
      (slot) => slot.start.getTime() === requestedStart.getTime(),
    );
    if (!selected) {
      return NextResponse.json(
        { error: "Ora nu mai este disponibilă. Cere din nou lista de sloturi." },
        { status: 409 },
      );
    }

    const appointmentId = `apt-${randomUUID()}`;
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        id: appointmentId,
        salon_id: input.salonId,
        barber_id: input.barberId,
        service_id: input.serviceId,
        client_id: null,
        client_name: input.customerName,
        client_phone: input.customerPhone,
        start_at: selected.start.toISOString(),
        end_at: selected.end.toISOString(),
        status: "confirmat",
        price: service.price,
        source: input.source,
      })
      .select("id, salon_id, barber_id, service_id, start_at, end_at, status, price, source")
      .single();

    if (insertError) {
      // PostgreSQL exclusion_violation: another request won the race for the slot.
      if (insertError.code === "23P01") {
        return NextResponse.json(
          { error: "Ora tocmai a fost ocupată. Alege un alt slot." },
          { status: 409 },
        );
      }
      throw insertError;
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("[appointments:create]", error);
    return NextResponse.json(
      { error: "Programarea nu a putut fi creată momentan." },
      { status: 503 },
    );
  }
}
