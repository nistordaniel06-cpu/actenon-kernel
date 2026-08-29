"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

import { Appointment, AppointmentStatus } from "@/lib/types";
import { getService } from "@/lib/mock/services";
import { useAppStore } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDateTime, formatPrice, initials } from "@/lib/utils";

const START_HOUR = 9;
const END_HOUR = 20;
const PX_PER_HOUR = 76;

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
  anulat: "border-transparent bg-surface-2 text-muted-foreground/60 line-through opacity-60",
  "no-show": "border-transparent bg-destructive/15 text-destructive line-through",
};

const NEXT_ACTIONS: Partial<Record<AppointmentStatus, { label: string; next: AppointmentStatus; variant?: "default" | "outline" | "destructive" }[]>> = {
  confirmat: [
    { label: "Check-in", next: "checkin" },
    { label: "Neprezentare", next: "no-show", variant: "destructive" },
  ],
  "in-asteptare": [{ label: "Confirmă", next: "confirmat" }],
  checkin: [{ label: "Începe serviciul", next: "in-progres" }],
  "in-progres": [{ label: "Finalizează", next: "finalizat" }],
};

export function AgendaTimeline({ appointments }: { appointments: Appointment[] }) {
  const [selected, setSelected] = useState<Appointment | null>(null);
  const updateStatus = useAppStore((s) => s.updateAppointmentStatus);
  const pushToast = useAppStore((s) => s.pushToast);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const totalHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  function setStatus(id: string, status: AppointmentStatus) {
    updateStatus(id, status);
    pushToast(
      status === "no-show" ? "Client marcat ca neprezentare" : "Status actualizat",
      status === "no-show" ? "destructive" : "success",
    );
    setSelected(null);
  }

  return (
    <>
      <div className="flex px-5">
        <div className="relative w-12 shrink-0" style={{ height: totalHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute -translate-y-1/2 text-[11px] text-muted-foreground"
              style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
            >
              {h % 12 === 0 ? 12 : h % 12}
              {h < 12 ? "" : ""}
            </div>
          ))}
        </div>
        <div className="relative flex-1 rounded-xl bg-surface-2/50" style={{ height: totalHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-border/60"
              style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
            />
          ))}
          {appointments.map((a) => {
            const top = (minutesFromStart(a.startIso) / 60) * PX_PER_HOUR;
            const height = Math.max(34, ((minutesFromStart(a.endIso) - minutesFromStart(a.startIso)) / 60) * PX_PER_HOUR);
            const service = getService(a.serviceId);
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                style={{ top, height }}
                className={cn(
                  "absolute inset-x-1 overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-xs leading-tight transition-opacity",
                  STATUS_STYLE[a.status],
                )}
              >
                <p className="truncate font-semibold">{a.clientName}</p>
                <p className="truncate opacity-80">
                  {service?.name} · {formatPrice(a.price)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Detalii programare</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-5 pb-6">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={selected.clientAvatar} alt={selected.clientName} />
                    <AvatarFallback>{initials(selected.clientName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selected.clientName}</p>
                    <p className="text-sm text-muted-foreground">{getService(selected.serviceId)?.name}</p>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5" /> {formatDateTime(selected.startIso)}
                </p>
                <p className="text-sm font-semibold">{formatPrice(selected.price)}</p>
                <div className="flex flex-col gap-2">
                  {(NEXT_ACTIONS[selected.status] ?? []).map((action) => (
                    <Button
                      key={action.label}
                      variant={action.variant ?? "default"}
                      onClick={() => setStatus(selected.id, action.next)}
                    >
                      {action.label}
                    </Button>
                  ))}
                  {(selected.status === "confirmat" || selected.status === "in-asteptare") && (
                    <Button variant="ghost" className="text-destructive" onClick={() => setStatus(selected.id, "anulat")}>
                      Anulează programarea
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
