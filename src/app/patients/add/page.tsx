import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AddLovedOneChooserPage() {
  const viewer = await getPageViewer();
  const profile = await getSessionUser();
  if (!profile) redirect("/login");
  if (profile.accountType !== "family_caregiver") redirect("/");

  return (
    <AppShell
      sourceLabel="Meridian"
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType="family_caregiver"
      accountRole="Family Caregiver"
    >
      <div className="mx-auto max-w-3xl space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            Add a loved one · Agregar ser querido
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            How do you want to connect?
          </h1>
          <p className="mt-2 text-ink-600">
            CareCircle never shows a searchable tenant-wide patient directory.
            Access requires creating a new profile or redeeming a verified
            invite from the patient.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create new patient profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-ink-600">
              <p>
                Create a Meridian patient record for someone you support. A Care
                Circle membership request (Inactive) is submitted for activation.
              </p>
              <Button asChild className="w-full">
                <Link href="/patients/new">Create new profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Connect to existing patient profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-ink-600">
              <p>
                Enter an invite code from the patient. We will not confirm whether
                an unrelated patient exists if the code is invalid.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/patients/connect">Use invite code</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Button asChild variant="ghost">
          <Link href="/patients">Back to loved ones</Link>
        </Button>
      </div>
    </AppShell>
  );
}
