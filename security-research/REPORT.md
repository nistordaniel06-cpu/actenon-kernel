# Vulnerability Report — actenon-kernel `BoundaryVerifier` Authentication Bypass

| | |
|---|---|
| **Target** | `nistordaniel06-cpu/actenon-kernel` |
| **Commit reviewed** | `43e17adf17be4cb04fbc7bcf528f3427c5805f13` |
| **File** | `actenon/boundary/__init__.py` |
| **Class / method** | `BoundaryVerifier.verify_boundary()` |
| **CWE** | CWE-306 (Missing Authentication for Critical Function) / CWE-287 (Improper Authentication) |
| **Severity** | **Critical** — full authentication bypass on the component the project documents as the resource-boundary trust gate for consequential actions (payments, refunds, deletes) |
| **Status** | Confirmed with a working PoC (`exploit_boundary_verifier.py` in this folder) |

---

## 1. Summary

`actenon-kernel` is a proof-verification library for gating consequential
agent actions behind a signed capability proof (a "PCCB"). The README
documents two supported integration placements:

- **Placement A** — verification inside the agent framework's tool call.
- **Placement B** — verification independently at the resource boundary
  (a FastAPI/Express/Go handler), via `BoundaryVerifier`. The README states:
  > "any caller ... must present a valid PCCB to cause a side effect,
  > regardless of how it got there."

`BoundaryVerifier.verify_boundary()` does not implement this. The only
check performed on the caller-supplied `proof_token` is a length check
(`len(proof_token) >= 16`). No signature is verified, no expiry is
checked, and none of the fields on `BoundaryVerificationRequest`
(`action_type`, `action_hash`, `audience`, `boundary_id`, `target`) are
bound to anything cryptographic. Any string of 16+ arbitrary bytes is
treated as a valid, verified proof and a success receipt is minted for it.

Critically, this holds **even when a real `PCCBVerifier` is passed in**
via `BoundaryVerifier(pccb_verifier=...)` — the constructor stores it,
but `verify_boundary()` never calls it (the call site is a literal
`pass` under a comment reading "Full PCCB verification would go here").

## 2. Root cause (code)

```python
# actenon/boundary/__init__.py

def verify_boundary(self, request: BoundaryVerificationRequest) -> BoundaryVerificationResult:
    if not request.proof_token:
        return BoundaryVerificationResult.failure("no proof token provided", "PROOF_MISSING")

    if len(request.proof_token) < 16:                     # <-- the entire "verification"
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
            pass                                            # <-- real verifier is never invoked
        except ProofVerificationError as e:
            ...

    self._replay_keys.add(proof_id)
    return BoundaryVerificationResult.success(proof_id=proof_id, receipt_id=f"rcpt_{uuid4().hex[:16]}")
```

The project's own unit test suite (`tests/unit/test_boundary_verifier.py`)
bakes this in as *expected* behavior — its "valid" fixture is
`proof_token="valid_proof_token_at_least_16_chars"`, which is plain text,
not a signed proof, and the test asserts it verifies successfully. So the
gap isn't a one-off oversight caught in isolation; the test suite treats
"any long-enough string" as correct behavior for a "valid proof."

