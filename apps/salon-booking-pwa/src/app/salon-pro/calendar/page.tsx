import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { CalendarClient } from "./calendar-client";

const MY_SALON_ID = "salon-1";

export default async function SalonProCalendarPage() {
  const result = await getSalonWithBarbers(MY_SALON_ID);
  if (!result) notFound();
  return <CalendarClient salon={result.salon} barbers={result.barbers} />;
}
