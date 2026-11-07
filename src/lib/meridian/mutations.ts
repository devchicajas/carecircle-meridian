import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  normalizeTask,
  type CareTask,
  type NotificationItem,
  type Patient,
  type Caregiver,
} from "@/lib/meridian/care-data";
import { flattenRecord, composePersonName, recordEnvelopeId } from "@/lib/meridian/records";
import {
  createPlatformSDKFromEnv,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

function requireSdk() {
  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required.",
    });
  }
  return sdk;
}

function asPatient(envelope: Record<string, unknown>): Patient {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["patientId"]),
    name: composePersonName(f),
    firstName: pickString(f, ["firstName"]),
    lastName: pickString(f, ["lastName"]),
    status: pickString(f, ["careStatus", "status"]) || "Unknown",
    language: pickString(f, ["preferredLanguage"]),
    phone: pickString(f, ["phoneNumber", "phone"]),
    email: pickString(f, ["emailAddress", "email"]),
    dateOfBirth: pickString(f, ["dateOfBirth"]),
    careStartDate: pickString(f, ["careStartDate"]),
    updatedAt: pickString(f, ["updatedAt"]),
    raw: envelope,
  };
}

function asCaregiver(envelope: Record<string, unknown>): Caregiver {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["caregiverId"]),
    name: composePersonName(f),
    role: pickString(f, ["caregiverType"]),
    language: pickString(f, ["preferredLanguage"]),
    phone: pickString(f, ["phoneNumber"]),
    email: pickString(f, ["emailAddress", "email"]),
    status: pickString(f, ["status"]) || "Unknown",
    raw: envelope,
  };
}

function asNotification(envelope: Record<string, unknown>): NotificationItem {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["notificationId", "id"]),
    patientRef: pickString(f, ["patient"]),
    recipientCaregiver: pickString(f, ["recipientCaregiver"]),
    relatedTask: pickString(f, ["relatedTask"]),
    relatedAppointment: pickString(f, ["relatedAppointment"]),
    message: pickString(f, ["message"]) || "Notification",
    notificationType: pickString(f, ["notificationType"]),
    status: pickString(f, ["readStatus", "status"]) || "Unknown",
    createdAt: pickString(f, ["createdAt"]),
    raw: envelope,
  };
}

export async function updatePatientProfile(
  id: string,
  values: Record<string, unknown>,
) {
  const sdk = requireSdk();
  // Never send patientId on update unless intentionally changing it.
  const { patientId: _ignored, ...safe } = values;
  const updated = await sdk.updateRecord(
    MERIDIAN_OBJECTS.patient,
    id,
    safe,
    "CareCircle demo: update patient profile",
  );
  return asPatient(updated as Record<string, unknown>);
}

export async function updateCaregiverProfile(
  id: string,
  values: Record<string, unknown>,
) {
  const sdk = requireSdk();
  const { caregiverId: _ignored, ...safe } = values;
  const updated = await sdk.updateRecord(
    MERIDIAN_OBJECTS.caregiver,
    id,
    safe,
    "CareCircle demo: update caregiver profile",
  );
  return asCaregiver(updated as Record<string, unknown>);
}

export async function createPatientProfile(values: {
  firstName: string;
  lastName: string;
  preferredLanguage?: string;
  careStatus?: string;
  emailAddress?: string;
  phoneNumber?: string;
  careStartDate?: string;
  preferredName?: string;
}) {
  const sdk = requireSdk();
  // Do not send patientId — Meridian must generate it.
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.patient,
    {
      firstName: values.firstName,
      lastName: values.lastName,
      preferredName: values.preferredName,
      preferredLanguage: values.preferredLanguage || "English",
      careStatus: values.careStatus || "Routine Care",
      emailAddress: values.emailAddress,
      phoneNumber: values.phoneNumber,
      careStartDate: values.careStartDate,
    },
    "CareCircle demo: create patient profile",
  );
  return asPatient(created as Record<string, unknown>);
}

export async function createCaregiverProfile(values: {
  firstName: string;
  lastName: string;
  caregiverType?: string;
  preferredLanguage?: string;
  status?: string;
  emailAddress?: string;
  phoneNumber?: string;
}) {
  const sdk = requireSdk();
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.caregiver,
    {
      firstName: values.firstName,
      lastName: values.lastName,
      caregiverType: values.caregiverType || "Family Caregiver",
      preferredLanguage: values.preferredLanguage || "English",
      status: values.status || "Active",
      emailAddress: values.emailAddress,
      phoneNumber: values.phoneNumber,
    },
    "CareCircle demo: create caregiver profile",
  );
  return asCaregiver(created as Record<string, unknown>);
}

export async function createNotification(values: {
  patient: string;
  recipientCaregiver: string;
  message: string;
  notificationType:
    | "Appointment Reminder"
    | "Task Assignment"
    | "Task Overdue"
    | "Task Completed"
    | string;
  relatedTask?: string;
  relatedAppointment?: string;
  readStatus?: string;
}) {
  const sdk = requireSdk();
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.notification,
    {
      patient: values.patient,
      recipientCaregiver: values.recipientCaregiver,
      message: values.message,
      notificationType: values.notificationType,
      relatedTask: values.relatedTask,
      relatedAppointment: values.relatedAppointment,
      readStatus: values.readStatus || "Unread",
      // Required by Meridian runtime validation (not always in OpenAPI props)
      recipientRole: "Caregiver",
    },
    "CareCircle demo: create notification",
  );
  return asNotification(created as Record<string, unknown>);
}

export async function createCareTaskSafe(values: {
  patient: string;
  description: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  assignedCaregiver?: string;
  carePlan?: string;
}): Promise<CareTask> {
  const sdk = requireSdk();
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.careTask,
    {
      patient: values.patient,
      description: values.description,
      priority: values.priority || "Medium",
      status: values.status || "Pending",
      dueDate: values.dueDate,
      assignedCaregiver: values.assignedCaregiver,
      carePlan: values.carePlan,
    },
    "CareCircle demo: create care task",
  );
  return normalizeTask(created as Record<string, unknown>);
}
