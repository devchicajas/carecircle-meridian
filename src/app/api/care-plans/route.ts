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
    carePlans: snapshot.carePlans,
    warnings: snapshot.warnings,
    authError: snapshot.authError,
  });
}
