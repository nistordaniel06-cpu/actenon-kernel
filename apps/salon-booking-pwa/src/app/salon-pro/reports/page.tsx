import { FileText, Receipt, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";

import { getSalonWithBarbers } from "@/lib/data/catalog";
import { BusinessHeader } from "@/components/business/business-header";

const MY_SALON_ID = "salon-1";

const sections = [
  { icon: Receipt, title: "Facturi", desc: "Emitere și export facturi pentru clienți și furnizori." },
  { icon: TrendingUp, title: "Rapoarte financiare", desc: "Venit pe frizer, pe serviciu și pe perioadă." },
  { icon: FileText, title: "Export contabilitate", desc: "Export compatibil pentru contabilul salonului." },
];

export default async function ReportsPage() {
  const result = await getSalonWithBarbers(MY_SALON_ID);
  if (!result) notFound();

  return (
    <div className="flex flex-col gap-5">
      <BusinessHeader salon={result.salon} title="Facturi & rapoarte" subtitle="Pregătit pentru etapa următoare" />

      <div className="flex flex-col gap-3 px-5 pb-6">
        {sections.map((s) => (
          <div key={s.title} className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
              <p className="mt-1 text-xs text-accent">Disponibil după conectarea cu Supabase</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
