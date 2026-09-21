import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateAvailableSlots, localDateTimeToUtc } from "@/lib/booking/availability";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  salonId: z.string().min(1),
  serviceId: z.string().min(1),
  barberId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type ServiceTiming = {
  duration_min: number;
  buffer_before_min: number | null;
  buffer_after_min: number | null;
};

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parametri de disponibilitate invalizi." }, { status: 400 });
  }

  const { salonId, serviceId, barberId, date } = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();

    const [{ data: salon, error: salonError }, { data: service, error: serviceError }] =
      await Promise.all([
        supabase.from("salons").select("id, timezone").eq("id", salonId).maybeSingle(),
        supabase
          .from("services")
          .select("id, salon_id, duration_min, buffer_before_min, buffer_after_min, active")
          .eq("id", serviceId)
          .eq("salon_id", salonId)
          .eq("active", true)
          .maybeSingle(),
      ]);

    if (salonError || serviceError) throw salonError ?? serviceError;
    if (!salon || !service) {
      return NextResponse.json({ error: "Salonul sau serviciul nu există." }, { status: 404 });
    }

    let barbersQuery = supabase.from("barbers").select("id, name").eq("salon_id", salonId);
    if (barberId) barbersQuery = barbersQuery.eq("id", barberId);
    const { data: barbers, error: barbersError } = await barbersQuery;
    if (barbersError) throw barbersError;
    if (!barbers?.length) return NextResponse.json({ slots: [] });

    const candidateIds = barbers.map((barber) => barber.id as string);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const timezone = String(salon.timezone || "Europe/Bucharest");
    const dayStart = localDateTimeToUtc(date, "00:00:00", timezone);
    const nextDay = new Date(dayStart.getTime() + 36 * 60 * 60 * 1000);
    const nextDayLocal = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(nextDay);
    const dayEnd = localDateTimeToUtc(nextDayLocal, "00:00:00", timezone);

    const [hoursResult, timeOffResult, appointmentsResult, mappingsResult, whatsappResult] =
      await Promise.all([
        supabase
          .from("working_hours")
          .select("barber_id, start_time, end_time")
          .in("barber_id", candidateIds)
          .eq("weekday", weekday)
          .eq("active", true),
        supabase
          .from("time_off")
          .select("barber_id, start_at, end_at")
          .in("barber_id", candidateIds)
          .lt("start_at", dayEnd.toISOString())
          .gt("end_at", dayStart.toISOString()),
        supabase
          .from("appointments")
          .select("barber_id, start_at, end_at, status")
          .in("barber_id", candidateIds)
          .lt("start_at", dayEnd.toISOString())
          .gt("end_at", dayStart.toISOString())
          .not("status", "in", '("anulat","no-show")'),
        supabase
          .from("barber_services")
          .select("barber_id, service_id")
          .in("barber_id", candidateIds),
        supabase
          .from("whatsapp_accounts")
          .select("minimum_notice_minutes, booking_horizon_days")
          .eq("salon_id", salonId)
          .maybeSingle(),
      ]);

    const firstError =
      hoursResult.error ??
      timeOffResult.error ??
      appointmentsResult.error ??
      mappingsResult.error ??
      whatsappResult.error;
    if (firstError) throw firstError;

    const now = new Date();
    const minimumNotice = Number(whatsappResult.data?.minimum_notice_minutes ?? 0);
    const notBefore = new Date(now.getTime() + minimumNotice * 60_000);
    const horizonDays = Number(whatsappResult.data?.booking_horizon_days ?? 60);
    if (dayStart.getTime() > now.getTime() + horizonDays * 86_400_000) {
      return NextResponse.json({ slots: [] });
    }

    const mappings = mappingsResult.data ?? [];
    const mappingCounts = new Map<string, number>();
    for (const mapping of mappings) {
      mappingCounts.set(mapping.barber_id, (mappingCounts.get(mapping.barber_id) ?? 0) + 1);
    }

    const timing = service as unknown as ServiceTiming;
    const slots = barbers.flatMap((barber) => {
      const explicitMappings = mappingCounts.get(barber.id) ?? 0;
      if (
        explicitMappings > 0 &&
        !mappings.some(
          (mapping) => mapping.barber_id === barber.id && mapping.service_id === serviceId,
        )
      ) {
        return [];
      }

      const workingWindows = (hoursResult.data ?? [])
        .filter((row) => row.barber_id === barber.id)
        .map((row) => ({ startTime: row.start_time, endTime: row.end_time }));

      const blocked = [
        ...(timeOffResult.data ?? [])
          .filter((row) => row.barber_id === barber.id)
          .map((row) => ({ start: new Date(row.start_at), end: new Date(row.end_at) })),
        ...(appointmentsResult.data ?? [])
          .filter((row) => row.barber_id === barber.id)
          .map((row) => ({ start: new Date(row.start_at), end: new Date(row.end_at) })),
      ];

      return generateAvailableSlots({
        date,
        timezone,
        workingWindows,
        blocked,
        durationMinutes: timing.duration_min,
        bufferBeforeMinutes: timing.buffer_before_min ?? 0,
        bufferAfterMinutes: timing.buffer_after_min ?? 0,
        slotStepMinutes: 10,
        notBefore,
      }).map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        barberId: barber.id,
        barberName: barber.name,
      }));
    });

    slots.sort((a, b) => a.start.localeCompare(b.start));
    return NextResponse.json({ timezone, slots: slots.slice(0, 60) });
  } catch (error) {
    console.error("[availability]", error);
    return NextResponse.json(
      { error: "Disponibilitatea nu poate fi calculată momentan." },
      { status: 503 },
    );
  }
}
