"use client";

import { useState } from "react";
import { Flame, Gift, Package, X } from "lucide-react";

import { getDealsForSalon } from "@/lib/mock/deals";
import { myBusinessSalon } from "@/lib/mock/business-context";
import { shopProducts } from "@/lib/mock/shop";
import { useAppStore } from "@/lib/store";
import { BusinessHeader } from "@/components/business/business-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

const STOCK = [18, 6, 24, 11, 3, 4, 2, 30];

const DISCOUNTS = [15, 20, 30, 40];

export default function CampaignsPage() {
  const initialDeals = getDealsForSalon(myBusinessSalon.id);
  const [activeDeals, setActiveDeals] = useState(initialDeals);
  const [discount, setDiscount] = useState(20);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const pushToast = useAppStore((s) => s.pushToast);

  function removeDeal(id: string) {
    setActiveDeals((prev) => prev.filter((d) => d.id !== id));
    setPendingRemoveId(null);
    pushToast("Ofertă oprită.", "success");
  }

  const pendingDeal = activeDeals.find((d) => d.id === pendingRemoveId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <BusinessHeader title="Campanii" subtitle="Oferte, giveaway și stoc produse" />

      <div className="flex flex-col gap-2 px-5">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Flame className="size-4 text-accent" /> Oferte active ({activeDeals.length})
        </h2>
        {activeDeals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nicio ofertă activă momentan.
          </p>
        ) : (
          activeDeals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-accent">{deal.title}</p>
                <p className="text-xs text-muted-foreground">-{deal.discountPercent}% · {deal.seatsLeft} loc rămas</p>
              </div>
              <button onClick={() => setPendingRemoveId(deal.id)} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card">
                <X className="size-4" />
              </button>
            </div>
          ))
        )}
        <div className="mt-1 flex items-center gap-2">
          {DISCOUNTS.map((d) => (
            <button
              key={d}
              onClick={() => setDiscount(d)}
              className={`flex-1 rounded-full border py-1.5 text-sm font-medium ${discount === d ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}
            >
              -{d}%
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() =>
            setActiveDeals((prev) => [
              ...prev,
              {
                id: `deal-${Date.now()}`,
                salonId: myBusinessSalon.id,
                title: `Ofertă generală -${discount}%`,
                discountPercent: discount,
                startIso: new Date().toISOString(),
                endIso: new Date(Date.now() + 3 * 3_600_000).toISOString(),
                serviceId: myBusinessSalon.services[0]?.id ?? "svc-1",
                seatsLeft: 3,
              },
            ])
          }
        >
          Lansează ofertă nouă
        </Button>
      </div>

      <div className="flex flex-col gap-2 px-5">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Gift className="size-4 text-accent" /> Giveaway lunar
        </h2>
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Câștigă un set de îngrijire barbă</p>
            <Badge variant="soft">142 înscrieri</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Se încheie în 5 zile · un câștigător tras la sorți din clienții fideli</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-5 pb-6">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Package className="size-4 text-accent" /> Stoc produse
        </h2>
        <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
          {shopProducts.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between border-b border-border/70 py-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(p.memberPrice)} preț membru</p>
              </div>
              <Badge variant={STOCK[i] < 5 ? "destructive" : "secondary"}>{STOCK[i]} buc.</Badge>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!pendingDeal} onOpenChange={(open) => !open && setPendingRemoveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oprești această ofertă?</DialogTitle>
            <DialogDescription>
              {pendingDeal?.title} nu va mai fi vizibilă clienților.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemoveId(null)}>
              Renunță
            </Button>
            <Button variant="destructive" onClick={() => pendingDeal && removeDeal(pendingDeal.id)}>
              Oprește oferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
