# CareCircle | Círculo de Cuidado

Premium caregiver MVP for the LightLeapAI Hackathon. **Meridian remains the backend and source of truth** — this repo is the Next.js frontend + secure server-side integration.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn-style UI + Lucide icons
- Meridian external Object API via `PlatformSDK.v1` (`src/lib/sdk/platformSDK.ts`)

## Meridian

| | |
|---|---|
| Tenant | `carecircle-ci-rculo-de-cuidado-5fbd81` |
| Base URL | `https://dev.lightleap.ai/meridian` |
| OpenAPI | `/api/ext/v1/openapi?tenant=carecircle-ci-rculo-de-cuidado-5fbd81` |

Required secret (server-only):

```bash
MERIDIAN_API_KEY=mk_live_...
MERIDIAN_BASE_URL=https://dev.lightleap.ai/meridian
MERIDIAN_TENANT=carecircle-ci-rculo-de-cuidado-5fbd81
```

Copy `.env.example` → `.env.local`. Never commit API keys.

Optional overrides after confirming exact exposed object names:

```bash
MERIDIAN_PATIENT_OBJECT=Patient
MERIDIAN_TASK_OBJECT=CareTask
```

## Demo flow

1. **Dashboard** `/` — metrics from Meridian records  
2. **Patient directory** `/patients` — search + status filters  
3. **María González profile** `/patients/[id]`  
4. **Related care task** — status update only if Meridian exposes PATCH and the key is authorized  

## Scripts

```bash
npm install
npm run dev
npm run build
npm run inspect:meridian
```

`inspect:meridian` loads the protected OpenAPI and prints exposed objects / guessed patient & task objects.

## Exposed Meridian objects (read-only)

`patient`, `caregiver`, `carePlan`, `appointment`, `medication`, `careTask`, `notification`

Intentionally unexposed: `auditEvent`, `platform_issue`, `recordsDirectlyIn`

## Authorization

- `MERIDIAN_API_KEY` is server-side only (Cursor app secret / `.env.local`).
- Application-user auth uses Cursor identity (`cursor/identity.ts`) on every `/api/*` route — independent of the Meridian integration key.
- Integration is **read-only** until Meridian enables create/update verbs.

## Notes

- Field RBAC, row scope, and tenant clamps stay on Meridian’s server.
- A tenant API key is not the same as end-user authorization.
- If an object/operation is missing from OpenAPI, the UI reports the missing exposure instead of inventing schema.
- This agent VM cannot read bound Cursor secrets; live Meridian verification happens on the published app runtime.
