import Link from "next/link";

import { Barber } from "@/lib/types";
import { Rating } from "@/components/client/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export function BarberRow({ barber, salonId }: { barber: Barber; salonId: string }) {
  return (
    <Link
      href={`/book/${salonId}?barber=${barber.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 active:bg-secondary/60"
    >
      <Avatar className="size-14">
        <AvatarImage src={barber.avatar} alt={barber.name} />
        <AvatarFallback>{initials(barber.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{barber.name}</p>
          {barber.availableNow && (
            <Badge variant="success" className="shrink-0">
              Now
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{barber.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <Rating value={barber.rating} count={barber.reviewCount} />
          <span className="text-xs text-muted-foreground">
            {barber.yearsExperience}y exp
          </span>
        </div>
      </div>
    </Link>
  );
}
