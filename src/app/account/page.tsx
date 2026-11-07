import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteCaregiverPanel } from "@/components/care/invite-caregiver-panel";
import { getSessionUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const roleLabel =
    user.accountType === "patient" ? "Patient" : "Family Caregiver";

  return (
    <AppShell
      sourceLabel="Meridian"
      viewerName={`${user.firstName} ${user.lastName}`}
      locale={locale}
      showLogout
      accountType={user.accountType}
      accountRole={roleLabel}
    >
      <div className="mx-auto max-w-2xl space-y-6 animate-fadeUp">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              {t.account}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 text-ink-600">{roleLabel}</p>
          </div>
          <LogoutButton label={t.logOut} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "es" ? "Cuenta CareCircle" : "CareCircle account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-700">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              {locale === "es" ? "Rol" : "Role"}: {roleLabel}
            </p>
            <p>
              Meridian Patient:{" "}
              {user.meridianPatientBusinessId || user.meridianPatientId || "—"}
            </p>
            <p>
              Meridian Caregiver:{" "}
              {user.meridianCaregiverBusinessId ||
                user.meridianCaregiverId ||
                "—"}
            </p>
            <p>Onboarded: {user.onboarded ? "yes" : "no"}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm">
                <Link href="/account/settings">{t.settings}</Link>
              </Button>
              {!user.onboarded ? (
                <Button asChild size="sm" variant="soft">
                  <Link href="/onboarding">{t.onboarding}</Link>
                </Button>
              ) : null}
              {user.accountType === "patient" ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/portal/patient">Patient portal</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/patients">My loved ones</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {user.accountType === "patient" && user.meridianPatientId ? (
          <InviteCaregiverPanel locale={locale} />
        ) : null}
      </div>
    </AppShell>
  );
}
