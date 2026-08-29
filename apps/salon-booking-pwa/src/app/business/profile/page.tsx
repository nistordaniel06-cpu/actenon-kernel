import { myBusinessSalon } from "@/lib/mock/business-context";
import { BusinessProfileClient } from "./profile-client";

export default function BusinessProfilePage() {
  return <BusinessProfileClient salon={myBusinessSalon} />;
}
