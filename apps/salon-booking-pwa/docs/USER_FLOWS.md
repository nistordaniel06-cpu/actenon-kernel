# Fluxuri utilizator

> Fiecare flux de mai jos e scris ca o secvență de ecrane/stări, nu ca
> specificație tehnică. Regulile numerice (limite, procente, praguri) sunt
> normative în [`BUSINESS_RULES.md`](./BUSINESS_RULES.md) — aici sunt doar
> referite.

## A. Fluxuri client

### A1. Autentificare și onboarding

1. Ecran de bun venit — promisiunea centrală vizibilă („Programezi. Faci
   check-in. Câștigi.”).
2. Autentificare cu număr de telefon → cod OTP.
3. Prim-utilizator: 2–3 ecrane scurte de preferințe (oraș/sector, tip de
   serviciu căutat) — opționale, se pot sări.
4. Cerere de permisiune locație, cu explicație clară a beneficiului
   („ca să-ți arătăm profesioniștii din apropiere”) — refuzul nu blochează
   aplicația, doar dezactivează harta/sortarea după distanță.
5. Aterizare pe ecranul principal (Descoperă).

### A2. Descoperire

Trei moduri de descoperire, toate accesibile din ecranul principal:

- **Căutare** — text liber, după nume salon/profesionist/serviciu.
- **Hartă** — pini cu preț aproximativ, tap → mini-card cu „Rezervă”.
- **Feed de inspirație** — derulare verticală de look-uri; fiecare postare
  are inimă (reacție) și buton „Rezervă acest look”.

Secțiunea **„Disponibil acum”** e vizibilă din ecranul principal (nu ascunsă
într-un filtru) — listă orizontală sau card dedicat cu profesioniști care au
un slot liber în următoarea oră.

### A3. Rezervare (maximum 3 pași principali)

1. **Pasul 1 — Serviciu.** Alege salonul/profesionistul (dacă nu a venit deja
   dintr-un context, ex. „Rezervă acest look”), apoi serviciul. Aici se
   alege și „la salon” vs. „la domiciliu”, dacă opțiunea e activă pentru
   acel profesionist.
2. **Pasul 2 — Oră.** Sloturi disponibile, grupate pe zi; dacă a ales „la
   domiciliu”, se cere adresa/raza aici, nu într-un pas separat.
3. **Pasul 3 — Confirmare.** Rezumat (serviciu, preț, oră, adresă dacă e
   cazul), metodă de plată, opțiunea de a folosi puncte de recompensă (până
   la plafonul permis — vezi `BUSINESS_RULES.md`), buton final de
   confirmare.

Rezultat: programare creată, vizibilă instant în „Programările mele” a
clientului și în calendarul profesionistului.

### A4. Gestionarea programărilor

- **Programările mele** — listă viitoare (sus) și istoric (jos).
- **Anulare** — din cardul programării, cu confirmare într-un bottom sheet;
  politica de anulare (ex. „gratuit până la 2h înainte”) e afișată explicit
  înainte de confirmare.
- **Reprogramare** — redeschide pasul 2 (alegere oră) cu serviciul deja
  fixat, fără a trece din nou prin pasul 1.

### A5. Ziua programării — check-in

1. Clientul ajunge la salon (sau, pentru domiciliu, profesionistul ajunge la
   client — nu există „check-in” pe tabletă pentru serviciul la domiciliu;
   confirmarea sosirii se face din partea profesionistului, din aplicația
   lui).
2. La salon: clientul se identifică la tabletă prin **cod QR** (din
   aplicație) sau prin **numărul de telefon**.
3. Tableta confirmă programarea găsită și arată o estimare a timpului de
   așteptare.
4. Profesionistul primește notificare că a sosit clientul.
5. Profesionistul marchează, din propria aplicație: sosit → început →
   finalizat (sau neprezentare, dacă e cazul).

### A6. După finalizare

Ecran unic, afișat imediat ce profesionistul marchează serviciul finalizat
(pe telefonul clientului, dacă a fost legat de programare):

1. Recompensă câștigată (puncte) — afișată clar, cu suma exactă.
2. Invitație la recenzie verificată (posibilă doar acum, doar pentru această
   programare).
3. Ofertă de rezervare imediată următoare, cu reducerea finanțată de salon
   deja aplicată — un singur buton „Rezervă din nou”.

### A7. Recenzie verificată

- Formular scurt: rating (stele), comentariu opțional, tag-uri rapide
  (ex. „punctual”, „curat”, „recomand”).
- Trimiterea recenziei acordă recompensa fixă de recenzie, indiferent de
  rating.
- Recenzia apare marcată „verificată” pe profilul salonului/profesionistului
  — nu există recenzii nemarcate/anonime în acest produs.

### A8. Portofel de recompense

- Sold curent, în puncte.
- Istoric: câștiguri (vizite, recenzii, roata zilnică, referral) și
  cheltuieli (folosite la o programare).
- Progres de rang afișat separat de sold (bară de progres către rangul
  următor) — vizual distinct, ca să nu se confunde cu soldul cheltuibil.

### A9. Roata zilnică

