"use client";

import { useState } from "react";
import { Clock, Percent } from "lucide-react";

import { Barber, Salon, StaffMember } from "@/lib/types";
import { BusinessHeader } from "@/components/business/business-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export function StaffClient({
  salon,
  barbers,
  initialStaff,
}: {
  salon: Salon;
  barbers: Barber[];
  initialStaff: StaffMember[];
}) {
  const [staff, setStaff] = useState(initialStaff);

  function updateCommission(id: string, value: number) {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, commissionPercent: value } : s)));
  }

  return (
    <div className="flex flex-col gap-5">
      <BusinessHeader salon={salon} title="Personal" subtitle="Ture și procente de comision" />

      <div className="flex flex-col gap-3 px-5 pb-6">
        {staff.map((s) => {
          const barber = barbers.find((b) => b.id === s.barberId);
          if (!barber) return null;
          return (
            <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarImage src={barber.avatar} alt={barber.name} />
                  <AvatarFallback>{initials(barber.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{barber.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {s.shift}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Percent className="size-3.5" /> Comision
                </span>
                <input
                  type="range"
                  min={20}
                  max={60}
                  step={5}
                  value={s.commissionPercent}
                  onChange={(e) => updateCommission(s.id, Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="w-10 text-right text-sm font-semibold">{s.commissionPercent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
