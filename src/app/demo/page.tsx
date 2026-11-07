import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerLocale } from "@/lib/i18n/locale";
import { getPageViewer } from "@/lib/viewer";
import { getAccountProfile } from "@/lib/account/session";
import { findMariaGonzalez, loadCareSnapshot } from "@/lib/meridian/care-data";
import { Clapperboard, HeartHandshake, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DemoGuidePage() {
  const locale = await getServerLocale();
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();
  const snapshot = await loadCareSnapshot();
  const maria = findMariaGonzalez(snapshot.patients);

  return (
    <AppShell
      locale={locale}
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
    >
      <div className="mx-auto max-w-3xl space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            LightLeapAI Hackathon 2026
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            CareCircle · 60-second Meridian demo
          </h1>
          <p className="mt-2 text-ink-600">
            Simulation MVP for families coordinating care — powered by live
            Meridian objects (patient, caregiver, carePlan, appointment,
            careTask, and more). Synthetic data only.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-3 pt-6 text-sm">
              <HeartHandshake className="mt-0.5 h-5 w-5 text-strawberry-600" />
              <div>
                <p className="font-medium">What</p>
                <p className="text-ink-600">
                  Bilingual care coordination for families
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 pt-6 text-sm">
              <Database className="mt-0.5 h-5 w-5 text-matcha-700" />
              <div>
                <p className="font-medium">How (Meridian)</p>
                <p className="text-ink-600">
                  Live Object API reads + verified writes
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 pt-6 text-sm">
              <Clapperboard className="mt-0.5 h-5 w-5 text-ink-700" />
              <div>
                <p className="font-medium">Film path</p>
                <p className="text-ink-600">Signup → María → task → ES</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suggested talking points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-700">
            <p>
              “CareCircle keeps appointments, care plans, and family tasks in
              one place so care doesn’t get lost in communication.”
            </p>
            <p>
              “In Meridian we model patients, caregivers, memberships, plans,
              appointments, medications, tasks, and notifications — and the
              Next.js app reads and updates those records live.”
            </p>
            <p>
              “Here I sign up with a dummy account, open María González’s
              fictional recovery journey, complete a care task, and switch the
              UI to Spanish.”
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={profile?.onboarded ? "/demo/ready" : "/signup"}>
              {profile?.onboarded ? "Continue as signed-in demo" : "Sign up dummy account"}
            </Link>
          </Button>
          {maria ? (
            <Button asChild variant="soft" size="lg">
              <Link href={`/patients/${encodeURIComponent(maria.id)}`}>
                Jump to María
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="lg">
            <Link href="/tasks">Tasks</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
