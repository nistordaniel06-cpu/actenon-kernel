import { getBusinessClients } from "@/lib/data/catalog";
import { ClientsList } from "@/components/shared/clients-list";

const MY_SALON_ID = "salon-1";

export default async function BarberClientsPage() {
  const clients = await getBusinessClients(MY_SALON_ID);
  return <ClientsList clients={clients} detailHrefBase="/barber/clients" />;
}
