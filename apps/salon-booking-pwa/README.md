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
zi.

Schema Postgres, autentificarea reală (email, fără parolă) și scrierea
programărilor sunt deja pregătite pentru Supabase — vezi
[„Conectarea la Supabase"](#conectarea-la-supabase) mai jos. Fără variabilele
de mediu setate, aplicația rulează exact ca până acum, pe date mock.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + componente stil shadcn/ui (Radix UI)
- Zustand pentru starea mock partajată între roluri (programări, puncte, boost-uri, review-uri)
- React Hook Form + Zod (formularul de Boost)
- Framer Motion (animația roții zilnice)
- Lucide React pentru iconițe
- Recharts pentru statistici
- date-fns instalat, formatele curente folosesc `Intl` cu locale `ro-RO`
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`) — schemă, autentificare
  pe email, scrierea programărilor, Storage pentru fotografii și citirea
  saloanelor/frizerilor/serviciilor/magazinului/personalului/clienților sunt
  cablate; restul ecranelor rămân pe mock până la etapa următoare (vezi mai jos)

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
- `src/lib/supabase/` — client browser/server (cu timeout pe fiecare cerere,
  ca un backend nedisponibil să nu blocheze pagina), config
  (`isSupabaseConfigured()`), autentificare pe email, mirror-ul scrierilor de programări
- `src/lib/data/catalog.ts` — citirea catalogului (saloane, frizeri, servicii,
  magazin, personal, clienți): din Postgres când Supabase e configurat, altfel
  din mock, cu `cache()` din React ca un layout și o pagină să nu dubleze
  aceeași cerere; `src/lib/data/mappers.ts` conține funcțiile pure de mapare
  rând → tip din aplicație
- `src/lib/supabase/storage.ts` — încărcare de imagini în bucket-ul public
  `media`; `src/lib/supabase/media.ts` — mirror-ul actualizărilor de fotografii
  (copertă/galerie salon, portofoliu frizer) către Postgres
- `src/proxy.ts` — împrospătează sesiunea Supabase (no-op fără variabile de mediu)
- `supabase/migrations/0001_init.sql` — schema Postgres completă + RLS
- `supabase/migrations/0002_storage_and_barber_gallery.sql` — bucket-ul de
  Storage + politicile lui, coloana de galerie a frizerului
- `supabase/seed.sql` — catalogul de mock data (saloane, frizeri, servicii,
  produse, roata zilnică) pregătit pentru un proiect Supabase nou
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

## Conectarea la Supabase

1. Creează un proiect nou pe [supabase.com](https://supabase.com).
2. În **SQL Editor**, rulează în ordine `supabase/migrations/0001_init.sql`,
   `supabase/migrations/0002_storage_and_barber_gallery.sql` (schema + RLS +
   bucket-ul de Storage) și opțional `supabase/seed.sql` (populează saloanele,
   frizerii, serviciile, produsele și roata zilnică, ca să nu pornești de la
   un catalog gol).
3. Din **Project Settings → API**, copiază `.env.local.example` în
   `.env.local` și completează `NEXT_PUBLIC_SUPABASE_URL` și
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. În **Authentication → Providers**, activează Email (Magic Link e activat
   implicit) — nu e nevoie de parolă.
5. Repornește `npm run dev`. Pe ecranul de bun venit apare acum și „Cont real
   (Supabase)" cu autentificare pe email; fără pașii de mai sus, aplicația
   rulează exact ca înainte, pe date mock.

**Ce e deja cablat la Supabase:**

- Autentificare pe email (magic link), cu profil creat automat (`profiles`,
  rol implicit `client`) și sincronizat cu rolul din aplicație.
- Scrierea programărilor: `addAppointment`, `updateAppointmentStatus`,
  `cancelAppointment`, `rescheduleAppointment` din `src/lib/store.ts` oglindesc
  acum și în Postgres, best-effort, când ești autentificat — starea Zustand
  locală rămâne mereu sursa de adevăr pentru UI, deci nimic nu se rupe dacă
  scrierea remote eșuează sau dacă nu ești logat.
- Citirea catalogului pe toate ecranele Server Component: Descoperă, profil
  salon, rezervare, tot Salon Pro (dashboard, calendar echipă, servicii,
  campanii, check-in tabletă, personal, profil), listele de clienți (Salon
  Pro și Frizer) și Magazin. `src/lib/data/catalog.ts` interoghează Postgres
  când e configurat, cu timeout de 5s pe fiecare cerere ca un backend
  nedisponibil să nu blocheze pagina, și revine automat pe mock la orice
  eroare — verificat inclusiv cu un proiect Supabase inexistent.
- Lista de clienți e derivată din `programări` printr-un view Postgres
  (`salon_clients`), nu stocată separat — pe un proiect nou, fără programări
  reale încă, pornește goală în loc să inventeze clienți; „tag"-ul (nou/fidel/
  VIP/în risc) se calculează din numărul de vizite și data ultimei vizite.
- Schema completă (saloane, frizeri, servicii, personal, recenzii, campanii,
  boost-uri, magazin, roata zilnică, puncte, clasament) cu RLS: catalogul e
  public la citire, programările/recenziile/punctele sunt vizibile doar
  clientului lor sau frizerului/salonului implicat, iar constrângerea
  `exclude` de pe `appointments` respinge la nivel de bază de date orice
  suprapunere pe același frizer. View-urile derivate rulează cu
  `security_invoker` — altfel ar fi ocolit RLS de pe `appointments`.
- Supabase Storage: „Schimbă coperta" și adăugarea de fotografii în galeria
  salonului (Salon Pro) și în portofoliul frizerului încarcă imagini reale în
  bucket-ul public `media` și persistă URL-ul în Postgres. Fără Supabase
  configurat, butoanele afișează același mesaj clar ca înainte — nu se
  deschide niciun selector de fișiere.

**Ce rămâne pentru etapa următoare:**

- Ecranele care depind de identitatea curentă din demo (`currentBarberId` din
  Zustand, ales prin „Schimbă rolul" din Profil, nu dintr-o sesiune reală) —
  agenda frizerului, portofoliul de bază (fotografiile încărcate real
  funcționează deja, doar numele/salonul frizerului rămân mock), recenziile
  frizerului — rămân pe mock. O pagină server nu poate ști ce rol ai ales
  în client fără o sesiune reală; trecerea lor pe Supabase înseamnă fie
  legarea `barbers.profile_id` de utilizatorul autentificat, fie un prim strat
  de citire client-side cu fallback pe mock — încă neconstruit, ca să nu
  amestec două tipare diferite de citire într-o singură etapă.
- Comunitate (clasament) și Style Passport citesc tot din mock, din același
  motiv sau pentru că depind de istoricul de programări al clientului curent.
  Cererea rapidă rămâne pe mock: serviciile sunt acum per-salon în schemă, iar
  lista ei globală de „servicii populare" ar cere fie deduplicare, fie un
  tabel separat de categorii — nu l-am construit încă.
- Autentificare cu telefon / Apple (schema de `profiles` e neutră la
  provider; azi e cablat doar email, cel mai simplu de activat fără cheile
  unui provider extern).
- Sincronizare reală cu Google Calendar API pentru frizeri (link-ul Google
  Calendar și fișierul `.ics` pentru client sunt deja generate în flux).
- Facturare/abonament pentru Salon Pro (secțiunea Rapoarte e pregătită ca placeholder).

## Urmărirea issue-urilor NearCut

Adaugă eticheta `nearcut` fiecărui issue care aparține acestei aplicații.
Workflow-ul `.github/workflows/nearcut-open-issues.yml` rulează zilnic la
08:20 UTC (și manual din Actions), numără doar issue-urile NearCut deschise și
creează sau actualizează un singur raport marcat `automated-report`. Raportul
automat este exclus din numărătoare.
