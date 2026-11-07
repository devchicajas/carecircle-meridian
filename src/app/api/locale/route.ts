import { privateJson } from "@/lib/auth";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = body.locale === "es" ? "es" : "en";
  const res = privateJson({ locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
