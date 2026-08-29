import { businessClients } from "@/lib/mock/business";
import { ClientsClient } from "./clients-client";

export default function BusinessClientsPage() {
  return <ClientsClient clients={businessClients} />;
}
