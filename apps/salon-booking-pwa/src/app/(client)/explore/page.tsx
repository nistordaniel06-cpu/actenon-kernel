import { Suspense } from "react";

import { salons } from "@/lib/mock/salons";
import { ExploreClient } from "./explore-client";

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreClient salons={salons} />
    </Suspense>
  );
}
