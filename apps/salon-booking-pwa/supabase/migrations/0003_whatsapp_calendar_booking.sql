-- NearCut Sprint 1 — WhatsApp booking + calendar sync foundation
-- Apply after 0001_init.sql and 0002_storage_and_barber_gallery.sql.

-- Salon settings needed by the booking engine.
alter table public.salons
  add column if not exists timezone text not null default 'Europe/Bucharest',
  add column if not exists phone text;

-- Service timing controls. Existing duration_min remains the service duration.
alter table public.services
  add column if not exists buffer_before_min integer not null default 0 check (buffer_before_min >= 0),
  add column if not exists buffer_after_min integer not null default 0 check (buffer_after_min >= 0);

-- Mark where an appointment came from and identify WhatsApp guests without
-- forcing them to create an auth account.
alter table public.appointments
  add column if not exists source text not null default 'app'
    check (source in ('app', 'whatsapp', 'manual')),
  add column if not exists client_phone text;

create index if not exists appointments_client_phone_idx
  on public.appointments (salon_id, client_phone)
  where client_phone is not null;

-- Which barber is allowed to perform which service. An empty mapping for a
-- barber means the salon can still fall back to specialties during migration;
-- new booking code should prefer this explicit mapping.
create table if not exists public.barber_services (
  barber_id text not null references public.barbers (id) on delete cascade,
  service_id text not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (barber_id, service_id)
);

-- 0 = Sunday ... 6 = Saturday, matching JavaScript Date#getDay().
create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id text not null references public.barbers (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time),
  unique (barber_id, weekday, start_time, end_time)
);

create index if not exists working_hours_barber_weekday_idx
  on public.working_hours (barber_id, weekday)
  where active;

create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  barber_id text not null references public.barbers (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (start_at < end_at)
);

create index if not exists time_off_barber_range_idx
  on public.time_off (barber_id, start_at, end_at);

-- One official WhatsApp Business connection per salon in Sprint 1.
create table if not exists public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references public.salons (id) on delete cascade,
  phone_number text,
  phone_number_id text unique,
  whatsapp_business_account_id text,
  -- Tokens must be encrypted by the application before persistence.
  access_token_encrypted text,
  greeting_message text not null default 'Salut! Cu ce te putem ajuta?',
  booking_enabled boolean not null default true,
  allow_reschedule boolean not null default true,
  allow_cancel boolean not null default true,
  minimum_notice_minutes integer not null default 60 check (minimum_notice_minutes >= 0),
  booking_horizon_days integer not null default 60 check (booking_horizon_days between 1 and 365),
  reminder_24h boolean not null default true,
  reminder_2h boolean not null default true,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id)
);

create type public.whatsapp_booking_state as enum (
  'START',
  'SELECTING_SERVICE',
  'SELECTING_BARBER',
  'SELECTING_DATE',
  'SELECTING_SLOT',
  'CONFIRMING',
  'BOOKED',
  'RESCHEDULING',
  'CANCELLING',
  'HUMAN_HANDOFF'
);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references public.salons (id) on delete cascade,
  customer_phone text not null,
  customer_name text,
  assigned_barber_id text references public.barbers (id) on delete set null,
  state public.whatsapp_booking_state not null default 'START',
  context jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, customer_phone)
);

create index if not exists whatsapp_conversations_recent_idx
  on public.whatsapp_conversations (salon_id, last_message_at desc);

create type public.calendar_provider as enum ('google', 'apple_ics');

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  barber_id text not null references public.barbers (id) on delete cascade,
  provider public.calendar_provider not null,
  calendar_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  -- Used only for a read-only subscribed Apple/iCalendar feed. This is a
  -- revocable bearer secret; never expose barber_id as the feed token.
  subscription_token uuid not null default gen_random_uuid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barber_id, provider),
  unique (subscription_token)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id text not null references public.appointments (id) on delete cascade,
  barber_id text not null references public.barbers (id) on delete cascade,
  provider public.calendar_provider not null,
  external_event_id text,
  sync_status text not null default 'pending'
    check (sync_status in ('pending', 'synced', 'failed', 'deleted')),
  sync_error text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, provider)
);

create index if not exists calendar_events_barber_idx
  on public.calendar_events (barber_id, created_at desc);

-- Row Level Security -------------------------------------------------------
alter table public.barber_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.whatsapp_accounts enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_events enable row level security;

-- Public may read only the catalog-level availability inputs. Sensitive
-- WhatsApp/calendar credentials remain owner/barber only. Public booking
-- writes are performed exclusively by validated server routes using service role.
create policy "barber_services: public read" on public.barber_services
  for select using (true);
create policy "barber_services: salon owner writes" on public.barber_services
  for all using (
    exists (
      select 1 from public.barbers b
      join public.salons s on s.id = b.salon_id
      where b.id = barber_id and s.owner_id = auth.uid()
    )
  );

create policy "working_hours: public read" on public.working_hours
  for select using (true);
create policy "working_hours: owner or barber writes" on public.working_hours
  for all using (
    exists (
      select 1 from public.barbers b
      join public.salons s on s.id = b.salon_id
      where b.id = barber_id
        and (b.profile_id = auth.uid() or s.owner_id = auth.uid())
    )
  );

create policy "time_off: public read" on public.time_off
  for select using (true);
create policy "time_off: owner or barber writes" on public.time_off
  for all using (
    exists (
      select 1 from public.barbers b
      join public.salons s on s.id = b.salon_id
      where b.id = barber_id
        and (b.profile_id = auth.uid() or s.owner_id = auth.uid())
    )
  );

create policy "whatsapp_accounts: salon owner" on public.whatsapp_accounts
  for all using (
    exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
  );

create policy "whatsapp_conversations: owner or assigned barber" on public.whatsapp_conversations
  for select using (
    exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
    or exists (
      select 1 from public.barbers b
      where b.id = assigned_barber_id and b.profile_id = auth.uid()
    )
  );

create policy "calendar_connections: owner or barber" on public.calendar_connections
  for all using (
    exists (
      select 1 from public.barbers b
      join public.salons s on s.id = b.salon_id
      where b.id = barber_id
        and (b.profile_id = auth.uid() or s.owner_id = auth.uid())
    )
  );

create policy "calendar_events: owner or barber" on public.calendar_events
  for select using (
    exists (
      select 1 from public.barbers b
      join public.salons s on s.id = b.salon_id
      where b.id = barber_id
        and (b.profile_id = auth.uid() or s.owner_id = auth.uid())
    )
  );

-- Grants: RLS still gates authenticated/anon reads. Service-role server routes
-- bypass RLS for public WhatsApp booking writes.
grant select on public.barber_services, public.working_hours, public.time_off to anon, authenticated;
grant all on public.barber_services, public.working_hours, public.time_off to authenticated;
grant all on public.whatsapp_accounts, public.whatsapp_conversations,
  public.calendar_connections, public.calendar_events to authenticated;
