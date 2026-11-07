import { AppShell } from "@/components/layout/app-shell";
import { CreateDemoAccountForm } from "@/components/auth/create-demo-account-form";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountProfile } from "@/lib/account/session";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { getServerLocale } from "@/lib/i18n/locale";
import { getPageViewer } from "@/lib/viewer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DemoAccountPage() {
  const locale = await getServerLocale();
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell
      locale={locale}
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={
        viewer.verified
          ? viewer.simulated
            ? `${viewer.name} (simulated)`
            : viewer.name
          : undefined
      }
    >
      <div className="mx-auto max-w-3xl space-y-6 animate-fadeUp">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              Showcase · Demostración
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              {locale === "es"
                ? "Cuenta dummy para probar Meridian"
                : "Dummy account to prove Meridian works"}
            </h1>
            <p className="mt-2 text-ink-600">
              {locale === "es"
                ? "Un clic crea tu perfil CareCircle, lo vincula a un cuidador/paciente ficticio en Meridian y confirma una escritura real."
                : "One click builds your CareCircle profile, links a fictional Meridian caregiver/patient, and confirms a real write."}
            </p>
          </div>
          {profile ? <LogoutButton label={locale === "es" ? "Salir" : "Log out"} /> : null}
        </div>

        {!viewer.verified ? (
          <Card className="border-strawberry-200 bg-strawberry-50">
            <CardContent className="pt-6 text-sm text-ink-800">
              {locale === "es"
                ? "Necesitas una sesión Cursor (local simulada o app publicada) para crear la cuenta demo."
                : "You need a Cursor session (local simulated or published app) to create the demo account."}
            </CardContent>
          </Card>
        ) : (
          <CreateDemoAccountForm
            locale={locale}
            caregivers={snapshot.caregivers.map((c) => ({
              value: c.businessId || c.id,
              label: `${c.name} (${c.businessId || c.id}) · ${c.role || "Caregiver"}`,
            }))}
            patients={snapshot.patients.map((p) => ({
              value: p.businessId || p.id,
              label: `${p.name} (${p.businessId || p.id})`,
            }))}
          />
        )}

        {profile?.onboarded ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "es" ? "Sesión actual" : "Current session"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-ink-700">
              <p>
                {profile.firstName} {profile.lastName} · {profile.accountType}
              </p>
              <p>
                Meridian Caregiver:{" "}
                {profile.meridianCaregiverBusinessId ||
                  profile.meridianCaregiverId ||
                  "—"}
              </p>
              <p>
                Meridian Patient:{" "}
                {profile.meridianPatientBusinessId ||
                  profile.meridianPatientId ||
                  "—"}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild>
                  <Link href="/">{locale === "es" ? "Panel" : "Dashboard"}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/account">
                    {locale === "es" ? "Mi cuenta" : "My account"}
                  </Link>
                </Button>
                <Button asChild variant="soft">
                  <Link href="/caregivers">
                    {locale === "es"
                      ? "Ver cuidadores en Meridian"
                      : "View caregivers in Meridian"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
