# CareCircle | Círculo de Cuidado

Bilingual family care-coordination app. **Meridian is the only database for care records.** Account credentials use Auth.js + bcrypt in a local SQLite auth store (not Meridian). Synthetic/fictional data only.

## Quick start

```bash
cp .env.example .env.local
# set MERIDIAN_API_KEY and AUTH_SECRET
npm install
npm run dev
```

Open http://localhost:3000 → **Sign up** with e.g. `jasmin@example.com` + password → onboarding creates a Meridian Patient/Caregiver → dashboard.

## Auth

- Email + password (Auth.js Credentials)
- `example.com` emails allowed
- **No email verification** in this controlled demo
- Sessions are secure httpOnly Auth.js JWTs
- Passwords hashed with bcrypt (cost 12)
- Care Coordinator / Admin cannot be self-assigned

## Meridian

Server-only `MERIDIAN_API_KEY`. Objects: patient, caregiver, careCircleMembership, carePlan, appointment, medication, careTask, notification.

If Meridian create returns `CONFLICT` on stuck business-ID sequences, the UI shows the real Meridian error (writes are not faked).

## Scripts

```bash
npm run lint
npm run test:task-consistency
npm run inspect:meridian
```
