import { requireAdminUser, privateJson } from "@/lib/auth";
import { listAllConnectionRequests } from "@/lib/auth/connections";
import { findUserById, toPublicUser } from "@/lib/auth/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminUser(request);
  if (admin instanceof Response) return admin;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | "pending_approval"
    | "approved"
    | "rejected"
    | null;

  const rows = listAllConnectionRequests(status || undefined).map((row) => {
    const patient = findUserById(row.patient_user_id);
    const caregiver = findUserById(row.caregiver_user_id);
    return {
      ...row,
      patient: patient
        ? {
            email: patient.email,
            name: `${patient.first_name} ${patient.last_name}`.trim(),
            meridianPatientBusinessId: patient.meridian_patient_business_id,
          }
        : null,
      caregiver: caregiver
        ? {
            email: caregiver.email,
            name: `${caregiver.first_name} ${caregiver.last_name}`.trim(),
            meridianCaregiverBusinessId: caregiver.meridian_caregiver_business_id,
          }
        : null,
    };
  });

  return privateJson({
    requests: rows,
    viewer: toPublicUser(
      // requireAdminUser already validated
      (await import("@/lib/auth/db")).findUserById(admin.id)!,
    ),
  });
}
