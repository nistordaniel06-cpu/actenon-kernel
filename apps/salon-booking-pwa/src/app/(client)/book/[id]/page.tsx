import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getSalon } from "@/lib/mock/salons";
import { getBarbersForSalon } from "@/lib/mock/barbers";
import { BookingClient } from "./booking-client";

export default async function BookPage({ params }: PageProps<"/book/[id]">) {
  const { id } = await params;
  const salon = getSalon(id);
  if (!salon) notFound();

  const barbers = getBarbersForSalon(salon.id);

  return (
    <Suspense>
      <BookingClient salon={salon} barbers={barbers} />
    </Suspense>
  );
}
