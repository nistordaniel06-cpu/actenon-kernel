import { businessClients } from "@/lib/mock/business";
import { ClientsList } from "@/components/shared/clients-list";

export default function SalonProClientsPage() {
  return <ClientsList clients={businessClients} detailHrefBase="/salon-pro/clients" />;
}
