# Raport de vulnerabilitate — Bypass de autentificare în `BoundaryVerifier` (actenon-kernel)

| | |
|---|---|
| **Țintă** | `nistordaniel06-cpu/actenon-kernel` |
| **Commit analizat** | `43e17adf17be4cb04fbc7bcf528f3427c5805f13` |
| **Fișier** | `actenon/boundary/__init__.py` |
| **Clasă / metodă** | `BoundaryVerifier.verify_boundary()` |
| **CWE** | CWE-306 (Missing Authentication for Critical Function) / CWE-287 (Improper Authentication) |
| **Severitate** | **Critică** — bypass complet de autentificare pe componenta pe care proiectul o documentează drept "poarta de încredere" la marginea resursei, pentru acțiuni consecvente (plăți, rambursări, ștergeri) |
| **Status** | Confirmat, cu PoC funcțional (`exploit_boundary_verifier.py`, în același folder) |

---

## 1. Rezumat

`actenon-kernel` este o librărie de verificare a unor "proof"-uri criptografice, folosită pentru a bloca acțiuni consecvente executate de agenți AI (ex. rambursări) în spatele unei dovezi semnate (numită "PCCB"). README-ul documentează două moduri de integrare:

- **Placement A** — verificarea are loc în interiorul tool-ului agentului.
- **Placement B** — verificarea are loc independent, la marginea resursei (un handler FastAPI/Express/Go), prin `BoundaryVerifier`. README-ul afirmă explicit:
  > "orice apelant ... trebuie să prezinte un PCCB valid ca să producă un efect, indiferent cum a ajuns acolo."

`BoundaryVerifier.verify_boundary()` nu implementează de fapt acest lucru. Singura verificare reală făcută asupra `proof_token`-ului trimis de apelant este o verificare de lungime (`len(proof_token) >= 16`). Nu se verifică nicio semnătură, nu se verifică expirarea, și niciunul dintre câmpurile din `BoundaryVerificationRequest` (`action_type`, `action_hash`, `audience`, `boundary_id`, `target`) nu este legat de ceva criptografic. Orice șir de minimum 16 caractere arbitrare este tratat ca o dovadă validă, verificată, iar pentru el se emite un "receipt" de succes.

Cel mai grav aspect: acest lucru se întâmplă **chiar și atunci când se atașează un `PCCBVerifier` real**, prin `BoundaryVerifier(pccb_verifier=...)` — constructorul îl reține, dar `verify_boundary()` nu îl apelează niciodată (linia respectivă e literalmente `pass`, sub un comentariu care spune "Full PCCB verification would go here").

## 2. Cauza (codul sursă)

```python
# actenon/boundary/__init__.py

def verify_boundary(self, request: BoundaryVerificationRequest) -> BoundaryVerificationResult:
    if not request.proof_token:
        return BoundaryVerificationResult.failure("no proof token provided", "PROOF_MISSING")

    if len(request.proof_token) < 16:                     # <-- asta e toată "verificarea"
        return BoundaryVerificationResult.failure("proof token too short (malformed)", "PROOF_INVALID")

    proof_id = f"proof_{hashlib.sha256(request.proof_token.encode()).hexdigest()[:16]}"

    if proof_id in self._replay_keys:
        return BoundaryVerificationResult.failure("replay detected...", "REPLAY_DETECTED")

    if self._pccb_verifier is not None:
        try:
            # Full PCCB verification would go here.
            # For now, the verifier is configured but the token
            # format is not yet PCCB (it's a raw token). The
            # structural check above is the gate.
            pass                                            # <-- verificatorul real nu e apelat niciodată
        except ProofVerificationError as e:
            ...

    self._replay_keys.add(proof_id)
    return BoundaryVerificationResult.success(proof_id=proof_id, receipt_id=f"rcpt_{uuid4().hex[:16]}")
```

Chiar suita de teste a proiectului (`tests/unit/test_boundary_verifier.py`) consfințește acest comportament ca fiind cel *așteptat* — fixture-ul ei "valid" este `proof_token="valid_proof_token_at_least_16_chars"`, adică text simplu, nu o dovadă semnată, iar testul verifică explicit că trece cu succes. Deci nu e o scăpare izolată prinsă din greșeală — suita de teste tratează "orice string suficient de lung" ca fiind comportamentul corect pentru o "dovadă validă".

Nu există niciun avertisment ("stub", "neimplementat", "doar pentru demo") lângă acest cod în exemplul de utilizare din README (`## Use as a boundary verifier (Boundary Kit, resource-owned mode)`), deci un cititor nu are niciun semnal că această clasă anume nu face ceea ce spune docstring-ul ei.

## 3. Impact

Orice implementare care conectează `BoundaryVerifier` direct la un endpoint de resurse — exact tiparul arătat în README și în referințele la "Placement B" / "Boundary Kit" — **nu are nicio autentificare criptografică la acea graniță**. Concret:

