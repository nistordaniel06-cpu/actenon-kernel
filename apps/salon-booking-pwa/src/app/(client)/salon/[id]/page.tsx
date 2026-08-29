import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Flame } from "lucide-react";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { getDealsForSalon } from "@/lib/mock/deals";
import { SalonGallery } from "@/components/client/salon-gallery";
import { Rating } from "@/components/client/rating";
import { PriceLevel } from "@/components/client/price-level";
import { ServiceRow } from "@/components/client/service-row";
import { BarberRow } from "@/components/client/barber-row";
import { SalonReviews } from "./salon-reviews";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";

export default async function SalonProfilePage({ params }: PageProps<"/salon/[id]">) {
  const { id } = await params;
  const result = await getSalonWithBarbers(id);
  if (!result) notFound();
  const { salon, barbers } = result;

  const dealsForSalon = getDealsForSalon(salon.id).map((deal) => ({
    deal,
    service: salon.services.find((s) => s.id === deal.serviceId),
  }));

  return (
    <div className="flex flex-col pb-28">
      <SalonGallery images={[salon.coverImage, ...salon.gallery]} name={salon.name} />

      <div className="flex flex-col gap-4 px-5 pt-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{salon.name}</h1>
            <PriceLevel level={salon.priceLevel} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Rating value={salon.rating} count={salon.reviewCount} size="md" />
            <span aria-hidden>·</span>
            <span>{salon.type === "barbershop" ? "Frizerie" : "Salon"}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {salon.distanceKm.toFixed(1)} km
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {salon.address} · Deschis până la {salon.openNowUntil}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {salon.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {dealsForSalon.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-accent/30 bg-accent-soft p-3.5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-accent">
              <Flame className="size-4" /> Oferte de ultim moment aici
            </p>
            {dealsForSalon.map(({ deal, service }) => {
              if (!service) return null;
              const price = Math.round(service.price * (1 - deal.discountPercent / 100));
              return (
                <Link
                  key={deal.id}
                  href={`/book/${salon.id}?service=${service.id}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{deal.title}</span>
                  <span className="font-semibold">
                    {formatPrice(price)}{" "}
                    <span className="text-xs font-normal text-muted-foreground line-through">
                      {formatPrice(service.price)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <Tabs defaultValue="services">
          <TabsList className="w-full">
            <TabsTrigger value="services">Servicii</TabsTrigger>
            <TabsTrigger value="team">Echipă</TabsTrigger>
            <TabsTrigger value="reviews">Recenzii</TabsTrigger>
          </TabsList>
          <TabsContent value="services">
            <div className="flex flex-col">
              {salon.services.map((service) => (
                <ServiceRow key={service.id} service={service} salonId={salon.id} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="team">
            <div className="flex flex-col gap-2">
              {barbers.map((barber) => (
                <BarberRow key={barber.id} barber={barber} salonId={salon.id} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <SalonReviews salonId={salon.id} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex w-full max-w-md justify-center px-5">
        <Link
          href={`/book/${salon.id}`}
          className="w-full rounded-full bg-primary py-3.5 text-center font-semibold text-primary-foreground shadow-lg"
        >
          Rezervă programare
        </Link>
      </div>
    </div>
  );
}
