import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  salonId: z.string().min(1),
  phoneNumber: z.string().max(32).nullable().optional(),
  phoneNumberId: z.string().max(100).nullable().optional(),
  whatsappBusinessAccountId: z.string().max(100).nullable().optional(),
  greetingMessage: z.string().min(1).max(500),
  bookingEnabled: z.boolean(),
  allowReschedule: z.boolean(),
  allowCancel: z.boolean(),
  minimumNoticeMinutes: z.number().int().min(0).max(43_200),
  bookingHorizonDays: z.number().int().min(1).max(365),
  reminder24h: z.boolean(),
  reminder2h: z.boolean(),
  isActive: z.boolean(),
});

async function requireSalonOwner(salonId: string) {
  const userClient = await getSupabaseServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };

  const { data: salon } = await userClient
    .from("salons")
    .select("id, owner_id")
    .eq("id", salonId)
    .maybeSingle();
  if (!salon || salon.owner_id !== user.id) return { ok: false as const, status: 403 };

  return { ok: true as const, userId: user.id };
}

export async function GET(request: NextRequest) {
  const salonId = request.nextUrl.searchParams.get("salonId");
  if (!salonId) return NextResponse.json({ error: "salonId lipsește." }, { status: 400 });

  try {
    const access = await requireSalonOwner(salonId);
    if (!access.ok) return NextResponse.json({ error: "Acces interzis." }, { status: access.status });

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("whatsapp_accounts")
      .select(
        "phone_number, phone_number_id, whatsapp_business_account_id, greeting_message, booking_enabled, allow_reschedule, allow_cancel, minimum_notice_minutes, booking_horizon_days, reminder_24h, reminder_2h, is_active",
      )
      .eq("salon_id", salonId)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("[salon:whatsapp:get]", error);
    return NextResponse.json({ error: "Setările nu pot fi încărcate." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Setări WhatsApp invalide." }, { status: 400 });
  }

  try {
    const input = parsed.data;
    const access = await requireSalonOwner(input.salonId);
    if (!access.ok) return NextResponse.json({ error: "Acces interzis." }, { status: access.status });

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("whatsapp_accounts")
      .upsert(
        {
          salon_id: input.salonId,
          phone_number: input.phoneNumber || null,
          phone_number_id: input.phoneNumberId || null,
          whatsapp_business_account_id: input.whatsappBusinessAccountId || null,
          greeting_message: input.greetingMessage,
          booking_enabled: input.bookingEnabled,
          allow_reschedule: input.allowReschedule,
          allow_cancel: input.allowCancel,
          minimum_notice_minutes: input.minimumNoticeMinutes,
          booking_horizon_days: input.bookingHorizonDays,
          reminder_24h: input.reminder24h,
          reminder_2h: input.reminder2h,
          is_active: input.isActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "salon_id" },
      )
      .select(
        "phone_number, phone_number_id, whatsapp_business_account_id, greeting_message, booking_enabled, allow_reschedule, allow_cancel, minimum_notice_minutes, booking_horizon_days, reminder_24h, reminder_2h, is_active",
      )
      .single();
    if (error) throw error;

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("[salon:whatsapp:update]", error);
    return NextResponse.json({ error: "Setările nu au putut fi salvate." }, { status: 503 });
  }
}
