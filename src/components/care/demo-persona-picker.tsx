"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type DemoPersona = {
  id: string;
  caregiverBusinessId: string;
  name: string;
  role: string;
  focusPatientId?: string;
  focusPatientName?: string;
  language?: string;
};

const STORAGE_KEY = "carecircle.demoPersona";

export function readDemoPersona(): DemoPersona | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoPersona) : null;
  } catch {
    return null;
  }
}

export function DemoPersonaPicker({ personas }: { personas: DemoPersona[] }) {
  const router = useRouter();
  const [active, setActive] = useState<DemoPersona | null>(null);

  useEffect(() => {
    setActive(readDemoPersona());
  }, []);

  function choose(persona: DemoPersona) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
    setActive(persona);
    if (persona.focusPatientId) {
      router.push(`/patients/${encodeURIComponent(persona.focusPatientId)}`);
    } else {
      router.push("/");
    }
    router.refresh();
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    setActive(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Demonstration only / Solo demostración:</strong> this switches a
        local demo persona. It is not secure Meridian user authentication. The
        API key still uses Meridian role permissions server-side.
      </div>

      {active ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-medium text-ink-900">
                Signed in as {active.name}
              </div>
              <div className="text-sm text-ink-500">
                {active.role}
                {active.focusPatientName
                  ? ` · supporting ${active.focusPatientName}`
                  : ""}
              </div>
            </div>
            <Button variant="outline" onClick={clear}>
              Switch account
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {personas.map((persona) => (
          <Card key={persona.id} className="hover:shadow-lift">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="matcha">{persona.role}</Badge>
                {persona.language ? (
                  <Badge variant="outline">{persona.language}</Badge>
                ) : null}
              </div>
              <div>
                <div className="text-lg font-semibold text-ink-900">
                  {persona.name}
                </div>
                <div className="text-sm text-ink-500">
                  {persona.caregiverBusinessId}
                  {persona.focusPatientName
                    ? ` · ${persona.focusPatientName}`
                    : ""}
                </div>
              </div>
              <Button onClick={() => choose(persona)} className="w-full">
                Continue as {persona.name.split(" ")[0]}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DemoPersonaBadge() {
  const [persona, setPersona] = useState<DemoPersona | null>(null);
  useEffect(() => {
    setPersona(readDemoPersona());
  }, []);
  if (!persona) return null;
  return (
    <Badge variant="warning">
      Demo: {persona.name}
    </Badge>
  );
}
