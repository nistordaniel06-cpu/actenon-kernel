import { cn } from "@/lib/utils";

export function PriceLevel({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex text-xs font-medium">
      {[1, 2, 3].map((n) => (
        <span key={n} className={cn(n <= level ? "text-foreground" : "text-border")}>
          $
        </span>
      ))}
    </span>
  );
}
