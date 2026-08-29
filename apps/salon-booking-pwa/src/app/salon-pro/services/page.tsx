import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { ServicesClient } from "./services-client";

const MY_SALON_ID = "salon-1";

export default async function BusinessServicesPage() {
  const result = await getSalonWithBarbers(MY_SALON_ID);
  if (!result) notFound();
  return <ServicesClient initialServices={result.salon.services} />;
}
