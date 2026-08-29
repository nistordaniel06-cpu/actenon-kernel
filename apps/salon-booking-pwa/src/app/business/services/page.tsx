import { myBusinessSalon } from "@/lib/mock/business-context";
import { ServicesClient } from "./services-client";

export default function BusinessServicesPage() {
  return <ServicesClient initialServices={myBusinessSalon.services} />;
}
