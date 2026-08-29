"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, CalendarCheck, UserPlus, Armchair, Flame, Star } from "lucide-react";

import { StatPoint } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function StatsClient({
  weeklyStats,
  summary,
}: {
  weeklyStats: StatPoint[];
  summary: {
    revenueThisWeek: number;
    bookingsThisWeek: number;
    newClientsThisWeek: number;
    chairUtilization: number;
    hotDealsFilled: number;
    avgRating: number;
  };
}) {
  return (
    <div className="flex flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <div>
        <h1 className="text-xl font-semibold">Statistici</h1>
        <p className="text-sm text-muted-foreground">Performanța săptămânii</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="Venit" value={formatPrice(summary.revenueThisWeek)} />
        <StatCard icon={CalendarCheck} label="Programări" value={String(summary.bookingsThisWeek)} />
        <StatCard icon={UserPlus} label="Clienți noi" value={String(summary.newClientsThisWeek)} />
        <StatCard icon={Armchair} label="Grad ocupare" value={`${summary.chairUtilization}%`} />
        <StatCard icon={Flame} label="Oferte finalizate" value={String(summary.hotDealsFilled)} accent />
        <StatCard icon={Star} label="Rating mediu" value={summary.avgRating.toFixed(1)} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 font-semibold">Venit pe zi</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                width={44}
              />
              <Tooltip
                cursor={{ fill: "var(--color-secondary)" }}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value) => [formatPrice(Number(value)), "Venit"]}
              />
              <Bar dataKey="revenue" fill="var(--color-accent)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 font-semibold">Programări pe zi</p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "var(--color-secondary)" }}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="bookings" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          accent ? "bg-accent/15 text-accent" : "bg-secondary text-foreground"
        }`}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
