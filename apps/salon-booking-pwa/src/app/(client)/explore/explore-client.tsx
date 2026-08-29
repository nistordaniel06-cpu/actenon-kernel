"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Map, List, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Salon } from "@/lib/types";
import { ExploreMap } from "@/components/client/explore-map";
import { SalonCard } from "@/components/client/salon-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "now" | "deals" | "barbershop" | "salon";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "now", label: "Available now" },
  { key: "deals", label: "Hot deals" },
  { key: "barbershop", label: "Barbershops" },
  { key: "salon", label: "Salons" },
];

export function ExploreClient({ salons }: { salons: Salon[] }) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") === "now" ? "now" : searchParams.get("filter") === "deals" ? "deals" : "all") as FilterKey;

  const [view, setView] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const filtered = useMemo(() => {
    return salons.filter((s) => {
      if (filter === "now") return s.availableNow;
      if (filter === "deals") return s.hasHotDeal;
      if (filter === "barbershop") return s.type === "barbershop";
      if (filter === "salon") return s.type === "salon";
      return true;
    });
  }, [salons, filter]);

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col">
      <div className="z-10 flex flex-col gap-3 bg-background pt-[max(env(safe-area-inset-top),1rem)] pb-3">
        <div className="flex items-center gap-3 px-5">
          <Link href="/" className="flex size-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">Explore nearby</h1>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {view === "map" ? (
          <ExploreMap salons={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        ) : (
          <div className="no-scrollbar h-full overflow-y-auto px-3 pb-6">
            {filtered.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-muted-foreground">
                No places match this filter yet.
              </p>
            ) : (
              filtered.map((salon) => <SalonCard key={salon.id} salon={salon} />)
            )}
          </div>
        )}

        <div className="absolute left-1/2 top-4 flex -translate-x-1/2 overflow-hidden rounded-full border border-border bg-card shadow-md">
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium",
              view === "map" ? "bg-primary text-primary-foreground" : "text-foreground",
            )}
          >
            <Map className="size-3.5" /> Map
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium",
              view === "list" ? "bg-primary text-primary-foreground" : "text-foreground",
            )}
          >
            <List className="size-3.5" /> List
          </button>
        </div>

        {view === "map" && (
          <button
            onClick={() => setListOpen(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg"
          >
            See {filtered.length} places
          </button>
        )}
      </div>

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>{filtered.length} places nearby</SheetTitle>
          </SheetHeader>
          <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-6">
            {filtered.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
