"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

import { salons } from "@/lib/mock/salons";
import { services } from "@/lib/mock/services";
import { SalonCard } from "@/components/client/salon-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const budgets = [
  { key: "any", label: "Orice buget", max: Infinity },
  { key: "low", label: "Sub 80 lei", max: 80 },
  { key: "mid", label: "Sub 150 lei", max: 150 },
  { key: "high", label: "Fără limită", max: Infinity },
] as const;

const radii = [1, 2, 5, 10];
const intervals = ["Oricând", "Dimineață", "După-amiază", "Seara"];

export default function QuickRequestPage() {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [interval, setInterval_] = useState(intervals[0]);
  const [budgetKey, setBudgetKey] = useState<(typeof budgets)[number]["key"]>("any");
  const [radius, setRadius] = useState(5);
  const [searched, setSearched] = useState(false);

  const budget = budgets.find((b) => b.key === budgetKey)!;

  const results = useMemo(() => {
    return salons.filter((s) => {
      if (s.distanceKm > radius) return false;
      if (!serviceId) return true;
      const svc = s.services.find((sv) => sv.id === serviceId);
      if (!svc) return false;
      return svc.price <= budget.max;
    });
  }, [serviceId, budget, radius]);

  return (
    <div className="flex flex-col gap-5 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-full bg-surface-2">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-lg font-semibold">Cerere rapidă</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Spune-ne ce cauți și îți arătăm cele mai potrivite locații.
      </p>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Serviciu</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setServiceId(null)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium",
              serviceId === null ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            Orice
          </button>
          {services.slice(0, 6).map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium",
                serviceId === s.id ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Interval orar</p>
        <div className="flex flex-wrap gap-2">
          {intervals.map((i) => (
            <button
              key={i}
              onClick={() => setInterval_(i)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium",
                interval === i ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Buget</p>
        <div className="flex flex-wrap gap-2">
          {budgets.map((b) => (
            <button
              key={b.key}
              onClick={() => setBudgetKey(b.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium",
                budgetKey === b.key ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Rază: {radius} km</p>
        <div className="flex gap-2">
          {radii.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={cn(
                "flex-1 rounded-full border py-1.5 text-sm font-medium",
                radius === r ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="gap-2" onClick={() => setSearched(true)}>
        <Search className="size-4" /> Caută
      </Button>

      {searched && (
        <div className="flex flex-col gap-1 pt-2">
          <p className="px-1 text-sm font-medium text-muted-foreground">
            {results.length} {results.length === 1 ? "rezultat" : "rezultate"}
          </p>
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Niciun salon nu se potrivește. Încearcă o rază mai mare.
            </p>
          ) : (
            results.map((salon) => <SalonCard key={salon.id} salon={salon} />)
          )}
        </div>
      )}
    </div>
  );
}
