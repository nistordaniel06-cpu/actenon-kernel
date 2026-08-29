"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, DollarSign, Percent, ArrowRight, PackageX, UserX } from "lucide-react";

import { myBusinessSalon } from "@/lib/mock/business-context";
import { businessStatsSummary } from "@/lib/mock/business";
import { useAppStore } from "@/lib/store";
import { BusinessHeader } from "@/components/business/business-header";
import { formatPrice } from "@/lib/utils";

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function SalonProDashboardPage() {
  const appointments = useAppStore((s) => s.appointments);
  const todays = appointments.filter(
    (a) => a.salonId === myBusinessSalon.id && isToday(a.startIso) && a.status !== "anulat",
  );
  const noShows = appointments.filter((a) => a.salonId === myBusinessSalon.id && a.status === "no-show").length;
  const revenueToday = todays.reduce((sum, a) => sum + a.price, 0);
  const today = new Intl.DateTimeFormat("ro-RO", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const alerts = [
    { icon: UserX, label: `${noShows} neprezentări în ultima perioadă`, show: noShows > 0 },
    { icon: PackageX, label: "Stoc scăzut: Pomadă Matte Clay", show: true },
  ].filter((a) => a.show);

  return (
    <div className="flex flex-col gap-5">
      <BusinessHeader title="Dashboard" subtitle={`${myBusinessSalon.name} · ${today}`} />

      <div className="grid grid-cols-3 gap-2 px-5">
        <Stat icon={CalendarDays} label="Programări azi" value={String(todays.length)} />
        <Stat icon={DollarSign} label="Venit estimat" value={formatPrice(revenueToday)} />
        <Stat icon={Percent} label="Grad ocupare" value={`${businessStatsSummary.chairUtilization}%`} accent />
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2 px-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Alerte</h2>
          {alerts.map((a) => (
            <div key={a.label} className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <p className="text-sm">{a.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 px-5">
        <h2 className="text-sm font-semibold text-muted-foreground">Acces rapid</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/salon-pro/calendar", label: "Calendar echipă" },
            { href: "/salon-pro/campaigns", label: "Campanii active" },
            { href: "/salon-pro/staff", label: "Personal & ture" },
            { href: "/salon-pro/checkin", label: "Check-in tabletă" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 text-sm font-medium">
              {l.label}
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof CalendarDays; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3">
      <Icon className={accent ? "size-4 text-accent" : "size-4 text-muted-foreground"} />
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
