import { NextResponse } from "next/server";
import {
  getIdentity,
  requireIdentity,
  requireTeamRole,
  type Identity,
} from "../../cursor/identity";

export { getIdentity, requireIdentity, requireTeamRole };
export type { Identity };

const READ_ROLES = ["admin", "member", "service"] as const;

/** Require a signed-in Cursor viewer (or simulated local viewer). */
export async function requireAppUser(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  const reader = requireTeamRole(identity, [...READ_ROLES]);
  if (reader instanceof Response) {
    // Private-app viewers may have no teamRole — admit verified people.
    if (identity.kind === "person" && identity.verified) {
      return identity;
    }
    return reader;
  }
  return reader;
}

export function privateJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(data, { ...init, headers });
}

export async function getViewerFromHeaders(headerList: Headers) {
  return getIdentity(headerList);
}
