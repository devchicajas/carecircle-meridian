import { NextResponse } from "next/server";
import { provisionAdminAccount, adminAccountCount } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/**
 * Secure Admin bootstrap — requires CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN.
 * Not linked from public signup. Creates or promotes an Admin account.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    preferredLanguage?: "English" | "Spanish";
    bootstrapToken?: string;
  };

  const headerToken = request.headers.get("x-admin-bootstrap-token");
  const token = headerToken || body.bootstrapToken || "";

  try {
    const result = await provisionAdminAccount({
      email: String(body.email || ""),
      password: String(body.password || ""),
      firstName: String(body.firstName || "CareCircle"),
      lastName: String(body.lastName || "Admin"),
      preferredLanguage: body.preferredLanguage,
      bootstrapToken: token,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      adminCount: adminAccountCount(),
      note: "Sign in at /login with this Admin email. Public signup cannot create Admin.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bootstrap failed";
    const status = /token/i.test(message)
      ? 403
      : /not configured/i.test(message)
        ? 503
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
