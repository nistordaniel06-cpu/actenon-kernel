"use client";

import Image from "next/image";
import { Scissors } from "lucide-react";

import { Salon } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAD = 14;

function normalize(salons: Salon[]) {
  const lats = salons.map((s) => s.lat);
  const lngs = salons.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return salons.map((s) => {
    const x = maxLng === minLng ? 50 : ((s.lng - minLng) / (maxLng - minLng)) * (100 - PAD * 2) + PAD;
    const yRaw = maxLat === minLat ? 50 : ((s.lat - minLat) / (maxLat - minLat)) * (100 - PAD * 2) + PAD;
    return { salon: s, x, y: 100 - yRaw };
  });
}

export function ExploreMap({
  salons,
  selectedId,
  onSelect,
}: {
  salons: Salon[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const points = normalize(salons);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-secondary"
      style={{
        backgroundImage:
          "linear-gradient(rgba(23,21,18,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(23,21,18,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(200,149,44,0.10),transparent_45%)]" />
      {points.map(({ salon, x, y }) => {
        const active = salon.id === selectedId;
        return (
          <button
            key={salon.id}
            onClick={() => onSelect(salon.id)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-full transition-transform",
              active && "z-10 scale-110",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold shadow-md",
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              {salon.availableNow && (
                <span className={cn("size-1.5 rounded-full", active ? "bg-accent-foreground" : "bg-success")} />
              )}
              {salon.priceLevel === 1 ? "$" : salon.priceLevel === 2 ? "$$" : "$$$"}
            </div>
            <span
              className={cn(
                "mx-auto block h-2 w-0.5",
                active ? "bg-accent" : "bg-foreground/60",
              )}
            />
          </button>
        );
      })}

      <div className="absolute right-3 bottom-3 flex size-11 items-center justify-center rounded-full border border-border bg-card shadow-md">
        <Scissors className="size-4 text-accent" />
      </div>
      {selectedId && (
        <MapPreviewCard salon={salons.find((s) => s.id === selectedId)!} />
      )}
    </div>
  );
}

function MapPreviewCard({ salon }: { salon: Salon }) {
  return (
    <a
      href={`/salon/${salon.id}`}
      className="absolute inset-x-4 bottom-4 flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
        <Image src={salon.coverImage} alt={salon.name} fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate font-semibold">{salon.name}</p>
        <p className="truncate text-xs text-muted-foreground">{salon.address}</p>
        <p className="mt-0.5 text-xs font-medium text-accent">
          {salon.availableNow ? "Available now" : `Next slot`} · {salon.distanceKm.toFixed(1)} km
        </p>
      </div>
    </a>
  );
}
