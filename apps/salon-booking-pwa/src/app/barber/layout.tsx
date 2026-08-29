import { BarberBottomNav } from "@/components/barber/bottom-nav";

export default function BarberLayout({ children }: LayoutProps<"/barber">) {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-surface-2/40">
      <div className="relative flex w-full max-w-md flex-1 flex-col bg-background shadow-sm">
        <div className="flex-1 pb-24">{children}</div>
        <BarberBottomNav />
      </div>
    </div>
  );
}
