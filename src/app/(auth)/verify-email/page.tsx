import { redirect } from "next/navigation";

/** Email verification is disabled in this controlled demo environment. */
export default function VerifyEmailPage() {
  redirect("/signup");
}
