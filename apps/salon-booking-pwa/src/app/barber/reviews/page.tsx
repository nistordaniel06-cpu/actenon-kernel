"use client";

import { Trophy } from "lucide-react";

import { getBarber } from "@/lib/mock/barbers";
import { leaderboard } from "@/lib/mock/community";
import { useAppStore } from "@/lib/store";
import { BarberHeader } from "@/components/barber/barber-header";
import { ReviewRow } from "@/components/client/review-row";
import { Badge } from "@/components/ui/badge";

export default function BarberReviewsPage() {
  const currentBarberId = useAppStore((s) => s.currentBarberId);
  const barber = getBarber(currentBarberId);
  const reviewsBySalon = useAppStore((s) => s.reviewsBySalon);

  if (!barber) return null;
  const reviews = reviewsBySalon[barber.salonId] ?? [];

  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex((e) => e.barberId === currentBarberId) + 1;

  return (
    <div className="flex flex-col gap-5">
      <BarberHeader barberId={currentBarberId} title="Recenzii" subtitle={`${barber.rating.toFixed(1)} · ${barber.reviewCount} recenzii`} />

      <div className="px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4">
          <Trophy className="size-6 text-accent" />
          <div>
            <p className="text-sm font-semibold text-accent">Locul {rank || "—"} în clasament</p>
            <p className="text-xs text-muted-foreground">Bazat pe programări, rating și review-uri verificate</p>
          </div>
          <Badge variant="soft" className="ml-auto">{sorted[rank - 1]?.score ?? "—"} pct</Badge>
        </div>
      </div>

      <div className="flex flex-col px-5">
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Niciun review încă.</p>
        ) : (
          reviews.map((r) => <ReviewRow key={r.id} review={r} />)
        )}
      </div>
    </div>
  );
}
