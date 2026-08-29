"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Plus, Star } from "lucide-react";

import { getBarber } from "@/lib/mock/barbers";
import { getSalon } from "@/lib/mock/salons";
import { getCommunityTitlesForBarber } from "@/lib/mock/community";
import { useAppStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { uploadImage } from "@/lib/supabase/storage";
import { mirrorBarberGallery } from "@/lib/supabase/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export default function BarberPortfolioPage() {
  const currentBarberId = useAppStore((s) => s.currentBarberId);
  const pushToast = useAppStore((s) => s.pushToast);
  const barber = getBarber(currentBarberId);
  const salon = barber ? getSalon(barber.salonId) : null;
  const titles = getCommunityTitlesForBarber(currentBarberId);
  const [gallery, setGallery] = useState(barber?.gallery ?? salon?.gallery ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    if (!isSupabaseConfigured()) {
      pushToast("Încărcarea fotografiilor va fi disponibilă după conectarea Supabase Storage.");
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !barber) return;
    try {
      const url = await uploadImage(file, `barbers/${barber.id}/portfolio`);
      const next = [...gallery, url];
      setGallery(next);
      void mirrorBarberGallery(barber.id, next);
      pushToast("Fotografie adăugată.", "success");
    } catch {
      pushToast("Încărcarea a eșuat. Încearcă din nou.", "destructive");
    }
  }

  if (!barber || !salon) return null;

  return (
    <div className="flex flex-col gap-5 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <h1 className="text-xl font-semibold">Portofoliu</h1>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar className="size-16">
          <AvatarImage src={barber.avatar} alt={barber.name} />
          <AvatarFallback>{initials(barber.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{barber.name}</p>
          <p className="text-sm text-muted-foreground">{barber.title} · {salon.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm">
            <Star className="size-3.5 fill-accent text-accent" /> {barber.rating.toFixed(1)} ({barber.reviewCount})
          </p>
        </div>
      </div>

      {titles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {titles.map((t) => (
            <Badge key={t.id} variant="soft">{t.title}</Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {barber.specialties.map((s) => (
          <Badge key={s} variant="secondary">{s}</Badge>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Lucrări</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAddPhoto}
        />
        <button
          onClick={openPicker}
          className="flex items-center gap-1 text-sm font-medium text-accent"
        >
          <Plus className="size-3.5" /> Adaugă foto
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {gallery.map((src) => (
          <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
            <Image src={src} alt="Lucrare portofoliu" fill sizes="33vw" className="object-cover" />
          </div>
        ))}
      </div>

      <Link href={`/salon/${salon.id}`}>
        <Button variant="outline" className="w-full gap-2">
          <Eye className="size-4" /> Previzualizează ca și client
        </Button>
      </Link>
    </div>
  );
}
