# Sistemul de design

> Direcția vizuală: senzație premium, nativă iOS. Inspirată din imaginile din
> [`docs/references/`](./references/) — **acel director e gol la momentul
> scrierii acestui document; primele imagini de referință trebuie adăugate
> înainte de a începe implementarea vizuală** (vezi nota din
> [`DECISIONS.md`](./DECISIONS.md)). Până atunci, acest document e sursa de
> adevăr pentru paletă, tipologie și componente.

## 1. Principii

- **Simplu înainte de bogat.** Un ecran client nu trebuie să arate ca un
  dashboard. Dacă un ecran client începe să semene cu un panou de control
  (multe carduri mici, multe cifre), e semn că informația trebuie mutată în
  profunzime (al doilea ecran), nu comprimată pe primul.
- **Alb generos.** Spațiere generoasă în jurul elementelor cheie — un ecran
  aglomerat contrazice senzația premium, indiferent cât de corectă e paleta.
- **Fără gradient ieftin.** Culoarea de accent (verde lime) se folosește
  plată, pe suprafețe mici (butoane, bagde, indicatori) — nu ca fundal de
  gradient pe carduri sau ecrane întregi.
- **Iconițe, nu emoji.** Lucide Icons peste tot unde e nevoie de o
  pictogramă în UI. Emoji apar doar în conținut generat de utilizator
  (ex. text liber al unei recenzii), niciodată în interfața de sistem.
- **Inimi, nu like-uri generice.** Reacția socială din feed și de pe
  profiluri e o inimă (plină/goală), nu un deget în sus, nu un emoji
  variabil. Stelele rămân rezervate exclusiv pentru rating-ul de recenzie
  verificată — cele două sisteme nu se amestecă vizual.
- **Tot ce vede utilizatorul e în română.** Fără excepții pentru texte de
  sistem (butoane, erori, notificări push, e-mailuri tranzacționale).

## 2. Paletă de culori

Valori de bază (aproximative, ajustabile cu ±5% luminozitate la nevoie de
contrast, dar nu schimbate ca familie de culoare):

| Token | Hex | Rol |
|---|---|---|
| `--ink` | `#0B0D0C` | fundal principal, text pe suprafețe deschise |
| `--accent` | `#76C93B` | verde lime — acțiune primară, stare activă, accent |
| `--accent-tint` | `#EAF6DF` | fundal verde foarte deschis — bagde, stări "soft", highlight discret |
| `--paper` | `#F8F9F6` | fundal aproape alb — suprafața cardurilor pe ecrane deschise |

Reguli de folosire:

- Fundalul implicit al aplicației client e **deschis** (`--paper` /
  `--ink` ca text), nu întunecat — spre deosebire de un dashboard
  profesionist, care poate folosi suprafețe mai închise pentru densitate de
  informație. Dacă produsul adoptă un mod întunecat mai târziu, el se
  documentează separat aici, nu se amestecă implicit.
- `--accent` e rezervat acțiunii principale de pe ecran (un singur buton
  „primary” vizibil per ecran, de regulă) și indicatorilor de stare activă
  (ex. „Disponibil acum”, tab selectat, progres de rang).
- `--accent-tint` e fundalul standard pentru bagde, chip-uri de filtru
  neselectate cu conotație pozitivă, și carduri de recompensă — niciodată
  fundal de buton principal (contrastul e insuficient pentru text alb).
- Nu se introduc culori de accent secundare (ex. albastru, portocaliu)
  pentru acțiuni de sistem. Stările semantice (eroare, avertisment) au
  culori proprii, separate de accent, definite când apare primul ecran care
  are nevoie de ele — nu presupuse în avans.

## 3. Tipografie

- Un singur font sans-serif de sistem/aproape-de-sistem (ex. SF Pro pe iOS,
  cu fallback la un sans-serif geometric similar pe web) — nu o pereche de
  fonturi display + text ca într-un site de marketing. Produsul e o
  aplicație, nu o pagină editorială.
- Scară de mărimi limitată: titlu de ecran, titlu de secțiune, corp de text,
  etichetă mică (caption). Patru trepte sunt suficiente; a introduce a cincea
  treaptă e un semn că ecranul are prea multă ierarhie.
- Titlurile de ecran au greutate semi-bold/bold; corpul de text e regular.
  Etichetele mici (ex. "Preț membru", "Verificat") sunt uppercase, cu spațiere
  de literă ușor mărită, greutate medium.

## 4. Formă și spațiere

- **Colțuri rotunjite 18–24px** pe toate cardurile principale (carduri de
  salon, carduri de programare, carduri de recompensă). Elementele mici din
  interiorul unui card (bagde, chip-uri, avatare) pot avea rotunjire proprie,
  mai mică sau complet circulară.
- **Safe areas iOS** respectate peste tot: niciun element interactiv sau text
  esențial nu se poziționează în zona de notch/dynamic island sus, sau în
  zona home-indicator jos. Padding-ul de bază al ecranului pornește de la
  safe area, nu de la marginea fizică a ecranului.
- **Bottom sheets în stil Uber** pentru orice acțiune contextuală care nu
  merită un ecran nou: alegerea unui slot orar, detaliile unei programări,
  confirmarea unei acțiuni (anulare, oprire campanie). Un bottom sheet se
  deschide de jos, ocupă strict cât are nevoie de conținut, și se poate
  închide prin tragere în jos sau prin butonul de închidere.
- Spațiere pe grilă de 4px; distanțele standard între secțiuni sunt 16px,
  24px sau 32px — nu valori arbitrare intermediare.

## 5. Componente cheie

| Componentă | Notă |
|---|---|
| Card de salon/profesionist | imagine copertă, nume, rating (stele), distanță, bagde de disponibilitate |
| Card de postare din feed | imagine, autor (salon/profesionist), inimă + număr, buton "Rezervă acest look" |
| Chip de filtru | stare selectată = fundal `--accent`, text pe `--ink`; neselectată = contur subțire, fundal `--paper` |
| Buton primary | fundal `--accent`, text `--ink` (contrast suficient pe verde lime deschis — nu alb) |
| Bagdă de recompensă | fundal `--accent-tint`, text `--ink` |
| Indicator "Disponibil acum" | punct plin `--accent` + text, niciodată doar culoare fără text (accesibilitate) |
| Roata zilnică | componentă circulară, animație de rotire cu oprire pe premiul câștigat — nu o listă simplă de premii |
| Kiosk de check-in | tipografie mărită (citire de la distanță pe tabletă), un singur câmp de input vizibil odată, fără elemente administrative pe ecranul public |

## 6. Iconografie

- Set unic: **Lucide Icons**, greutate `stroke` consistentă (nu se amestecă
  icoane pline cu icoane outline în același ecran, cu excepția stării
  active/inactive a aceleiași icoane — ex. inimă goală vs. plină).
- Dimensiuni standard: 16px (etichete inline), 20px (butoane secundare),
  24px (navigare principală).

## 7. Ce evităm explicit

- dashboard client aglomerat (asta e treaba profesionistului, nu a
  clientului — vezi `PRODUCT_SPEC.md` §4 vs §5);
- gradient-uri ieftine (verde-spre-altă-culoare pe fundaluri mari);
- emoji în locul iconițelor de sistem;
- text vizibil în altă limbă decât română (inclusiv texte de eroare,
  placeholder-e, notificări);
- like-uri generice sau reacții multiple pentru feed — o singură reacție
  (inimă), simplă și consistentă.
