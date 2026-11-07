"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  label = "Log Out",
}: {
  label?: string;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}
