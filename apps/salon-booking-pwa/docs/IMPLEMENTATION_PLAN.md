# Plan de implementare

> Acest document e un plan de fazare, nu cod. Nicio fază de mai jos nu se
> începe fără să citească întâi `PRODUCT_SPEC.md`, `DESIGN_SYSTEM.md`,
> `USER_FLOWS.md`, `BUSINESS_RULES.md` și `DATABASE_SCHEMA.md`.

## 0. Punctul de plecare

Acest director (`apps/salon-booking-pwa/`) conține deja un MVP funcțional
construit înainte de acest set de documente ("NearCut"): trei roluri
(client/frizer/administrator salon), stare Zustand pe date mock, și un strat
Supabase parțial cablat (schemă, autentificare pe email, scriere programări,
citiri de catalog, Storage pentru fotografii — vezi `README.md` din
rădăcina proiectului pentru starea exactă).

**Acest cod existent e punctul de plecare, nu se aruncă**, dar nu se
presupune compatibil linie cu linie cu documentele din `docs/`. Diferențe
cunoscute, de reconciliat la începutul Fazei 1:

| Zonă | Cod existent | Ce cere `docs/` |
|---|---|---|
| Ranguri | Ucenic → Calfă → Meșter → Maestru → Legendă (5 trepte) | Descoperitor → Inițiat → Cunoscător → Maestru → Campion → Legendă (6 trepte) |
| Paletă | `#090b09` / `#75b82a` (aproape identică, dar nu identică) | `#0B0D0C` / `#76C93B` / `#EAF6DF` / `#F8F9F6` — vezi `DESIGN_SYSTEM.md` |
| Reacție socială | fără sistem de "inimi" separat de recenzii | inimi pe postări din feed, distincte de stelele de recenzie |
| Autentificare | e-mail (magic link) | telefon (OTP) ca metodă principală |
| Model de business | fără abonamente/comisioane implementate | planuri Solo/Salon Start/Salon Growth/Founding, taxă per client nou, Boost cu cost fix — `BUSINESS_RULES.md` §6 |
| Check-in | căutare după nume/telefon, fără QR | QR sau telefon, fără listă publică de clienți |
| Feed de inspirație, Smart Promote, misiuni, referral, Client Plus, magazin cu comision | inexistente | descrise complet în `PRODUCT_SPEC.md` |

Reconcilierea nu înseamnă neapărat rescriere completă — pentru multe zone
(structura de rute pe rol, tiparul Server Component + citire Supabase cu
fallback pe mock, componentele UI de bază) codul existent e o fundație
validă. Decizia exactă (adaptare vs. rescriere) se ia per zonă, la
începutul fazei care o atinge, și se înregistrează în `DECISIONS.md`.

## 1. Fazare

Filozofia rămâne cea validată deja pe acest proiect: **UI complet navigabil
pe date mock întâi, apoi backend real** — nu invers, și nu simultan.

### Faza 1 — Aliniere fundație

- Reconciliază design tokens la paleta din `DESIGN_SYSTEM.md`.
- Redenumește rangurile la cele 6 trepte din `PRODUCT_SPEC.md` §6, cu
  pragurile din `BUSINESS_RULES.md` §2.
- Extinde schema Supabase existentă spre `DATABASE_SCHEMA.md` (tabele
  lipsă: `missions`, `mission_completions`, `referrals`, `feed_posts`,
  `post_hearts`, `boost_campaigns` cu cost fix, `subscriptions`,
  `salon_existing_clients`, `platform_fees`, `products`/`product_orders`,
  `calendar_integrations`) — adăugat incremental, nu într-o singură
  migrare uriașă.

### Faza 2 — Descoperire și feed

- Feed de inspirație (postări, inimi, „Rezervă acest look”).
- Hartă + „Disponibil acum” (dacă nu sunt deja la nivelul cerut din MVP-ul
  existent — verifică față de `USER_FLOWS.md` §A2).

