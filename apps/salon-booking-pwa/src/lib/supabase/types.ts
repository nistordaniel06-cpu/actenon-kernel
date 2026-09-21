// Tipuri minime, scrise manual, pentru schema NearCut folosită de aplicație.
// După conectarea proiectului Supabase real, ideal se înlocuiesc cu output-ul
// `npx supabase gen types typescript --linked`.

export type AppRole = "client" | "barber" | "salonPro";
export type AppointmentSource = "app" | "whatsapp" | "manual";
export type CalendarProvider = "google" | "apple_ics";
export type WhatsAppBookingState =
  | "START"
  | "SELECTING_SERVICE"
  | "SELECTING_BARBER"
  | "SELECTING_DATE"
  | "SELECTING_SLOT"
  | "CONFIRMING"
  | "BOOKED"
  | "RESCHEDULING"
  | "CANCELLING"
  | "HUMAN_HANDOFF";

export type AppointmentRow = {
  id: string;
  salon_id: string;
  barber_id: string;
  service_id: string;
  client_id: string | null;
  client_name: string;
  client_avatar: string | null;
  client_phone: string | null;
  start_at: string;
  end_at: string;
  status: string;
  price: number;
  source: AppointmentSource;
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
  timezone: string;
  phone: string | null;
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
  buffer_before_min: number;
  buffer_after_min: number;
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

export type BarberServiceRow = {
  barber_id: string;
  service_id: string;
  created_at: string;
};

export type WorkingHoursRow = {
  id: string;
  barber_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
  created_at: string;
};

export type TimeOffRow = {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_at: string;
};

export type WhatsAppAccountRow = {
  id: string;
  salon_id: string;
  phone_number: string | null;
  phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
  access_token_encrypted: string | null;
  greeting_message: string;
  booking_enabled: boolean;
  allow_reschedule: boolean;
  allow_cancel: boolean;
  minimum_notice_minutes: number;
  booking_horizon_days: number;
  reminder_24h: boolean;
  reminder_2h: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WhatsAppConversationRow = {
  id: string;
  salon_id: string;
  customer_phone: string;
  customer_name: string | null;
  assigned_barber_id: string | null;
  state: WhatsAppBookingState;
  context: Record<string, unknown>;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type CalendarConnectionRow = {
  id: string;
  barber_id: string;
  provider: CalendarProvider;
  calendar_id: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  subscription_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CalendarEventRow = {
  id: string;
  appointment_id: string;
  barber_id: string;
  provider: CalendarProvider;
  external_event_id: string | null;
  sync_status: "pending" | "synced" | "failed" | "deleted";
  sync_error: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
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

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ReadOnlyTable<Row> = Table<Row, Row, Partial<Row>>;

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & { id: string }>;
      appointments: Table<
        AppointmentRow,
        Partial<AppointmentRow> & {
          id: string;
          salon_id: string;
          barber_id: string;
          service_id: string;
          client_name: string;
          start_at: string;
          end_at: string;
          price: number;
        }
      >;
      salons: ReadOnlyTable<SalonRow>;
      barbers: ReadOnlyTable<BarberRow>;
      services: ReadOnlyTable<ServiceRow>;
      shop_products: ReadOnlyTable<ShopProductRow>;
      staff: ReadOnlyTable<StaffRow>;
      barber_services: Table<
        BarberServiceRow,
        Partial<BarberServiceRow> & { barber_id: string; service_id: string }
      >;
      working_hours: Table<
        WorkingHoursRow,
        Partial<WorkingHoursRow> & {
          barber_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        }
      >;
      time_off: Table<
        TimeOffRow,
        Partial<TimeOffRow> & { barber_id: string; start_at: string; end_at: string }
      >;
      whatsapp_accounts: Table<
        WhatsAppAccountRow,
        Partial<WhatsAppAccountRow> & { salon_id: string }
      >;
      whatsapp_conversations: Table<
        WhatsAppConversationRow,
        Partial<WhatsAppConversationRow> & { salon_id: string; customer_phone: string }
      >;
      calendar_connections: Table<
        CalendarConnectionRow,
        Partial<CalendarConnectionRow> & { barber_id: string; provider: CalendarProvider }
      >;
      calendar_events: Table<
        CalendarEventRow,
        Partial<CalendarEventRow> & {
          appointment_id: string;
          barber_id: string;
          provider: CalendarProvider;
        }
      >;
    };
    Views: {
      salon_clients: { Row: SalonClientRow; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      whatsapp_booking_state: WhatsAppBookingState;
      calendar_provider: CalendarProvider;
    };
    CompositeTypes: Record<string, never>;
  };
}
