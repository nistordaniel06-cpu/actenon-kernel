import { getDealsForSalon } from "@/lib/mock/deals";
import { calendarBookings } from "@/lib/mock/business";
import { myBusinessSalon } from "@/lib/mock/business-context";
import { DealsClient } from "./deals-client";

export default function BusinessDealsPage() {
  const initialDeals = getDealsForSalon(myBusinessSalon.id);
  const emptySlots = calendarBookings.filter((b) => b.status === "hot-deal");

  return <DealsClient initialDeals={initialDeals} emptySlots={emptySlots} />;
}
