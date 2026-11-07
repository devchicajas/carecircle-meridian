# CareCircle invitation & Care Circle connection flow

## Root cause (invite redeem failure)

Caregiver accounts still referenced **stale Meridian IDs** (`CG-001` / `CG-002`) after the tenant moved to UUID business IDs. Redeem created a Care Circle Membership with `caregiver: CG-001`, Meridian rejected the reference (`reference.exists`), and the UI showed a generic failure.

Secondary bug: status checks used `/active/i`, which **matches `Inactive`**, so approval skipped the PATCH to `Active` and left memberships Inactive while still reporting success.

## Fix summary

1. **Durable invites + connection requests** in SQLite (`patient_invites`, `connection_requests`) — not React state / localStorage.
2. **Redeem** re-links the caregiver via `ensureLiveCaregiverProfile` (reuse live row by id/email or create Family Caregiver).
3. Creates Meridian membership as **`Inactive`** (Meridian enum is Active | Inactive only — no Pending).
4. Persists a **`pending_approval` connection request**; caregiver sees awaiting approval.
5. Patient owner (or Active Care Coordinator) **approves** → server PATCH membership to **Active** → read-back confirms → My Loved Ones unlocks.
6. **`isActiveStatus()`** requires exact `Active` (never matches `Inactive`).
7. Patient detail API enforces **authorized access** (404 when unauthorized so existence is not leaked).
8. Distinct EN/ES messages in `src/lib/i18n/invite-messages.ts`.

## E2E results (`npm run test:invite-flow`)

| # | Test | Result |
|---|------|--------|
| 1 | Patient creates invitation | PASS |
| 2 | Invitation survives browser refresh | PASS |
| 2b | Invitation durable in SQLite | PASS |
| 3 | Caregiver enters correct code | PASS |
| 4 | Invalid codes fail safely | PASS |
| 5 | Expired codes fail safely | PASS |
| 6 | Duplicate redemption cannot create duplicate memberships | PASS |
| 7 | Connection request persists | PASS |
| 8 | Patient/owner approval succeeds | PASS |
| 9 | Meridian saves Active membership | PASS |
| 10 | Caregiver sees Patient under My Loved Ones | PASS |
| 11 | Caregiver cannot view unrelated Patients | PASS |
| 12 | Care Plans/Meds/Tasks per permissions | PASS |
| 13 | English/Spanish error messages | PASS |

Bonus: historical code `E7E545BD` redeemed successfully after caregiver re-link (`pending_approval` → approve → Active).
