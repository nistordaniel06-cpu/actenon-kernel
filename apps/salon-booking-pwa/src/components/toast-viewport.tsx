"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ToastViewport() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismissToast(t.id), 3200),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium shadow-lg",
            t.variant === "success" && "border-accent/40",
            t.variant === "destructive" && "border-destructive/40",
          )}
        >
          {t.variant === "success" && <CheckCircle2 className="size-4 shrink-0 text-accent" />}
          {t.variant === "destructive" && <XCircle className="size-4 shrink-0 text-destructive" />}
          {(!t.variant || t.variant === "default") && <Info className="size-4 shrink-0 text-muted-foreground" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
