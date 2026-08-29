import { SalonProSidebar } from "@/components/salon-pro/sidebar";
import { SalonProBottomNav } from "@/components/salon-pro/bottom-nav";

export default function SalonProLayout({ children }: LayoutProps<"/salon-pro">) {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-surface-2/40 md:block md:bg-background">
      <div className="relative flex w-full max-w-md flex-1 flex-col bg-background shadow-sm md:mx-auto md:max-w-6xl md:flex-row md:shadow-none">
        <SalonProSidebar />
        <div className="flex-1 pb-24 md:pb-8">{children}</div>
        <SalonProBottomNav />
      </div>
    </div>
  );
}
