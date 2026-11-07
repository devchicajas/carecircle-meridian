import { randomBytes } from "node:crypto";
import { getAuthDb } from "@/lib/auth/db";

export type PatientInviteRow = {
  id: string;
  code: string;
  patient_user_id: string;
  meridian_patient_id: string;
  meridian_patient_business_id: string | null;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by_caregiver_user_id: string | null;
};

function ensureInviteTable() {
  getAuthDb().exec(`
    CREATE TABLE IF NOT EXISTS patient_invites (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      patient_user_id TEXT NOT NULL,
      meridian_patient_id TEXT NOT NULL,
      meridian_patient_business_id TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      redeemed_at TEXT,
      redeemed_by_caregiver_user_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_patient_invites_code ON patient_invites(code);
    CREATE INDEX IF NOT EXISTS idx_patient_invites_patient ON patient_invites(patient_user_id);
  `);
}

function generateCode() {
  // Short human-enterable code (no patient ID leakage).
  return randomBytes(4).toString("hex").toUpperCase();
}

export function createPatientInvite(input: {
  patientUserId: string;
  meridianPatientId: string;
  meridianPatientBusinessId?: string | null;
  ttlHours?: number;
}) {
  ensureInviteTable();
  const now = new Date();
  const expires = new Date(
    now.getTime() + (input.ttlHours ?? 72) * 60 * 60 * 1000,
  );
  const id = crypto.randomUUID();
  let code = generateCode();
  // Rare collision retry
  for (let i = 0; i < 5; i++) {
    try {
      getAuthDb()
        .prepare(
          `INSERT INTO patient_invites (
            id, code, patient_user_id, meridian_patient_id,
            meridian_patient_business_id, created_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          code,
          input.patientUserId,
          input.meridianPatientId,
          input.meridianPatientBusinessId ?? null,
          now.toISOString(),
          expires.toISOString(),
        );
      return { id, code, expiresAt: expires.toISOString() };
    } catch {
      code = generateCode();
    }
  }
  throw new Error("Could not allocate invite code.");
}

export function findInviteByCode(code: string): PatientInviteRow | null {
  ensureInviteTable();
  const row = getAuthDb()
    .prepare("SELECT * FROM patient_invites WHERE code = ? COLLATE NOCASE")
    .get(code.trim().toUpperCase()) as PatientInviteRow | undefined;
  return row ?? null;
}

export function markInviteRedeemed(input: {
  inviteId: string;
  caregiverUserId: string;
}) {
  ensureInviteTable();
  getAuthDb()
    .prepare(
      `UPDATE patient_invites
       SET redeemed_at = ?, redeemed_by_caregiver_user_id = ?
       WHERE id = ? AND redeemed_at IS NULL`,
    )
    .run(new Date().toISOString(), input.caregiverUserId, input.inviteId);
}

export function listActiveInvitesForPatient(patientUserId: string) {
  ensureInviteTable();
  const now = new Date().toISOString();
  return getAuthDb()
    .prepare(
      `SELECT * FROM patient_invites
       WHERE patient_user_id = ?
         AND redeemed_at IS NULL
         AND expires_at >= ?
       ORDER BY created_at DESC`,
    )
    .all(patientUserId, now) as PatientInviteRow[];
}
