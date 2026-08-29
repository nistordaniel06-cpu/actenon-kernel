"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MapPin } from "lucide-react";

import { Appointment } from "@/lib/types";
import { getSalon } from "@/lib/mock/salons";
import { getBarber } from "@/lib/mock/barbers";
import { getService } from "@/lib/mock/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const salon = getSalon(appointment.salonId);
  const barber = getBarber(appointment.barberId);
  const service = getService(appointment.serviceId);
  if (!salon || !barber || !service) return null;

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(appointment.startIso));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
            <Image src={salon.coverImage} alt={salon.name} fill sizes="48px" className="object-cover" />
          </div>
          <div>
            <p className="font-semibold">{salon.name}</p>
            <p className="text-sm text-muted-foreground">{service.name} · {barber.name}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
        <span className="text-muted-foreground">{date}</span>
        <span className="font-semibold">{formatPrice(appointment.price)}</span>
      </div>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3" /> {salon.address}
      </p>

      {appointment.status === "upcoming" && (
        <div className="flex gap-2 pt-1">
          <Link href={`/book/${salon.id}?service=${service.id}&barber=${barber.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Reschedule
            </Button>
          </Link>
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:bg-destructive/10">
                Cancel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel this appointment?</DialogTitle>
                <DialogDescription>
                  Your slot at {salon.name} on {date} will be released for other clients.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelOpen(false)}>
                  Keep booking
                </Button>
                <Button variant="destructive" onClick={() => setCancelOpen(false)}>
                  Cancel appointment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {appointment.status === "completed" && (
        <Link href={`/salon/${salon.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Book again
          </Button>
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  if (status === "upcoming") return <Badge variant="success">Upcoming</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">Completed</Badge>;
}
