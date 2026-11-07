"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PatientCard } from "@/components/care/patient-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/lib/meridian/care-data";
import { cn } from "@/lib/utils";

export function PatientDirectory({
  patients,
  framing = "patients",
}: {
  patients: Patient[];
  framing?: "patients" | "lovedOnes";
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const isLovedOnes = framing === "lovedOnes";

  const statuses = useMemo(() => {
    const set = new Set(patients.map((p) => p.status).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [patients]);

  const filtered = patients.filter((patient) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      patient.name.toLowerCase().includes(q) ||
      patient.businessId?.toLowerCase().includes(q) ||
      patient.language?.toLowerCase().includes(q) ||
      patient.email?.toLowerCase().includes(q) ||
      patient.status.toLowerCase().includes(q);
    const matchesStatus =
      status === "all" ||
      patient.status.toLowerCase() === status.toLowerCase();
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isLovedOnes
                ? "Search loved ones · Buscar seres queridos"
                : "Search patients · Buscar pacientes"
            }
            className="pl-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                status === item
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-600 hover:bg-strawberry-50",
              )}
            >
              {item === "all" ? "All / Todos" : item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="outline">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white/60 p-10 text-center text-ink-500">
          {isLovedOnes
            ? "No loved ones match this filter."
            : "No patients match this filter."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}
