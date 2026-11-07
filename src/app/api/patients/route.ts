import { requireAppUser, privateJson } from "@/lib/auth";
import { createMembershipRecord } from "@/lib/meridian/care-data";
import { createPatientProfile } from "@/lib/meridian/mutations";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const view = await loadAuthorizedCareView(identity);
  return privateJson({
    source: view.source,
    connected: view.connected,
    patientObject: view.patientObject,
    warnings: view.warnings,
    authError: view.authError,
    loadingError: view.loadingError,
    patients: view.patients,
    viewer: { id: identity.id, name: identity.name, email: identity.email },
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  try {
    if (identity.accountType === "patient") {
      return privateJson(
        {
          error:
            "Patient accounts cannot create additional patient profiles here.",
        },
        { status: 403 },
      );
    }

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

    let membership: unknown = null;
    let membershipNote: string | undefined;
    const caregiverRef =
      identity.meridianCaregiverBusinessId || identity.meridianCaregiverId;
    const patientRef = patient.businessId || patient.id;
    if (caregiverRef && patientRef) {
      try {
        membership = await createMembershipRecord({
          patient: patientRef,
          caregiver: caregiverRef,
          relationshipType: "Family Member",
          membershipStatus: "Inactive",
          startDate: new Date().toISOString().slice(0, 10),
        });
        membershipNote =
          "Care Circle membership created as Inactive. A coordinator/admin must set it Active before this person appears in My Loved Ones.";
      } catch (memErr) {
        membershipNote =
          memErr instanceof PlatformSDKError
            ? `Patient created, but Care Circle request failed: ${memErr.detail || memErr.message}`
            : "Patient created, but Care Circle request failed.";
      }
    } else {
      membershipNote =
        "Patient created. Link your caregiver profile before a Care Circle request can be submitted.";
    }

    return privateJson(
      { patient, membership, membershipNote, readBack: true },
      { status: 201 },
    );
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
