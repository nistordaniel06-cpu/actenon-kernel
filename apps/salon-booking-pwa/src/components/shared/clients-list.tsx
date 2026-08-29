"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { BusinessClient } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatDayMonth, formatPrice, initials } from "@/lib/utils";

type TagFilter = "all" | BusinessClient["tag"];

const tagMeta: Record<BusinessClient["tag"], { label: string; variant: "success" | "secondary" | "soft" | "destructive" }> = {
  new: { label: "Nou", variant: "soft" },
  regular: { label: "Fidel", variant: "secondary" },
  vip: { label: "VIP", variant: "success" },
  "at-risk": { label: "În risc", variant: "destructive" },
};

const filters: { key: TagFilter; label: string }[] = [
  { key: "all", label: "Toți" },
  { key: "vip", label: "VIP" },
  { key: "regular", label: "Fideli" },
  { key: "new", label: "Noi" },
  { key: "at-risk", label: "În risc" },
];

export function ClientsList({ clients, detailHrefBase }: { clients: BusinessClient[]; detailHrefBase: string }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<TagFilter>("all");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (tag !== "all" && c.tag !== tag) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [clients, tag, query]);

  return (
    <div className="flex flex-col gap-4 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <div>
        <h1 className="text-xl font-semibold">Clienți</h1>
        <p className="text-sm text-muted-foreground">{clients.length} persoane au rezervat cu tine</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută clienți"
          className="pl-10"
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setTag(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
              tag === f.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`${detailHrefBase}/${c.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
          >
            <Avatar className="size-11">
              <AvatarImage src={c.avatar} alt={c.name} />
              <AvatarFallback>{initials(c.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{c.name}</p>
                <Badge variant={tagMeta[c.tag].variant}>{tagMeta[c.tag].label}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {c.visits} vizite · Ultima {formatDayMonth(c.lastVisit)} · Preferă {c.favoriteService}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold">{formatPrice(c.totalSpent)}</p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Niciun client nu se potrivește acestui filtru.</p>
        )}
      </div>
    </div>
  );
}
