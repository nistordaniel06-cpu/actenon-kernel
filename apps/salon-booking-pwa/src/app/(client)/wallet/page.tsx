"use client";

import Link from "next/link";
import { useState } from "react";
import { Gift, Copy, Check, Sparkles, Users, ChevronRight } from "lucide-react";

import { currentUser } from "@/lib/mock/user";
import { useAppStore } from "@/lib/store";
import { RANKS, rankForPoints, nextRank } from "@/lib/ranks";
import { TierBadge } from "@/components/client/tier-badge";
import { DailyWheel } from "@/components/client/daily-wheel";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDayMonth } from "@/lib/utils";

export default function WalletPage() {
  const [copied, setCopied] = useState(false);
  const points = useAppStore((s) => s.points);
  const activity = useAppStore((s) => s.pointActivity);

  const rank = rankForPoints(points);
  const currentTier = RANKS.find((t) => t.rank === rank)!;
  const upcoming = nextRank(points);
  const progress = upcoming
    ? Math.min(100, Math.round(((points - currentTier.min) / (upcoming.min - currentTier.min)) * 100))
    : 100;

  function copyCode() {
    navigator.clipboard?.writeText(currentUser.referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <h1 className="text-xl font-semibold">Portofel</h1>

      <div className="flex flex-col gap-4 rounded-3xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="text-sm text-primary-foreground/70">Soldul tău</p>
          <TierBadge rank={rank} className="bg-black/15 text-primary-foreground" />
        </div>
        <p className="text-3xl font-semibold">{points.toLocaleString("ro-RO")} puncte</p>
        {upcoming ? (
          <div className="flex flex-col gap-1.5">
            <Progress value={progress} className="bg-black/15" indicatorClassName="bg-primary-foreground" />
            <p className="text-xs text-primary-foreground/70">
              {upcoming.min - points} puncte până la rangul {upcoming.rank}
            </p>
          </div>
        ) : (
          <p className="text-xs text-primary-foreground/70">Ai atins cel mai înalt rang.</p>
        )}
      </div>

      <DailyWheel />

      <Link
        href="/community"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-accent">
          <Users className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Comunitate</p>
          <p className="text-xs text-muted-foreground">Câștigătorii săptămânii și topurile</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Ranguri și beneficii</h2>
        {RANKS.map((t) => (
          <div
            key={t.rank}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
          >
            <TierBadge rank={t.rank} />
            <p className="text-sm text-muted-foreground">{t.perk}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-4">
        <p className="flex items-center gap-1.5 font-semibold text-accent">
          <Gift className="size-4" /> Invită prieteni, câștigă 200 puncte
        </p>
        <p className="text-sm text-muted-foreground">
          Distribuie codul tău — amândoi sunteți recompensați după prima lor programare.
        </p>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="font-mono text-sm font-semibold tracking-wide">
            {currentUser.referralCode}
          </span>
          <Button size="sm" variant="ghost" onClick={copyCode} className="gap-1.5">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiat" : "Copiază"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="size-4 text-accent" /> Activitate recentă
        </h2>
        <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
          {activity.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between border-b border-border/70 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{formatDayMonth(a.date)}</p>
              </div>
              <span className="text-sm font-semibold text-accent">+{a.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
