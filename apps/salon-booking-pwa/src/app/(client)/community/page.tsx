"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Star, TrendingUp } from "lucide-react";

import { communityTitles, leaderboard } from "@/lib/mock/community";
import { getBarber } from "@/lib/mock/barbers";
import { getSalon } from "@/lib/mock/salons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export default function CommunityPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-full bg-surface-2">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-lg font-semibold">Comunitate</h1>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-muted-foreground">
          <Trophy className="size-4 text-accent" /> Titluri săptămâna aceasta
        </h2>
        {communityTitles.map((t) => {
          const barber = getBarber(t.barberId);
          const salon = barber ? getSalon(barber.salonId) : null;
          if (!barber) return null;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4">
              <Avatar className="size-12">
                <AvatarImage src={barber.avatar} alt={barber.name} />
                <AvatarFallback>{initials(barber.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-accent">{t.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {barber.name} · {salon?.name}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{t.week}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-muted-foreground">
          <TrendingUp className="size-4 text-accent" /> Clasament general
        </h2>
        <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
          {leaderboard
            .sort((a, b) => b.score - a.score)
            .map((entry, i) => {
              const barber = getBarber(entry.barberId);
              if (!barber) return null;
              return (
                <div key={entry.barberId} className="flex items-center gap-3 border-b border-border/70 py-3 last:border-0">
                  <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                  <Avatar className="size-10">
                    <AvatarImage src={barber.avatar} alt={barber.name} />
                    <AvatarFallback>{initials(barber.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{barber.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.bookingsWeek} programări săptămâna asta</p>
                  </div>
                  <Badge variant="soft" className="gap-1 shrink-0">
                    <Star className="size-3 fill-accent text-accent" /> {entry.ratingWeek.toFixed(1)}
                  </Badge>
                </div>
              );
            })}
        </div>
        <p className="px-1 text-xs text-muted-foreground">
          Scorul combină numărul de programări, rating-ul și review-urile verificate — nu doar volumul brut.
        </p>
      </div>
    </div>
  );
}
