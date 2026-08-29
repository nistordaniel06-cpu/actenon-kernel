import { notFound } from "next/navigation";

import { getSalonWithBarbers, getShopProducts } from "@/lib/data/catalog";
import { CampaignsClient } from "./campaigns-client";

const MY_SALON_ID = "salon-1";

export default async function CampaignsPage() {
  const [result, shopProducts] = await Promise.all([
    getSalonWithBarbers(MY_SALON_ID),
    getShopProducts(),
  ]);
  if (!result) notFound();
  return <CampaignsClient salon={result.salon} shopProducts={shopProducts} />;
}
