# Schema bazei de date (țintă)

> Acest document descrie schema **țintă**, la nivel de design — nu e o
> migrare de rulat. Migrarea SQL reală (Postgres/Supabase), politicile RLS
> complete și indecșii de performanță se scriu la implementare, urmând acest
> document ca sursă de adevăr pentru entități și relații. Tipurile SQL de
> mai jos sunt indicative (Postgres), ca să fie fără ambiguitate — nu o
> constrângere de motor de bază de date.
>
> Convenție: fiecare tabel are `id uuid primary key default gen_random_uuid()`
> și `created_at timestamptz not null default now()`, omise mai jos pentru
> concizie, cu excepția cazurilor unde tipul de `id` diferă explicit.

## 1. Identitate și roluri

```sql
create type user_role as enum ('client', 'professional', 'salon_admin', 'staff');

create table profiles (
  id uuid primary key references auth.users(id),
  role user_role not null default 'client',
  phone text unique not null,
  name text not null,
  avatar_url text,
  city text,
  sector text,
  onboarded_at timestamptz
);
```

Un profil e client, profesionist, administrator de salon sau staff. Un
profesionist Solo (`PRODUCT_SPEC.md` §5) e simultan `professional` și
`salon_admin` pentru propriul salon — nu un rol separat.

## 2. Saloane, locații, profesioniști, servicii

```sql
create table salons (
  id text primary key,                    -- slug stabil, ex. 'urban-cuts'
  owner_profile_id uuid references profiles(id),
  name text not null,
  type text not null check (type in ('salon', 'barbershop', 'beauty')),
  logo_url text,
  cover_image_url text,
  gallery text[] not null default '{}',
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  subscription_plan text not null default 'solo'
    check (subscription_plan in ('solo', 'salon_start', 'salon_growth', 'founding')),
  founding_slot boolean not null default false,
  home_service_enabled boolean not null default false,
  home_service_radius_km numeric(4,1),
  home_service_fee numeric(10,2),
  rebooking_enabled boolean not null default true,
  rebooking_discount_percent numeric(4,1) not null default 5,
  rebooking_max_lei numeric(10,2) not null default 10,
  wheel_opt_in boolean not null default false,
  giveaway_opt_in boolean not null default false
);

create table salon_locations (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references salons(id) on delete cascade,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  open_hours jsonb not null default '{}'    -- { "mon": ["09:00","20:00"], ... }
);

create table professionals (
  id uuid primary key default gen_random_uuid(),
  salon_id text references salons(id) on delete cascade,   -- null = independent, pre-afiliere
  profile_id uuid references profiles(id),
  name text not null,
  avatar_url text,
  title text,
  specialties text[] not null default '{}',
  bio text,
  rating numeric(2,1) not null default 0,
  review_count int not null default 0
);

create table professional_locations (             -- unde lucrează, dacă salonul are mai multe locații
  professional_id uuid references professionals(id) on delete cascade,
  location_id uuid references salon_locations(id) on delete cascade,
  shift text,                                       -- text liber, ex. "Luni-Vineri 09:00-18:00"
  commission_percent numeric(4,1),
  primary key (professional_id, location_id)
);

create table services (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references salons(id) on delete cascade,
  name text not null,
  category text not null check (category in ('hair','beard','color','spa','kids','combo','other')),
  duration_min int not null,
  price numeric(10,2) not null,
  description text,
  home_service_available boolean not null default false,
  active boolean not null default true
);
```

## 3. Programări și check-in

```sql
create type appointment_status as enum (
  'pending', 'confirmed', 'checked_in', 'in_progress',
  'completed', 'cancelled', 'no_show'
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  salon_id text not null references salons(id),
  location_id uuid references salon_locations(id),
  professional_id uuid not null references professionals(id),
  service_id uuid not null references services(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status appointment_status not null default 'pending',
  is_home_service boolean not null default false,
  home_address text,
  travel_fee numeric(10,2),
  price numeric(10,2) not null,
  points_used int not null default 0,
  points_earned int,
  rebooking_source_appointment_id uuid references appointments(id),  -- dacă a rezultat dintr-o ofertă de rezervare imediată
  cancelled_reason text,
  -- fără suprapuneri pe același profesionist (exclude programările anulate/neprezentare)
  exclude using gist (
    professional_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status not in ('cancelled', 'no_show'))
);

create table check_in_sessions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  method text not null check (method in ('qr', 'phone')),
  checked_in_at timestamptz not null default now(),
  estimated_wait_min int
);

create table staff_pin_access_log (          -- audit pentru modul staff de pe tabletă
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references salons(id),
  location_id uuid references salon_locations(id),
  action text not null,                       -- ex. 'manual_checkin', 'edit_appointment'
  appointment_id uuid references appointments(id),
  accessed_at timestamptz not null default now()
);
```

