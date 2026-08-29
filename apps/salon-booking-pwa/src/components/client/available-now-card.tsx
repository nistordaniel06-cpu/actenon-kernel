import Image from "next/image";
import Link from "next/link";

import { Barber, Salon } from "@/lib/types";
import { Rating } from "@/components/client/rating";

export function AvailableNowCard({ barber, salon }: { barber: Barber; salon: Salon }) {
  return (
    <Link
      href={`/salon/${salon.id}?barber=${barber.id}`}
      className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3 active:bg-secondary/60"
    >
      <div className="relative">
        <div className="relative size-14 overflow-hidden rounded-full ring-2 ring-success/40">
          <Image src={barber.avatar} alt={barber.name} fill sizes="56px" className="object-cover" />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card bg-success" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{barber.name}</p>
        <p className="truncate text-xs text-muted-foreground">{salon.name}</p>
        <Rating value={barber.rating} className="mt-1" />
      </div>
    </Link>
  );
}
