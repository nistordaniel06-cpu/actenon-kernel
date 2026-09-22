# Decizii și verificare de completitudine

## 1. Verificare: nicio funcționalitate cerută nu lipsește

Fiecare element din cerința inițială e mapat mai jos la documentul și
secțiunea care îl acoperă. Nimic din listă nu a fost omis.

### Concept central

| Element cerut | Acoperit în |
|---|---|
| Instagram pentru inspirație | `PRODUCT_SPEC.md` §1, §4.5 |
| Uber pentru rezervare rapidă și disponibilitate din apropiere | `PRODUCT_SPEC.md` §1, §4.3–4.4 |
| Descoperire inspirată din Stailer | `PRODUCT_SPEC.md` §1, §4.8 |
| Inimi pentru reputație socială | `PRODUCT_SPEC.md` §1, §4.6; `DESIGN_SYSTEM.md` §1, §5 |
| Progres RPG al clientului | `PRODUCT_SPEC.md` §1, §6; `BUSINESS_RULES.md` §2 |
| Management profesionist de salon | `PRODUCT_SPEC.md` §1, §5 |
| Clienții primesc beneficii reale | `PRODUCT_SPEC.md` §1, §7–8; `BUSINESS_RULES.md` §1, §3 |
| Promisiunea „Programezi. Faci check-in. Câștigi.” | `PRODUCT_SPEC.md` §2 |

### Funcționalități client (21/21)

Toate cele 21 de elemente din cerință apar, în aceeași ordine, în
`PRODUCT_SPEC.md` §4.1–§4.21 (autentificare/onboarding → profil și
preferințe). Detaliile de flux sunt în `USER_FLOWS.md` secțiunea A.

### Ranguri românești

Cele 6 ranguri (Descoperitor → Legendă) sunt în `PRODUCT_SPEC.md` §6, cu
regula „nu e monedă cheltuibilă” explicită. Formula de progres și pragurile
sunt în `BUSINESS_RULES.md` §2 (marcate reglabile — spec-ul inițial nu a dat
o formulă exactă, vezi §2 mai jos).

### Reguli de recompensă cheltuibilă (5/5)

100 unități = 1 leu, plafon 10%, recompensă recenzie 20 unități indiferent
de rating, finanțare de la saloane/sponsori, platforma nu plătește din bani
proprii — toate patru în `BUSINESS_RULES.md` §1.

### Rezervare imediată următoare (5/5)

Afișată după finalizare, 5% implicit, plafon 10 lei, finanțată de salon,
configurabilă/dezactivabilă de salon — toate în `BUSINESS_RULES.md` §3 și
`USER_FLOWS.md` §A6.

### Roata zilnică (6/6)

O rotire/24h, fără rotiri plătite, fără premii în bani, premii
virtuale/salon/sponsorizate, opt-in per salon, stoc și anti-abuz
server-side — toate în `BUSINESS_RULES.md` §4.

### Check-in pe tabletă (8/8)

Kiosk public privacy-safe, fără listă publică, identificare QR sau telefon,
confirmare programare, notificare profesionist, timp estimat de așteptare,
mod staff cu PIN, ecran post-finalizare cu recompense/recenzie/rebooking —
toate în `PRODUCT_SPEC.md` §10 și `USER_FLOWS.md` §A5, §B6.

### Funcționalități profesionist (16/16)

Toate cele 16 elemente din cerință apar, în aceeași ordine, în
`PRODUCT_SPEC.md` §5.1–§5.16. Detaliile de flux sunt în `USER_FLOWS.md`
secțiunea B.

### Model de business (10/10)

Solo 69 lei, Salon Start 149 lei/5 calendare, Salon Growth 249 lei/12
calendare, Founding 990 lei/an primele 10, comision zero clienți existenți,
taxă 8 lei prima vizită client nou, Boost 15 lei, Client Plus 24,90 lei
(ulterior), comision magazin 10% (ulterior), buget reclame zero în pilot —
toate în `BUSINESS_RULES.md` §6.

### Pilot (6/6)

4MEN Lujerului, 20 de rezervări fără erori, 10 saloane fondatoare în
Sectorul 6, ~750 de invitații, 5 abonamente Founding pre-vândute, fără
recompense finanțate necontrolat — toate în `BUSINESS_RULES.md` §7 și
`IMPLEMENTATION_PLAN.md` §2.

### Direcție vizuală (9/9)

Senzație premium nativă iOS, inspirație din `docs/references/`, paletă
negru/alb/verde lime cu hex-urile exacte, whitespace generos, colțuri
18–24px, safe areas iOS, bottom sheets stil Uber, Lucide Icons, fără
dashboard aglomerat/gradient ieftin/emoji, tot în română — toate în
`DESIGN_SYSTEM.md`.

### Fișiere cerute (8/8)

`CLAUDE.md`, `docs/PRODUCT_SPEC.md`, `docs/DESIGN_SYSTEM.md`,
`docs/USER_FLOWS.md`, `docs/BUSINESS_RULES.md`, `docs/DATABASE_SCHEMA.md`,
`docs/IMPLEMENTATION_PLAN.md`, `docs/DECISIONS.md` — toate create (acest
fișier fiind ultimul).

