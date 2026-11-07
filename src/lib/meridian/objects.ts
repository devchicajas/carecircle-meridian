/** Exact Meridian object API keys for this CareCircle tenant. */
export const MERIDIAN_OBJECTS = {
  patient: "patient",
  caregiver: "caregiver",
  careCircleMembership: "careCircleMembership",
  carePlan: "carePlan",
  appointment: "appointment",
  medication: "medication",
  careTask: "careTask",
  notification: "notification",
} as const;

export type MeridianObjectKey = keyof typeof MERIDIAN_OBJECTS;

export const EXPOSED_OBJECT_NAMES = Object.values(MERIDIAN_OBJECTS);

/** Do not call these from CareCircle product flows. */
export const OUT_OF_SCOPE_OBJECTS = ["platform_issue", "auditEvent"] as const;
