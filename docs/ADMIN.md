# CareCircle Admin

## Secure provisioning (not public signup)

Admin accounts are **never** created from `/signup`.

1. Set `CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN` in `.env.local` (long random secret).
2. Provision:

```bash
npm run admin:provision -- --email admin@example.com --password '...' --first CareCircle --last Admin
```

Or `POST /api/admin/bootstrap` with header `X-Admin-Bootstrap-Token`.

3. Sign in at `/login` → redirects to `/admin`.

## Admin Dashboard (`/admin`)

- **Improve / create Meridian membership**: pick Patient + Caregiver, relationship, Active/Inactive → saved and verified in Meridian
- Activating is **exclusive per Patient/Caregiver pair** (other Active duplicates for that pair are set Inactive first)
- Pending Care Circle connection requests → Approve / Reject
- On approve: Meridian `membershipStatus` → **Active** (read-back verified)
- CareCircle account list (Patient / Family Caregiver); Admin promote only via bootstrap
- Meridian patients, caregivers, memberships, care plans with status controls

### Sign in

Use the provisioned Admin email/password at `/login` (redirects to `/admin`).
Public signup cannot create Admin.

## Auth notes

- CareCircle SQLite stores login credentials only
- Meridian stores Patient / Caregiver / care records
- Password verification uses bcrypt; Auth.js issues the session after credential check
