import { Barber, Appointment, AppointmentStatus, Service } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

const START_HOUR = 9;
const END_HOUR = 20;
const PX_PER_HOUR = 72;

function minutesFromStart(iso: string) {
  const d = new Date(iso);
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes();
}

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  confirmat: "border-transparent bg-surface-3 text-foreground",
  "in-asteptare": "border-dashed border-warning bg-warning/10 text-warning",
  checkin: "border-accent bg-accent-soft text-accent",
  "in-progres": "border-transparent bg-primary text-primary-foreground",
  finalizat: "border-transparent bg-surface-2 text-muted-foreground opacity-70",
  anulat: "border-transparent bg-surface-2 text-muted-foreground/50 line-through opacity-50",
  "no-show": "border-transparent bg-destructive/15 text-destructive line-through",
};

export function DayTimeline({
  barbers,
  appointments,
  services,
}: {
  barbers: Barber[];
  appointments: Appointment[];
  services: Service[];
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
            {h}:00
          </div>
        ))}
      </div>

      <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${barbers.length}, minmax(0, 1fr))` }}>
        {barbers.map((barber) => (
          <div key={barber.id} className="flex flex-col">
            <p className="mb-2 truncate text-center text-xs font-semibold">{barber.name.split(" ")[0]}</p>
            <div className="relative rounded-xl bg-surface-2/50" style={{ height: totalHeight }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-border/60"
                  style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                />
              ))}
              {appointments
                .filter((a) => a.barberId === barber.id)
                .map((a) => {
                  const top = (minutesFromStart(a.startIso) / 60) * PX_PER_HOUR;
                  const height = Math.max(
                    28,
                    ((minutesFromStart(a.endIso) - minutesFromStart(a.startIso)) / 60) * PX_PER_HOUR,
                  );
                  const service = services.find((s) => s.id === a.serviceId);
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-[11px] leading-tight",
                        STATUS_STYLE[a.status],
                      )}
                      style={{ top, height }}
                    >
                      <p className="truncate font-semibold">{a.clientName}</p>
                      <p className="truncate opacity-80">
                        {service?.name} · {formatPrice(a.price)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
