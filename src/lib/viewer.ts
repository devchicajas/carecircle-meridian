import { headers } from "next/headers";
import { getViewerFromHeaders } from "@/lib/auth";

export async function getPageViewer() {
  const headerList = await headers();
  return getViewerFromHeaders(headerList);
}
