"use client";

import { CalendarDays, DollarSign, Flame } from "lucide-react";

import { Barber, Salon } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { BusinessHeader } from "@/components/business/business-header";
import { DayTimeline } from "@/components/business/day-timeline";
import { formatPrice } from "@/lib/utils";

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function CalendarClient({ salon, barbers }: { salon: Salon; barbers: Barber[] }) {
  const appointments = useAppStore((s) => s.appointments);
  const today = new Intl.DateTimeFormat("ro-RO", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const todays = appointments.filter((a) => a.salonId === salon.id && isToday(a.startIso));
  const booked = todays.filter((a) => a.status !== "anulat").length;
  const waiting = todays.filter((a) => a.status === "in-asteptare").length;
  const revenue = todays.filter((a) => a.status !== "anulat").reduce((s, a) => s + a.price, 0);

  return (
    <div className="flex flex-col gap-4">
      <BusinessHeader salon={salon} title={salon.name} subtitle={today} />

      <div className="grid grid-cols-3 gap-2 px-5">
        <StatChip icon={CalendarDays} label="Programate" value={String(booked)} />
        <StatChip icon={DollarSign} label="Venit azi" value={formatPrice(revenue)} />
        <StatChip icon={Flame} label="În așteptare" value={String(waiting)} accent />
      </div>

      <DayTimeline barbers={barbers} appointments={todays} services={salon.services} />
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
