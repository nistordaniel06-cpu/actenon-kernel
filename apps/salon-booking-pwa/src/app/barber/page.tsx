"use client";

import { CalendarDays, DollarSign, Percent } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { BarberHeader } from "@/components/barber/barber-header";
import { AgendaTimeline } from "@/components/barber/agenda-timeline";
import { formatPrice } from "@/lib/utils";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function BarberAgendaPage() {
  const currentBarberId = useAppStore((s) => s.currentBarberId);
  const appointments = useAppStore((s) => s.appointments);

  const today = new Intl.DateTimeFormat("ro-RO", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const todays = appointments
    .filter((a) => a.barberId === currentBarberId && isToday(a.startIso) && a.status !== "anulat")
    .sort((a, b) => a.startIso.localeCompare(b.startIso));

  const revenueToday = todays
    .filter((a) => a.status !== "no-show")
    .reduce((sum, a) => sum + a.price, 0);
  const bookedHours = todays.reduce(
    (sum, a) => sum + (new Date(a.endIso).getTime() - new Date(a.startIso).getTime()) / 3_600_000,
    0,
  );
  const utilization = Math.min(100, Math.round((bookedHours / 11) * 100));

  return (
    <div className="flex flex-col gap-4">
      <BarberHeader barberId={currentBarberId} title="Agenda zilei" subtitle={today} />

      <div className="grid grid-cols-3 gap-2 px-5">
        <StatChip icon={CalendarDays} label="Programări" value={String(todays.length)} />
        <StatChip icon={DollarSign} label="Venit azi" value={formatPrice(revenueToday)} />
        <StatChip icon={Percent} label="Ocupare" value={`${utilization}%`} accent />
      </div>

      {todays.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Nicio programare azi. Folosește Boost pentru a umple orele libere.
        </p>
      ) : (
        <AgendaTimeline appointments={todays} />
      )}
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3">
      <Icon className={accent ? "size-4 text-accent" : "size-4 text-muted-foreground"} />
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
