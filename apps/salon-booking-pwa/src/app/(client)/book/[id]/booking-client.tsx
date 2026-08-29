"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  CalendarPlus,
  CalendarCheck2,
  PartyPopper,
  Home,
  Store,
  MapPin,
} from "lucide-react";

import { Barber, Salon, Service } from "@/lib/types";
import { generateSlots } from "@/lib/mock/slots";
import { currentUser } from "@/lib/mock/user";
import { useAppStore } from "@/lib/store";
import { StepIndicator } from "@/components/client/step-indicator";
import { Rating } from "@/components/client/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice, initials } from "@/lib/utils";
import { buildGoogleCalendarUrl, downloadIcs } from "@/lib/calendar";

const STEPS = ["Serviciu", "Oră", "Confirmare"];
const TRAVEL_FEE = 35;

export function BookingClient({ salon, barbers }: { salon: Salon; barbers: Barber[] }) {
  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get("reschedule");
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(searchParams.get("service"));
  const [barberId, setBarberId] = useState<string | null>(searchParams.get("barber"));
  const [sameBarber, setSameBarber] = useState(true);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [isHomeService, setIsHomeService] = useState(false);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"salon" | "online">("salon");
  const [done, setDone] = useState(false);

  const addAppointment = useAppStore((s) => s.addAppointment);
  const rescheduleAppointment = useAppStore((s) => s.rescheduleAppointment);
  const addPoints = useAppStore((s) => s.addPoints);
  const pushToast = useAppStore((s) => s.pushToast);

  const service = salon.services.find((s) => s.id === serviceId) ?? null;
  const effectiveBarbers = sameBarber ? barbers : barbers.slice(0, 1);
  const barber = effectiveBarbers.find((b) => b.id === barberId) ?? effectiveBarbers[0] ?? null;

  const days = useMemo(
    () => (barber ? generateSlots(barber.id, service?.durationMin ?? 30) : []),
    [barber, service],
  );

  const canContinue =
    (step === 0 && !!serviceId && (!isHomeService || address.trim().length > 3)) ||
    (step === 1 && !!barber && !!slotIso) ||
    step === 2;

  function handleContinue() {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (!service || !barber || !slotIso) return;

    const price = service.price + (isHomeService ? TRAVEL_FEE : 0);
    const endIso = new Date(new Date(slotIso).getTime() + service.durationMin * 60_000).toISOString();

    if (rescheduleId) {
      rescheduleAppointment(rescheduleId, slotIso, endIso);
      pushToast("Programare reprogramată", "success");
    } else {
      addAppointment({
        id: `appt-${Date.now()}`,
        salonId: salon.id,
        barberId: barber.id,
        serviceId: service.id,
        clientName: currentUser.name,
        clientAvatar: currentUser.avatar,
        startIso: slotIso,
        endIso,
        status: "confirmat",
        price,
        isHomeService,
        address: isHomeService ? address : undefined,
        travelFee: isHomeService ? TRAVEL_FEE : undefined,
      });
      addPoints(price, `Programare la ${salon.name}`);
    }
    setDone(true);
  }

  function handleBack() {
    if (step === 0) return;
    setStep(step - 1);
  }

  if (done && service && barber && slotIso) {
    return (
      <BookingConfirmed
        salon={salon}
        barber={barber}
        service={service}
        slotIso={slotIso}
        isHomeService={isHomeService}
        address={address}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-32 pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="flex items-center gap-3 px-5">
        <button
          onClick={handleBack}
          className="flex size-9 items-center justify-center rounded-full bg-surface-2"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-semibold">{salon.name}</h1>
          <p className="text-xs text-muted-foreground">
            {rescheduleId ? "Reprogramare" : "Rezervare"} · Pasul {step + 1} din 3
          </p>
        </div>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <div className="flex flex-col gap-4 px-5">
          <div className="flex rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setIsHomeService(false)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium",
                !isHomeService && "bg-primary text-primary-foreground",
              )}
            >
              <Store className="size-3.5" /> La salon
            </button>
            <button
              onClick={() => setIsHomeService(true)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium",
                isHomeService && "bg-primary text-primary-foreground",
              )}
            >
              <Home className="size-3.5" /> La domiciliu
            </button>
          </div>

          {isHomeService && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Adresa ta</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Str. Lujerului 45, Bl. U7, București"
              />
              <p className="text-xs text-muted-foreground">
                Se adaugă o taxă de deplasare de {formatPrice(TRAVEL_FEE)}.
              </p>
            </div>
          )}

          <h2 className="text-lg font-semibold">Alege serviciul</h2>
          {salon.services.map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                serviceId === s.id ? "border-accent bg-accent-soft" : "border-border bg-card",
              )}
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> {s.durationMin} min
                </p>
              </div>
              <p className="font-semibold">{formatPrice(s.price)}</p>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4 px-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Alege frizerul</h2>
            </div>
            <div className="mb-3 flex rounded-full border border-border bg-card p-1">
              <button
                onClick={() => setSameBarber(true)}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-medium",
                  sameBarber && "bg-surface-3 text-foreground",
                )}
              >
                Același frizer
              </button>
              <button
                onClick={() => setSameBarber(false)}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-medium",
                  !sameBarber && "bg-surface-3 text-foreground",
                )}
              >
                Oricare disponibil
              </button>
            </div>
            {sameBarber && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBarberId(b.id);
                      setSlotIso(null);
                    }}
                    className={cn(
                      "flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2.5",
                      barberId === b.id ? "border-accent bg-accent-soft" : "border-border bg-card",
                    )}
                  >
                    <Avatar className="size-12">
                      <AvatarImage src={b.avatar} alt={b.name} />
                      <AvatarFallback>{initials(b.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs font-medium">{b.name.split(" ")[0]}</span>
                    <Rating value={b.rating} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {barber && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Alege ora potrivită</h2>
              <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                {days.map((d, i) => (
                  <button
                    key={d.dateIso}
                    onClick={() => setDayIndex(i)}
                    className={cn(
                      "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
                      dayIndex === i
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {days[dayIndex]?.slots.map(({ iso, available }) => (
                  <button
                    key={iso}
                    disabled={!available}
                    onClick={() => setSlotIso(iso)}
                    className={cn(
                      "rounded-xl border py-2 text-sm font-medium transition-colors",
                      !available && "cursor-not-allowed border-border/50 text-muted-foreground/40 line-through",
                      available && slotIso !== iso && "border-border bg-card",
                      available && slotIso === iso && "border-accent bg-accent text-accent-foreground",
                    )}
                  >
                    {new Intl.DateTimeFormat("ro-RO", { hour: "numeric", minute: "2-digit" }).format(
                      new Date(iso),
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
                <CalendarCheck2 className="size-3.5" /> Se sincronizează cu Google Calendar — primești o invitație după confirmare.
              </p>
            </div>
          )}
        </div>
      )}

      {step === 2 && service && barber && slotIso && (
        <div className="flex flex-col gap-4 px-5">
          <h2 className="text-lg font-semibold">
            {isHomeService ? "Frizerul vine la tine" : "Confirmă programarea"}
          </h2>

          {isHomeService ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="size-4 text-accent" /> {address}
                </p>
              </div>
              <div className="flex h-24 items-center justify-center rounded-xl bg-surface-2 text-xs text-muted-foreground">
                Traseu estimat pe hartă (demo)
              </div>
              <div className="flex items-center gap-3 border-t border-border/70 pt-3">
                <Avatar className="size-11">
                  <AvatarImage src={barber.avatar} alt={barber.name} />
                  <AvatarFallback>{initials(barber.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="flex items-center gap-1 font-medium">
                    {barber.name} <Rating value={barber.rating} />
                  </p>
                  <p className="text-xs text-accent">Ajunge în ~35 min</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
                <span className="text-muted-foreground">Serviciu</span>
                <span>{formatPrice(service.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deplasare</span>
                <span>{formatPrice(TRAVEL_FEE)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-3">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatPrice(service.price + TRAVEL_FEE)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-xl bg-surface-2">
                  <Image src={salon.coverImage} alt={salon.name} fill sizes="48px" className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold">{salon.name}</p>
                  <p className="text-xs text-muted-foreground">{salon.address}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
                <span className="text-muted-foreground">Frizer</span>
                <span className="font-medium">{barber.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Serviciu</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Când</span>
                <span className="font-medium">
                  {new Intl.DateTimeFormat("ro-RO", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(slotIso))}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-3">
                <span className="font-semibold">Preț total</span>
                <span className="font-semibold">{formatPrice(service.price)}</span>
              </div>
            </div>
          )}

          {!isHomeService && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Metodă de plată</p>
              {(
                [
                  { key: "salon", label: "Plată la salon", desc: "Plătești la finalul serviciului" },
                  { key: "online", label: "Plată online", desc: "Card sau Apple Pay" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPaymentMethod(opt.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3.5 text-left",
                    paymentMethod === opt.key ? "border-accent bg-accent-soft" : "border-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                      paymentMethod === opt.key ? "border-accent" : "border-border",
                    )}
                  >
                    {paymentMethod === opt.key && <span className="size-2 rounded-full bg-accent" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-accent-soft p-3.5 text-sm text-accent">
            Primești <strong>{service.price + (isHomeService ? TRAVEL_FEE : 0)} puncte</strong> pentru această programare.
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-20 z-30 mx-auto w-full max-w-md px-5">
        <Button onClick={handleContinue} disabled={!canContinue} className="w-full" size="lg">
          {step === 2 ? (isHomeService ? "Rezervă la domiciliu" : "Confirmă programarea") : "Continuă"}
        </Button>
      </div>
    </div>
  );
}

function BookingConfirmed({
  salon,
  barber,
  service,
  slotIso,
  isHomeService,
  address,
}: {
  salon: Salon;
  barber: Barber;
  service: Service;
  slotIso: string;
  isHomeService: boolean;
  address: string;
}) {
  const endIso = new Date(new Date(slotIso).getTime() + service.durationMin * 60_000).toISOString();
  const location = isHomeService ? address : salon.address;
  const event = {
    uid: `${salon.id}-${slotIso}`,
    title: `${service.name} la ${salon.name}`,
    description: `Programare cu ${barber.name} pentru ${service.name}.`,
    location,
    startIso: slotIso,
    endIso,
  };

  return (
    <div className="flex flex-col items-center gap-6 px-6 pb-32 pt-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <PartyPopper className="size-8" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Programare confirmată!</h1>
        <p className="mt-1 text-sm text-muted-foreground">{salon.name} te așteaptă.</p>
      </div>

      <div className="w-full rounded-2xl border border-border bg-card p-4 text-left">
        <p className="font-semibold">{service.name}</p>
        <p className="text-sm text-muted-foreground">cu {barber.name}</p>
        <p className="mt-2 text-sm font-medium">
          {new Intl.DateTimeFormat("ro-RO", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(slotIso))}
        </p>
        <p className="text-sm text-muted-foreground">{location}</p>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noreferrer">
          <Button variant="outline" className="w-full gap-2">
            <CalendarPlus className="size-4" /> Adaugă în Google Calendar
          </Button>
        </a>
        <Button variant="outline" className="w-full gap-2" onClick={() => downloadIcs(event)}>
          <CalendarCheck2 className="size-4" /> Adaugă în Apple Calendar (.ics)
        </Button>
        <Link href="/appointments">
          <Button className="w-full">Vezi programările mele</Button>
        </Link>
      </div>
    </div>
  );
}
