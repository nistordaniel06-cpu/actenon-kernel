import { Award } from "lucide-react";

import { RewardTier } from "@/lib/types";
import { cn } from "@/lib/utils";

const tierStyles: Record<RewardTier, string> = {
  Bronze: "bg-[#8a5a3b]/15 text-[#8a5a3b]",
  Silver: "bg-[#8a8f98]/15 text-[#6b7078]",
  Gold: "bg-accent/15 text-accent",
  Premiere: "bg-primary/10 text-primary",
};

export function TierBadge({ tier, className }: { tier: RewardTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tierStyles[tier],
        className,
      )}
    >
      <Award className="size-3.5" /> {tier}
    </span>
  );
}
