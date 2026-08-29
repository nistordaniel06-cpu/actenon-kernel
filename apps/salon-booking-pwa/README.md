# NearCut — Platformă premium de programări pentru frizerii și saloane

O aplicație PWA mobile-first pentru rezervarea la frizerii și saloane, cu trei
roluri complete: **client**, **frizer** și **administrator de salon** (Salon
Pro). Temă premium negru + verde lime, conținut și formate în limba română.

Acest MVP trăiește la `apps/salon-booking-pwa/` în interiorul repository-ului
`actenon-kernel`; e un proiect Next.js de sine stătător, complet independent
de pachetul Python Actenon Kernel din restul repo-ului.

## Status

MVP complet navigabil pe date mock, cu toate acțiunile principale funcționale
(nu doar ecrane statice): o programare făcută de client apare instant în
"Programările mele" și în agenda frizerului, anularea/reprogramarea
actualizează starea reală, roata zilnică, review-urile și magazinul au
interacțiuni reale, iar Salon Pro vede calendarul echipei și indicatorii la
zi. Backend-ul real (Supabase, sincronizare calendar) este următoarea etapă.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + componente stil shadcn/ui (Radix UI)
- Zustand pentru starea mock partajată între roluri (programări, puncte, boost-uri, review-uri)
- React Hook Form + Zod (formularul de Boost)
- Framer Motion (animația roții zilnice)
- Lucide React pentru iconițe
- Recharts pentru statistici
- date-fns instalat, formatele curente folosesc `Intl` cu locale `ro-RO`
- Supabase client libraries instalate, pregătite pentru etapa următoare

## Structură

- `src/app/page.tsx` — ecranul de bun venit (alegere rol + login demo)
- `src/app/(client)/` — aplicația client: acasă, descoperă (hartă/listă),
  cerere rapidă, profil salon, rezervare (3 pași + la domiciliu), programările
  mele, Style Passport, portofel (ranguri + roata zilnică), comunitate, magazin, profil
- `src/app/barber/` — rolul Frizer: agenda zilei (check-in / început /
  finalizare / neprezentare), clienți, Boost oră liberă, portofoliu, recenzii
- `src/app/salon-pro/` — rolul Salon Pro: dashboard, calendar echipă,
  clienți, personal & procente, servicii, campanii & stoc, rapoarte
  (placeholder), mod tabletă check-in — sidebar pe tabletă/desktop, bottom
  nav pe mobil
- `src/lib/store.ts` — starea Zustand partajată (persistă în localStorage)
- `src/lib/mock/` — date mock: 4 saloane din București, 8 frizeri, 12
  servicii, disponibilitate pe 7 zile, programări viitoare/istoric, 8
  produse, review-uri, ranguri, campanii
- `src/lib/calendar.ts` — link Google Calendar + generare `.ics`
- `src/components/ui/` — primitive stil shadcn
- `src/components/client/`, `src/components/barber/`, `src/components/salon-pro/`, `src/components/shared/` — componente pe rol

## Instalare și rulare

```bash
cd apps/salon-booking-pwa
npm install
npm run dev
```

Deschide http://localhost:3000 — ecranul de bun venit. Alege un rol (fără
autentificare reală în această etapă — orice buton te duce direct în demo):

- **Sunt client** → `/home`
- **Sunt frizer** → `/barber`
- **Administrez un salon** → `/salon-pro`

Poți schimba rolul oricând din ecranul Profil.

## Verificări

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Toate trec fără erori la ultima verificare (29 rute compilate).

## Următoarea etapă (Supabase)

- Autentificare reală (telefon / Apple) cu Supabase Auth
- Schema Postgres pentru saloane, frizeri, servicii, programări, review-uri, puncte
- Scriere programări în timp real, fără suprapuneri (constrângere unică pe frizer + interval)
- Sincronizare reală cu Google Calendar API pentru frizeri (link-ul Google Calendar
  și fișierul `.ics` pentru client sunt deja generate în flux)
- Supabase Storage pentru fotografiile de portofoliu
- Facturare/abonament pentru Salon Pro (secțiunea Rapoarte e pregătită ca placeholder)
