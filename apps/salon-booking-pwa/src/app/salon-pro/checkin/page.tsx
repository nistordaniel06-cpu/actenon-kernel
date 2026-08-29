import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { CheckinClient } from "./checkin-client";

const MY_SALON_ID = "salon-1";

export default async function CheckinKioskPage() {
  const result = await getSalonWithBarbers(MY_SALON_ID);
  if (!result) notFound();
  return <CheckinClient salon={result.salon} barbers={result.barbers} />;
}
