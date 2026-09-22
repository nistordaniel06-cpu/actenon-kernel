# Specificația produsului

> Acest document e sursa de adevăr pentru **ce** construim și **de ce**. Pentru
> "cum arată", vezi [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). Pentru "cum se
> comportă pas cu pas", vezi [`USER_FLOWS.md`](./USER_FLOWS.md). Pentru cifre
> exacte (comisioane, praguri, limite), vezi [`BUSINESS_RULES.md`](./BUSINESS_RULES.md).

## 1. Ce este

O platformă mobilă (PWA, mobile-first), în limba română, pentru programări la
frizerii, saloane și profesioniști de înfrumusețare, care combină patru idei
dovedite într-un singur produs:

| Sursă de inspirație | Ce împrumutăm |
|---|---|
| **Instagram** | feed de inspirație — look-uri publicate de profesioniști, cu "rezervă acest look" |
| **Uber** | rezervare rapidă, "disponibil acum", hartă cu profesioniști din apropiere |
| **Stailer** | tiparul de descoperire — profil de salon/profesionist cu portofoliu, servicii, prețuri |
| **rețele sociale** | inimi (nu like-uri generice) pentru reputație socială |
| **RPG** | progres de client pe ranguri, cu misiuni și recompense — nu doar un istoric de vizite |

Produsul are două fețe, cu nevoi diferite, servite din aceeași bază de date:

- **Clientul** descoperă, rezervă, face check-in, câștigă recompense reale,
  lasă recenzii verificate și e împins spre următoarea vizită imediat.
- **Salonul/profesionistul** primește clienți noi, umple sloturi goale,
  publică conținut, promovează linkuri de rezervare, gestionează calendarul
  și reține clienții.

## 2. Promisiunea centrală

> **„Programezi. Faci check-in. Câștigi.”**

Fiecare ecran client trebuie să servească această buclă. Dacă un ecran nu
ajută la a programa mai repede, a confirma prezența, sau a recompensa
clientul, e un candidat pentru a fi tăiat sau simplificat.

Bucla completă, pentru client:

```
Descoperă (feed / hartă / căutare)
   → Rezervă (max. 3 pași, la salon sau la domiciliu)
      → Check-in (tabletă la salon, QR sau telefon)
         → Serviciu finalizat
            → Recompensă + recenzie verificată
               → Rezervare imediată următoare, cu beneficiu
                  → (înapoi la Descoperă, cu rang crescut)
```

Și pentru salon:

```
Publică conținut / Boost sloturi libere
   → Client nou rezervă
      → Check-in pe tabletă la recepție
         → Serviciu finalizat, plată încasată
            → Client reținut (recompensă plătită de salon, nu de platformă)
```

## 3. Roluri

- **Client** — persoana care rezervă și vine la programare.
- **Profesionist** — frizerul/stilistul/cosmeticianul care prestează
  serviciul. Poate fi angajat al unui salon sau independent (Solo).
- **Administrator de salon** — gestionează calendarul echipei, angajații,
  locațiile, abonamentul, campaniile. Pe planul Solo, profesionistul și
  administratorul sunt aceeași persoană.
- **Staff recepție (tabletă)** — mod protejat prin PIN, pentru check-in la
  recepție fără cont individual.

## 4. Funcționalități client

Fiecare element de mai jos are un flux detaliat în `USER_FLOWS.md`.

1. **Autentificare și onboarding** — telefon (OTP) ca metodă principală;
   colectare minimă la prima rulare (nume, oraș/sector, preferință servicii).
2. **Locație și căutare** — permisiune de locație, căutare după nume salon,
   serviciu sau profesionist.
3. **Hartă cu profesioniști din apropiere** — pini cu preț aproximativ și
   disponibilitate, în stil Uber.
4. **„Disponibil acum”** — filtru/secțiune dedicată sloturilor libere azi,
   utilizabile pentru rezervare instant.
5. **Feed de inspirație** — look-uri publicate de saloane/profesioniști,
   derulare verticală, cu buton „Rezervă acest look” pe fiecare postare.
