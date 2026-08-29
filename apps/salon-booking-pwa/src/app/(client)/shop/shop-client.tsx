"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Gift } from "lucide-react";

import { currentUser } from "@/lib/mock/user";
import { useAppStore } from "@/lib/store";
import { ShopProduct } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";

const categories: { key: ShopProduct["category"] | "all"; label: string }[] = [
  { key: "all", label: "Recomandate" },
  { key: "pomade", label: "Pomadă" },
  { key: "beard", label: "Îngrijire barbă" },
  { key: "shampoo", label: "Șampon" },
  { key: "tools", label: "Unelte" },
];

export function ShopClient({ products }: { products: ShopProduct[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof categories)[number]["key"]>("all");
  const addProductToNextAppointment = useAppStore((s) => s.addProductToNextAppointment);
  const pushToast = useAppStore((s) => s.pushToast);

  const filtered = useMemo(
    () => (category === "all" ? products : products.filter((p) => p.category === category)),
    [category, products],
  );

  function addToBooking(product: ShopProduct) {
    const added = addProductToNextAppointment(product, currentUser.name);
    pushToast(
      added
        ? `${product.name} a fost adăugat la următoarea ta programare.`
        : "Nu ai nicio programare viitoare — rezervă întâi o vizită.",
      added ? "success" : "destructive",
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-full bg-surface-2">
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-lg font-semibold">Magazin</h1>
        </div>
        <ShoppingCart className="size-5 text-muted-foreground" />
      </div>

      <div>
        <h2 className="mb-1 text-xl font-semibold tracking-tight">Produse pentru stilul tău</h2>
        <p className="text-sm text-muted-foreground">Recomandate după ultimul tuns</p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
              category === c.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              <Image src={p.image} alt={p.name} fill sizes="80px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {formatPrice(p.memberPrice)}{" "}
                    <span className="text-xs font-normal text-muted-foreground line-through">
                      {formatPrice(p.price)}
                    </span>
                  </p>
                  <Badge variant="soft" className="mt-0.5">Preț membru</Badge>
                  {p.pickupOnly && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Ridicare la salon</p>
                  )}
                </div>
                <Button size="sm" onClick={() => addToBooking(p)}>
                  Adaugă la programare
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-4">
        <Gift className="size-5 shrink-0 text-accent" />
        <p className="text-sm text-accent">Poți câștiga acest produs la roata zilnică din Portofel.</p>
      </div>
    </div>
  );
}
