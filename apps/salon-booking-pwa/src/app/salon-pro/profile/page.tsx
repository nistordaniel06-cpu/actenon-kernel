import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { BusinessProfileClient } from "./profile-client";

const MY_SALON_ID = "salon-1";

export default async function BusinessProfilePage() {
  const result = await getSalonWithBarbers(MY_SALON_ID);
  if (!result) notFound();
  return <BusinessProfileClient salon={result.salon} />;
}