6. **Inimi** — reacție socială pe postări și pe profiluri (nu „thumbs up”,
   nu stele pe feed — stelele rămân doar la recenzii verificate).
7. **„Rezervă acest look”** — din orice postare din feed, deschide fluxul de
   rezervare pre-completat cu serviciul/profesionistul din acea postare.
8. **Profiluri de salon și profesionist** — portofoliu, servicii și prețuri,
   recenzii verificate, program, badge-uri (ex. „Locul 1 săptămâna asta”).
9. **Rezervare în maximum trei pași principali** — serviciu → oră/profesionist
   → confirmare. Orice pas suplimentar (ex. alegere locație pentru acasă)
   se integrează în cele trei, nu se adaugă ca al patrulea.
10. **La salon sau la domiciliu** — comutator vizibil din primul pas al
    rezervării; domiciliul e disponibil doar unde profesionistul/salonul îl
    activează explicit (vezi `BUSINESS_RULES.md`).
11. **Programările mele** — viitoare și istoric, cu status clar.
12. **Anulare și reprogramare** — din „Programările mele”, cu politică de
    anulare vizibilă înainte de confirmare (fereastra exactă e configurabilă
    per salon).
13. **Recenzii verificate** — se pot lăsa doar după o programare marcată
    finalizată; recenzia dă recompensă fixă indiferent de rating (vezi §7).
14. **Rezervare imediată următoare** — ecran de succes după finalizarea
    serviciului, cu reducere limitată, finanțată de salon (vezi §8).
15. **Portofel de recompense** — sold de puncte, istoric de câștig/cheltuire,
    modalitate de folosire la următoarea plată.
16. **Ranguri românești (RPG)** — progres vizibil, necheltuibil, care crește
    prin vizite, misiuni, recenzii și recomandări (vezi §6).
17. **Roata zilnică** — o rotire gratuită la 24h, premii virtuale/sponsorizate
    (vezi §9).
18. **Referral** — cod/link de recomandare, recompensă la prima vizită
    finalizată a prietenului invitat.
19. **Client Plus** — abonament client cu beneficii suplimentare (activare
    ulterioară pilotului, preț definit în `BUSINESS_RULES.md`).
20. **Magazin simplu de produse** — produse de îngrijire vândute prin salon,
    cu comision platformă (activare ulterioară, vezi `BUSINESS_RULES.md`).
21. **Profil și preferințe** — date personale, preferințe de servicii,
    setări de notificări, istoricul recompenselor.

## 5. Funcționalități profesionist / salon

1. **Dashboard** — indicatori cheie ai zilei (programări, venit, ocupare,
   alerte) — vezi `DESIGN_SYSTEM.md` pentru principiul „fără dashboard
   aglomerat”, valabil și aici.
2. **Calendar zilnic și săptămânal** — per profesionist și, pentru
   administrator, agregat pe toată echipa.
3. **CRM clienți** — istoric per client, note interne, etichete (nou / fidel
   / VIP / în risc), calculate din tiparul real de vizite.
4. **Servicii și prețuri** — catalog editabil per salon.
5. **Angajați și locații** — un salon poate avea mai multe locații și mai
   mulți profesioniști; planul de abonament limitează numărul de calendare
   active (vezi `BUSINESS_RULES.md`).
6. **Check-in pe tabletă** — mod kiosk la recepție (vezi §10).
7. **Last-minute Boost** — promovează un slot liber, eliberat recent, cu
   reducere temporară.
8. **Publicare în feed** — postează look-uri/oferte, vizibile în feed-ul de
   inspirație al clienților.
9. **Smart Promote** — recomandare automată a celui mai potrivit moment/canal
   pentru a promova un slot sau o postare (regulă, nu AI generativ, în MVP).
10. **Recenzii și clasament săptămânal** — vizibilitate pe poziția în
    clasamentul profesioniștilor participanți.
11. **Setări serviciu la domiciliu** — activare/dezactivare, rază, taxă de
    deplasare.
12. **Opt-in recompense și giveaway** — salonul alege dacă participă la
    roata zilnică și cu ce premii, și dacă are giveaway propriu.
