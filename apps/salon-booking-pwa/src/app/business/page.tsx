import { CalendarDays, DollarSign, Flame } from "lucide-react";

import { myBarbers, myBusinessSalon } from "@/lib/mock/business-context";
import { calendarBookings, businessStatsSummary } from "@/lib/mock/business";
import { BusinessHeader } from "@/components/business/business-header";
import { DayTimeline } from "@/components/business/day-timeline";
import { formatPrice } from "@/lib/utils";

export default function BusinessCalendarPage() {
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
    new Date(),
  );
  const confirmedToday = calendarBookings.filter((b) => b.status !== "hot-deal").length;
  const openToday = calendarBookings.filter((b) => b.status === "hot-deal").length;

  return (
    <div className="flex flex-col gap-4">
      <BusinessHeader title={myBusinessSalon.name} subtitle={today} />

      <div className="grid grid-cols-3 gap-2 px-5">
        <StatChip icon={CalendarDays} label="Booked" value={String(confirmedToday)} />
        <StatChip icon={DollarSign} label="Today" value={formatPrice(businessStatsSummary.revenueThisWeek / 7)} />
        <StatChip icon={Flame} label="Open slots" value={String(openToday)} accent />
      </div>

      <DayTimeline barbers={myBarbers} bookings={calendarBookings} />
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
