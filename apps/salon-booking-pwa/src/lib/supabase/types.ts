// Tipuri minime, scrise manual, doar pentru tabelele pe care le folosește
// codul curent (profiles, appointments). După ce legi un proiect Supabase
// real, rulează `npx supabase gen types typescript --linked` și înlocuiește
// acest fișier cu rezultatul complet, generat din schema efectivă.

export type AppRole = "client" | "barber" | "salonPro";

export type AppointmentRow = {
  id: string;
  salon_id: string;
  barber_id: string;
  service_id: string;
  client_id: string | null;
  client_name: string;
  client_avatar: string | null;
  start_at: string;
  end_at: string;
  status: string;
  price: number;
  points_earned: number | null;
  is_home_service: boolean;
  address: string | null;
  travel_fee: number | null;
  extras: unknown;
  reviewed: boolean;
  client_notes: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  role: AppRole;
  name: string;
  email: string | null;
  avatar_url: string | null;
  points: number;
  referral_code: string | null;
  member_since: string;
};

export type SalonRow = {
  id: string;
  owner_id: string | null;
  name: string;
  type: "salon" | "barbershop";
  cover_image: string | null;
  gallery: string[];
  logo: string | null;
  rating: number;
  review_count: number;
  address: string;
  lat: number;
  lng: number;
  price_level: 1 | 2 | 3;
  open_now_until: string | null;
  tags: string[];
  has_hot_deal: boolean;
  created_at: string;
};

export type BarberRow = {
  id: string;
  salon_id: string;
  profile_id: string | null;
  name: string;
  avatar: string | null;
  title: string | null;
  rating: number;
  review_count: number;
  years_experience: number;
  specialties: string[];
  available_now: boolean;
  next_slot_at: string | null;
  gallery: string[];
  created_at: string;
};

export type ServiceRow = {
  id: string;
  salon_id: string;
  name: string;
  category: "hair" | "beard" | "color" | "spa" | "kids" | "combo";
  duration_min: number;
  price: number;
  description: string | null;
  active: boolean;
};

export type ShopProductRow = {
  id: string;
  name: string;
  category: "pomade" | "beard" | "shampoo" | "tools";
  price: number;
  member_price: number;
  image: string | null;
  description: string | null;
  pickup_only: boolean;
};

export type StaffRow = {
  id: string;
  salon_id: string;
  barber_id: string;
  shift: string;
  commission_percent: number;
};

export type SalonClientRow = {
  salon_id: string;
  client_id: string | null;
  client_name: string;
  client_avatar: string | null;
  visits: number;
  last_visit: string | null;
  total_spent: number;
  favorite_service_id: string | null;
};

type ReadOnlyTable<Row> = {
  Row: Row;
  Insert: Row;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      appointments: {
        Row: AppointmentRow;
        Insert: Partial<AppointmentRow> & {
          id: string;
          salon_id: string;
          barber_id: string;
          service_id: string;
          client_name: string;
          start_at: string;
          end_at: string;
          price: number;
        };
        Update: Partial<AppointmentRow>;
        Relationships: [];
      };
      salons: ReadOnlyTable<SalonRow>;
      barbers: ReadOnlyTable<BarberRow>;
      services: ReadOnlyTable<ServiceRow>;
      shop_products: ReadOnlyTable<ShopProductRow>;
      staff: ReadOnlyTable<StaffRow>;
    };
    Views: {
      salon_clients: { Row: SalonClientRow; Relationships: [] };
    };
    Functions: Record<string, never>;
  };
}
