@AGENTS.md

# NearCut — reguli permanente de proiect

Platformă mobilă (PWA, mobile-first), în limba română, pentru programări la
frizerii, saloane și profesioniști de înfrumusețare. Promisiunea centrală:
**„Programezi. Faci check-in. Câștigi.”**

## Citește înainte de a implementa

Acest fișier e intenționat scurt. Detaliile normative sunt în `docs/` —
**orice sesiune care implementează cod trebuie să citească documentul
relevant înainte de a scrie prima linie**, nu doar acest fișier:

| Document | Când îl citești |
|---|---|
| [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) | înainte de orice funcționalitate nouă — ce e produsul și ce conține |
| [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | înainte de orice ecran/componentă UI — paletă, tipografie, componente |
| [`docs/USER_FLOWS.md`](./docs/USER_FLOWS.md) | înainte de a implementa un flux — secvența exactă de ecrane/stări |
| [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) | înainte de orice cifră (procente, plafoane, prețuri) — normativ, nu de ghicit |
| [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) | înainte de orice schemă/migrare — entități și relații țintă |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | la începutul oricărei faze — ce e deja construit, ce diferă, ce urmează |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | când o cerință pare ambiguă — poate a fost deja decisă |

`docs/references/` conține (sau va conține) capturi/imagini de referință
pentru direcția vizuală — verifică-l înainte de a implementa un ecran nou.

## Reguli care nu se negociază

- **Tot textul vizibil utilizatorului e în limba română** — fără excepții
  pentru texte de sistem (erori, notificări, e-mailuri).
- **Rangurile client sunt românești și fixe**: Descoperitor, Inițiat,
  Cunoscător, Maestru, Campion, Legendă. Progresul de rang **nu e monedă
  cheltuibilă** — nu se transferă, nu se cumpără, nu reduce prețul.
- **Platforma nu finanțează niciodată recompense sau premii din bani
  proprii.** Sunt finanțate de saloane sau sponsori, prin opt-in explicit.
- **Roata zilnică**: o rotire gratuită la 24h, fără rotiri plătite, fără
  premii în bani. Stocul de premii și anti-abuzul se validează server-side.
- **Check-in pe tabletă nu afișează niciodată o listă publică de clienți.**
  Identificare doar prin QR sau telefon; modul staff e separat, prin PIN.
- **Rezervarea client are maximum trei pași principali.** Un pas nou nu se
  adaugă — se integrează în unul din cei trei existenți.
- **Niciun literal magic pentru cifre de business** (procente, plafoane,
  prețuri de abonament) — acestea vin din `docs/BUSINESS_RULES.md`, citite
  din configurare, nu scrise fix în cod.
- **Fără butoane moarte.** Orice control fie schimbă stare, fie navighează,
  fie arată un mesaj clar.
- **Fără gradient-uri ieftine, fără emoji în locul iconițelor de sistem,
  fără dashboard client aglomerat** — vezi `docs/DESIGN_SYSTEM.md` §7.

## Stare curentă

Acest director conține deja un MVP funcțional construit înainte de setul
curent de documente (vezi `README.md` din rădăcina proiectului pentru stack
și starea exactă a integrării Supabase). E punctul de plecare pentru
implementare, **nu** presupus deja aliniat cu `docs/` — discrepanțele
cunoscute și planul de reconciliere sunt în
[`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) §0.

## Verificări obligatorii înainte de a considera o etapă „gata”

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

Fără erori de consolă la navigare, fără butoane moarte, comportament
verificat față de `docs/USER_FLOWS.md` — nu doar presupus din citirea
codului.
