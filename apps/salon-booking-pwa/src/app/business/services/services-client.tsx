"use client";

import { useState } from "react";
import { Pencil, Plus, Clock } from "lucide-react";

import { Service } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

export function ServicesClient({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(
    initialServices.map((s) => ({ ...s, active: true })),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", price: "", durationMin: "" });

  function toggle(id: string) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  function addService() {
    if (!draft.name || !draft.price || !draft.durationMin) return;
    setServices((prev) => [
      ...prev,
      {
        id: `svc-custom-${prev.length + 1}`,
        name: draft.name,
        category: "hair",
        price: Number(draft.price),
        durationMin: Number(draft.durationMin),
        active: true,
      },
    ]);
    setDraft({ name: "", price: "", durationMin: "" });
    setAddOpen(false);
  }

  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Services & prices</h1>
          <p className="text-sm text-muted-foreground">{services.filter((s) => s.active).length} active services</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New service</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Textured Crop"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={draft.price}
                    onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={draft.durationMin}
                    onChange={(e) => setDraft((d) => ({ ...d, durationMin: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addService}>Save service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </h2>
          <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
            {items.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 border-b border-border/70 py-3.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {s.durationMin} min
                    </span>
                    <span>{formatPrice(s.price)}</span>
                  </p>
                </div>
                <button className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
                  <Pencil className="size-3.5" />
                </button>
                <Switch checked={s.active} onCheckedChange={() => toggle(s.id)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
