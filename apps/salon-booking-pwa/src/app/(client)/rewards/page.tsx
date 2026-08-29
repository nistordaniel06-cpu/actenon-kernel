"use client";

import { useState } from "react";
import { Gift, Copy, Check, Sparkles } from "lucide-react";

import { currentUser, rewardActivity, rewardTiers } from "@/lib/mock/user";
import { TierBadge } from "@/components/client/tier-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDayMonth } from "@/lib/utils";

export default function RewardsPage() {
  const [copied, setCopied] = useState(false);
  const tierIndex = rewardTiers.findIndex((t) => t.tier === currentUser.tier);
  const currentTier = rewardTiers[tierIndex];
  const nextTier = rewardTiers[tierIndex + 1];
  const progress = nextTier
    ? Math.min(
        100,
        Math.round(
          ((currentUser.points - currentTier.min) / (nextTier.min - currentTier.min)) * 100,
        ),
      )
    : 100;

  function copyCode() {
    navigator.clipboard?.writeText(currentUser.referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <h1 className="text-xl font-semibold">Rewards wallet</h1>

      <div className="flex flex-col gap-4 rounded-3xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="text-sm text-primary-foreground/70">Your balance</p>
          <TierBadge tier={currentUser.tier} className="bg-white/15 text-primary-foreground" />
        </div>
        <p className="text-3xl font-semibold">{currentUser.points.toLocaleString()} pts</p>
        {nextTier ? (
          <div className="flex flex-col gap-1.5">
            <Progress value={progress} className="bg-white/15" indicatorClassName="bg-white" />
            <p className="text-xs text-primary-foreground/70">
              {nextTier.min - currentUser.points} pts to {nextTier.tier}
            </p>
          </div>
        ) : (
          <p className="text-xs text-primary-foreground/70">You&apos;ve reached the top tier.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Tier perks</h2>
        {rewardTiers.map((t) => (
          <div
            key={t.tier}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
          >
            <TierBadge tier={t.tier} />
            <p className="text-sm text-muted-foreground">{t.perk}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4">
        <p className="flex items-center gap-1.5 font-semibold text-accent">
          <Gift className="size-4" /> Invite friends, earn 200 pts
        </p>
        <p className="text-sm text-muted-foreground">
          Share your code — you both get rewarded after their first booking.
        </p>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="font-mono text-sm font-semibold tracking-wide">
            {currentUser.referralCode}
          </span>
          <Button size="sm" variant="ghost" onClick={copyCode} className="gap-1.5">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="size-4 text-accent" /> Recent activity
        </h2>
        <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
          {rewardActivity.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between border-b border-border/70 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{formatDayMonth(a.date)}</p>
              </div>
              <span className="text-sm font-semibold text-success">+{a.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
