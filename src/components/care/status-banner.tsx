import { AlertTriangle, Database, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatusBanner({
  source,
  connected,
  warnings,
  authError,
  loadingError,
  patientObject,
  taskObject,
}: {
  source: "meridian" | "unavailable";
  connected: boolean;
  warnings: string[];
  authError?: {
    status: number;
    code: string;
    detail?: string;
    traceId?: string;
  };
  loadingError?: string;
  patientObject: string | null;
  taskObject: string | null;
}) {
  if (source === "meridian" && connected && !authError && warnings.length === 0) {
    return (
      <Card className="border-matcha-100 bg-matcha-50/80">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-matcha-900">
          <Database className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              Connected to Meridian · Conectado a Meridian
            </p>
            <p className="mt-1 text-matcha-800/80">
              Care records via{" "}
              <code className="rounded bg-white/70 px-1">
                {patientObject ?? "patient"}
              </code>
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
        {connected && !authError ? (
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div className="space-y-2">
          <p className="font-medium">
            {authError
              ? "Meridian authentication failed"
              : source === "unavailable"
                ? "Meridian key unavailable in this runtime"
                : "Meridian connected with warnings"}
          </p>
          {loadingError ? (
            <p className="text-amber-900/80">{loadingError}</p>
          ) : null}
          {authError ? (
            <p className="font-mono text-xs text-amber-900/90">
              HTTP {authError.status} · {authError.code}
              {authError.traceId ? ` · trace ${authError.traceId}` : ""}
            </p>
          ) : null}
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
