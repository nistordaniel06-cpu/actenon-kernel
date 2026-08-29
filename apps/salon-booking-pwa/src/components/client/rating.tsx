import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
  size = "sm",
}: {
  value: number;
  count?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-foreground",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <Star className={cn("fill-accent text-accent", size === "sm" ? "size-3.5" : "size-4")} />
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </span>
  );
}
