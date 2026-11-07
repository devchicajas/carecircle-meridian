import type { Locale } from "@/lib/i18n/dictionary";

const messages = {
  invalid: {
    en: "That invite code is not valid.",
    es: "Ese código de invitación no es válido.",
  },
  expired: {
    en: "That invite code has expired. Ask the patient for a new one.",
    es: "Ese código de invitación venció. Pide uno nuevo al paciente.",
  },
  revoked: {
    en: "That invite was revoked by the patient.",
    es: "Esa invitación fue revocada por el paciente.",
  },
  redeemed: {
    en: "That invite code was already used.",
    es: "Ese código de invitación ya fue utilizado.",
  },
  caregiverNotLinked: {
    en: "Link your Family Caregiver profile before redeeming an invite.",
    es: "Vincula tu perfil de cuidador familiar antes de canjear una invitación.",
  },
  requestSubmitted: {
    en: "Connection request submitted. Waiting for approval before this person appears in My Loved Ones.",
    es: "Solicitud de conexión enviada. Espera la aprobación antes de que aparezca en Mis seres queridos.",
  },
  awaitingApproval: {
    en: "Awaiting approval",
    es: "En espera de aprobación",
  },
  approved: {
    en: "Connection approved. The patient is now in My Loved Ones.",
    es: "Conexión aprobada. El paciente ya está en Mis seres queridos.",
  },
  alreadyConnected: {
    en: "You are already connected to this patient.",
    es: "Ya estás conectado con este paciente.",
  },
  unauthorized: {
    en: "You are not authorized to perform this action.",
    es: "No tienes autorización para realizar esta acción.",
  },
  meridianError: {
    en: "Meridian could not complete this step. Try again or contact a coordinator.",
    es: "Meridian no pudo completar este paso. Inténtalo de nuevo o contacta a un coordinador.",
  },
  patientOnlyCreate: {
    en: "Only patient accounts can create invites.",
    es: "Solo las cuentas de paciente pueden crear invitaciones.",
  },
  caregiverOnlyRedeem: {
    en: "Only family caregiver accounts can redeem invites.",
    es: "Solo las cuentas de cuidador familiar pueden canjear invitaciones.",
  },
} as const;

export type InviteMessageKey = keyof typeof messages;

export function inviteMessage(key: InviteMessageKey, locale: Locale = "en") {
  return messages[key][locale] || messages[key].en;
}

export function inviteMessagesBoth(key: InviteMessageKey) {
  return { error: messages[key].en, errorEs: messages[key].es };
}
