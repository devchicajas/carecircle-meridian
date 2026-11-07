import { requireAppUser, privateJson } from "@/lib/auth";
import { getPatientById } from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  const result = await getPatientById(decodeURIComponent(id));
  if (!result.patient) {
    return privateJson({ error: "Patient not found" }, { status: 404 });
  }
  return privateJson({
    ...result,
    viewer: { sub: identity.sub, name: identity.name, kind: identity.kind },
  });
}
