import { requireAppUser, privateJson } from "@/lib/auth";
import { loadCareSnapshot } from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const snapshot = await loadCareSnapshot();
  return privateJson({
    source: snapshot.source,
    connected: snapshot.connected,
    taskObject: snapshot.taskObject,
    warnings: snapshot.warnings,
    authError: snapshot.authError,
    tasks: snapshot.tasks,
    viewer: { sub: identity.sub, name: identity.name, kind: identity.kind },
  });
}
