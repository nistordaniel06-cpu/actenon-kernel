"use client";

import { useState } from "react";
import { Star, Camera } from "lucide-react";

import { Appointment } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { currentUser } from "@/lib/mock/user";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TAG_OPTIONS = ["Punctual", "Curățenie impecabilă", "Rezultat peste așteptări", "Prietenos", "A meritat prețul"];

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stele`}>
            <Star className={cn("size-5", n <= value ? "fill-accent text-accent" : "text-border")} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({
  open,
  onOpenChange,
  appointment,
  salonName,
  serviceName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment: Appointment;
  salonName: string;
  serviceName: string;
}) {
  const [quality, setQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [photoAdded, setPhotoAdded] = useState(false);

  const addReview = useAppStore((s) => s.addReview);
  const addPoints = useAppStore((s) => s.addPoints);
  const pushToast = useAppStore((s) => s.pushToast);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function submit() {
    const overall = Math.round((quality + punctuality + cleanliness) / 3);
    addReview(appointment.salonId, appointment.id, {
      id: `rev-${Date.now()}`,
      author: currentUser.name,
      avatar: currentUser.avatar,
      rating: overall,
      quality,
      punctuality,
      cleanliness,
      tags,
      comment,
      date: new Date().toISOString(),
      serviceName,
      verified: true,
    });
    addPoints(20, "Review verificat");
    pushToast("Mulțumim pentru review! Ai primit 20 de puncte.", "success");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>Cum a fost la {salonName}?</SheetTitle>
        </SheetHeader>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{serviceName}</p>
            <StarPicker label="Calitate" value={quality} onChange={setQuality} />
            <StarPicker label="Punctualitate" value={punctuality} onChange={setPunctuality} />
            <StarPicker label="Curățenie" value={cleanliness} onChange={setCleanliness} />

            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    tags.includes(tag) ? "border-accent bg-accent-soft text-accent" : "border-border",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Spune-ne mai multe despre experiența ta..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <button
              type="button"
              onClick={() => setPhotoAdded((v) => !v)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium",
                photoAdded ? "border-accent text-accent" : "border-border text-muted-foreground",
              )}
            >
              <Camera className="size-4" /> {photoAdded ? "Fotografie adăugată" : "Adaugă o fotografie (demo)"}
            </button>

            <Button onClick={submit} className="w-full">
              Trimite review-ul
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
