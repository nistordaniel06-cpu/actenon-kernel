import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { DashboardClient } from "./dashboard-client";

const MY_SALON_ID = "salon-1";

export default async function SalonProDashboardPage() {
  const result = await getSalonWithBarbers(MY_SALON_ID);
  if (!result) notFound();
  return <DashboardClient salon={result.salon} />;
}
