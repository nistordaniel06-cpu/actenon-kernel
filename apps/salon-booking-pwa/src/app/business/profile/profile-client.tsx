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
  { day: "Mon – Fri", time: "9:00 AM – 8:00 PM" },
  { day: "Saturday", time: "9:00 AM – 9:30 PM" },
  { day: "Sunday", time: "Closed" },
];

export function BusinessProfileClient({ salon }: { salon: Salon }) {
  const [name, setName] = useState(salon.name);
  const [bio, setBio] = useState(
    "Precision cuts and classic barbering in the heart of the city. Walk-ins welcome, but booking ahead guarantees your favorite chair.",
  );

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="relative h-40 w-full bg-secondary">
        <Image src={salon.coverImage} alt={salon.name} fill className="object-cover" />
        <BackButton className="absolute left-3 top-[max(env(safe-area-inset-top),0.75rem)]" />
        <button className="absolute right-3 top-[max(env(safe-area-inset-top),0.75rem)] flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
          <Camera className="size-3.5" /> Change cover
        </button>
        <div className="absolute -bottom-8 left-5 size-16 overflow-hidden rounded-2xl border-4 border-background bg-card">
          <Image src={salon.logo} alt="" fill className="object-cover" />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-6">
        <div className="flex flex-col gap-1.5">
          <Label>Business name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>About</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Portfolio</Label>
            <Badge variant="secondary">{salon.gallery.length} photos</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {salon.gallery.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                <Image src={src} alt="Portfolio" fill className="object-cover" />
              </div>
            ))}
            <button className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Opening hours</Label>
          <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
            {hours.map((h) => (
              <div key={h.day} className="flex items-center justify-between border-b border-border/70 py-3 last:border-0 text-sm">
                <span className="text-muted-foreground">{h.day}</span>
                <span className="font-medium">{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full">Save changes</Button>

        <Link href={`/salon/${salon.id}`}>
          <Button variant="outline" className="w-full gap-2">
            <Eye className="size-4" /> Preview as client
          </Button>
        </Link>

        <Link href="/profile">
          <Button variant="ghost" className="w-full gap-2">
            <User className="size-4" /> Switch to client app
          </Button>
        </Link>

        <button className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-semibold text-destructive">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
