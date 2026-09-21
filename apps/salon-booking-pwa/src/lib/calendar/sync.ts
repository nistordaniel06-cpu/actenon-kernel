import {
  createGoogleCalendarEvent,
  refreshGoogleAccessToken,
} from "@/lib/calendar/google";
import { decryptSecret, encryptSecret } from "@/lib/security/secrets";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function syncAppointmentToGoogle(appointmentId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, salon_id, barber_id, service_id, client_name, start_at, end_at, status")
    .eq("id", appointmentId)
    .single();
  if (appointmentError) throw appointmentError;
  if (["anulat", "no-show"].includes(appointment.status)) return { status: "skipped" as const };

  const { data: connection, error: connectionError } = await supabase
    .from("calendar_connections")
    .select(
      "id, calendar_id, access_token_encrypted, refresh_token_encrypted, expires_at, is_active",
    )
    .eq("barber_id", appointment.barber_id)
    .eq("provider", "google")
    .eq("is_active", true)
    .maybeSingle();
  if (connectionError) throw connectionError;
  if (!connection) return { status: "not_connected" as const };

  try {
    const [{ data: salon }, { data: barber }, { data: service }] = await Promise.all([
      supabase
        .from("salons")
        .select("name, address, timezone")
        .eq("id", appointment.salon_id)
        .single(),
      supabase.from("barbers").select("name").eq("id", appointment.barber_id).single(),
      supabase.from("services").select("name").eq("id", appointment.service_id).single(),
    ]);

    if (!connection.access_token_encrypted || !connection.refresh_token_encrypted) {
      throw new Error("Google Calendar connection has no tokens.");
    }

    let accessToken = decryptSecret(connection.access_token_encrypted);
    const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
    if (expiresAt <= Date.now() + 60_000) {
      const refreshed = await refreshGoogleAccessToken(
        decryptSecret(connection.refresh_token_encrypted),
      );
      accessToken = refreshed.access_token;
      const { error: refreshPersistError } = await supabase
        .from("calendar_connections")
        .update({
          access_token_encrypted: encryptSecret(accessToken),
          expires_at: new Date(Date.now() + Number(refreshed.expires_in ?? 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);
      if (refreshPersistError) throw refreshPersistError;
    }

    const googleEvent = await createGoogleCalendarEvent(
      accessToken,
      connection.calendar_id || "primary",
      {
        summary: `${service?.name ?? "Programare"} — ${appointment.client_name}`,
        description: `Programare NearCut • ${barber?.name ?? "Frizer"}`,
        location: salon?.address ?? "",
        startAt: appointment.start_at,
        endAt: appointment.end_at,
        timezone: salon?.timezone || "Europe/Bucharest",
      },
    );

    const { error: eventPersistError } = await supabase.from("calendar_events").upsert(
      {
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        provider: "google",
        external_event_id: googleEvent.id,
        sync_status: "synced",
        sync_error: null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "appointment_id,provider" },
    );
    if (eventPersistError) throw eventPersistError;

    return { status: "synced" as const, externalEventId: googleEvent.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown calendar sync error";
    await supabase.from("calendar_events").upsert(
      {
        appointment_id: appointment.id,
        barber_id: appointment.barber_id,
        provider: "google",
        sync_status: "failed",
        sync_error: message.slice(0, 1000),
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "appointment_id,provider" },
    );
    console.error("[calendar:google:sync]", error);
    return { status: "failed" as const };
  }
}
