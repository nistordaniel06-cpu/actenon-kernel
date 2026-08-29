"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Search, Bell, ChevronDown, ChevronRight, Sliders, ShoppingBag, Check } from "lucide-react";

import { salons, getSalon } from "@/lib/mock/salons";
import { barbers, getBarber } from "@/lib/mock/barbers";
import { deals } from "@/lib/mock/deals";
import { getService } from "@/lib/mock/services";
import { currentUser } from "@/lib/mock/user";
import { shopProducts } from "@/lib/mock/shop";
import { useAppStore } from "@/lib/store";
import { AvailableNowCard } from "@/components/client/available-now-card";
import { DealCard } from "@/components/client/deal-card";
import { SalonCard } from "@/components/client/salon-card";
import { SectionHeader } from "@/components/client/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice, initials } from "@/lib/utils";

const BUCHAREST_AREAS = [
  "Sector 1, București",
  "Sector 2, București",
  "Sector 3, București",
  "Sector 4, București",
  "Sector 5, București",
  "Sector 6, București",
];

export default function HomePage() {
  const availableBarbers = barbers.filter((b) => b.availableNow).slice(0, 6);
  const nearby = [...salons].sort((a, b) => a.distanceKm - b.distanceKm);
  const firstName = currentUser.name.split(" ")[0];
  const [area, setArea] = useState(BUCHAREST_AREAS[0]);
  const [areaOpen, setAreaOpen] = useState(false);

  const appointments = useAppStore((s) => s.appointments);
  const nextAppt = appointments
    .filter((a) => a.status === "confirmat" && a.clientName === currentUser.name)
    .sort((a, b) => a.startIso.localeCompare(b.startIso))[0];

  return (
    <div className="flex flex-col gap-6 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex items-center justify-between px-5 pt-2">
        <div>
          <p className="text-xs text-muted-foreground">Bine ai revenit, {firstName}</p>
          <button
            onClick={() => setAreaOpen(true)}
            className="mt-0.5 flex items-center gap-1 text-sm font-semibold"
          >
            <MapPin className="size-4 text-accent" />
            {area}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="relative flex size-9 items-center justify-center rounded-full bg-surface-2"
          >
            <Bell className="size-4.5" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
          </Link>
          <Link href="/profile">
            <Avatar className="size-9">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      <div className="flex gap-2 px-5">
        <Link
          href="/discover"
          className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm text-muted-foreground active:bg-surface-2"
        >
          <Search className="size-4" />
          Caută frizeri, saloane, servicii
        </Link>
        <Link
          href="/request"
          aria-label="Cerere rapidă"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card active:bg-surface-2"
        >
          <Sliders className="size-4" />
        </Link>
      </div>

      {nextAppt && (
        <section className="px-5">
          {(() => {
            const salon = getSalon(nextAppt.salonId);
            const barber = getBarber(nextAppt.barberId);
            if (!salon || !barber) return null;
            return (
              <Link
                href="/appointments"
                className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3.5"
              >
                <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <Image src={salon.coverImage} alt={salon.name} fill sizes="44px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-accent">Următoarea programare</p>
                  <p className="truncate text-sm font-semibold">
                    {salon.name} · {new Intl.DateTimeFormat("ro-RO", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(nextAppt.startIso))}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-accent" />
              </Link>
            );
          })()}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Liberi acum" subtitle="Rezervă instant, fără așteptare" href="/discover?filter=now" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
          {availableBarbers.map((barber) => {
            const salon = getSalon(barber.salonId);
            if (!salon) return null;
            return <AvailableNowCard key={barber.id} barber={barber} salon={salon} />;
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Oferte de ultim moment" subtitle="Sloturi eliberate, la preț redus" href="/discover?filter=deals" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
          {deals.map((deal) => {
            const salon = getSalon(deal.salonId);
            const service = getService(deal.serviceId);
            if (!salon || !service) return null;
            return <DealCard key={deal.id} deal={deal} salon={salon} service={service} />;
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2 pb-2">
        <SectionHeader title="Aproape de tine" subtitle={`${nearby.length} locații`} href="/discover" />
        <div className="flex flex-col px-3">
          {nearby.slice(0, 4).map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 pb-4">
        <SectionHeader title="Magazin" subtitle="Produse recomandate pentru stilul tău" href="/shop" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
          {shopProducts.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              href="/shop"
              className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-2.5"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                <Image src={p.image} alt={p.name} fill sizes="144px" className="object-cover" />
              </div>
              <div>
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(p.memberPrice)} preț membru</p>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/shop" className="px-5">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <ShoppingBag className="size-4" /> Vezi tot magazinul
          </Button>
        </Link>
      </section>

      <Sheet open={areaOpen} onOpenChange={setAreaOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Alege zona ta</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-5 pb-6">
            {BUCHAREST_AREAS.map((a) => (
              <button
                key={a}
                onClick={() => {
                  setArea(a);
                  setAreaOpen(false);
                }}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-surface-2"
              >
                {a}
                {a === area && <Check className="size-4 text-accent" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
