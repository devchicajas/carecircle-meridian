import { requireAppUser, privateJson } from "@/lib/auth";
import { discoverCareCircleSchema } from "@/lib/meridian/discovery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const schema = await discoverCareCircleSchema();
  return privateJson({
    ...schema,
    viewer: { id: identity.id, name: identity.name, email: identity.email },
  });
}
