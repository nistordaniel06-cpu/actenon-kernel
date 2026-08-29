"use client";

import { useState } from "react";
import { Pencil, Plus, Clock } from "lucide-react";

import { Service, ServiceCategory } from "@/lib/types";
import { useAppStore } from "@/lib/store";
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

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hair: "Păr",
  beard: "Barbă",
  color: "Vopsit",
  spa: "Spa",
  kids: "Copii",
  combo: "Pachete",
};

type EditableService = Service & { active: boolean };

const emptyDraft = { name: "", price: "", durationMin: "" };

export function ServicesClient({ initialServices }: { initialServices: Service[] }) {
  const pushToast = useAppStore((s) => s.pushToast);
  const [services, setServices] = useState<EditableService[]>(
    initialServices.map((s) => ({ ...s, active: true })),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);

  function toggle(id: string) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  function openAdd() {
    setEditingId(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  }

  function openEdit(service: EditableService) {
    setEditingId(service.id);
    setDraft({ name: service.name, price: String(service.price), durationMin: String(service.durationMin) });
    setDialogOpen(true);
  }

  function saveDraft() {
    if (!draft.name || !draft.price || !draft.durationMin) return;
    if (editingId) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, name: draft.name, price: Number(draft.price), durationMin: Number(draft.durationMin) }
            : s,
        ),
      );
      pushToast("Serviciu actualizat.", "success");
    } else {
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
      pushToast("Serviciu adăugat.", "success");
    }
    setDraft(emptyDraft);
    setDialogOpen(false);
  }

  const grouped = services.reduce<Record<string, EditableService[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Servicii & prețuri</h1>
          <p className="text-sm text-muted-foreground">{services.filter((s) => s.active).length} servicii active</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openAdd}>
              <Plus className="size-4" /> Adaugă
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editează serviciul" : "Serviciu nou"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Nume</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Ex: Tuns texturat"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Preț (lei)</Label>
                  <Input
                    type="number"
                    value={draft.price}
                    onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Durată (min)</Label>
                  <Input
                    type="number"
                    value={draft.durationMin}
                    onChange={(e) => setDraft((d) => ({ ...d, durationMin: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Anulează
              </Button>
              <Button onClick={saveDraft}>{editingId ? "Salvează modificările" : "Salvează serviciul"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[category as ServiceCategory] ?? category}
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
                <button
                  onClick={() => openEdit(s)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-2"
                  aria-label={`Editează ${s.name}`}
                >
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
