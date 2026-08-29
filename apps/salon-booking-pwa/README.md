# NearCut — Salon & Barbershop Booking PWA

A mobile-first PWA for booking barbers and salons, inspired by Uber and
Stailer: find nearby places, see who's available now, and book in three
taps. Includes a companion business dashboard for barbers/salons to manage
their calendar, services, hot deals, clients, and stats.

This app lives at `apps/salon-booking-pwa/` inside the `actenon-kernel`
repository as a standalone Next.js project; it does not depend on, and is
not depended on by, the Actenon Kernel Python package in the rest of this
repo.

## Status

This is phase 1: a fully navigable UI backed by polished mock data (no
backend yet), as requested. Phase 2 will wire up Supabase (Auth, Postgres,
Storage), real-time availability, Google Calendar sync, and ICS export.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components (Radix primitives)
- Lucide icons
- Recharts for business stats
- Supabase client libraries installed and ready to wire up (`@supabase/supabase-js`, `@supabase/ssr`)

## Structure

- `src/app/(client)/` — client-facing app: home, explore (map/list), salon
  profile, booking flow, appointments, rewards, profile
- `src/app/business/` — business dashboard: calendar, services, hot deals,
  clients, stats, profile & portfolio
- `src/lib/mock/` — mock data (salons, barbers, services, deals, reviews,
  rewards, business clients/bookings/stats)
- `src/lib/calendar.ts` — Google Calendar link + `.ics` file generation
  helpers, already used by the booking confirmation screen
- `src/components/ui/` — shadcn-style primitives
- `src/components/client/`, `src/components/business/` — feature components

## Getting started

```bash
cd apps/salon-booking-pwa
npm install
npm run dev
```

Open http://localhost:3000 for the client app, and
http://localhost:3000/business for the business dashboard (also reachable
from the client Profile screen via "I'm a barber or salon owner").

## Next steps (phase 2)

- Supabase Auth (client + business accounts) and Postgres schema for
  salons, barbers, services, bookings, reviews, rewards
- Real-time availability + booking writes with no double-booking
  (unique constraint / transaction on barber+slot)
- Google Calendar API sync for barbers; the client already generates
  Google Calendar links and downloadable `.ics` files for clients
- Supabase Storage for salon/portfolio photos
- Stripe (or similar) for barber/salon subscriptions and boosts