`exclude using gist` cere extensia `btree_gist` — previne dublarea unui slot
pentru același profesionist la nivel de bază de date, nu doar în UI.

## 4. Recenzii

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references appointments(id),
  client_id uuid not null references profiles(id),
  salon_id text not null references salons(id),
  professional_id uuid not null references professionals(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  verified boolean not null default true,     -- mereu true: recenzia există doar dacă appointment_id e 'completed'
  points_awarded int not null default 20
);
```

Constrângere de business (aplicată la scriere, nu doar la citire): o
recenzie se poate crea **doar** dacă `appointments.status = 'completed'`
pentru `appointment_id`, și doar o dată per programare (`unique` pe
`appointment_id` de mai sus acoperă a doua condiție).

## 5. Recompense, rang, misiuni, referral

```sql
create table points_ledger (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  delta int not null,                          -- pozitiv = câștig, negativ = cheltuire
  reason text not null check (reason in (
    'visit', 'review', 'wheel', 'referral', 'redeem', 'manual_adjustment'
  )),
  appointment_id uuid references appointments(id),
  created_at timestamptz not null default now()
);
-- soldul curent = suma delta pentru client_id; se poate materializa într-o
-- vedere sau coloană cache, dar sursa de adevăr e jurnalul, nu un contor mutabil.

create table missions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  score_reward int not null,
  points_reward int not null default 0,
  active boolean not null default true
);

create table mission_completions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  mission_id uuid not null references missions(id),
  completed_at timestamptz not null default now(),
  unique (client_id, mission_id)
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  referrer_client_id uuid not null references profiles(id),
  referred_client_id uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  confirmed_at timestamptz,           -- setat doar când referred_client finalizează prima programare
  reward_points int
);
```

Scorul de rang (`BUSINESS_RULES.md` §2) e **derivat**, nu stocat direct:
calculat din numărul de vizite finalizate, `mission_completions`,
`reviews`, și `referrals` confirmate ale clientului — printr-o vedere sau la
citire, nu printr-un contor care poate rămâne desincronizat.

## 6. Roata zilnică

```sql
create table wheel_prizes (
  id uuid primary key default gen_random_uuid(),
  salon_id text references salons(id),     -- null = premiu generic/sponsorizat, nu al unui salon anume
  kind text not null check (kind in ('points', 'discount', 'product', 'sponsor')),
  label text not null,
  value int not null default 0,             -- puncte, sau procent reducere, în funcție de kind
  stock_remaining int,                      -- null = nelimitat; altfel decrementat atomic la câștig
  active boolean not null default true
);

create table wheel_spins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  prize_id uuid references wheel_prizes(id),
  spun_at timestamptz not null default now(),
  spun_on date not null default current_date,
  unique (client_id, spun_on)     -- o rotire pe zi calendaristică server, per client
);
```

Decrementarea `stock_remaining` și verificarea `unique (client_id, spun_on)`
se fac în aceeași tranzacție server-side care înregistrează rotirea — niciun
client nu trebuie să poată roti de două ori printr-o cursă de request-uri
paralele (`select for update` sau echivalent, la implementare).

## 7. Boost, feed, inimi

```sql
create table boost_campaigns (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id),
  salon_id text not null references salons(id),
  service_id uuid references services(id),
  discount_percent numeric(4,1) not null,
  radius_km numeric(4,1) not null,
  cost_lei numeric(10,2) not null default 15,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  active boolean not null default true
);

create table feed_posts (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references salons(id),
  professional_id uuid references professionals(id),
  image_url text not null,
  caption text,
  service_id uuid references services(id),   -- pentru "Rezervă acest look"
  heart_count int not null default 0          -- cache; sursa de adevăr e post_hearts
);

