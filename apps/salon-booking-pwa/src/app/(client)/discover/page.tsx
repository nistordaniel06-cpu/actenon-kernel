import { Suspense } from "react";

import { salons } from "@/lib/mock/salons";
import { DiscoverClient } from "./discover-client";

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverClient salons={salons} />
    </Suspense>
  );
}
