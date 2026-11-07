import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  titleEs,
  detail,
}: {
  title: string;
  titleEs: string;
  detail?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-10 text-center">
        <p className="font-medium text-ink-800">
          {title} <span className="font-normal text-ink-400">/ {titleEs}</span>
        </p>
        {detail ? (
          <p className="mt-2 text-sm text-ink-500">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
