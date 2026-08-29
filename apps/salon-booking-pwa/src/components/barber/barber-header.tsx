import Link from "next/link";
import { Bell } from "lucide-react";

import { getBarber } from "@/lib/mock/barbers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export function BarberHeader({
  barberId,
  title,
  subtitle,
}: {
  barberId: string;
  title: string;
  subtitle?: string;
}) {
  const barber = getBarber(barberId);
  return (
    <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-1">
      <div>
        <Badge variant="soft" className="mb-1">Frizer</Badge>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative flex size-9 items-center justify-center rounded-full bg-surface-2">
          <Bell className="size-4.5" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
        </button>
        <Link href="/barber/portfolio">
          <Avatar className="size-9">
            {barber && <AvatarImage src={barber.avatar} alt={barber.name} />}
            <AvatarFallback>{barber ? initials(barber.name) : "?"}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
