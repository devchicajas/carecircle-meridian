import { AlertTriangle, Database, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatusBanner({
  source,
  connected,
  warnings,
  patientObject,
  taskObject,
}: {
  source: "meridian" | "demo";
  connected: boolean;
  warnings: string[];
  patientObject: string | null;
  taskObject: string | null;
}) {
  if (source === "meridian" && warnings.length === 0) {
    return (
      <Card className="border-matcha-100 bg-matcha-50/80">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-matcha-900">
          <Database className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              Connected to Meridian · Conectado a Meridian
            </p>
            <p className="mt-1 text-matcha-800/80">
              Patients via <code className="rounded bg-white/70 px-1">{patientObject ?? "—"}</code>
              {taskObject ? (
                <>
                  {" "}
                  · Tasks via{" "}
                  <code className="rounded bg-white/70 px-1">{taskObject}</code>
                </>
              ) : null}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-100 bg-amber-50/90">
      <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-950">
        {connected ? (
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div className="space-y-2">
          <p className="font-medium">
            {source === "demo"
              ? "Showing fictional demo data until Meridian credentials are available in this runtime."
              : "Meridian connected with incomplete exposure."}
          </p>
          <p className="text-amber-900/80">
            Live reads use your tenant&apos;s governed Object API
            (`/api/ext/v1/objects/…`). Missing object exposure is reported here
            instead of inventing schema.
          </p>
          {warnings.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-amber-900/90">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
