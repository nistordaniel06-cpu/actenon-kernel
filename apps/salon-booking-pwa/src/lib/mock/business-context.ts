import { getSalon } from "@/lib/mock/salons";
import { getBarbersForSalon } from "@/lib/mock/barbers";

export const myBusinessSalon = getSalon("salon-1")!;
export const myBarbers = getBarbersForSalon(myBusinessSalon.id);