### Faza 3 — Rezervare, check-in, recompense

- Confirmă fluxul de rezervare respectă strict 3 pași (`USER_FLOWS.md`
  §A3) — inclusiv „la domiciliu”.
- Check-in pe tabletă: identificare QR/telefon, fără listă publică, mod
  staff cu PIN separat.
- Portofel de puncte, plafonul de 10%, recompensa fixă de recenzie,
  rezervare imediată următoare (5%/max 10 lei, configurabilă per salon).

### Faza 4 — RPG și engagement

- Scor de rang derivat (nu stocat ca fapt), misiuni, referral cu
  confirmare la prima vizită finalizată.
- Roata zilnică: o rotire/24h, stoc și anti-abuz server-side, opt-in per
  salon.

### Faza 5 — Panou profesionist/salon complet

- Last-minute Boost (cost fix 15 lei), Smart Promote (bazat pe reguli),
  CRM cu etichete calculate, analitice.
- Abonamente (Solo/Salon Start/Salon Growth/Founding) și taxele per
  tranzacție din `BUSINESS_RULES.md` §6.

### Faza 6 — Integrări externe

- Google Calendar (OAuth, sincronizare bidirecțională).
- Apple Calendar prin `.ics`.

### Faza 7 — Post-pilot (nu în lansarea inițială)

- Client Plus (24,90 lei/lună).
- Magazin de produse cu comision (țintă 10%).

Fazele 2–6 pot avea ordine flexibilă în funcție de ce e nevoie pentru pilot
(vezi mai jos) — ordinea de mai sus e logică, nu obligatorie.

## 2. Pilot (execuție, nu doar criterii)

Criteriile sunt normative în `BUSINESS_RULES.md` §7; aici e succesiunea de
execuție:

1. **Configurare salon pilot** — 4MEN Lujerului, ca prim salon activ, plan
   Founding sau echivalent intern, catalog real de servicii/profesioniști.
2. **Validare tehnică** — minimum 20 de rezervări reale, fără erori, înainte
   de a onboarda alt salon. „Fără erori” = fără eșecuri de plată, fără
   suprapuneri de programări, fără pierderi de date de check-in.
3. **Extindere controlată** — onboardarea a 10 saloane fondatoare în
   Sectorul 6, câte unul verificat manual înainte de următorul.
4. **Achiziție** — invitarea a ~750 de clienți existenți ai saloanelor
   pilot (import în `salon_existing_clients`, ca să primească
   corect comision zero, nu taxa de 8 lei).
5. **Vânzare anticipată** — 5 abonamente Founding pre-vândute, în paralel
   cu extinderea, nu după.
6. **Fără buget de reclame plătite** în tot acest interval
   (`BUSINESS_RULES.md` §6.2).

## 3. Definition of Done per fază

O fază e „gata” doar dacă:

- pornește cu o singură comandă documentată (`npm run dev` sau echivalent);
- funcționează la 360px/390px (mobil) — panoul de salon și la tabletă/desktop;
- `tsc --noEmit`, `eslint`, `next build` trec fără erori;
- fără console errors la navigare completă pe ecranele atinse de fază;
- fără „butoane moarte” — orice control fie schimbă stare, fie navighează,
  fie arată un mesaj clar (regulă moștenită din implementarea anterioară a
  acestui produs, valabilă în continuare);
- comportamentul documentat în `USER_FLOWS.md` pentru acea fază e verificat
  manual sau printr-un test, nu doar presupus din citirea codului.

## 4. Ce nu se implementează fără o decizie explicită

Repetat din `PRODUCT_SPEC.md` §11, ca reamintire la nivel de plan: fără
recompense finanțate din bugetul platformei, fără rotiri plătite sau
premii în bani la roata zilnică, fără listă publică de clienți pe tabletă,
fără buget de reclame plătite în pilot, fără activarea Client Plus/comision
magazin înainte de finalul pilotului.