**Concluzie: toate elementele cerute sunt acoperite. Niciun cod de
aplicație nu a fost modificat în această etapă** — verificat: singurele
fișiere noi/schimbate sunt `CLAUDE.md` și conținutul din `docs/`.

## 2. Decizii luate (unde spec-ul nu a dat o valoare exactă sau a fost ambiguu)

| Decizie | Rațiune | Unde apare |
|---|---|---|
| Documentația se scrie în `apps/salon-booking-pwa/`, înlocuind stub-ul vechi de `CLAUDE.md`, nu într-un proiect nou separat | Confirmat explicit de utilizator — acest director rămâne baza de cod, dar viitoarele sesiuni urmează aceste documente ca specificație definitivă, nu brief-ul ad-hoc din prima fază de construcție | — |
| `docs/references/` a fost creat, dar e **gol** | Cerința menționează imagini de referință în acel director, dar niciuna nu a fost furnizată. Am marcat explicit în `DESIGN_SYSTEM.md` că adăugarea lor e o precondiție înainte de implementarea vizuală, nu am inventat/presupus imagini | `DESIGN_SYSTEM.md` antet |
| Numele unității de recompensă: „puncte” | Spec-ul dă doar rata de schimb (100 unități = 1 leu), fără nume. „Puncte” e terminologia standard pentru acest tip de mecanism în română; marcat explicit ca denumire de lucru, reglabilă | `BUSINESS_RULES.md` §1 |
| Formulă și praguri de scor pentru ranguri | Spec-ul cere ca progresul să crească „prin vizite, misiuni, recenzii și recomandări”, fără formulă. Am definit o formulă ponderată explicită și 6 praguri, marcate clar ca valori inițiale de calibrat în pilot, nu constante de business fixe | `BUSINESS_RULES.md` §2 |
| Praguri etichete CRM (nou/fidel/VIP/în risc) | Nespecificate în cerință. Am reutilizat euristica din implementarea anterioară a acestui produs (vizite + zile de la ultima vizită), marcată reglabilă | `BUSINESS_RULES.md` §6.3 |
| Mecanism de distincție „client existent al salonului” vs. „client nou pe platformă” | Cerința dă regulile de business (comision zero vs. 8 lei) dar nu mecanismul. Am propus un import de liste de clienți existenți per salon (potrivire după telefon), documentat ca decizie de implementare, nu de business | `DATABASE_SCHEMA.md` §8, `BUSINESS_RULES.md` §6.2 |
| Paleta exactă din cerință (`#0B0D0C`/`#76C93B`/`#EAF6DF`/`#F8F9F6`) e păstrată ca atare, deși diferă ușor de token-urile deja implementate în cod (`#090b09`/`#75b82a`) | Cerința a dat valori noi, exacte; nu le-am „rotunjit” la ce exista deja în cod. Reconcilierea codului cu noua paletă e muncă de implementare (Faza 1), nu de documentare | `DESIGN_SYSTEM.md` §2, `IMPLEMENTATION_PLAN.md` §0 |
| Numele produsului rămâne „NearCut” în documente, provizoriu | Cerința nu a dat un nume nou pentru produs, doar promisiunea/tagline-ul. Am păstrat numele existent ca referință de lucru, deschis schimbării | — |
| Nicio schemă SQL nu a fost aplicată efectiv (nicio migrare nouă în `supabase/migrations/`) | Cerința explicită: „nu implementa cod de aplicație în această etapă”. `DATABASE_SCHEMA.md` descrie schema țintă ca documentație, nu ca migrare de rulat | `DATABASE_SCHEMA.md` antet |
| `CLAUDE.md` păstrează `@AGENTS.md` ca includere, nu îl înlocuiește | `AGENTS.md` e regenerat automat de `next dev` (comentariu în fișier); înlocuirea lui ar recrea diff-uri needorite la fiecare pornire de server. Regulile noi, permanente, sunt adăugate în `CLAUDE.md`, alături de includere, nu în locul ei | `CLAUDE.md` |

## 3. Discrepanțe cunoscute față de codul deja implementat

Documentate integral, cu tabel comparativ, în `IMPLEMENTATION_PLAN.md` §0 —
nu repetate aici ca să nu existe două surse de adevăr pentru aceeași
informație. Pe scurt: ranguri (5 vs. 6 trepte, nume diferite), paletă
(aproximativă vs. exactă), autentificare (e-mail vs. telefon), lipsă
completă a feed-ului de inspirație/inimilor/misiunilor/referral/Client
Plus/magazinului cu comision în codul actual, și un model de business
neimplementat încă (abonamente, taxe per tranzacție).

Niciuna dintre aceste discrepanțe nu a fost rezolvată în această etapă —
sunt semnalate explicit pentru Faza 1 din `IMPLEMENTATION_PLAN.md`.
