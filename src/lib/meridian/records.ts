import { pickString } from "@/lib/utils";

/** Flatten Meridian list/get envelope: fields live under `payload`. */
export function flattenRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const payload =
    record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
      ? (record.payload as Record<string, unknown>)
      : {};
  const values =
    record.values && typeof record.values === "object" && !Array.isArray(record.values)
      ? (record.values as Record<string, unknown>)
      : {};

  return {
    ...payload,
    ...values,
    // Keep envelope metadata available
    id: record.id ?? payload.id,
    objectKey: record.objectKey,
    createdAt: record.createdAt ?? payload.createdAt,
    updatedAt: record.updatedAt ?? payload.updatedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    _raw: record,
  };
}

export function composePersonName(fields: Record<string, unknown>) {
  const preferred = pickString(fields, ["preferredName", "preferred_name"]);
  if (preferred) return preferred;
  const parts = [
    pickString(fields, ["firstName", "first_name"]),
    pickString(fields, ["middleName", "middle_name"]),
    pickString(fields, ["lastName", "last_name"]),
  ].filter(Boolean);
  return parts.join(" ") || "Unnamed";
}

export function recordEnvelopeId(record: Record<string, unknown>) {
  return String(record.id ?? "");
}
