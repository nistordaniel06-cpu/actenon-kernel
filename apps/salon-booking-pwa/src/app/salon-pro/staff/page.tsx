import { notFound } from "next/navigation";

import { getSalonWithBarbers, getStaffForSalon } from "@/lib/data/catalog";
import { StaffClient } from "./staff-client";

const MY_SALON_ID = "salon-1";

export default async function StaffPage() {
  const [result, staff] = await Promise.all([
    getSalonWithBarbers(MY_SALON_ID),
    getStaffForSalon(MY_SALON_ID),
  ]);
  if (!result) notFound();
  return <StaffClient salon={result.salon} barbers={result.barbers} initialStaff={staff} />;
}
