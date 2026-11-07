import { Card, CardContent } from "@/components/ui/card";

export function MeridianCreateHint() {
  return (
    <Card className="border-strawberry-100 bg-strawberry-50/80">
      <CardContent className="space-y-2 p-4 text-sm text-strawberry-950">
        <p className="font-medium">
          Meridian create blocker · Bloqueo de creación
        </p>
        <p>
          Live <strong>updates</strong> work. New patient/caregiver/task creates
          currently fail with <code>409 CONFLICT</code> because Meridian keeps
          generating the same business IDs (<code>PAT-001</code>,{" "}
          <code>CG-001</code>, <code>TSK-001</code>).
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open Meridian → Object Designer for each object</li>
          <li>
            Fix the auto-number / sequence for <code>patientId</code>,{" "}
            <code>caregiverId</code>, <code>taskId</code>, etc. so the next
            value is unused (e.g. start at 005)
          </li>
          <li>Retry Create Profile here — no frontend rewrite needed</li>
        </ol>
        <p className="text-xs text-strawberry-900/80">
          Until then, showcase edits on María González, task status changes, and
          notification creates (those already succeed).
        </p>
      </CardContent>
    </Card>
  );
}
