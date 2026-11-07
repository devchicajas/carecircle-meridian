import { redirect } from "next/navigation";

/** Former simulated persona entry — replaced by credentials auth. */
export default function EnterPage() {
  redirect("/login");
}