- Un atacator fără nicio cheie, fără niciun grant și fără nicio interacțiune anterioară cu emitentul poate trimite orice acțiune protejată (`payment.refund`, `data.export` etc.) cu un `proof_token` arbitrar de 16+ caractere și primește `valid=True` plus un "receipt" emis.
- Câmpurile `action_hash`, `audience` și `target` din cerere sunt acceptate ca atare și nu sunt verificate niciodată față de nimic, deci nimic nu împiedică un atacator să declare orice formă de acțiune dorește. `construct_receipt()` serializează în receipt doar `action_hash` (trunchiat la 16 caractere) și `boundary_id`/`action_type` — `audience` și `target` sunt acceptate, dar nu sunt păstrate nicăieri, așa că un receipt forjat conține chiar mai puține dovezi criminalistice despre acțiunea revendicată decât cererea în sine.
- Protecția anti-replay (`self._replay_keys`) previne doar *reutilizarea aceluiași token identic*; un token nou, aleatoriu, ocolește trivial acest lucru și trece drept o dovadă "diferită" (vezi pasul [1] din PoC, și testul existent `test_different_proofs_both_verify`).

Acest lucru contrazice direct modelul de amenințări al proiectului (`docs/THREAT_MODEL.md`) și garanția "fără receipt, fără efect" care este chiar premisa fundamentală a kernel-ului.

## 4. Proof of Concept

Vezi `exploit_boundary_verifier.py` din același folder. Trei demonstrații:

1. **Bypass simplu** — un `BoundaryVerifier()` fără niciun verificator atașat acceptă un token falsificat, nesemnat, și emite un receipt de succes pentru o acțiune `payment.refund` către un cont controlat de atacator.
2. **Bypass-ul persistă chiar cu verificator real atașat** — construirea `BoundaryVerifier(pccb_verifier=<PCCBVerifier configurat corect>)` nu schimbă nimic; token-ul falsificat tot trece verificarea, ceea ce dovedește că verificatorul real este cod mort pe acest traseu.
3. **Contrast** — aceeași intrare falsificată, trimisă către traseul real de verificare al kernel-ului (`PCCB.from_dict` / `PCCBVerifier`), este respinsă corect, ceea ce arată că bypass-ul este izolat la `BoundaryVerifier` și nu e o slăbiciune a verificatorului criptografic de bază sau a `ActenonGate` / `ProtectedExecutor` (care chiar apelează verificatorul real, corect).

Rulare:

```bash
python3 -m venv venv && source venv/bin/activate
pip install -e /calea/catre/actenon-kernel
python3 exploit_boundary_verifier.py
```

Output-ul confirmă `result.valid = True` pentru un token clar falsificat, atât în scenariul 1, cât și în 2.

## 5. Direcție de remediere sugerată (neaplicată — lăsată intenționat așa, la cererea proprietărului repo-ului, pentru un exercițiu attack/defense de concurs)

`verify_boundary()` ar trebui, atunci când există un `proof_token`, să:

1. Îl decodeze într-un `PCCB` (base64url → JSON → `PCCB.from_dict`), eșuând închis (fail-closed) la orice eroare de parsare.
2. Construiască `ActionIntent`/`DynamicContextInput` corespunzător din câmpurile cererii (`action_type`, `action_hash`, `audience`, `boundary_id`, `target`).
3. Apeleze `self._pccb_verifier.verify(intent, pccb, context)` și returneze `success(...)` doar dacă nu aruncă excepție.
4. Să cadă pe un refuz "verificator neconfigurat" (`PCCB_VERIFIER_NOT_CONFIGURED`, fail-closed) doar când `_pccb_verifier is None` — niciodată să trateze "fără verificator" ca "orice token trece".

Setul în memorie `_replay_keys` ar trebui de asemenea înlocuit cu (sau susținut de) același `ReplayStore` durabil folosit de traseul `ProtectedExecutor`, ca starea de replay să nu se piardă la restart și să nu fie per-instanță.

## 6. Notă de scop

Restul kernel-ului analizat (`PCCBVerifier` / `proof/service.py`, `HmacSha256Signer`, `ReplayProtector` / `replay/service.py`, `ActenonGate` din `gate.py`, serverul MCP din `mcp_server.py`, `WellKnownKeySignatureVerifier` cu protecțiile lui anti-SSRF, `verify_countersignature`, `verify_issuer_status`, `verify_approval_artifact`) efectuează corect verificarea criptografică, folosește `hmac.compare_digest` pentru comparație în timp constant, eșuează închis la erori ale replay-store-ului și eșuează închis la construirea semnatarului local HMAC / mod `LOCAL_DEBUG` în medii de tip producție. Problema identificată aici este izolată la `BoundaryVerifier`.
