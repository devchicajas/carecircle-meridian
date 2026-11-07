import { requireAppUser, privateJson } from "@/lib/auth";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { createPatientProfile } from "@/lib/meridian/mutations";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const snapshot = await loadCareSnapshot();
  return privateJson({
    source: snapshot.source,
    connected: snapshot.connected,
    patientObject: snapshot.patientObject,
    warnings: snapshot.warnings,
    authError: snapshot.authError,
    patients: snapshot.patients,
    viewer: { id: identity.id, name: identity.name, email: identity.email },
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      preferredLanguage?: string;
      careStatus?: string;
      emailAddress?: string;
      phoneNumber?: string;
      careStartDate?: string;
      preferredName?: string;
    };
    if (!body.firstName || !body.lastName) {
      return privateJson(
        { error: "firstName and lastName are required" },
        { status: 400 },
      );
    }
    const patient = await createPatientProfile({
      firstName: body.firstName,
      lastName: body.lastName,
      preferredLanguage: body.preferredLanguage,
      careStatus: body.careStatus,
      emailAddress: body.emailAddress,
      phoneNumber: body.phoneNumber,
      careStartDate: body.careStartDate,
      preferredName: body.preferredName,
    });
    return privateJson({ patient }, { status: 201 });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        {
          error: err.detail || err.message,
          code: err.code,
          traceId: err.traceId,
          hint:
            err.status === 409
              ? "Meridian business-ID generator is stuck on PAT-001. In Meridian Object Designer, fix the patientId auto-number sequence so new patients get PAT-005+."
              : undefined,
        },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
