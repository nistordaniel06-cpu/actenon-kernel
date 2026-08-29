import Link from "next/link";
import { Bell } from "lucide-react";

import { myBusinessSalon } from "@/lib/mock/business-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export function BusinessHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-1">
      <div>
        <Badge variant="soft" className="mb-1">
          Business
        </Badge>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative flex size-9 items-center justify-center rounded-full bg-secondary">
          <Bell className="size-4.5" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
        </button>
        <Link href="/business/profile">
          <Avatar className="size-9">
            <AvatarImage src={myBusinessSalon.logo} alt={myBusinessSalon.name} />
            <AvatarFallback>{initials(myBusinessSalon.name)}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
