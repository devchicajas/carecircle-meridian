# CareCircle Phase 1 Audit

**Date:** 2026-11-07  
**Stack:** Next.js 16.4 (App Router) · React 19 · TypeScript · Tailwind · Meridian Object API

## Preserve

- Strawberry / matcha visual system (`AppShell`, cards, badges, metric cards)
- Live Meridian client (`PlatformSDK`) with `{ values, reason? }` mutations
- Object coverage: patient, caregiver, careCircleMembership, carePlan, appointment, medication, careTask, notification
- Payload unwrap + field mappers in `care-data.ts`
- Care Task Patient–Care Plan consistency (`task-consistency.ts`, HTTP 422 EN/ES)
- Cursor Identity gate on `/api/*` (`requireAppUser`)
- María González demo path and patient directory search

## Missing (this upgrade)

- Real CareCircle signup / email verification / password reset (Meridian OpenAPI has **no** auth endpoints)
- Immutable account ↔ Meridian record mapping field (propose `identitySubject` on patient/caregiver)
- Caregiver–Patient Active membership check on task assign
- Role-specific portals (Patient / Family Caregiver / Coordinator / Admin)
- Full CRUD UI for care plans, appointments, memberships, caregivers
- Care Journey timeline
- Global EN/ES language switcher (labels currently bilingual inline)
- Toast confirmations and richer mobile nav

## Broken / limited

- Meridian create often conflicts on business-ID sequences (`TSK-001`, etc.) — platform generates IDs; next-ID collision is a Meridian tenant issue
- Demo persona picker is **simulated** role switching (labeled) — not authorization
- Shared tenant API key is not per-user Meridian identity

## Auth decision

| Option | Result |
|--------|--------|
| Meridian native member auth for external Next.js | **Unavailable** — OpenAPI exposes object CRUD only |
| Cursor Identity (published private/team app) | **In use** — verified `sub`, email, `emailVerified` |
| Separate IdP (Auth0 / Clerk) | **Recommended next** — requires team secrets not yet bound |

CareCircle will use Cursor Identity for sessions, onboarding to link Meridian Patient/Caregiver records, and clearly mark email/password reset as requiring a managed IdP.

## Security

- `MERIDIAN_API_KEY` server-only (bound Cursor secret) ✓
- No public generic Meridian proxy ✓
- Cross-record checks are CareCircle-server only (not Meridian-global) — documented ✓
- Row-level auth still limited until per-user Meridian identity mapping exists
