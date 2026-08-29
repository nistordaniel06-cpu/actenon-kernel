import { getBusinessClients, getSalonWithBarbers } from "@/lib/data/catalog";
import { ClientDetail } from "@/components/shared/client-detail";

const MY_SALON_ID = "salon-1";

export default async function BarberClientDetailPage({ params }: PageProps<"/barber/clients/[id]">) {
  const { id } = await params;
  const [clients, result] = await Promise.all([
    getBusinessClients(MY_SALON_ID),
    getSalonWithBarbers(MY_SALON_ID),
  ]);
  const client = clients.find((c) => c.id === id);
  return <ClientDetail client={client} services={result?.salon.services ?? []} />;
}
