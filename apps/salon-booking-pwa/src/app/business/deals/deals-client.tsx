"use client";

import { useState } from "react";
import { Flame, Clock, X } from "lucide-react";

import { CalendarBooking, Deal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DISCOUNTS = [15, 20, 30, 40];

export function DealsClient({
  initialDeals,
  emptySlots,
}: {
  initialDeals: Deal[];
  emptySlots: CalendarBooking[];
}) {
  const [activeDeals, setActiveDeals] = useState(initialDeals);
  const [pendingSlots, setPendingSlots] = useState(emptySlots.map((s) => s.id));
  const [discountChoice, setDiscountChoice] = useState<Record<string, number>>({});

  function activate(slot: CalendarBooking) {
    const discount = discountChoice[slot.id] ?? 20;
    setActiveDeals((prev) => [
      ...prev,
      {
        id: `deal-${slot.id}`,
        salonId: "salon-1",
        title: `Fill ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(slot.startIso))} slot`,
        discountPercent: discount,
        startIso: slot.startIso,
        endIso: slot.endIso,
        serviceId: "svc-1",
        seatsLeft: 1,
      },
    ]);
    setPendingSlots((prev) => prev.filter((id) => id !== slot.id));
  }

  function deactivate(id: string) {
    setActiveDeals((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <div>
        <h1 className="text-xl font-semibold">Hot deals</h1>
        <p className="text-sm text-muted-foreground">
          Fill empty chairs instead of losing the slot entirely.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Active deals ({activeDeals.length})</h2>
        {activeDeals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No deals running right now.
          </p>
        ) : (
          activeDeals.map((deal) => (
            <div
              key={deal.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-medium text-accent">
                  <Flame className="size-4" /> {deal.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  -{deal.discountPercent}% · {deal.seatsLeft} seat left
                </p>
              </div>
              <button
                onClick={() => deactivate(deal.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card"
              >
                <X className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Empty slots today</h2>
        {pendingSlots.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Your calendar is fully booked. Nice work!
          </p>
        ) : (
          emptySlots
            .filter((s) => pendingSlots.includes(s.id))
            .map((slot) => (
              <div key={slot.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="size-3.5" />
                    {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
                      new Date(slot.startIso),
                    )}{" "}
                    –{" "}
                    {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
                      new Date(slot.endIso),
                    )}
                  </p>
                  <Badge variant="secondary">Unbooked</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {DISCOUNTS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDiscountChoice((prev) => ({ ...prev, [slot.id]: d }))}
                      className={`flex-1 rounded-full border py-1.5 text-sm font-medium ${
                        (discountChoice[slot.id] ?? 20) === d
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background"
                      }`}
                    >
                      -{d}%
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={() => activate(slot)}>
                  Activate hot deal
                </Button>
                <p className="text-xs text-muted-foreground">
                  Commission applies only if this attracts a brand-new client to your business.
                </p>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
