import Link from "next/link";
import { MapPin, Search, Bell, ChevronDown } from "lucide-react";

import { salons } from "@/lib/mock/salons";
import { barbers } from "@/lib/mock/barbers";
import { deals } from "@/lib/mock/deals";
import { getSalon } from "@/lib/mock/salons";
import { getService } from "@/lib/mock/services";
import { currentUser } from "@/lib/mock/user";
import { AvailableNowCard } from "@/components/client/available-now-card";
import { DealCard } from "@/components/client/deal-card";
import { SalonCard } from "@/components/client/salon-card";
import { SectionHeader } from "@/components/client/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export default function HomePage() {
  const availableBarbers = barbers.filter((b) => b.availableNow).slice(0, 6);
  const nearby = [...salons].sort((a, b) => a.distanceKm - b.distanceKm);
  const firstName = currentUser.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex items-center justify-between px-5 pt-2">
        <div>
          <p className="text-xs text-muted-foreground">Good to see you, {firstName}</p>
          <button className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
            <MapPin className="size-4 text-accent" />
            Midtown, 5th Avenue
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="relative flex size-9 items-center justify-center rounded-full bg-secondary"
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

      <Link
        href="/explore"
        className="mx-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xs active:bg-secondary/60"
      >
        <Search className="size-4" />
        Search barbers, salons, services
      </Link>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Available now" subtitle="Book instantly, no waiting" href="/explore?filter=now" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
          {availableBarbers.map((barber) => {
            const salon = getSalon(barber.salonId);
            if (!salon) return null;
            return <AvailableNowCard key={barber.id} barber={barber} salon={salon} />;
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Hot deals" subtitle="Empty slots, filled fast" href="/explore?filter=deals" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
          {deals.map((deal) => {
            const salon = getSalon(deal.salonId);
            const service = getService(deal.serviceId);
            if (!salon || !service) return null;
            return <DealCard key={deal.id} deal={deal} salon={salon} service={service} />;
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2 pb-4">
        <SectionHeader title="Nearby" subtitle={`${nearby.length} places near you`} href="/explore" />
        <div className="flex flex-col px-3">
          {nearby.slice(0, 6).map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>
      </section>
    </div>
  );
}
