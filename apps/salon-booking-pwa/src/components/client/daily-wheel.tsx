"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";

import { wheelPrizes } from "@/lib/mock/wheel";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const SECTOR = 360 / wheelPrizes.length;

export function DailyWheel() {
  const canSpinToday = useAppStore((s) => s.canSpinToday);
  const spinWheel = useAppStore((s) => s.spinWheel);
  const pushToast = useAppStore((s) => s.pushToast);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const canSpin = canSpinToday() && !spinning;

  function handleSpin() {
    if (!canSpin) return;
    setSpinning(true);
    setResult(null);
    const prize = spinWheel();
    if (!prize) {
      setSpinning(false);
      return;
    }
    const idx = wheelPrizes.findIndex((p) => p.id === prize.id);
    const target = 360 * 6 - (idx * SECTOR + SECTOR / 2);
    setRotation((r) => r - (r % 360) + target + 360 * 6);
    setTimeout(() => {
      setSpinning(false);
      setResult(prize.label);
      pushToast(
        prize.value > 0 ? `Ai câștigat: ${prize.label}!` : "Mai încearcă mâine!",
        prize.value > 0 ? "success" : "default",
      );
    }, 2600);
  }

  const gradient = `conic-gradient(${wheelPrizes
    .map((p, i) => `${p.color} ${i * SECTOR}deg ${(i + 1) * SECTOR}deg`)
    .join(", ")})`;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <p className="flex items-center gap-1.5 self-start text-sm font-semibold text-accent">
        <Gift className="size-4" /> Roata zilnică
      </p>
      <div className="relative size-48">
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
          style={{
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "14px solid var(--color-foreground)",
          }}
        />
        <motion.div
          className="size-48 rounded-full border-4 border-surface-3"
          style={{ background: gradient }}
          animate={{ rotate: rotation }}
          transition={{ duration: 2.5, ease: [0.17, 0.67, 0.2, 1] }}
        />
        <div className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full border border-border bg-card text-xs font-bold">
          SPIN
        </div>
      </div>
      {result && !spinning && (
        <p className="text-sm font-medium">{result === "Mai încearcă mâine" ? "Mai încearcă mâine!" : `Ai câștigat: ${result}`}</p>
      )}
      <Button onClick={handleSpin} disabled={!canSpin} className="w-full">
        {canSpin ? "Rotește o dată azi" : "Ai folosit rotirea de azi"}
      </Button>
    </div>
  );
}
