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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
