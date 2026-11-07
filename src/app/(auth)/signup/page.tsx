import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { CreateDemoAccountForm } from "@/components/auth/create-demo-account-form";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { getAccountProfile } from "@/lib/account/session";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();
  const snapshot = await loadCareSnapshot();

  return (
    <AuthShell
      locale={locale}
      title={t.signUp}
      subtitle={
        locale === "es"
          ? "MVP de simulación LightLeapAI — registra una cuenta dummy y demuestra Meridian en vivo."
          : "LightLeapAI simulation MVP — register a dummy account and prove Meridian is live."
      }
    >
      <div className="space-y-4">
        {profile?.onboarded ? (
          <div className="rounded-2xl border border-matcha-200 bg-matcha-50 p-4 text-sm">
            <p className="font-medium">
              {locale === "es" ? "Ya tienes cuenta" : "You already have an account"}{" "}
              · {profile.firstName} {profile.lastName}
            </p>
            <Button asChild className="mt-3 w-full">
              <Link href="/demo/ready">
                {locale === "es" ? "Continuar demo" : "Continue demo"}
              </Link>
            </Button>
          </div>
        ) : null}

        {!viewer.verified ? (
          <div className="rounded-2xl border border-strawberry-200 bg-strawberry-50 p-4 text-sm">
            {locale === "es"
              ? "Abre CareCircle en local (viewer simulado) o publícalo como app privada Cursor para registrarte."
              : "Open CareCircle locally (simulated viewer) or publish as a Cursor private app to sign up."}
          </div>
        ) : (
          <CreateDemoAccountForm
            locale={locale}
            compact
            caregivers={snapshot.caregivers.map((c) => ({
              value: c.businessId || c.id,
              label: `${c.name} (${c.businessId || c.id})`,
            }))}
            patients={snapshot.patients.map((p) => ({
              value: p.businessId || p.id,
              label: `${p.name} (${p.businessId || p.id})`,
            }))}
          />
        )}

        <p className="text-center text-sm text-ink-500">
          {locale === "es" ? "¿Ya entraste?" : "Already in?"}{" "}
          <Link href="/login" className="text-strawberry-700 underline">
            {t.logIn}
          </Link>
          {" · "}
          <Link href="/demo" className="text-strawberry-700 underline">
            60s video guide
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
