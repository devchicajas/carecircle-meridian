import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getSessionUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const locale = await getServerLocale();
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.accountType !== "admin") redirect("/");

  return (
    <AppShell
      locale={locale}
      sourceLabel="Meridian"
      viewerName={`${user.firstName} ${user.lastName}`}
      showLogout
      accountType="admin"
      accountRole="Admin"
    >
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Admin · Administración
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {locale === "es"
              ? "Panel de administración CareCircle"
              : "CareCircle Admin Dashboard"}
          </h1>
          <p className="mt-2 max-w-3xl text-ink-600">
            Approve Care Circle connection requests, manage CareCircle accounts,
            and verify Meridian memberships, patients, caregivers, and care
            plans. Admin access is provisioned only with{" "}
            <code>CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN</code> — never via public
            signup.
          </p>
        </div>
        <AdminDashboard locale={locale} />
      </div>
    </AppShell>
  );
}
