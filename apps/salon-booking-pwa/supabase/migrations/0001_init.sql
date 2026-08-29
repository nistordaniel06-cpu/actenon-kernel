-- NearCut — schema inițial Supabase
-- Rulează în Supabase SQL editor sau cu `supabase db push` după ce ai legat proiectul.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ─────────────────────────────────────────────────────────────────────────
-- Profiluri (una per utilizator auth, rol implicit "client")
-- ─────────────────────────────────────────────────────────────────────────

create type public.app_role as enum ('client', 'barber', 'salonPro');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'client',
  name text not null default '',
  email text,
  avatar_url text,
  points integer not null default 0,
  referral_code text unique,
  member_since timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, referral_code)
  values (new.id, new.email, upper(substr(replace(new.id::text, '-', ''), 1, 8)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- Catalog: saloane, frizeri, servicii, personal
-- ─────────────────────────────────────────────────────────────────────────

create table public.salons (
  id text primary key,
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  type text not null check (type in ('salon', 'barbershop')),
  cover_image text,
  gallery text[] not null default '{}',
  logo text,
  rating numeric(2, 1) not null default 0,
  review_count integer not null default 0,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  price_level smallint not null default 2 check (price_level between 1 and 3),
  open_now_until text,
  tags text[] not null default '{}',
  has_hot_deal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.barbers (
  id text primary key,
  salon_id text not null references public.salons (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  avatar text,
  title text,
  rating numeric(2, 1) not null default 0,
  review_count integer not null default 0,
  years_experience integer not null default 0,
  specialties text[] not null default '{}',
  available_now boolean not null default true,
  next_slot_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.services (
  id text primary key,
  salon_id text not null references public.salons (id) on delete cascade,
  name text not null,
  category text not null check (category in ('hair', 'beard', 'color', 'spa', 'kids', 'combo')),
  duration_min integer not null,
  price numeric(10, 2) not null,
  description text,
  active boolean not null default true
);

create table public.staff (
  id text primary key,
  salon_id text not null references public.salons (id) on delete cascade,
  barber_id text not null references public.barbers (id) on delete cascade,
  shift text not null,
  commission_percent integer not null default 40
);

-- ─────────────────────────────────────────────────────────────────────────
-- Programări (sursa de adevăr pentru agenda client + frizer + salon pro)
-- ─────────────────────────────────────────────────────────────────────────

create table public.appointments (
  id text primary key,
  salon_id text not null references public.salons (id) on delete cascade,
  barber_id text not null references public.barbers (id) on delete cascade,
  service_id text not null references public.services (id),
  client_id uuid references public.profiles (id) on delete set null,
  client_name text not null,
  client_avatar text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'confirmat'
    check (status in ('confirmat', 'in-asteptare', 'checkin', 'in-progres', 'finalizat', 'anulat', 'no-show')),
  price numeric(10, 2) not null,
  points_earned integer,
  is_home_service boolean not null default false,
  address text,
  travel_fee numeric(10, 2),
  extras jsonb not null default '[]',
  reviewed boolean not null default false,
  client_notes text,
  created_at timestamptz not null default now(),
  -- fără suprapuneri pe același frizer, cu excepția programărilor anulate/neprezentare
  exclude using gist (
    barber_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status not in ('anulat', 'no-show'))
);

create index appointments_client_id_idx on public.appointments (client_id);
create index appointments_barber_id_idx on public.appointments (barber_id, start_at);
create index appointments_salon_id_idx on public.appointments (salon_id, start_at);

-- ─────────────────────────────────────────────────────────────────────────
-- Recenzii, campanii, boost-uri, magazin, roata zilnică, comunitate
-- ─────────────────────────────────────────────────────────────────────────

create table public.reviews (
  id text primary key,
  salon_id text not null references public.salons (id) on delete cascade,
  appointment_id text references public.appointments (id) on delete set null,
  barber_id text references public.barbers (id) on delete set null,
  author text not null,
  avatar text,
  rating smallint not null check (rating between 1 and 5),
  quality smallint check (quality between 1 and 5),
  punctuality smallint check (punctuality between 1 and 5),
  cleanliness smallint check (cleanliness between 1 and 5),
  tags text[] not null default '{}',
  comment text not null default '',
  service_name text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.deals (
  id text primary key,
  salon_id text not null references public.salons (id) on delete cascade,
  service_id text references public.services (id) on delete set null,
  title text not null,
  discount_percent integer not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  seats_left integer not null default 1
);

create table public.boosts (
  id text primary key,
  barber_id text not null references public.barbers (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  discount_percent integer not null,
  radius_km integer not null,
  budget_lei numeric(10, 2) not null default 0,
  channels text[] not null default '{}',
  active boolean not null default true
);

create table public.shop_products (
  id text primary key,
  name text not null,
  category text not null check (category in ('pomade', 'beard', 'shampoo', 'tools')),
  price numeric(10, 2) not null,
  member_price numeric(10, 2) not null,
  image text,
  description text,
  pickup_only boolean not null default false
);

create table public.wheel_prizes (
  id text primary key,
  label text not null,
  kind text not null check (kind in ('points', 'discount', 'product')),
  value integer not null default 0,
  color text not null default '#75b82a'
);

create table public.wheel_spins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  spun_on date not null default current_date,
  prize_id text references public.wheel_prizes (id),
  created_at timestamptz not null default now(),
  unique (client_id, spun_on)
);

create table public.point_activity (
  id text primary key,
  client_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  points integer not null,
  created_at timestamptz not null default now()
);

create table public.community_titles (
  id text primary key,
  barber_id text not null references public.barbers (id) on delete cascade,
  title text not null,
  week text not null
);

-- instantaneu săptămânal; într-o etapă ulterioară va fi recalculat printr-un
-- job programat din appointments + reviews în loc de a fi scris manual
create table public.leaderboard_weekly (
  barber_id text primary key references public.barbers (id) on delete cascade,
  week text not null,
  score integer not null,
  bookings_week integer not null,
  rating_week numeric(2, 1) not null
);

-- ─────────────────────────────────────────────────────────────────────────
-- View-uri derivate (lista de clienți și statistici per salon, calculate
-- din programări în loc de a fi stocate separat)
-- ─────────────────────────────────────────────────────────────────────────

-- security_invoker: fără el, un view rulează cu privilegiile celui care l-a
-- creat (de regulă un superuser în migrare) și ar ocoli complet RLS de pe
-- appointments — oricine ar putea citi clienții tuturor saloanelor.
create view public.salon_clients
with (security_invoker = true) as
select
  a.salon_id,
  a.client_id,
  a.client_name,
  a.client_avatar,
  count(*) filter (where a.status = 'finalizat') as visits,
  max(a.start_at) as last_visit,
  coalesce(sum(a.price) filter (where a.status = 'finalizat'), 0) as total_spent,
  mode() within group (order by a.service_id) as favorite_service_id
from public.appointments a
group by a.salon_id, a.client_id, a.client_name, a.client_avatar;

create view public.salon_daily_stats
with (security_invoker = true) as
select
  salon_id,
  date_trunc('day', start_at) as day,
  count(*) as bookings,
  coalesce(sum(price) filter (where status = 'finalizat'), 0) as revenue
from public.appointments
group by salon_id, date_trunc('day', start_at);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.salons enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;
alter table public.deals enable row level security;
alter table public.boosts enable row level security;
alter table public.shop_products enable row level security;
alter table public.wheel_prizes enable row level security;
alter table public.wheel_spins enable row level security;
alter table public.point_activity enable row level security;
alter table public.community_titles enable row level security;
alter table public.leaderboard_weekly enable row level security;

-- profiluri: fiecare vede/își editează propriul profil
create policy "profiles: select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- catalog: citire publică (necesar pentru descoperire fără autentificare),
-- scriere doar de proprietarul salonului
create policy "salons: public read" on public.salons for select using (true);
create policy "salons: owner write" on public.salons for insert with check (auth.uid() = owner_id);
create policy "salons: owner update" on public.salons for update using (auth.uid() = owner_id);

create policy "barbers: public read" on public.barbers for select using (true);
create policy "barbers: salon owner writes" on public.barbers for all using (
  exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
);

create policy "services: public read" on public.services for select using (true);
create policy "services: salon owner writes" on public.services for all using (
  exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
);

create policy "staff: salon owner only" on public.staff for all using (
  exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
);

create policy "shop_products: public read" on public.shop_products for select using (true);
create policy "wheel_prizes: public read" on public.wheel_prizes for select using (true);
create policy "deals: public read" on public.deals for select using (true);
create policy "deals: salon owner writes" on public.deals for all using (
  exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
);
create policy "community_titles: public read" on public.community_titles for select using (true);
create policy "leaderboard_weekly: public read" on public.leaderboard_weekly for select using (true);

-- programări: clientul vede/creează/actualizează ale sale; frizerul și
-- proprietarul salonului văd/actualizează programările din salonul lor
create policy "appointments: client select own" on public.appointments for select using (
  auth.uid() = client_id
  or exists (select 1 from public.barbers b where b.id = barber_id and b.profile_id = auth.uid())
  or exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
);
create policy "appointments: client insert own" on public.appointments for insert with check (
  auth.uid() = client_id
);
create policy "appointments: client or staff update" on public.appointments for update using (
  auth.uid() = client_id
  or exists (select 1 from public.barbers b where b.id = barber_id and b.profile_id = auth.uid())
  or exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
);

-- recenzii: publice la citire, scrise doar de clientul care a rezervat
create policy "reviews: public read" on public.reviews for select using (true);
create policy "reviews: client insert own" on public.reviews for insert with check (
  exists (
    select 1 from public.appointments a
    where a.id = appointment_id and a.client_id = auth.uid()
  )
);

-- boost-uri: gestionate doar de frizerul asociat
create policy "boosts: barber manages own" on public.boosts for all using (
  exists (select 1 from public.barbers b where b.id = barber_id and b.profile_id = auth.uid())
);

-- roata zilnică & puncte: fiecare client vede/creează doar ale sale
create policy "wheel_spins: client own" on public.wheel_spins for all using (auth.uid() = client_id);
create policy "point_activity: client own" on public.point_activity for all using (auth.uid() = client_id);
