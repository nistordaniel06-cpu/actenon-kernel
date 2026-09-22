# Reguli de business

> Acest document e **normativ** — orice cifră de aici trebuie citită din
> configurare (bază de date sau variabile de mediu), niciodată scrisă direct
> în cod ca literal magic. Unde spec-ul inițial nu a dat o valoare exactă,
> valoarea de mai jos e marcată **(implicit, reglabil)** — se poate schimba
> fără să conteze ca o abatere de la cerințe.

## 1. Unitatea de recompensă

- Numele intern de lucru al monedei de recompensă: **puncte**
  **(denumire de lucru, reglabilă — vezi `DECISIONS.md`)**.
- Rată de schimb fixă: **100 puncte = 1 leu**.
- Puncte câștigate:
  - vizită finalizată: procent din valoarea programării, stabilit per salon
    (vezi §6) — nu un procent unic global;
  - recenzie verificată: **20 de puncte, indiferent de rating**;
  - roata zilnică: variabil, per premiu (vezi §4);
  - referral confirmat: valoare stabilită per campanie, cu un implicit
    **(implicit, reglabil)** documentat lângă configurarea de referral.
- Puncte cheltuite: doar la plata unei programări, niciodată transferate
  către alt cont, niciodată convertite înapoi în bani de către client.

### 1.1 Plafonul de plată cu puncte

- Maximum **10% din valoarea unei programări** poate fi achitat din puncte.
  Diferența (minimum 90%) se achită prin metoda de plată normală.
- Plafonul se calculează pe valoarea programării **înainte** de aplicarea
  reducerii de rezervare imediată următoare (§3), ca să nu se poată combina
  cele două beneficii într-un mod care lasă salonul cu încasare sub cost.

### 1.2 Cine plătește recompensele

- **Platforma nu finanțează niciodată recompense sau premii din bani
  proprii.** Toate punctele câștigate de clienți, toate premiile roții
  zilnice și toate reducerile de rezervare imediată sunt finanțate de
  saloane sau de sponsori care aleg explicit să participe (opt-in).
- Un salon care nu a activat opt-in-ul de recompense nu apare ca sursă de
  puncte/premii pentru clienții lui.

## 2. Ranguri (progres RPG)

Rangurile (`PRODUCT_SPEC.md` §6) cresc printr-un **scor de progres**, separat
complet de soldul de puncte cheltuibile. Formula și pragurile de mai jos sunt
**(implicit, reglabil — de calibrat în timpul pilotului)**:

```
scor = (vizite_finalizate × 10)
     + (misiuni_completate × 15)
     + (recenzii_lăsate × 5)
     + (recomandări_confirmate × 25)
```

| Rang | Prag scor minim |
|---|---|
| Descoperitor | 0 |
| Inițiat | 50 |
| Cunoscător | 150 |
| Maestru | 350 |
| Campion | 700 |
| Legendă | 1500 |

Regulă fixă (nu reglabilă): **scorul de progres nu poate fi cheltuit, transferat
sau convertit în puncte.** E strict un indicator de statut.

„Misiune” = o acțiune definită de platformă sau de salon cu recompensă de
scor asociată (ex. „prima vizită la domiciliu”, „3 recenzii într-o lună”) —
catalogul de misiuni active e configurare, nu parte fixă din acest document.

## 3. Rezervare imediată următoare

- Reducere implicită: **5%** din valoarea următoarei programări.
- Plafon absolut: **maximum 10 lei** reducere, indiferent de valoarea
  programării (o programare de 300 lei primește tot 10 lei, nu 15).
- Finanțată integral de salon.
- Salonul poate **configura procentul** (inclusiv sub 5%) sau **dezactiva
  complet** acest beneficiu din panoul lui — implicit e activ la 5%/10 lei
  pentru saloanele noi.
- Oferta e valabilă o singură dată per programare finalizată (nu se
  acumulează dacă clientul nu o folosește imediat) — fereastra exactă de
  expirare e configurare per salon, cu un implicit de 30 de zile
  **(implicit, reglabil)**.

## 4. Roata zilnică

- **O rotire gratuită la fiecare 24 de ore** per cont de client.
- **Fără rotiri plătite** — nu există niciun mecanism de cumpărare a unei
  rotiri suplimentare.
- **Fără premii în bani** — premiile sunt puncte, beneficii oferite de un
  salon participant (ex. reducere, serviciu adăugat gratuit) sau produse
  sponsorizate.
- **Opt-in per salon** — un salon apare ca sursă de premiu doar dacă a
  activat explicit participarea și a definit stocul disponibil.
