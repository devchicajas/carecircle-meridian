import { NextResponse } from "next/server";
import { updateTaskStatus } from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const body = (await request.json()) as { status?: string };
    if (!body.status || typeof body.status !== "string") {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }
    const task = await updateTaskStatus(decodeURIComponent(id), body.status);
    return NextResponse.json({ task });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return NextResponse.json(
        {
          error: err.detail || err.message,
          code: err.code,
          traceId: err.traceId,
        },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
