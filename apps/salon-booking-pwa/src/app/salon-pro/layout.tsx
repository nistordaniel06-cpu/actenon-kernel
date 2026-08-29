import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { SalonProSidebar } from "@/components/salon-pro/sidebar";
import { SalonProBottomNav } from "@/components/salon-pro/bottom-nav";

const MY_SALON_ID = "salon-1";

export default async function SalonProLayout({ children }: LayoutProps<"/salon-pro">) {
  const result = await getSalonWithBarbers(MY_SALON_ID);
  if (!result) notFound();

  return (
    <div className="flex min-h-full flex-1 justify-center bg-surface-2/40 md:block md:bg-background">
      <div className="relative flex w-full max-w-md flex-1 flex-col bg-background shadow-sm md:mx-auto md:max-w-6xl md:flex-row md:shadow-none">
        <SalonProSidebar salon={result.salon} />
        <div className="flex-1 pb-24 md:pb-8">{children}</div>
        <SalonProBottomNav />
      </div>
    </div>
  );
}
