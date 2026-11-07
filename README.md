# CareCircle | Círculo de Cuidado

Bilingual family care-coordination frontend for the LightLeapAI Hackathon. **Meridian is the only application database.** Synthetic demo data only — not for real patients, not HIPAA, not production-ready.

**Tagline:** Care shouldn't get lost in communication.

## Stack

- Next.js 16 App Router + TypeScript + Tailwind + shadcn-style UI
- Meridian external Object API (`src/lib/sdk/platformSDK.ts`)
- Cursor Identity for verified sessions on published private/team apps

## Quick start

```bash
cp .env.example .env.local   # set MERIDIAN_API_KEY (server-only)
npm install
npm run dev                  # http://localhost:3000
npm run lint
npm run test:task-consistency
npm run inspect:meridian
```

## Auth (important)

Meridian OpenAPI exposes **object CRUD only** — no external signup/login/password APIs.

| Capability | Status |
|------------|--------|
| Cursor Identity session | Implemented (publish as private/team) |
| CareCircle profile + onboarding | Implemented (signed cookie ↔ Meridian Patient/Caregiver) |
| Email/password + reset | Requires Auth0/Clerk secrets — pages document the gap; success is not faked |

See `docs/AUDIT.md` and `docs/DELIVERY.md`.

## Meridian

| | |
|---|---|
| Tenant | `build-90f628cf19f2414abab1bb2cea64614189` |
| Base URL | `https://dev.lightleap.ai/meridian` |
| Objects | patient, caregiver, careCircleMembership, carePlan, appointment, medication, careTask, notification |

Mutations: `{ "values": { … }, "reason": "optional" }`. Never fabricate business IDs (`PAT-001`, …).

Cross-record checks (Patient↔Care Plan, Caregiver membership) are enforced in the **CareCircle Next.js server**, not claimed as Meridian-global rules.

## Showcase dummy account (prove Meridian)

Meridian **creates** are currently blocked in this tenant by stuck business-ID sequences (`CG-001` / `PAT-001` / `TSK-001`). Updates work.

1. Open **`/demo/account`** (also linked from the dashboard and login)
2. Enter a fictional name → **Create dummy account**
3. CareCircle links you to an existing fictional Meridian Caregiver/Patient, **PATCHes** a proof phone number, and **reads it back**
4. Open `/account` and `/caregivers` to show the live Meridian record

## Demo path (María González)

1. `/demo/account` → create showcase dummy account  
2. `/` Caregiver Command Center (“Better Care, Together.”)  
3. `/patients` → open María González  
4. `/care-plans` · `/appointments` · `/tasks` · `/care-journey?patient=PAT-001`  
5. Update a care task; confirm Meridian persistence  
6. Toggle EN/ES with the language switcher