create table post_hearts (
  post_id uuid not null references feed_posts(id) on delete cascade,
  client_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  primary key (post_id, client_id)
);
```

## 8. Abonamente și taxe platformă

```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references salons(id),
  plan text not null check (plan in ('solo','salon_start','salon_growth','founding')),
  price_lei numeric(10,2) not null,
  billing_cycle text not null check (billing_cycle in ('monthly','yearly')),
  status text not null default 'active' check (status in ('active','past_due','cancelled')),
  started_at timestamptz not null default now(),
  renews_at timestamptz
);

create table salon_existing_clients (          -- import la onboarding, pt. comision zero
  salon_id text not null references salons(id) on delete cascade,
  phone text not null,
  imported_at timestamptz not null default now(),
  primary key (salon_id, phone)
);

create table platform_fees (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references salons(id),
  kind text not null check (kind in ('new_client_fee', 'boost_fee', 'store_commission')),
  amount_lei numeric(10,2) not null,
  appointment_id uuid references appointments(id),
  boost_campaign_id uuid references boost_campaigns(id),
  product_order_id uuid,
  charged_at timestamptz not null default now()
);
```

`new_client_fee` (8 lei, `BUSINESS_RULES.md` §6.2) se generează automat când
o programare trece în `completed` și `client_id`-ul respectiv (i) nu are
telefonul în `salon_existing_clients` pentru niciun salon, și (ii) nu are
nicio altă programare `completed` anterioară pe platformă.

## 9. Magazin de produse (post-pilot)

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references salons(id),
  name text not null,
  category text not null check (category in ('pomade','beard','shampoo','tools','other')),
  price numeric(10,2) not null,
  member_price numeric(10,2) not null,
  stock int not null default 0,
  image_url text,
  description text
);

create table product_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  product_id uuid not null references products(id),
  salon_id text not null references salons(id),
  quantity int not null default 1,
  price_paid numeric(10,2) not null,
  commission_lei numeric(10,2) not null
);
```

## 10. Integrare calendar extern

```sql
create table calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id),
  provider text not null check (provider in ('google', 'apple_ics')),
  access_token text,          -- Google: token OAuth criptat la repaus
  refresh_token text,
  ics_public_token text,      -- Apple: token opac folosit în URL-ul .ics abonat
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);
```

## 11. Vederi derivate (nu tabele separate)

Ca și în implementarea anterioară a acestui produs (`salon_clients`,
`salon_daily_stats`), datele agregate se calculează prin **vederi Postgres**
peste tabelele de mai sus, nu se duplică în tabele scrise manual:

- **CRM clienți** (`USER_FLOWS.md` §B5) — agregare din `appointments` +
  `reviews`, per `salon_id` + `client_id`: vizite, ultima vizită, valoare
  totală, etichetă (calculată după pragurile din `BUSINESS_RULES.md` §6.3).
- **Analitice salon** — agregare din `appointments` (venit, ocupare) și
  `boost_campaigns` (sloturi umplute per cost).
- **Clasament săptămânal profesioniști** — agregare din `appointments`
  finalizate + `reviews`, fereastră de 7 zile.

**Important, reținut din implementarea anterioară:** orice vedere derivată
din tabele cu RLS (Postgres 15+, cazul Supabase) trebuie creată cu
`with (security_invoker = true)` — altfel vederea rulează cu privilegiile
celui care a creat-o și ocolește complet RLS-ul tabelelor sursă. A fost un
bug real, găsit și reparat în implementarea anterioară a acestui produs
(vezi `DECISIONS.md`).

## 12. Principii RLS (Row Level Security)

Regulile complete se scriu la implementare, dar principiile sunt fixe:

- Un **client** vede și scrie doar propriile programări, recenzii, jurnal
  de puncte, rotiri de roată, referral-uri.
- Un **profesionist** vede programările unde e `professional_id`, poate
  actualiza statusul lor, își gestionează propriul portofoliu (`feed_posts`
  unde e autor) și campaniile lui de Boost.
- Un **administrator de salon** vede și gestionează tot ce ține de
  `salon_id`-ul lui: profesioniști, servicii, locații, abonament, opt-in
  recompense.
- Catalogul public (saloane, profesioniști, servicii, postări din feed) e
  citibil de oricine autentificat, fără a expune date administrative
  (facturare, jurnal de acces PIN, taxe platformă) — acelea sunt vizibile
  doar administratorului salonului respectiv.