- **Stoc și anti-abuz, validate server-side:**
  - stocul unui premiu (ex. „10 uleiuri de barbă disponibile luna asta”) se
    verifică și se decrementează atomic pe server, niciodată doar în client;
  - eligibilitatea rotirii (a trecut cel puțin 24h de la ultima) se
    calculează server-side, pe ceasul serverului, nu pe ceasul
    dispozitivului clientului;
  - un cont de client = un telefon verificat prin OTP; nu se permit rotiri
    suplimentare prin conturi noi fără verificare de telefon unică;
  - probabilitățile de câștig per premiu sunt configurare server-side,
    niciodată expuse sau calculate în client.

## 5. Check-in pe tabletă — reguli de confidențialitate

(Comportamentul complet e în `PRODUCT_SPEC.md` §10 și `USER_FLOWS.md` §A5;
aici doar regulile care nu se negociază la implementare.)

- Ecranul public de check-in **nu interoghează și nu afișează niciodată** o
  listă de clienți — doar rezultatul unei căutări exacte (QR sau telefon).
- Modul staff (PIN) e o suprafață de acces separată, cu propriul jurnal de
  acces — nu doar un ecran ascuns în spatele aceluiași cod.

## 6. Model de business

### 6.1 Abonamente salon

| Plan | Preț | Limită calendare active |
|---|---|---|
| Solo | 69 lei/lună | 1 (profesionistul e propriul calendar) |
| Salon Start | 149 lei/lună | maximum 5 |
| Salon Growth | 249 lei/lună | maximum 12 |
| Founding | 990 lei/an | primele 10 saloane înscrise; limită de calendare = Salon Growth |

Founding e o ofertă limitată numeric (primele 10 saloane), nu limitată în
timp — odată epuizate cele 10 locuri, oferta se retrage din vânzare.

### 6.2 Comisioane și taxe per tranzacție

- **Clienți existenți ai salonului: comision zero.** Un salon care își
  aduce propria bază de clienți (ex. printr-o listă importată la
  înregistrare) nu plătește platformei comision pentru acei clienți,
  indiferent câte vizite fac.
- **Prima vizită finalizată a unui client nou pe platformă: 8 lei**, taxă
  plătită de salonul unde are loc acea vizită. „Nou pe platformă” = clientul
  nu apare în lista de clienți existenți a niciunui salon și nu are nicio
  vizită finalizată anterioară pe platformă. Mecanismul exact de potrivire
  (ex. după numărul de telefon, comparat cu lista importată de salon) e o
  decizie de implementare, nu de business — regula fixă e că taxa se aplică
  o singură dată per client, la prima lui vizită finalizată oriunde pe
  platformă.
- **Boost:** 15 lei per campanie activată de profesionist/salon.
- **Client Plus:** 24,90 lei/lună — **activare ulterioară pilotului**, nu în
  timpul lansării inițiale.
- **Comision magazin de produse:** țintă 10% din valoarea vânzării —
  **activare ulterioară**, nu în timpul lansării inițiale.
- **Buget de publicitate plătită în timpul pilotului: zero.** Nicio
  campanie plătită (social, search) nu se lansează înainte de finalul
  pilotului descris în `IMPLEMENTATION_PLAN.md`.

### 6.3 Etichete CRM client (§B5 din `USER_FLOWS.md`)

Calculate din tiparul real de vizite, nu setate manual — praguri
**(implicit, reglabil)**:

| Etichetă | Regulă |
|---|---|
| Nou | 0 vizite finalizate |
| Fidel | 2–7 vizite finalizate, ultima vizită în ultimele 45 de zile |
| VIP | 8+ vizite finalizate |
| În risc | ultima vizită cu peste 45 de zile în urmă, indiferent de numărul total de vizite |

## 7. Pilot

Obiective și limite explicite pentru prima lansare reală, detaliate ca plan
de execuție în `IMPLEMENTATION_PLAN.md` §Pilot:

- Start: **4MEN Lujerului** ca prim salon activ.
- Prag de validare tehnică: **20 de rezervări fără erori** înainte de a
  extinde la alte saloane.
- Extindere: **10 saloane fondatoare în Sectorul 6**.
- Achiziție: invitarea a aproximativ **750 de clienți existenți** (ai
  salonului/salonelor pilot).
- Vânzare anticipată: **5 abonamente Founding** pre-vândute înainte de
  finalul pilotului.
- **Nicio recompensă finanțată necontrolat din bugetul platformei** — orice
  recompensă activă în pilot trece prin regulile de opt-in și finanțare de
  la §1.2 și §4.
