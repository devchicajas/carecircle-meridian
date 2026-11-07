import { NextResponse } from "next/server";
import { getPatientById } from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await getPatientById(decodeURIComponent(id));
  if (!result.patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
