# CareCircle Final Delivery Summary

## 1. Already working (preserved)

- Next.js 16 App Router strawberry/matcha UI
- Live Meridian Object API via server-only `PlatformSDK`
- Eight operational objects with payload unwrap
- Patient directory, María González profile, task create/update
- Cursor Identity gate on `/api/*`
- Care Task Patient–Care Plan consistency (422 EN/ES)

## 2. Improved in this upgrade

- Account/auth UX pages (signup, login, verify, forgot/reset, logout, account, settings, onboarding, unauthorized, session-expired)
- CareCircle profile cookie mapped to Cursor Identity `sub`
- Onboarding create/link Meridian Patient or Family Caregiver
- Caregiver Active + membership authorization on task assign
- Care Plan / Appointment create forms + APIs with Meridian rules
- Membership create API (Pending only from browser)
- Care Journey timeline from real dated Meridian records
- Care Circle memberships page
- Patient portal starter
- Global EN/ES language switcher (cookie)
- Brand color tokens aligned to strawberry/matcha/forest/cream/charcoal
- Required Due Date on Care Tasks

## 3. Key files

| Area | Paths |
|------|--------|
| Audit | `docs/AUDIT.md`, `docs/DELIVERY.md` |
| Auth/account | `src/app/(auth)/*`, `src/app/account/*`, `src/app/onboarding/*`, `src/lib/account/*`, `src/app/api/account/*` |
| i18n | `src/lib/i18n/*`, `src/components/i18n/language-switcher.tsx`, `src/app/api/locale/route.ts` |
| Validation | `src/lib/meridian/task-consistency.ts`, `src/lib/meridian/task-assignment.ts` |
| CRUD | `src/lib/meridian/care-data.ts`, `src/app/api/care-plans`, `appointments`, `memberships` |
| Journey / circle / portal | `src/app/care-journey`, `care-circle`, `portal/patient` |

## 4. Authentication provider

**Implemented:** Cursor Identity (verified sessions on published private/team Cursor apps; simulated locally via `cursor/identity.dev`).

**Not available from Meridian:** OpenAPI has no signup/login/session/password endpoints for external Next.js.

**Incomplete without extra secrets:** Email/password signup, forgot/reset password. Forgot/reset pages document that Auth0 or Clerk must be bound — success is not simulated.

**Account mapping:** Signed httpOnly CareCircle cookie keyed by Cursor `sub`. **Proposed Meridian field:** `identitySubject` on Patient/Caregiver for durable cross-device mapping (email match used only as a weak interim link check).

## 5. Working routes

Auth: `/signup` `/login` `/verify-email` `/forgot-password` `/reset-password` `/unauthorized` `/session-expired` `/onboarding` `/account` `/account/settings`

App: `/` `/patients` `/patients/new` `/patients/[id]` `/caregivers` `/care-plans` `/appointments` `/medications` `/tasks` `/notifications` `/care-circle` `/care-journey` `/portal/patient` `/enter`

APIs: patients, caregivers, care-plans, appointments, memberships, tasks, notifications, account, locale, meridian/schema

## 6. Verified Meridian endpoints

- `GET /api/ext/v1/objects/{object}` — patient, caregiver, careCircleMembership, carePlan, appointment, medication, careTask, notification
- `POST/PATCH /api/ext/v1/objects/{object}` with `{ values, reason? }`
- Tenant: `build-90f628cf19f2414abab1bb2cea64614189`

## 7. Data-model notes

- Membership status API field is `membershipStatus` (not `status`)
- Caregiver email field is `emailAddress`
- Business IDs (`PAT-001`, …) are Meridian-generated — never sent on create
- Preferred Name uniqueness rule in Meridian should be removed manually (not bypassed)

## 8. Read/Create/Update test results

| Test | Result |
|------|--------|
| GET patients/caregivers/plans/memberships/tasks | Pass (live) |
| Patient–Care Plan mismatch 422 EN/ES | Pass |
| Valid task update + read-back (TSK-001) | Pass |
| Unauthorized caregiver CG-004→PAT-001 | Pass (422) |
| Authorized caregiver CG-001→PAT-001 | Pass |
| New careTask create | Fail on Meridian sequence conflict `TSK-001` already exists — platform ID generation issue, not CareCircle validation |

## 9. Authorization results

- API routes require Cursor Identity
- Coordinator/Admin cannot be self-granted from signup/onboarding
- New memberships forced to Pending from CareCircle API
- Demo persona picker remains **simulated** and labeled
- Full per-user Meridian row RBAC still limited (shared API key) — documented

## 10. UI/UX

- Language switcher in shell + auth screens
- Care Journey timeline, patient portal, create forms for plans/appointments/tasks
- Strawberry `#F4A6B8`, matcha `#91B88B`, forest `#315C45`, cream `#FFF9F5`, charcoal `#25332B`

## 11. English/Spanish

- Dictionary + status labels; nav and auth screens switch via `carecircle_locale` cookie
- Meridian enum values stored unchanged; display labels translated

## 12. Remaining gaps

- Email/password IdP not bound (Auth0/Clerk secrets required)
- No Meridian `identitySubject` field yet
- Care Coordinator / Admin portals are not fully separate caseload-scoped apps yet
- Meridian create ID sequence conflicts for some objects
- Notifications collection currently empty in tenant
- Not HIPAA / not production-ready — synthetic demo only

## 13. Environment

```bash
cp .env.example .env.local
# set MERIDIAN_API_KEY (server-only)
# optional AUTH_SECRET for account cookie signing
```

## 14. Start locally

```bash
npm install
npm run dev
# http://localhost:3000
npm run test:task-consistency
npm run inspect:meridian
```

## 15. Next milestone

1. Bind Auth0 or Clerk for email/password + reset
2. Add Meridian `identitySubject` on Patient/Caregiver
3. Propagate per-user authorization into Meridian (or scoped keys)
4. Resolve Meridian business-ID sequence for creates
5. Finish Coordinator/Admin portals with invitation-only elevation
