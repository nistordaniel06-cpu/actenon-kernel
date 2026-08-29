import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { BookingClient } from "./booking-client";

export default async function BookPage({ params }: PageProps<"/book/[id]">) {
  const { id } = await params;
  const result = await getSalonWithBarbers(id);
  if (!result) notFound();

  return (
    <Suspense>
      <BookingClient salon={result.salon} barbers={result.barbers} />
    </Suspense>
  );
}
