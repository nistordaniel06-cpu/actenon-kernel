import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";

import { Deal, Salon, Service } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function DealCard({
  deal,
  salon,
  service,
}: {
  deal: Deal;
  salon: Salon;
  service: Service;
}) {
  const discounted = Math.round(service.price * (1 - deal.discountPercent / 100));
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
    new Date(deal.startIso),
  );

  return (
    <Link
      href={`/salon/${salon.id}?service=${service.id}`}
      className="relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card active:opacity-90"
    >
      <div className="relative h-28 w-full">
        <Image src={salon.coverImage} alt={salon.name} fill sizes="256px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
          <Flame className="size-3" />-{deal.discountPercent}%
        </span>
        <span className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow">
          {salon.name}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-sm font-medium">{deal.title}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Today at {time} · {deal.seatsLeft} left</p>
          <p className="text-sm font-semibold">
            {formatPrice(discounted)}{" "}
            <span className="text-xs font-normal text-muted-foreground line-through">
              {formatPrice(service.price)}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
