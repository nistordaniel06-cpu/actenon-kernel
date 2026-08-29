import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2 px-5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  done || active ? "bg-accent" : "bg-secondary",
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {done ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Check className="size-3" /> {label}
                  </span>
                ) : (
                  label
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
