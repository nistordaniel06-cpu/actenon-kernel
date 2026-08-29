import { BusinessBottomNav } from "@/components/business/bottom-nav";

export default function BusinessLayout({ children }: LayoutProps<"/business">) {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-secondary/40">
      <div className="relative flex w-full max-w-md flex-1 flex-col bg-background shadow-sm">
        <div className="flex-1 pb-24">{children}</div>
        <BusinessBottomNav />
      </div>
    </div>
  );
}
