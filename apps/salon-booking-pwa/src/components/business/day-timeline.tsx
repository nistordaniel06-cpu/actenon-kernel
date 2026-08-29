import Link from "next/link";
import { Flame } from "lucide-react";

import { Barber, CalendarBooking } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

const START_HOUR = 9;
const END_HOUR = 20;
const PX_PER_HOUR = 72;

function minutesFromStart(iso: string) {
  const d = new Date(iso);
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes();
}

export function DayTimeline({
  barbers,
  bookings,
}: {
  barbers: Barber[];
  bookings: CalendarBooking[];
}) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const totalHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  return (
    <div className="flex px-5">
      <div className="relative w-12 shrink-0" style={{ height: totalHeight }}>
        {hours.map((h) => (
          <div
            key={h}
            className="absolute -translate-y-1/2 text-[11px] text-muted-foreground"
            style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
          >
            {h % 12 === 0 ? 12 : h % 12}
            {h < 12 ? "am" : "pm"}
          </div>
        ))}
      </div>

      <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${barbers.length}, minmax(0, 1fr))` }}>
        {barbers.map((barber) => (
          <div key={barber.id} className="flex flex-col">
            <p className="mb-2 truncate text-center text-xs font-semibold">{barber.name.split(" ")[0]}</p>
            <div className="relative rounded-xl bg-secondary/50" style={{ height: totalHeight }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-border/60"
                  style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                />
              ))}
              {bookings
                .filter((b) => b.barberId === barber.id)
                .map((b) => {
                  const top = (minutesFromStart(b.startIso) / 60) * PX_PER_HOUR;
                  const height = Math.max(
                    28,
                    ((minutesFromStart(b.endIso) - minutesFromStart(b.startIso)) / 60) * PX_PER_HOUR,
                  );
                  const isDeal = b.status === "hot-deal";
                  const content = (
                    <div
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-[11px] leading-tight",
                        isDeal && "border-dashed border-accent bg-accent/10 text-accent",
                        !isDeal && b.status === "pending" && "border-border bg-card/80 text-foreground",
                        !isDeal && b.status === "confirmed" && "border-transparent bg-primary text-primary-foreground",
                      )}
                      style={{ top, height }}
                    >
                      {isDeal ? (
                        <span className="flex items-center gap-1 font-semibold">
                          <Flame className="size-3" /> Open slot
                        </span>
                      ) : (
                        <>
                          <p className="truncate font-semibold">{b.clientName}</p>
                          <p className="truncate opacity-80">
                            {b.serviceName} · {formatPrice(b.price)}
                          </p>
                        </>
                      )}
                    </div>
                  );
                  return isDeal ? (
                    <Link key={b.id} href="/business/deals">
                      {content}
                    </Link>
                  ) : (
                    <div key={b.id}>{content}</div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
