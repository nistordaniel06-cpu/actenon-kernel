import Link from "next/link";
import { Clock } from "lucide-react";

import { Service } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function ServiceRow({ service, salonId }: { service: Service; salonId: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="font-medium">{service.name}</p>
        {service.description && (
          <p className="truncate text-sm text-muted-foreground">{service.description}</p>
        )}
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" /> {service.durationMin} min
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="font-semibold">{formatPrice(service.price)}</p>
        <Link
          href={`/book/${salonId}?service=${service.id}`}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold active:bg-secondary"
        >
          Rezervă
        </Link>
      </div>
    </div>
  );
}
