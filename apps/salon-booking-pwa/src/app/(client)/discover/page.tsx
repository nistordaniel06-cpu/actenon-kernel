import { Suspense } from "react";

import { getSalons } from "@/lib/data/catalog";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  const salons = await getSalons();
  return (
    <Suspense>
      <DiscoverClient salons={salons} />
    </Suspense>
  );
}
