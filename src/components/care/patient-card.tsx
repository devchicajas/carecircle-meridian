import Link from "next/link";
import { ArrowUpRight, Languages, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/lib/meridian/care-data";
import { initials } from "@/lib/utils";

export function PatientCard({ patient }: { patient: Patient }) {
  const statusVariant = /recovery|active/i.test(patient.status)
    ? "matcha"
    : /chronic|routine/i.test(patient.status)
      ? "warning"
      : "outline";

  return (
    <Link href={`/patients/${encodeURIComponent(patient.id)}`} className="block">
      <Card className="group h-full">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-strawberry-200 to-matcha-200 text-sm font-semibold text-ink-800">
                {initials(patient.name)}
              </div>
              <div>
                <div className="font-semibold text-ink-900 group-hover:text-strawberry-700">
                  {patient.name}
                </div>
                <div className="text-xs text-ink-500">
                  {patient.businessId || "Care profile"}
                </div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-ink-300 transition group-hover:text-strawberry-500" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant}>{patient.status}</Badge>
            {patient.language ? (
              <Badge variant="outline">{patient.language}</Badge>
            ) : null}
          </div>

          <div className="mt-auto space-y-2 text-sm text-ink-600">
            {patient.language ? (
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-matcha-600" />
                <span>{patient.language}</span>
              </div>
            ) : null}
            {patient.email ? (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-strawberry-500" />
                <span>{patient.email}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