No disclaimer ("stub", "not implemented", "demo only") appears next to
this code path in the README's usage example (`## Use as a boundary
verifier (Boundary Kit, resource-owned mode)`), so a reader has no signal
that this specific class doesn't do what its docstring says it does.

## 3. Impact

Any deployment that wires `BoundaryVerifier` directly into a resource
endpoint — exactly the pattern shown in the README and in
`docs/`/`examples/` references to "Placement B" / the "Boundary Kit" — has
**no cryptographic authentication at that boundary**. Concretely:

- An attacker with no key, no grant, and no prior interaction with the
  issuer can submit any `payment.refund`, `data.export`, or other
  protected action with an arbitrary 16+ byte string as `proof_token` and
  receive `valid=True` plus a minted receipt.
- `action_hash`, `audience`, and `target` on the request are accepted
  as-is and never checked against anything, so nothing prevents an
  attacker from claiming any action shape they like. `construct_receipt()`
  only serializes `action_hash` (truncated to 16 chars) and `boundary_id`/
  `action_type` into the receipt — `audience` and `target` are accepted
  but not persisted anywhere, so a forged receipt carries even less
  forensic evidence of the claimed action than the request itself did.
- Replay protection (`self._replay_keys`) only prevents *reusing the
  identical token*; a fresh random token bypasses it trivially and
  passes as a "different" proof (see PoC step [1], and
  `test_different_proofs_both_verify` in the existing test suite).

This directly contradicts the project's own threat model
(`docs/THREAT_MODEL.md`) and the "no receipt, no side effect" guarantee
that is the entire premise of the kernel.

## 4. Proof of Concept

See `exploit_boundary_verifier.py` in this folder. Three demonstrations:

1. **Naive bypass** — a `BoundaryVerifier()` with no verifier attached
   accepts a forged, unsigned token and mints a success receipt for a
   `payment.refund` action to an attacker-controlled account.
2. **Bypass persists with a real verifier attached** — constructing
   `BoundaryVerifier(pccb_verifier=<correctly configured PCCBVerifier>)`
   changes nothing; the forged token still verifies, proving the real
   verifier is dead code on this path.
3. **Contrast** — the same forged input handed to the kernel's actual
   verification path (`PCCB.from_dict` / `PCCBVerifier`) is correctly
   rejected, showing the bypass is isolated to `BoundaryVerifier` and not
   a weakness in the core cryptographic verifier itself. This contrast
   holds for `ActenonGate` and for `ProtectedExecutor`'s normal,
   non-idempotent verification path — it does **not** extend to
   `ProtectedExecutor`'s idempotency short-circuit, which is a separate
   confirmed finding: for a repeated `operation_id` with a matching
   `action_hash`, `execute()` returns success from cached state *before*
   calling `proof_verifier.verify()` at all, so an unsigned PCCB is
   accepted on that path (see `investigate_idempotency_order.py` and
   `investigate_unbounded_receipts.py`).

Run:

```bash
python3 -m venv venv && source venv/bin/activate
pip install -e /path/to/actenon-kernel
python3 exploit_boundary_verifier.py
```

Output confirms `result.valid = True` for a plainly forged token in both
scenario 1 and 2.

## 5. Suggested fix direction (not applied — left as-is per repo owner's request for a CTF attack/defense exercise)

`verify_boundary()` should, when a `proof_token` is present:

1. Decode it into a `PCCB` (base64url → JSON → `PCCB.from_dict`), failing
   closed on any parse error.
2. Call `self._pccb_verifier.verify(intent, pccb, context)` and only
   return `success(...)` if it does not raise.
3. Only fall back to a "no verifier configured" refusal
   (`PCCB_VERIFIER_NOT_CONFIGURED`, fail-closed) when `_pccb_verifier is
   None` — never treat "no verifier" as "any token passes."

**Note on step 2's `ActionIntent`:** `PCCBVerifier.verify()` needs the
*canonical* `ActionIntent` — the same `intent_id`, `tenant`, `requester`,
full action `parameters`, `target`, and issuance/expiry timestamps that
were hashed into `action_hash` at mint time (see `build_action_hash_input`
in `actenon/proof/service.py`). `BoundaryVerificationRequest` as it exists
today only carries a caller-provided digest and a few loose string fields
(`action_type`, `audience` as strings, `boundary_id`) — not enough to
reconstruct that intent. Fabricating the missing fields would let a
verifier accept a proof for a different actual operation than the one
being fabricated around it; copying them from the untrusted request would
not bind the proof to anything the resource itself decided. A real fix
therefore also needs to extend `BoundaryVerificationRequest` (or whatever
calls into `verify_boundary()`) to carry or locally construct the
canonical intent and context — the same way the repository's own
reference verifier endpoint (`actenon/verifier/endpoint.py`) does it —
not just decode the token and call `.verify()` in isolation.

The in-memory `_replay_keys` set should also be replaced with (or backed
by) the same durable `ReplayStore` the `ProtectedExecutor` path uses, so
replay state isn't lost on process restart and isn't per-instance.

## 6. Scope note

The rest of the kernel that was reviewed (`PCCBVerifier` / `proof/service.py`,
`HmacSha256Signer`, `ReplayProtector` / `replay/service.py`, `ActenonGate`
in `gate.py`, the MCP server in `mcp_server.py`) correctly performs
cryptographic verification, uses `hmac.compare_digest` for constant-time
comparison, fails closed on replay-store errors, and fails closed on
`LOCAL_DEBUG`/local-HMAC-signer construction in production-like
environments. The issue identified here is isolated to
`BoundaryVerifier`.
