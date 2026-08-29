import Image from "next/image";
import Link from "next/link";
import { Flame, Clock } from "lucide-react";

import { Salon } from "@/lib/types";
import { Rating } from "@/components/client/rating";
import { PriceLevel } from "@/components/client/price-level";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SalonCard({ salon, className }: { salon: Salon; className?: string }) {
  return (
    <Link
      href={`/salon/${salon.id}`}
      className={cn(
        "flex gap-3 rounded-2xl p-2 transition-colors active:bg-secondary/60",
        className,
      )}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
        <Image
          src={salon.coverImage}
          alt={salon.name}
          fill
          sizes="96px"
          className="object-cover"
        />
        {salon.hasHotDeal && (
          <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
            <Flame className="size-2.5" />
            Deal
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold leading-snug">{salon.name}</h3>
          <PriceLevel level={salon.priceLevel} />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Rating value={salon.rating} count={salon.reviewCount} />
          <span aria-hidden>·</span>
          <span className="text-xs">{salon.distanceKm.toFixed(1)} km</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {salon.availableNow ? (
            <Badge variant="success" className="gap-1">
              <span className="size-1.5 rounded-full bg-success" /> Available now
            </Badge>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Next {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(salon.nextAvailableIso))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