1. Buton „Rotește” disponibil o dată la 24h; dacă a fost deja folosit,
   butonul arată numărătoarea inversă până la resetare.
2. Animație de rotire, oprire pe premiul câștigat.
3. Premiul se adaugă automat în portofel (puncte) sau apare ca beneficiu
   activabil (produs sponsorizat, reducere de la un salon participant).

### A10. Referral

1. Clientul distribuie un cod/link personal.
2. Prietenul invitat se înregistrează prin acel link.
3. Recompensa de recomandare se acordă **doar** după ce prietenul invitat
   finalizează prima programare (nu la simpla înregistrare) — descurajează
   abuzul de conturi false.

### A11. Client Plus (post-pilot)

Ecran de upgrade, accesibil din Profil — beneficiile exacte și prețul sunt
în `BUSINESS_RULES.md`. Nu e activ în timpul pilotului.

### A12. Magazin de produse (post-pilot)

Listă simplă de produse, filtrabile pe categorie, cu preț membru afișat
lângă preț normal — vezi `PRODUCT_SPEC.md` §4.20. Comisionul de platformă e
în `BUSINESS_RULES.md`.

## B. Fluxuri profesionist / salon

### B1. Dashboard zilnic

La deschiderea aplicației: programările zilei, venitul estimat, gradul de
ocupare, alerte (ex. „ai 2 sloturi libere azi după-amiază”). Fără cifre
suplimentare care nu cer o acțiune — un dashboard aglomerat contrazice
`DESIGN_SYSTEM.md` §7.

### B2. Calendar

- Vedere zilnică (implicit) și săptămânală.
- Pentru administrator de salon: vedere agregată pe toți profesioniștii din
  echipă, coloană per profesionist.
- Tap pe o programare → detalii + acțiuni (check-in manual, reprogramare,
  anulare, notă internă).

### B3. Last-minute Boost

1. Profesionistul selectează un slot liber, eliberat recent (ex. o
   anulare).
2. Alege reducerea și raza de promovare.
3. Boost-ul devine vizibil clienților din zonă în secțiunea „Disponibil
   acum” / „Oferte de ultim moment”.
4. Costul Boost-ului pentru profesionist e în `BUSINESS_RULES.md`.

### B4. Publicare în feed + Smart Promote

1. Profesionistul încarcă o fotografie (look finalizat), adaugă serviciul
   asociat.
2. Postarea apare în feed-ul clienților care urmăresc/sunt în apropierea
   salonului.
3. **Smart Promote** sugerează, pe bază de reguli (nu AI generativ în MVP):
   cel mai bun moment din zi pentru a publica, sau dacă postarea ar trebui
   însoțită de un Boost pe un slot liber.

### B5. CRM clienți

- Listă de clienți cu etichetă calculată (nou / fidel / VIP / în risc) din
  tiparul real de vizite (vezi `BUSINESS_RULES.md` pentru pragurile
  exacte).
- Fișă client: istoric vizite, notă internă (vizibilă doar echipei),
  serviciul preferat.

### B6. Check-in tabletă — mod staff

- Ecranul public de check-in (§A5) nu are acces la funcții administrative.
- Modul staff se deschide printr-un gest/buton discret + **PIN** — separat
  de contul individual al fiecărui profesionist, gândit pentru o tabletă
  comună la recepție.
- Din modul staff: căutare manuală a unei programări, check-in manual,
  editare rapidă.

### B7. Opt-in recompense/giveaway

- Salonul alege explicit dacă participă la roata zilnică (și cu ce
  premii/stoc) și dacă organizează un giveaway propriu.
- Fără opt-in, salonul nu apare ca sursă de premii — clientul nu vede
  niciodată un premiu „fantomă” de la un salon neparticipant.

### B8. Inventar produse (post-pilot)

Listă de produse cu stoc; scăderea stocului la fiecare vânzare prin magazin.

### B9. Analitice

Venituri (zi/săptămână/lună), grad de ocupare, clienți noi vs. recurenți,
performanța campaniilor Boost (sloturi umplute / cost). Fără metrici
suplimentare fără o decizie clară pe care o susțin.

### B10. Conectare calendar extern

- **Google Calendar** — autorizare OAuth, sincronizare bidirecțională:
  o programare nouă în aplicație apare în Google Calendar și invers (blocaj
  de interval, nu creare de programare din Google).
- **Apple Calendar** — prin fișier/link `.ics`; profesionistul se abonează
  o singură dată, actualizările ulterioare apar automat dacă clientul de
  calendar suportă abonare live, altfel prin re-export.

## C. Fluxuri administrative (abonament)

### C1. Alegerea planului

La înregistrarea unui salon: alegere plan (Solo / Salon Start / Salon
Growth / Founding, dacă e disponibil) — vezi `BUSINESS_RULES.md` pentru
prețuri și limite. Upgrade/downgrade posibil oricând; limita de calendare
active a planului se aplică imediat.

### C2. Facturare

Facturare lunară (sau anuală pentru Founding), fără pași suplimentari în
acest document — detaliile de procesare a plății se stabilesc la
implementare, nu sunt parte din fluxul de produs.
