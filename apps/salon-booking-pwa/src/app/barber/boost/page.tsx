"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flame, Share2, MessageCircle, Bell, X } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { BarberHeader } from "@/components/barber/barber-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn, formatPrice } from "@/lib/utils";

const CHANNELS = [
  { key: "instagram" as const, label: "Instagram", icon: Share2 },
  { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { key: "push" as const, label: "Notificare push", icon: Bell },
];

const boostSchema = z.object({
  discountPercent: z.number().min(10).max(50),
  radiusKm: z.number().min(1).max(15),
  budgetLei: z.number().min(0).max(500),
  channels: z.array(z.enum(["instagram", "whatsapp", "push"])).min(1, "Alege cel puțin un canal"),
});

type BoostForm = z.infer<typeof boostSchema>;

export default function BoostPage() {
  const currentBarberId = useAppStore((s) => s.currentBarberId);
  const allBoosts = useAppStore((s) => s.boosts);
  const boosts = allBoosts.filter((b) => b.barberId === currentBarberId);
  const addBoost = useAppStore((s) => s.addBoost);
  const toggleBoost = useAppStore((s) => s.toggleBoost);
  const pushToast = useAppStore((s) => s.pushToast);

  const { watch, setValue, handleSubmit, formState } = useForm<BoostForm>({
    resolver: zodResolver(boostSchema),
    defaultValues: { discountPercent: 20, radiusKm: 5, budgetLei: 50, channels: ["push"] },
  });

  const values = watch();

  function toggleChannel(key: BoostForm["channels"][number]) {
    const set = new Set(values.channels);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    setValue("channels", Array.from(set), { shouldValidate: true });
  }

  function onSubmit(data: BoostForm) {
    addBoost({
      id: `boost-${Date.now()}`,
      barberId: currentBarberId,
      startIso: new Date().toISOString(),
      endIso: new Date(Date.now() + 3 * 3_600_000).toISOString(),
      discountPercent: data.discountPercent,
      radiusKm: data.radiusKm,
      budgetLei: data.budgetLei,
      channels: data.channels,
      active: true,
    });
    pushToast("Boost activat — trimitem notificări clienților din zonă.", "success");
  }

  return (
    <div className="flex flex-col gap-5">
      <BarberHeader barberId={currentBarberId} title="Boost oră liberă" subtitle="Umple sloturile goale rapid" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-5">
        <div className="flex flex-col gap-2">
          <Label>Reducere: {values.discountPercent}%</Label>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={values.discountPercent}
            onChange={(e) => setValue("discountPercent", Number(e.target.value))}
            className="accent-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Rază: {values.radiusKm} km</Label>
          <input
            type="range"
            min={1}
            max={15}
            value={values.radiusKm}
            onChange={(e) => setValue("radiusKm", Number(e.target.value))}
            className="accent-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Buget: {formatPrice(values.budgetLei)}</Label>
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={values.budgetLei}
            onChange={(e) => setValue("budgetLei", Number(e.target.value))}
            className="accent-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Canale de promovare (demo)</Label>
          {CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <span className="flex items-center gap-2 text-sm">
                <c.icon className="size-4 text-muted-foreground" /> {c.label}
              </span>
              <Switch
                checked={values.channels.includes(c.key)}
                onCheckedChange={() => toggleChannel(c.key)}
              />
            </div>
          ))}
          {formState.errors.channels && (
            <p className="text-xs text-destructive">{formState.errors.channels.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="gap-2">
          <Flame className="size-4" /> Activează boost
        </Button>
      </form>

      {boosts.length > 0 && (
        <div className="flex flex-col gap-2 px-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Boost-uri active</h2>
          {boosts.map((b) => (
            <div key={b.id} className={cn("flex items-center justify-between rounded-2xl border p-4", b.active ? "border-accent/30 bg-accent-soft" : "border-border bg-card opacity-60")}>
              <div>
                <p className="text-sm font-medium">-{b.discountPercent}% · {b.radiusKm} km · {formatPrice(b.budgetLei)}</p>
                <p className="text-xs text-muted-foreground">{b.channels.join(", ")}</p>
              </div>
              <button
                onClick={() => {
                  toggleBoost(b.id);
                  pushToast(b.active ? "Boost oprit." : "Boost repornit.", "success");
                }}
                className="flex size-8 items-center justify-center rounded-full bg-surface-2"
                aria-label={b.active ? "Oprește boost-ul" : "Repornește boost-ul"}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
