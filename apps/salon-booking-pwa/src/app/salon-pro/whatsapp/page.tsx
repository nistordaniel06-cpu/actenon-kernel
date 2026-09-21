"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, MessageCircle, Save, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const SALON_ID = "salon-1";

type Settings = {
  salonId: string;
  phoneNumber: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  greetingMessage: string;
  bookingEnabled: boolean;
  allowReschedule: boolean;
  allowCancel: boolean;
  minimumNoticeMinutes: number;
  bookingHorizonDays: number;
  reminder24h: boolean;
  reminder2h: boolean;
  isActive: boolean;
};

const defaults: Settings = {
  salonId: SALON_ID,
  phoneNumber: "",
  phoneNumberId: "",
  whatsappBusinessAccountId: "",
  greetingMessage: "Salut! ✂️ Cu ce te putem ajuta?",
  bookingEnabled: true,
  allowReschedule: true,
  allowCancel: true,
  minimumNoticeMinutes: 60,
  bookingHorizonDays: 60,
  reminder24h: true,
  reminder2h: true,
  isActive: false,
};

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/salon/whatsapp?salonId=${encodeURIComponent(SALON_ID)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Backend neconfigurat sau autentificare necesară.");
        return response.json();
      })
      .then(({ settings: remote }) => {
        if (!active || !remote) return;
        setSettings({
          salonId: SALON_ID,
          phoneNumber: remote.phone_number ?? "",
          phoneNumberId: remote.phone_number_id ?? "",
          whatsappBusinessAccountId: remote.whatsapp_business_account_id ?? "",
          greetingMessage: remote.greeting_message ?? defaults.greetingMessage,
          bookingEnabled: remote.booking_enabled ?? true,
          allowReschedule: remote.allow_reschedule ?? true,
          allowCancel: remote.allow_cancel ?? true,
          minimumNoticeMinutes: remote.minimum_notice_minutes ?? 60,
          bookingHorizonDays: remote.booking_horizon_days ?? 60,
          reminder24h: remote.reminder_24h ?? true,
          reminder2h: remote.reminder_2h ?? true,
          isActive: remote.is_active ?? false,
        });
      })
      .catch(() => {
        if (active) setMessage("Mod demo: conectează Supabase pentru salvarea setărilor reale.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/salon/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Salvarea a eșuat.");
      setMessage("Setările WhatsApp au fost salvate.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Setările nu au putut fi salvate.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <MessageCircle className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">WhatsApp Programator</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Recepționerul salonului, direct pe WhatsApp</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Clienții aleg serviciul, frizerul și ora. NearCut verifică disponibilitatea și salvează programarea automat.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium">
          <span className={`size-2 rounded-full ${settings.isActive ? "bg-accent" : "bg-muted-foreground/40"}`} />
          {settings.isActive ? "Programator activ" : "Neconectat"}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Conexiune WhatsApp Business</h2>
              <p className="text-xs text-muted-foreground">Datele tehnice rămân în contul salonului.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Număr WhatsApp
              <input
                className={inputClass}
                value={settings.phoneNumber}
                onChange={(event) => update("phoneNumber", event.target.value)}
                placeholder="+40 7xx xxx xxx"
              />
            </label>
            <label className="text-sm font-medium">
              Phone Number ID
              <input
                className={inputClass}
                value={settings.phoneNumberId}
                onChange={(event) => update("phoneNumberId", event.target.value)}
                placeholder="Meta Phone Number ID"
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              WhatsApp Business Account ID
              <input
                className={inputClass}
                value={settings.whatsappBusinessAccountId}
                onChange={(event) => update("whatsappBusinessAccountId", event.target.value)}
                placeholder="WABA ID"
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Mesaj de întâmpinare
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                value={settings.greetingMessage}
                onChange={(event) => update("greetingMessage", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Status</h2>
              <p className="text-xs text-muted-foreground">Controlează când botul acceptă programări.</p>
            </div>
          </div>
          <ToggleRow
            title="Programator activ"
            description="Permite webhook-ului NearCut să preia rezervări."
            checked={settings.isActive}
            onCheckedChange={(value) => update("isActive", value)}
          />
          <ToggleRow
            title="Programări pe WhatsApp"
            description="Afișează servicii, frizeri și ore disponibile."
            checked={settings.bookingEnabled}
            onCheckedChange={(value) => update("bookingEnabled", value)}
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Reguli de rezervare</h2>
              <p className="text-xs text-muted-foreground">Aceleași reguli sunt folosite în WhatsApp și în API.</p>
            </div>
          </div>
          <ToggleRow
            title="Permite reprogramarea"
            description="Clientul poate cere mutarea unei rezervări."
            checked={settings.allowReschedule}
            onCheckedChange={(value) => update("allowReschedule", value)}
          />
          <ToggleRow
            title="Permite anularea"
            description="Clientul poate anula din conversație."
            checked={settings.allowCancel}
            onCheckedChange={(value) => update("allowCancel", value)}
          />
          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Notice minim (minute)
              <input
                type="number"
                min={0}
                className={inputClass}
                value={settings.minimumNoticeMinutes}
                onChange={(event) => update("minimumNoticeMinutes", Number(event.target.value))}
              />
            </label>
            <label className="text-sm font-medium">
              Rezervări cu max. (zile)
              <input
                type="number"
                min={1}
                max={365}
                className={inputClass}
                value={settings.bookingHorizonDays}
                onChange={(event) => update("bookingHorizonDays", Number(event.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Clock3 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Remindere</h2>
              <p className="text-xs text-muted-foreground">Pregătit pentru template-urile aprobate în Meta.</p>
            </div>
          </div>
          <ToggleRow
            title="Cu 24h înainte"
            description="Confirmare și opțiuni de reprogramare."
            checked={settings.reminder24h}
            onCheckedChange={(value) => update("reminder24h", value)}
          />
          <ToggleRow
            title="Cu 2h înainte"
            description="Reminder scurt înainte de vizită."
            checked={settings.reminder2h}
            onCheckedChange={(value) => update("reminder2h", value)}
          />
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 text-accent" />
          <span>{loading ? "Se încarcă setările…" : message || "Setările sunt gata de configurare."}</span>
        </div>
        <Button variant="accent" onClick={save} disabled={saving || loading}>
          <Save className="size-4" />
          {saving ? "Se salvează…" : "Salvează setările"}
        </Button>
      </div>
    </main>
  );
}
