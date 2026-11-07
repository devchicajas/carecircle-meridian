import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  labelEs,
  value,
  hint,
  icon: Icon,
  tone = "strawberry",
}: {
  label: string;
  labelEs: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "strawberry" | "matcha" | "ink";
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-5">
        <div
          className={cn(
            "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl",
            tone === "strawberry" && "bg-strawberry-100 text-strawberry-600",
            tone === "matcha" && "bg-matcha-100 text-matcha-700",
            tone === "ink" && "bg-ink-100 text-ink-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-3xl font-semibold tracking-tight text-ink-900">
          {value}
        </div>
        <div className="mt-1 text-sm font-medium text-ink-800">
          {label}{" "}
          <span className="font-normal text-ink-400">/ {labelEs}</span>
        </div>
        {hint ? <p className="mt-2 text-xs text-ink-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
