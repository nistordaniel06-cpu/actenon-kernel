import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { formatDateInTimeZone } from "@/lib/booking/availability";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppList, sendWhatsAppText } from "@/lib/whatsapp/cloud-api";

type IncomingMessage = {
  from?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    list_reply?: { id?: string; title?: string };
    button_reply?: { id?: string; title?: string };
  };
};

type MetaWebhook = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: IncomingMessage[];
      };
    }>;
  }>;
};

type ConversationContext = {
  serviceId?: string;
  barberId?: string;
  firstAvailable?: boolean;
  date?: string;
  offeredSlots?: Array<{
    start: string;
    end: string;
    barberId: string;
    barberName?: string;
  }>;
  startAt?: string;
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function selectedId(message: IncomingMessage) {
  return (
    message.interactive?.list_reply?.id ??
    message.interactive?.button_reply?.id ??
    ""
  );
}

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature?.startsWith("sha256=")) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function parseRequestedDate(text: string, timezone: string) {
  const value = normalize(text);
  const now = new Date();
  if (value === "azi") return formatDateInTimeZone(now, timezone);
  if (value === "maine") {
    return formatDateInTimeZone(new Date(now.getTime() + 30 * 60 * 60 * 1000), timezone);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

function appUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("NEXT_PUBLIC_APP_URL lipsește.");
  return value.replace(/\/$/, "");
}

async function getAvailability(input: {
  salonId: string;
  serviceId: string;
  barberId?: string;
  date: string;
}) {
  const url = new URL(`${appUrl()}/api/availability`);
  url.searchParams.set("salonId", input.salonId);
  url.searchParams.set("serviceId", input.serviceId);
  url.searchParams.set("date", input.date);
  if (input.barberId) url.searchParams.set("barberId", input.barberId);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Availability API: ${response.status}`);
  return (await response.json()) as {
    slots?: Array<{
      start: string;
      end: string;
      barberId: string;
      barberName?: string;
    }>;
  };
}

async function createAppointment(input: {
  salonId: string;
  barberId: string;
  serviceId: string;
  customerPhone: string;
  customerName: string;
  startAt: string;
}) {
  const response = await fetch(`${appUrl()}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, source: "whatsapp" }),
    cache: "no-store",
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: MetaWebhook;
  try {
    payload = JSON.parse(rawBody) as MetaWebhook;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Acknowledge status-only callbacks without doing booking work.
  const value = payload.entry?.[0]?.changes?.[0]?.value;
  const phoneNumberId = value?.metadata?.phone_number_id;
  const message = value?.messages?.[0];
  const customerPhone = message?.from;
  if (!phoneNumberId || !message || !customerPhone) {
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: account, error: accountError } = await supabase
      .from("whatsapp_accounts")
      .select("salon_id, greeting_message, booking_enabled")
      .eq("phone_number_id", phoneNumberId)
      .eq("is_active", true)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account || !account.booking_enabled) return NextResponse.json({ ok: true });

    const customerName = value?.contacts?.[0]?.profile?.name ?? customerPhone;
    const { data: existing, error: conversationError } = await supabase
      .from("whatsapp_conversations")
      .select("id, state, context")
      .eq("salon_id", account.salon_id)
      .eq("customer_phone", customerPhone)
      .maybeSingle();
    if (conversationError) throw conversationError;

    const state = String(existing?.state ?? "START");
    const context = (existing?.context ?? {}) as ConversationContext;
    const choice = selectedId(message);
    const text = message.text?.body?.trim() ?? "";

    const saveConversation = async (nextState: string, nextContext: ConversationContext) => {
      const { error } = await supabase.from("whatsapp_conversations").upsert(
        {
          ...(existing?.id ? { id: existing.id } : {}),
          salon_id: account.salon_id,
          customer_phone: customerPhone,
          customer_name: customerName,
          state: nextState,
          context: nextContext,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "salon_id,customer_phone" },
      );
      if (error) throw error;
    };

    if (state === "START" || normalize(text) === "programare" || normalize(text) === "rezervare") {
      const { data: services, error } = await supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("salon_id", account.salon_id)
        .eq("active", true)
        .order("name")
        .limit(10);
      if (error) throw error;

      if (!services?.length) {
        await sendWhatsAppText(phoneNumberId, customerPhone, "Momentan nu sunt servicii active pentru programare.");
        return NextResponse.json({ ok: true });
      }

      await sendWhatsAppList({
        phoneNumberId,
        to: customerPhone,
        body: `${account.greeting_message}\nAlege serviciul dorit:`,
        button: "Alege serviciul",
        sectionTitle: "Servicii",
        rows: services.map((service) => ({
          id: `service:${service.id}`,
          title: service.name,
          description: `${service.price} lei · ${service.duration_min} min`,
        })),
      });
      await saveConversation("SELECTING_SERVICE", {});
      return NextResponse.json({ ok: true });
    }

    if (state === "SELECTING_SERVICE" && choice.startsWith("service:")) {
      const serviceId = choice.slice("service:".length);
      const { data: service } = await supabase
        .from("services")
        .select("id")
        .eq("id", serviceId)
        .eq("salon_id", account.salon_id)
        .eq("active", true)
        .maybeSingle();
      if (!service) {
        await sendWhatsAppText(phoneNumberId, customerPhone, "Serviciul nu mai este disponibil. Scrie «programare» pentru a reîncepe.");
        return NextResponse.json({ ok: true });
      }

      const { data: barbers, error } = await supabase
        .from("barbers")
        .select("id, name")
        .eq("salon_id", account.salon_id)
        .order("name")
        .limit(9);
      if (error) throw error;

      await sendWhatsAppList({
        phoneNumberId,
        to: customerPhone,
        body: "Cu cine dorești programarea?",
        button: "Alege frizerul",
        sectionTitle: "Echipa",
        rows: [
          { id: "barber:first_available", title: "Primul disponibil" },
          ...(barbers ?? []).map((barber) => ({ id: `barber:${barber.id}`, title: barber.name })),
        ],
      });
      await saveConversation("SELECTING_BARBER", { serviceId });
      return NextResponse.json({ ok: true });
    }

    if (state === "SELECTING_BARBER" && choice.startsWith("barber:") && context.serviceId) {
      const selectedBarber = choice.slice("barber:".length);
      const nextContext: ConversationContext = {
        ...context,
        barberId: selectedBarber === "first_available" ? undefined : selectedBarber,
        firstAvailable: selectedBarber === "first_available",
      };
      await saveConversation("SELECTING_DATE", nextContext);
      await sendWhatsAppText(
        phoneNumberId,
        customerPhone,
        "Pentru ce zi? Scrie «azi», «mâine» sau data în format AAAA-LL-ZZ.",
      );
      return NextResponse.json({ ok: true });
    }

    if (state === "SELECTING_DATE" && context.serviceId) {
      const { data: salon } = await supabase
        .from("salons")
        .select("timezone")
        .eq("id", account.salon_id)
        .single();
      const timezone = String(salon?.timezone || "Europe/Bucharest");
      const date = parseRequestedDate(text, timezone);
      if (!date) {
        await sendWhatsAppText(phoneNumberId, customerPhone, "Nu am înțeles data. Exemplu: «mâine» sau «2026-09-22».");
        return NextResponse.json({ ok: true });
      }

      const availability = await getAvailability({
        salonId: account.salon_id,
        serviceId: context.serviceId,
        barberId: context.barberId,
        date,
      });
      const offeredSlots = (availability.slots ?? []).slice(0, 10);
      if (!offeredSlots.length) {
        await sendWhatsAppText(phoneNumberId, customerPhone, "Nu am găsit locuri în ziua aleasă. Trimite o altă zi.");
        return NextResponse.json({ ok: true });
      }

      const timeFormatter = new Intl.DateTimeFormat("ro-RO", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
      });
      await sendWhatsAppList({
        phoneNumberId,
        to: customerPhone,
        body: "Am găsit aceste ore libere:",
        button: "Alege ora",
        sectionTitle: "Ore disponibile",
        rows: offeredSlots.map((slot, index) => ({
          id: `slot:${index}`,
          title: `${timeFormatter.format(new Date(slot.start))} · ${slot.barberName ?? "Frizer"}`,
        })),
      });
      await saveConversation("SELECTING_SLOT", { ...context, date, offeredSlots });
      return NextResponse.json({ ok: true });
    }

    if (state === "SELECTING_SLOT" && choice.startsWith("slot:") && context.serviceId) {
      const index = Number(choice.slice("slot:".length));
      const slot = context.offeredSlots?.[index];
      if (!slot) {
        await sendWhatsAppText(phoneNumberId, customerPhone, "Slotul a expirat. Trimite din nou ziua dorită.");
        await saveConversation("SELECTING_DATE", { serviceId: context.serviceId, barberId: context.barberId });
        return NextResponse.json({ ok: true });
      }

      await saveConversation("CONFIRMING", {
        ...context,
        barberId: slot.barberId,
        startAt: slot.start,
      });
      await sendWhatsAppText(
        phoneNumberId,
        customerPhone,
        `Confirmi programarea la ${slot.barberName ?? "frizer"}? Răspunde «DA» pentru confirmare sau «NU» pentru a reîncepe.`,
      );
      return NextResponse.json({ ok: true });
    }

    if (state === "CONFIRMING" && context.serviceId && context.barberId && context.startAt) {
      const answer = normalize(text);
      if (["nu", "anuleaza", "renunta"].includes(answer)) {
        await saveConversation("START", {});
        await sendWhatsAppText(phoneNumberId, customerPhone, "Am oprit rezervarea. Scrie «programare» când vrei să începem din nou.");
        return NextResponse.json({ ok: true });
      }
      if (!["da", "confirm", "confirma", "confirmare"].includes(answer)) {
        await sendWhatsAppText(phoneNumberId, customerPhone, "Răspunde «DA» pentru confirmare sau «NU» pentru anulare.");
        return NextResponse.json({ ok: true });
      }

      const result = await createAppointment({
        salonId: account.salon_id,
        barberId: context.barberId,
        serviceId: context.serviceId,
        customerPhone,
        customerName,
        startAt: context.startAt,
      });

      if (!result.ok) {
        await saveConversation("SELECTING_DATE", {
          serviceId: context.serviceId,
          barberId: context.barberId,
        });
        await sendWhatsAppText(
          phoneNumberId,
          customerPhone,
          result.status === 409
            ? "Ora tocmai a fost ocupată. Trimite ziua dorită și îți arăt alte variante."
            : "Nu am putut confirma programarea momentan. Încearcă din nou.",
        );
        return NextResponse.json({ ok: true });
      }

      const appointment = result.data.appointment as { id: string; start_at: string };
      await saveConversation("BOOKED", { ...context, startAt: appointment.start_at });
      await sendWhatsAppText(
        phoneNumberId,
        customerPhone,
        "✅ Programarea este confirmată. O vei găsi automat în agenda salonului și a frizerului. Pentru o nouă rezervare scrie «programare».",
      );
      return NextResponse.json({ ok: true });
    }

    if (state === "BOOKED") {
      await sendWhatsAppText(phoneNumberId, customerPhone, "Programarea este deja confirmată. Scrie «programare» pentru una nouă.");
      return NextResponse.json({ ok: true });
    }

    await sendWhatsAppText(phoneNumberId, customerPhone, "Scrie «programare» ca să începem o rezervare.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp:webhook]", error);
    // Meta expects a fast 2xx acknowledgment; internal errors are logged and retried
    // by product-level recovery instead of triggering an uncontrolled webhook loop.
    return NextResponse.json({ ok: true });
  }
}
