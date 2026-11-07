import { NextResponse } from "next/server";
import { loadCareSnapshot } from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await loadCareSnapshot();
  return NextResponse.json({
    source: snapshot.source,
    connected: snapshot.connected,
    patientObject: snapshot.patientObject,
    warnings: snapshot.warnings,
    patients: snapshot.patients,
  });
}
