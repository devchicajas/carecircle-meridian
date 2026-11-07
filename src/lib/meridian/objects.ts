/** Exact Meridian object API names exposed for this tenant (read-only). */
export const MERIDIAN_OBJECTS = {
  patient: "patient",
  caregiver: "caregiver",
  carePlan: "carePlan",
  appointment: "appointment",
  medication: "medication",
  careTask: "careTask",
  notification: "notification",
} as const;

export type MeridianObjectKey = keyof typeof MERIDIAN_OBJECTS;

export const EXPOSED_OBJECT_NAMES = Object.values(MERIDIAN_OBJECTS);

/** Intentionally unexposed — do not call. */
export const UNEXPOSED_OBJECTS = [
  "auditEvent",
  "platform_issue",
  "recordsDirectlyIn",
] as const;
