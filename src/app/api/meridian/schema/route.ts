import { NextResponse } from "next/server";
import { discoverCareCircleSchema } from "@/lib/meridian/discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  const schema = await discoverCareCircleSchema();
  return NextResponse.json(schema);
}
