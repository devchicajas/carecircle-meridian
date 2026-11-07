import { requireAppUser, privateJson } from "@/lib/auth";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { createCaregiverProfile } from "@/lib/meridian/mutations";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const snapshot = await loadCareSnapshot();
  return privateJson({
    source: snapshot.source,
    connected: snapshot.connected,
    caregivers: snapshot.caregivers,
    warnings: snapshot.warnings,
    authError: snapshot.authError,
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      caregiverType?: string;
      preferredLanguage?: string;
      status?: string;
      emailAddress?: string;
      phoneNumber?: string;
    };
    if (!body.firstName || !body.lastName) {
      return privateJson(
        { error: "firstName and lastName are required" },
        { status: 400 },
      );
    }
    const caregiver = await createCaregiverProfile({
      firstName: body.firstName,
      lastName: body.lastName,
      caregiverType: body.caregiverType,
      preferredLanguage: body.preferredLanguage,
      status: body.status,
      emailAddress: body.emailAddress,
      phoneNumber: body.phoneNumber,
    });
    return privateJson({ caregiver }, { status: 201 });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        {
          error: err.detail || err.message,
          code: err.code,
          traceId: err.traceId,
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
