# CareCircle | Círculo de Cuidado

**Built for the LightLeap Meridian Hackathon** — a bilingual family caregiving app with **Meridian at the center** as the system of record for all care data.

> Better Care, Together. · Mejor cuidado, juntos.

![Meridian-centered](https://img.shields.io/badge/Platform-LightLeap%20Meridian-315C45)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20TypeScript%20%7C%20Auth.js-F4A6B8)
![i18n](https://img.shields.io/badge/Languages-English%20%2B%20Spanish-91B88B)

---

## Hackathon challenge

**Platform:** [LightLeap Meridian](https://dev.lightleap.ai/meridian) — governed Object API for operational care records.

**Challenge:** Build a real application on Meridian (not mock data) that shows how Meridian objects, references, and membership rules power a useful care workflow — then demo it in **60 seconds or less**.

**Problem we chose:** Families struggle to coordinate care for a loved one. Caregivers either get **no structured access** or **unsafe oversharing** (shared logins, spreadsheets, group chats). Clinics and care apps rarely model the **trusted family circle** as a first-class, authorized relationship.

**What we built:** **CareCircle** — Patients invite Family Caregivers; Meridian **Care Circle Memberships** authorize access; caregivers only see their **My Loved Ones** and permitted care records. English + Spanish. Strawberry & matcha UI.

---

## Meridian at the center

```text
                    ┌─────────────────────────────┐
                    │     LightLeap Meridian      │
                    │   (source of truth for      │
                    │    all care records)        │
                    │                             │
                    │  patient · caregiver        │
                    │  careCircleMembership       │
                    │  carePlan · medication      │
                    │  careTask · appointment     │
                    │  notification               │
                    └─────────────▲───────────────┘
                                  │
                     Object API   │  { values, reason? }
                     server-only  │  MERIDIAN_API_KEY
                                  │
                    ┌─────────────┴───────────────┐
                    │         CareCircle          │
                    │   Next.js · Auth.js · UI    │
                    │                             │
                    │  Patient / Caregiver / Admin│
                    │  Invite → Approve → Active  │
                    │  My Loved Ones (scoped)     │
                    │  EN / ES                    │
                    └─────────────────────────────┘
```

| Layer | Role |
|-------|------|
| **Meridian** | Only database for Patients, Caregivers, Memberships, Plans, Meds, Tasks, Appointments |
| **CareCircle** | UX, Auth.js login sessions, invite/approval workflow, authorization checks, bilingual UI |
| **SQLite auth DB** | Email/password accounts only — **not** care data |

Meridian generates business IDs. CareCircle never fabricates Patient/Caregiver/Membership records as “fake success.”

---

## How the solution works in Meridian

1. **Onboarding** creates or links a Meridian `patient` or `caregiver` (Family Caregiver).
2. A Patient generates a **secure invite**; a Caregiver redeems it.
3. CareCircle creates a Meridian `careCircleMembership` as **Inactive** (Meridian supports Active | Inactive only).
4. Patient owner or **Admin** approves → membershipStatus set to **Active** (read-back verified).
5. **My Loved Ones** lists only patients with an **Active** membership for that caregiver.
6. Care Plans, Medications, and Care Tasks are loaded from Meridian and scoped to authorized patients.

### Meridian objects used

| Object | Purpose in CareCircle |
|--------|------------------------|
| `patient` | Loved one receiving care |
| `caregiver` | Family Caregiver (and coordinators in tenant) |
| `careCircleMembership` | Authorized link · Active unlocks My Loved Ones |
| `carePlan` | Recovery goals & plan status |
| `medication` | Med list for authorized patients |
| `careTask` | Tasks assigned within the circle |
| `appointment` | Visits / follow-ups |
| `notification` | Alerts when present in tenant |

Tenant (demo): `build-90f628cf19f2414abab1bb2cea64614189`

---

## 60-second demo angle

**Problem → Meridian membership → trusted access**

Suggested cut (linked Patient + Caregiver):

1. Face: name CareCircle + problem (unsafe / missing family access).
2. Screen: Caregiver **My Loved Ones** powered by Active Meridian membership.
3. Open live Meridian care plan / medication / task for that patient.
4. Flip EN → ES.
5. Close: “Invite → Active Meridian membership → authorized care.”

---

## Features

- Live Meridian Object API via server-only `PlatformSDK`
- Auth.js + bcrypt accounts (Patient, Family Caregiver, Admin)
- Secure Admin provisioning (bootstrap token — **not** public signup)
- Invite → pending connection → approve → Active membership
- Scoped **My Loved Ones** (no global patient directory for caregivers)
- Care Plans, Medications, Care Tasks, Appointments, Care Journey
- Patient portal + Caregiver dashboard + Admin membership tools
- English / Spanish language switcher
- Strawberry `#F4A6B8` · Matcha `#91B88B` · Forest · Cream UI

---

## Quick start

```bash
cp .env.example .env.local
# Required:
#   MERIDIAN_API_KEY=...
#   MERIDIAN_BASE_URL=https://dev.lightleap.ai/meridian
#   MERIDIAN_TENANT=...
#   AUTH_SECRET=...
# Optional Admin bootstrap:
#   CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN=...

npm install
npm run dev
```

Open http://localhost:3000 → Sign up → Onboarding links Meridian profile → Dashboard.

### Admin (optional)

```bash
npm run admin:provision -- --email admin@example.com --password '...' --first CareCircle --last Admin
```

Then sign in → `/admin` to approve connections and improve Meridian memberships.

---

## Scripts

```bash
npm run lint
npm run inspect:meridian
npm run test:invite-flow
npm run test:admin-login-flow
npm run test:task-consistency
```

---

## Docs

| Doc | Topic |
|-----|--------|
| [docs/AUDIT.md](docs/AUDIT.md) | Phase 1 audit |
| [docs/DELIVERY.md](docs/DELIVERY.md) | Delivery summary |
| [docs/AUTH.md](docs/AUTH.md) | Auth.js + account rules |
| [docs/ADMIN.md](docs/ADMIN.md) | Admin bootstrap & membership tools |
| [docs/INVITE_FLOW.md](docs/INVITE_FLOW.md) | Invite → Active membership E2E |
| [docs/FIELD_AUDIT.md](docs/FIELD_AUDIT.md) | Meridian field coverage |

---

## Architecture notes

- **Meridian** = care system of record  
- **CareCircle** = product experience + session auth + workflow  
- API key stays **server-only** (never `NEXT_PUBLIC_`)  
- Mutations use Meridian body shape: `{ "values": { ... }, "reason": "..." }`  
- Synthetic / fictional demo data only — not HIPAA / not production medical use  

---

## Team / repo

**Repo:** [devchicajas/carecircle-meridian](https://github.com/devchicajas/carecircle-meridian)

Built with LightLeap **Meridian** as the center of the care data model for the Meridian hackathon submission.
