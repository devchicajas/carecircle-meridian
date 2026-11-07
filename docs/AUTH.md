# CareCircle authentication (demo environment)

## What we use

- **Auth.js (NextAuth v5)** Credentials provider
- **bcrypt** password hashes (cost 12)
- **SQLite** auth DB at `data/carecircle-auth.sqlite` (accounts only — not care data)
- **Meridian** remains the source of truth for Patient / Caregiver / care records

## Demo rules

- `jasmin@example.com`-style emails are allowed as **login identifiers**
- **No email verification** in this controlled synthetic environment
- Unverified email is **not** treated as proof of identity for arbitrary Meridian rows
- Users cannot self-assign Care Coordinator or Admin

## Meridian profile create

If Meridian returns `CONFLICT` / stuck `*-001` business IDs:

1. In **Meridian Data Studio**, create (or edit) a Family Caregiver / Patient with the **exact same email** as the CareCircle account
2. On `/onboarding`, use **Link Meridian profile by exact email**
3. CareCircle PATCHes that row and verifies read-back

When Meridian ID sequences work again, **Create profile in Meridian** succeeds without the link step.

## Env

```bash
AUTH_SECRET=...                 # required
MERIDIAN_API_KEY=...            # server-only
CARECIRCLE_AUTH_DB=./data/...   # optional
```
