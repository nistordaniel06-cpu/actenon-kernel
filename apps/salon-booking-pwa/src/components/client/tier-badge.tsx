import { Award } from "lucide-react";

import { Rank } from "@/lib/ranks";
import { cn } from "@/lib/utils";

const rankStyles: Record<Rank, string> = {
  "Ucenic": "bg-surface-3 text-muted-foreground",
  "Calfă": "bg-[#8a8f98]/20 text-[#c7cdd6]",
  "Meșter": "bg-accent-soft text-accent",
  "Maestru": "bg-accent/25 text-accent",
  "Legendă": "bg-accent text-accent-foreground",
};

export function TierBadge({ rank, className }: { rank: Rank; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        rankStyles[rank],
        className,
      )}
    >
      <Award className="size-3.5" /> {rank}
    </span>
  );
}
