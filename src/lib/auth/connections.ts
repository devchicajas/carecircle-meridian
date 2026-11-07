import { randomBytes } from "node:crypto";
import { getAuthDb } from "@/lib/auth/db";

export type InviteStatus = "active" | "revoked" | "redeemed" | "expired";

export type PatientInviteRow = {
  id: string;
  code: string;
  patient_user_id: string;
  meridian_patient_id: string;
  meridian_patient_business_id: string | null;
  relationship_hint: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  redeemed_at: string | null;
  redeemed_by_caregiver_user_id: string | null;
};

export type ConnectionRequestRow = {
  id: string;
  invite_id: string;
  patient_user_id: string;
  caregiver_user_id: string;
  meridian_patient_id: string;
  meridian_patient_business_id: string | null;
  meridian_caregiver_id: string;
  meridian_caregiver_business_id: string | null;
  relationship_type: string;
  status: "pending_approval" | "approved" | "rejected";
  meridian_membership_id: string | null;
  meridian_membership_business_id: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
  decided_by_user_id: string | null;
};

function ensureTables() {
  const db = getAuthDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS patient_invites (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      patient_user_id TEXT NOT NULL,
      meridian_patient_id TEXT NOT NULL,
      meridian_patient_business_id TEXT,
      relationship_hint TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      redeemed_at TEXT,
      redeemed_by_caregiver_user_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_patient_invites_code ON patient_invites(code);
    CREATE INDEX IF NOT EXISTS idx_patient_invites_patient ON patient_invites(patient_user_id);

    CREATE TABLE IF NOT EXISTS connection_requests (
      id TEXT PRIMARY KEY NOT NULL,
      invite_id TEXT NOT NULL,
      patient_user_id TEXT NOT NULL,
      caregiver_user_id TEXT NOT NULL,
      meridian_patient_id TEXT NOT NULL,
      meridian_patient_business_id TEXT,
      meridian_caregiver_id TEXT NOT NULL,
      meridian_caregiver_business_id TEXT,
      relationship_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending_approval','approved','rejected')),
      meridian_membership_id TEXT,
      meridian_membership_business_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      decided_at TEXT,
      decided_by_user_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_connection_requests_patient ON connection_requests(patient_user_id);
    CREATE INDEX IF NOT EXISTS idx_connection_requests_caregiver ON connection_requests(caregiver_user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_requests_pair_pending
      ON connection_requests(patient_user_id, caregiver_user_id, status)
      WHERE status = 'pending_approval';
  `);

  // Migrate older invite rows that lack revoked_at / relationship_hint.
  const cols = db
    .prepare(`PRAGMA table_info(patient_invites)`)
    .all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("revoked_at")) {
    db.exec(`ALTER TABLE patient_invites ADD COLUMN revoked_at TEXT`);
  }
  if (!names.has("relationship_hint")) {
    db.exec(`ALTER TABLE patient_invites ADD COLUMN relationship_hint TEXT`);
  }
}

function generateCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function createPatientInvite(input: {
  patientUserId: string;
  meridianPatientId: string;
  meridianPatientBusinessId?: string | null;
  relationshipHint?: string | null;
  ttlHours?: number;
}) {
  ensureTables();
  const now = new Date();
  const expires = new Date(
    now.getTime() + (input.ttlHours ?? 72) * 60 * 60 * 1000,
  );
  const id = crypto.randomUUID();
  let code = generateCode();
  for (let i = 0; i < 8; i++) {
    try {
      getAuthDb()
        .prepare(
          `INSERT INTO patient_invites (
            id, code, patient_user_id, meridian_patient_id,
            meridian_patient_business_id, relationship_hint,
            created_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          code,
          input.patientUserId,
          input.meridianPatientId,
          input.meridianPatientBusinessId ?? null,
          input.relationshipHint ?? null,
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
  ensureTables();
  const row = getAuthDb()
    .prepare("SELECT * FROM patient_invites WHERE code = ? COLLATE NOCASE")
    .get(code.trim().toUpperCase()) as PatientInviteRow | undefined;
  return row ?? null;
}

export function classifyInvite(
  invite: PatientInviteRow | null,
): {
  state:
    | "invalid"
    | "expired"
    | "revoked"
    | "redeemed"
    | "usable";
  invite: PatientInviteRow | null;
} {
  if (!invite) return { state: "invalid", invite: null };
  if (invite.revoked_at) return { state: "revoked", invite };
  if (invite.redeemed_at) return { state: "redeemed", invite };
  if (invite.expires_at < new Date().toISOString()) {
    return { state: "expired", invite };
  }
  return { state: "usable", invite };
}

export function listInvitesForPatient(patientUserId: string) {
  ensureTables();
  return getAuthDb()
    .prepare(
      `SELECT * FROM patient_invites
       WHERE patient_user_id = ?
       ORDER BY created_at DESC`,
    )
    .all(patientUserId) as PatientInviteRow[];
}

export function revokeInvite(input: {
  inviteId: string;
  patientUserId: string;
}) {
  ensureTables();
  const result = getAuthDb()
    .prepare(
      `UPDATE patient_invites
       SET revoked_at = ?
       WHERE id = ?
         AND patient_user_id = ?
         AND redeemed_at IS NULL
         AND revoked_at IS NULL`,
    )
    .run(new Date().toISOString(), input.inviteId, input.patientUserId);
  return result.changes > 0;
}

export function markInviteRedeemed(input: {
  inviteId: string;
  caregiverUserId: string;
}) {
  ensureTables();
  const result = getAuthDb()
    .prepare(
      `UPDATE patient_invites
       SET redeemed_at = ?, redeemed_by_caregiver_user_id = ?
       WHERE id = ? AND redeemed_at IS NULL AND revoked_at IS NULL`,
    )
    .run(new Date().toISOString(), input.caregiverUserId, input.inviteId);
  return result.changes > 0;
}

export function findPendingConnection(
  patientUserId: string,
  caregiverUserId: string,
) {
  ensureTables();
  return (
    (getAuthDb()
      .prepare(
        `SELECT * FROM connection_requests
         WHERE patient_user_id = ?
           AND caregiver_user_id = ?
           AND status = 'pending_approval'
         LIMIT 1`,
      )
      .get(patientUserId, caregiverUserId) as
      | ConnectionRequestRow
      | undefined) ?? null
  );
}

export function findApprovedConnection(
  patientUserId: string,
  caregiverUserId: string,
) {
  ensureTables();
  return (
    (getAuthDb()
      .prepare(
        `SELECT * FROM connection_requests
         WHERE patient_user_id = ?
           AND caregiver_user_id = ?
           AND status = 'approved'
         ORDER BY decided_at DESC
         LIMIT 1`,
      )
      .get(patientUserId, caregiverUserId) as
      | ConnectionRequestRow
      | undefined) ?? null
  );
}

export function createConnectionRequest(input: {
  inviteId: string;
  patientUserId: string;
  caregiverUserId: string;
  meridianPatientId: string;
  meridianPatientBusinessId?: string | null;
  meridianCaregiverId: string;
  meridianCaregiverBusinessId?: string | null;
  relationshipType: string;
  meridianMembershipId?: string | null;
  meridianMembershipBusinessId?: string | null;
}) {
  ensureTables();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  getAuthDb()
    .prepare(
      `INSERT INTO connection_requests (
        id, invite_id, patient_user_id, caregiver_user_id,
        meridian_patient_id, meridian_patient_business_id,
        meridian_caregiver_id, meridian_caregiver_business_id,
        relationship_type, status,
        meridian_membership_id, meridian_membership_business_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.inviteId,
      input.patientUserId,
      input.caregiverUserId,
      input.meridianPatientId,
      input.meridianPatientBusinessId ?? null,
      input.meridianCaregiverId,
      input.meridianCaregiverBusinessId ?? null,
      input.relationshipType,
      input.meridianMembershipId ?? null,
      input.meridianMembershipBusinessId ?? null,
      now,
      now,
    );
  return findConnectionById(id)!;
}

export function findConnectionById(id: string) {
  ensureTables();
  return (
    (getAuthDb()
      .prepare(`SELECT * FROM connection_requests WHERE id = ?`)
      .get(id) as ConnectionRequestRow | undefined) ?? null
  );
}

export function listConnectionRequestsForPatient(patientUserId: string) {
  ensureTables();
  return getAuthDb()
    .prepare(
      `SELECT * FROM connection_requests
       WHERE patient_user_id = ?
       ORDER BY created_at DESC`,
    )
    .all(patientUserId) as ConnectionRequestRow[];
}

export function listConnectionRequestsForCaregiver(caregiverUserId: string) {
  ensureTables();
  return getAuthDb()
    .prepare(
      `SELECT * FROM connection_requests
       WHERE caregiver_user_id = ?
       ORDER BY created_at DESC`,
    )
    .all(caregiverUserId) as ConnectionRequestRow[];
}

export function listAllConnectionRequests(status?: ConnectionRequestRow["status"]) {
  ensureTables();
  if (status) {
    return getAuthDb()
      .prepare(
        `SELECT * FROM connection_requests
         WHERE status = ?
         ORDER BY created_at DESC`,
      )
      .all(status) as ConnectionRequestRow[];
  }
  return getAuthDb()
    .prepare(
      `SELECT * FROM connection_requests ORDER BY created_at DESC`,
    )
    .all() as ConnectionRequestRow[];
}

export function decideConnectionRequest(input: {
  requestId: string;
  status: "approved" | "rejected";
  decidedByUserId: string;
  meridianMembershipId?: string | null;
  meridianMembershipBusinessId?: string | null;
}) {
  ensureTables();
  const now = new Date().toISOString();
  const result = getAuthDb()
    .prepare(
      `UPDATE connection_requests
       SET status = ?,
           updated_at = ?,
           decided_at = ?,
           decided_by_user_id = ?,
           meridian_membership_id = COALESCE(?, meridian_membership_id),
           meridian_membership_business_id = COALESCE(?, meridian_membership_business_id)
       WHERE id = ? AND status = 'pending_approval'`,
    )
    .run(
      input.status,
      now,
      now,
      input.decidedByUserId,
      input.meridianMembershipId ?? null,
      input.meridianMembershipBusinessId ?? null,
      input.requestId,
    );
  return result.changes > 0 ? findConnectionById(input.requestId) : null;
}