13. **Inventar produse** — stoc pentru magazinul simplu de produse.
14. **Analitice** — venituri, ocupare, clienți noi vs. recurenți, performanța
    campaniilor Boost.
15. **Conectare Google Calendar** — sincronizare bidirecțională a
    programărilor.
16. **Apple Calendar prin ICS** — export/abonare `.ics` pentru profesioniștii
    care nu vor cont Google.

## 6. Ranguri (progres RPG)

Rangurile sunt **în română** și reprezintă statutul clientului, nu monedă:

1. Descoperitor
2. Inițiat
3. Cunoscător
4. Maestru
5. Campion
6. Legendă

Regula fundamentală: **progresul de rang nu e monedă cheltuibilă.** Nu poate
fi transferat, cumpărat sau folosit la reducere. Crește exclusiv prin acțiuni
reale: vizite finalizate, misiuni completate, recenzii lăsate, recomandări
confirmate. Formula de calcul și pragurile exacte sunt în `BUSINESS_RULES.md`
(sunt valori inițiale, reglabile în timpul pilotului, nu constante fixe în
cod).

## 7. Recompense cheltuibile

Regulile exacte (rata de schimb, plafoane, cine plătește) sunt normative în
`BUSINESS_RULES.md` — aici doar conceptul:

- Recompensele cheltuibile sunt o monedă internă separată de rangul RPG.
- Recenziile dau recompensă fixă, indiferent de nota acordată — încurajăm
  recenzia sinceră, nu doar cea pozitivă.
- Recompensele și premiile reale **nu sunt plătite din bugetul platformei** —
  sunt finanțate de saloane sau de sponsori care aleg să participe.

## 8. Rezervare imediată următoare

Imediat după ce o programare e marcată finalizată, clientul vede un ecran
dedicat care îi propune să rezerve următoarea vizită pe loc, cu o reducere
mică, limitată și finanțată de salon — nu de platformă. Salonul poate regla
sau opri acest beneficiu. Detalii exacte în `BUSINESS_RULES.md`.

## 9. Roata zilnică

O rotire gratuită la fiecare 24 de ore, fără rotiri plătite și fără premii în
bani. Premiile sunt recompense virtuale, beneficii oferite de saloane sau
produse sponsorizate. Saloanele participă doar prin opt-in explicit. Stocul
de premii și regulile anti-abuz se validează server-side, nu în client
(detalii în `BUSINESS_RULES.md` și `DATABASE_SCHEMA.md`).

## 10. Check-in pe tabletă (mod kiosk)

Un mod public, montat pe o tabletă la recepția salonului, gândit explicit
pentru confidențialitate:

- **Nu afișează niciodată o listă publică de clienți.** Identificarea se
  face doar prin cod QR (generat în aplicația clientului) sau prin numărul
  de telefon introdus de client la tabletă.
- Confirmă programarea găsită și **notifică profesionistul** că a sosit
  clientul.
- Arată o estimare a timpului de așteptare.
- **Modul staff** (acces la funcții administrative de pe aceeași tabletă,
  ex. anulare, editare) e protejat printr-un PIN separat — nu accesibil din
  ecranul public de check-in.
- După ce profesionistul marchează serviciul finalizat, tableta (sau
  telefonul clientului, dacă a fost legat) arată recompensa câștigată,
  invitația la recenzie și oferta de rezervare imediată următoare.

## 11. Ce nu construim în acest pas

Această listă e intenționat restrictivă — nu implementăm cod în etapa de
documentație, dar și pentru etapele viitoare, notăm explicit ce rămâne în
afara scopului până se spune altfel (vezi și `IMPLEMENTATION_PLAN.md` §Pilot):

- recompense sau premii plătite din banii platformei;
- rotiri plătite la roata zilnică sau premii în bani;
- listă publică de clienți vizibilă pe tabletă;
- buget de publicitate plătită în timpul pilotului;
- Client Plus și comisionul de magazin ca surse active de venit (rămân
  planificate, activate după pilot — vezi `BUSINESS_RULES.md`).
