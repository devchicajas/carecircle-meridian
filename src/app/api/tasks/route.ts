import { NextResponse } from "next/server";
import { loadCareSnapshot } from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await loadCareSnapshot();
  return NextResponse.json({
    source: snapshot.source,
    connected: snapshot.connected,
    taskObject: snapshot.taskObject,
    warnings: snapshot.warnings,
    tasks: snapshot.tasks,
  });
}
