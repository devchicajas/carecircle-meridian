import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ConnectPatientForm } from "@/components/care/connect-patient-form";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { getServerLocale } from "@/lib/i18n/locale";
import { listConnectionRequestsForCaregiver } from "@/lib/auth/connections";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ConnectExistingPatientPage() {
  const locale = await getServerLocale();
  const viewer = await getPageViewer();
  const profile = await getSessionUser();
  if (!profile) redirect("/login");
  if (profile.accountType !== "family_caregiver") redirect("/");

  const requests = listConnectionRequestsForCaregiver(profile.id);

  return (
    <AppShell
      locale={locale}
      accountType="family_caregiver"
      accountRole="Family Caregiver"
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout
    >
      <div className="mx-auto max-w-xl space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            Connect existing · Conectar existente
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Connect to an existing patient
          </h1>
        </div>

        <ConnectPatientForm locale={locale} />

        <Card>
          <CardHeader>
            <CardTitle>Your connection requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {requests.length === 0 ? (
              <p className="text-ink-500">No requests yet.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-ink-50 p-3"
                >
                  <div>
                    <p>{req.relationship_type}</p>
                    <p className="text-xs text-ink-500">
                      {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      req.status === "approved"
                        ? "matcha"
                        : req.status === "rejected"
                          ? "outline"
                          : "default"
                    }
                  >
                    {req.status === "pending_approval"
                      ? locale === "es"
                        ? "En espera de aprobación"
                        : "Awaiting approval"
                      : req.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button asChild variant="ghost">
          <Link href="/patients/add">Back</Link>
        </Button>
      </div>
    </AppShell>
  );
}
