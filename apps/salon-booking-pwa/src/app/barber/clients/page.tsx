import { businessClients } from "@/lib/mock/business";
import { ClientsList } from "@/components/shared/clients-list";

export default function BarberClientsPage() {
  return <ClientsList clients={businessClients} detailHrefBase="/barber/clients" />;
}
