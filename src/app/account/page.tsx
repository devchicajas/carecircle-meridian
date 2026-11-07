import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountProfile } from "@/lib/account/session";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getPageViewer } from "@/lib/viewer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();

  return (
    <AppShell
      sourceLabel="Meridian"
      viewerName={viewer.verified ? viewer.name : undefined}
      locale={locale}
    >
      <div className="mx-auto max-w-2xl space-y-6 animate-fadeUp">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              {t.account}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              {t.settings}
            </h1>
          </div>
          <LogoutButton label={t.logOut} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "es" ? "Identidad Cursor" : "Cursor Identity"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-700">
            <p>
              <strong>sub:</strong> {viewer.verified ? viewer.sub : "—"}
            </p>
            <p>
              <strong>email:</strong> {viewer.verified ? viewer.email : "—"}
            </p>
            <p>
              <strong>verified:</strong>{" "}
              {viewer.verified
                ? viewer.emailVerified ||
                  ("simulated" in viewer && viewer.simulated)
                  ? "yes"
                  : "no"
                : "signed out"}
            </p>
            {viewer.verified &&
            "simulated" in viewer &&
            viewer.simulated ? (
              <p className="text-xs text-ink-500">
                Simulated local viewer — publish as private/team for real tokens.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "es" ? "Perfil CareCircle" : "CareCircle profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-700">
            {profile ? (
              <>
                <p>
                  {profile.firstName} {profile.lastName}
                </p>
                <p>
                  {locale === "es" ? "Tipo" : "Type"}: {profile.accountType}
                </p>
                <p>
                  {locale === "es" ? "Idioma" : "Language"}:{" "}
                  {profile.preferredLanguage}
                </p>
                <p>
                  Meridian Patient:{" "}
                  {profile.meridianPatientBusinessId ||
                    profile.meridianPatientId ||
                    "—"}
                </p>
                <p>
                  Meridian Caregiver:{" "}
                  {profile.meridianCaregiverBusinessId ||
                    profile.meridianCaregiverId ||
                    "—"}
                </p>
                <p>Onboarded: {profile.onboarded ? "yes" : "no"}</p>
              </>
            ) : (
              <p>
                {locale === "es"
                  ? "Sin perfil todavía."
                  : "No CareCircle profile yet."}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm">
                <Link href="/account/settings">{t.settings}</Link>
              </Button>
              {!profile?.onboarded ? (
                <Button asChild size="sm" variant="soft">
                  <Link href={profile ? "/onboarding" : "/signup"}>
                    {profile ? t.onboarding : t.signUp}
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
