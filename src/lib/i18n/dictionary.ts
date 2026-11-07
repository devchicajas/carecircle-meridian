export type Locale = "en" | "es";

export const dictionaries = {
  en: {
    tagline: "Care shouldn't get lost in communication.",
    appName: "CareCircle",
    appNameEs: "Círculo de Cuidado",
    dashboard: "Dashboard",
    myLovedOnes: "My Loved Ones",
    carePlan: "Care Plan",
    careJourney: "Care Journey",
    appointments: "Appointments",
    myTasks: "My Tasks",
    notifications: "Notifications",
    medications: "Medications",
    careCircle: "Care Circle",
    myProfile: "My Profile",
    patients: "Patients",
    caregivers: "Caregivers",
    saveChanges: "Save Changes",
    signUp: "Sign Up",
    logIn: "Log In",
    logOut: "Log Out",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
    betterCare: "Better Care, Together.",
    betterCareSub:
      "Keep your loved ones' appointments, responsibilities, and care plans organized in one place.",
    welcome: "Welcome to CareCircle",
    onboarding: "Onboarding",
    account: "My Account",
    settings: "Profile Settings",
    unauthorized: "Unauthorized",
    sessionExpired: "Session Expired",
    language: "Language",
    continueCursor: "Continue with Cursor",
    demoOnly: "Synthetic demo — not for real patient data",
    safety:
      "CareCircle organizes care. It does not diagnose, prescribe, or replace healthcare professionals.",
  },
  es: {
    tagline: "El cuidado no debería perderse en la comunicación.",
    appName: "CareCircle",
    appNameEs: "Círculo de Cuidado",
    dashboard: "Panel de control",
    myLovedOnes: "Mis seres queridos",
    carePlan: "Plan de cuidados",
    careJourney: "Seguimiento de cuidados",
    appointments: "Citas",
    myTasks: "Mis tareas",
    notifications: "Notificaciones",
    medications: "Medicamentos",
    careCircle: "Círculo de cuidado",
    myProfile: "Mi perfil",
    patients: "Pacientes",
    caregivers: "Cuidadores",
    saveChanges: "Guardar cambios",
    signUp: "Registrarse",
    logIn: "Iniciar sesión",
    logOut: "Cerrar sesión",
    pending: "Pendiente",
    inProgress: "En progreso",
    completed: "Completado",
    overdue: "Vencido",
    betterCare: "Mejor cuidado, juntos.",
    betterCareSub:
      "Mantén las citas, responsabilidades y planes de cuidados de tus seres queridos organizados en un solo lugar.",
    welcome: "Bienvenido a CareCircle",
    onboarding: "Incorporación",
    account: "Mi cuenta",
    settings: "Configuración del perfil",
    unauthorized: "No autorizado",
    sessionExpired: "Sesión expirada",
    language: "Idioma",
    continueCursor: "Continuar con Cursor",
    demoOnly: "Demo sintética — no usar datos de pacientes reales",
    safety:
      "CareCircle organiza el cuidado. No diagnostica, no prescribe ni reemplaza a profesionales de la salud.",
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}

/** Display label for Meridian enum values — never mutate stored enums. */
export function statusLabel(status: string, locale: Locale): string {
  const key = status.trim().toLowerCase();
  const map: Record<string, { en: string; es: string }> = {
    pending: { en: "Pending", es: "Pendiente" },
    "in progress": { en: "In Progress", es: "En progreso" },
    completed: { en: "Completed", es: "Completado" },
    overdue: { en: "Overdue", es: "Vencido" },
    active: { en: "Active", es: "Activo" },
    inactive: { en: "Inactive", es: "Inactivo" },
    scheduled: { en: "Scheduled", es: "Programada" },
    cancelled: { en: "Cancelled", es: "Cancelada" },
    "on hold": { en: "On Hold", es: "En pausa" },
  };
  return map[key]?.[locale] || status;
}
