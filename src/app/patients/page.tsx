import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PatientDirectory } from "@/components/care/patient-directory";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Button } from "@/components/ui/button";
import {
  loadCareSnapshot,
  lovedOnesForCaregiver,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();
  const isCaregiver =
    viewer.verified && viewer.accountType === "family_caregiver";

  const people = isCaregiver
    ? lovedOnesForCaregiver(snapshot, [
        viewer.meridianCaregiverId,
        viewer.meridianCaregiverBusinessId,
      ])
    : viewer.verified && viewer.accountType === "patient"
      ? snapshot.patients.filter(
          (p) =>
            p.id === viewer.meridianPatientId ||
            p.businessId === viewer.meridianPatientBusinessId,
        )
      : [];

  return (
    <AppShell
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType={viewer.accountType}
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
              {isCaregiver
                ? "My Loved Ones · Mis seres queridos"
                : "Care profiles · Perfiles"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
              {isCaregiver
                ? "People in your Care Circle"
                : "Your linked care profile"}
            </h1>
            <p className="mt-2 max-w-2xl text-ink-600">
              {isCaregiver
                ? "Family caregivers only see patients they are linked to through Care Circle — not a clinic-wide directory."
                : "Your Meridian patient profile and related care records."}
            </p>
          </div>
          {isCaregiver ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/care-circle">Open Care Circle</Link>
              </Button>
              <Button asChild>
                <Link href="/patients/new">Add loved one</Link>
              </Button>
            </div>
          ) : null}
        </div>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
          authError={snapshot.authError}
          loadingError={snapshot.loadingError}
          patientObject={snapshot.patientObject}
          taskObject={snapshot.taskObject}
        />

        {!viewer.verified ? (
          <EmptyState
            title="Sign in required"
            titleEs="Inicia sesión"
            detail="Log in as a family caregiver to see your loved ones."
          />
        ) : people.length === 0 ? (
          <EmptyState
            title={
              isCaregiver
                ? "No loved ones linked yet"
                : "No profile linked yet"
            }
            titleEs={
              isCaregiver
                ? "Sin seres queridos vinculados"
                : "Sin perfil vinculado"
            }
            detail={
              isCaregiver
                ? "When a Care Circle membership connects you to someone, they appear here. You will not see every patient in the Meridian tenant."
                : "Finish onboarding to link your patient profile."
            }
          />
        ) : (
          <PatientDirectory
            patients={people}
            framing={isCaregiver ? "lovedOnes" : "patients"}
          />
        )}
      </div>
    </AppShell>
  );
}
