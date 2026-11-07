import { redirect } from "next/navigation";

/** Canonical signup for the hackathon dummy account is /signup. */
export const dynamic = "force-dynamic";

export default function DemoAccountRedirectPage() {
  redirect("/signup");
}
