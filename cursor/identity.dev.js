// JS twin of identity.dev.ts so Turbopack can resolve the "./identity.dev.js" import
// from cursor/identity.ts. Prefer editing identity.dev.ts for TypeScript projects;
// keep these values in sync for local simulated viewer.

export const DEV_VIEWER = {
  sub: "user:dev",
  email: "dev@example.com",
  name: "Dev Viewer",
  teamId: 1,
  teamRole: "admin",
};
