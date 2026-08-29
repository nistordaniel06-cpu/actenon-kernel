"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Eye, LogOut, Plus, User } from "lucide-react";

import { Salon } from "@/lib/types";
import { BackButton } from "@/components/client/back-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const hours = [
  { day: "Luni – Vineri", time: "09:00 – 20:00" },
  { day: "Sâmbătă", time: "09:00 – 21:30" },
  { day: "Duminică", time: "Închis" },
];

export function BusinessProfileClient({ salon }: { salon: Salon }) {
  const [name, setName] = useState(salon.name);
  const [bio, setBio] = useState(
    "Tunsori de precizie și frizerie clasică în inima orașului. Acceptăm și clienți fără programare, dar rezervarea în avans îți garantează scaunul preferat.",
  );

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="relative h-40 w-full bg-surface-2">
        <Image src={salon.coverImage} alt={salon.name} fill priority sizes="100vw" className="object-cover" />
        <BackButton className="absolute left-3 top-[max(env(safe-area-inset-top),0.75rem)]" />
        <button className="absolute right-3 top-[max(env(safe-area-inset-top),0.75rem)] flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
          <Camera className="size-3.5" /> Schimbă coperta
        </button>
        <div className="absolute -bottom-8 left-5 size-16 overflow-hidden rounded-2xl border-4 border-background bg-card">
          <Image src={salon.logo} alt="" fill sizes="64px" className="object-cover" />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-6">
        <div className="flex flex-col gap-1.5">
          <Label>Numele afacerii</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Despre noi</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Portofoliu</Label>
            <Badge variant="secondary">{salon.gallery.length} fotografii</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {salon.gallery.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                <Image src={src} alt="Portofoliu" fill sizes="33vw" className="object-cover" />
              </div>
            ))}
            <button className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Program de funcționare</Label>
          <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
            {hours.map((h) => (
              <div key={h.day} className="flex items-center justify-between border-b border-border/70 py-3 last:border-0 text-sm">
                <span className="text-muted-foreground">{h.day}</span>
                <span className="font-medium">{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full">Salvează modificările</Button>

        <Link href={`/salon/${salon.id}`}>
          <Button variant="outline" className="w-full gap-2">
            <Eye className="size-4" /> Previzualizează ca și client
          </Button>
        </Link>

        <Link href="/profile">
          <Button variant="ghost" className="w-full gap-2">
            <User className="size-4" /> Comută la aplicația de client
          </Button>
        </Link>

        <button className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-semibold text-destructive">
          <LogOut className="size-4" /> Deconectare
        </button>
      </div>
    </div>
  );
}
