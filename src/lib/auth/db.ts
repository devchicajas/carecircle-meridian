import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AccountType } from "@/lib/account/types";

export type AuthUserRow = {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  preferred_language: "English" | "Spanish";
  account_type: AccountType;
  meridian_patient_id: string | null;
  meridian_patient_business_id: string | null;
  meridian_caregiver_id: string | null;
  meridian_caregiver_business_id: string | null;
  onboarded: number;
  created_at: string;
  updated_at: string;
};

const DB_PATH =
  process.env.CARECIRCLE_AUTH_DB?.trim() ||
  join(process.cwd(), "data", "carecircle-auth.sqlite");

let dbSingleton: Database.Database | null = null;

function migrateAccountTypeConstraint(db: Database.Database) {
  const row = db
    .prepare(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`,
    )
    .get() as { sql?: string } | undefined;
  const sql = row?.sql || "";
  if (sql.includes("'admin'")) return;

  db.exec(`
    BEGIN;
    CREATE TABLE users_migrated (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      preferred_name TEXT,
      preferred_language TEXT NOT NULL DEFAULT 'English',
      account_type TEXT NOT NULL CHECK(account_type IN ('patient', 'family_caregiver', 'admin')),
      meridian_patient_id TEXT,
      meridian_patient_business_id TEXT,
      meridian_caregiver_id TEXT,
      meridian_caregiver_business_id TEXT,
      onboarded INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO users_migrated SELECT * FROM users;
    DROP TABLE users;
    ALTER TABLE users_migrated RENAME TO users;
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    COMMIT;
  `);
}

export function getAuthDb() {
  if (dbSingleton) return dbSingleton;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      preferred_name TEXT,
      preferred_language TEXT NOT NULL DEFAULT 'English',
      account_type TEXT NOT NULL CHECK(account_type IN ('patient', 'family_caregiver', 'admin')),
      meridian_patient_id TEXT,
      meridian_patient_business_id TEXT,
      meridian_caregiver_id TEXT,
      meridian_caregiver_business_id TEXT,
      onboarded INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
  migrateAccountTypeConstraint(db);
  dbSingleton = db;
  return db;
}

export function findUserByEmail(email: string): AuthUserRow | null {
  const row = getAuthDb()
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim()) as AuthUserRow | undefined;
  return row ?? null;
}

export function findUserById(id: string): AuthUserRow | null {
  const row = getAuthDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as AuthUserRow | undefined;
  return row ?? null;
}

export function listUsers(): AuthUserRow[] {
  return getAuthDb()
    .prepare(`SELECT * FROM users ORDER BY created_at DESC`)
    .all() as AuthUserRow[];
}

export function countUsersByAccountType(accountType: AccountType) {
  const row = getAuthDb()
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE account_type = ?`)
    .get(accountType) as { c: number };
  return row.c;
}

export function insertUser(input: {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  preferredLanguage: "English" | "Spanish";
  accountType: AccountType;
  onboarded?: boolean;
}) {
  const now = new Date().toISOString();
  getAuthDb()
    .prepare(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, preferred_language,
        account_type, onboarded, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.firstName.trim(),
      input.lastName.trim(),
      input.preferredLanguage,
      input.accountType,
      input.onboarded ? 1 : 0,
      now,
      now,
    );
  return findUserById(input.id)!;
}

export function updateUserProfile(
  id: string,
  patch: Partial<{
    firstName: string;
    lastName: string;
    preferredName: string | null;
    preferredLanguage: "English" | "Spanish";
    accountType: AccountType;
    meridianPatientId: string | null;
    meridianPatientBusinessId: string | null;
    meridianCaregiverId: string | null;
    meridianCaregiverBusinessId: string | null;
    onboarded: boolean;
    passwordHash: string;
  }>,
) {
  const current = findUserById(id);
  if (!current) return null;
  const next = {
    first_name: patch.firstName ?? current.first_name,
    last_name: patch.lastName ?? current.last_name,
    preferred_name:
      patch.preferredName !== undefined
        ? patch.preferredName
        : current.preferred_name,
    preferred_language: patch.preferredLanguage ?? current.preferred_language,
    account_type: patch.accountType ?? current.account_type,
    meridian_patient_id:
      patch.meridianPatientId !== undefined
        ? patch.meridianPatientId
        : current.meridian_patient_id,
    meridian_patient_business_id:
      patch.meridianPatientBusinessId !== undefined
        ? patch.meridianPatientBusinessId
        : current.meridian_patient_business_id,
    meridian_caregiver_id:
      patch.meridianCaregiverId !== undefined
        ? patch.meridianCaregiverId
        : current.meridian_caregiver_id,
    meridian_caregiver_business_id:
      patch.meridianCaregiverBusinessId !== undefined
        ? patch.meridianCaregiverBusinessId
        : current.meridian_caregiver_business_id,
    onboarded:
      patch.onboarded !== undefined
        ? patch.onboarded
          ? 1
          : 0
        : current.onboarded,
    password_hash: patch.passwordHash ?? current.password_hash,
    updated_at: new Date().toISOString(),
  };
  getAuthDb()
    .prepare(
      `UPDATE users SET
        first_name = ?, last_name = ?, preferred_name = ?, preferred_language = ?,
        account_type = ?,
        meridian_patient_id = ?, meridian_patient_business_id = ?,
        meridian_caregiver_id = ?, meridian_caregiver_business_id = ?,
        onboarded = ?, password_hash = ?, updated_at = ?
      WHERE id = ?`,
    )
    .run(
      next.first_name,
      next.last_name,
      next.preferred_name,
      next.preferred_language,
      next.account_type,
      next.meridian_patient_id,
      next.meridian_patient_business_id,
      next.meridian_caregiver_id,
      next.meridian_caregiver_business_id,
      next.onboarded,
      next.password_hash,
      next.updated_at,
      id,
    );
  return findUserById(id);
}

export function toPublicUser(row: AuthUserRow) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name || undefined,
    preferredLanguage: row.preferred_language,
    accountType: row.account_type,
    role: row.account_type as AccountType,
    meridianPatientId: row.meridian_patient_id || undefined,
    meridianPatientBusinessId: row.meridian_patient_business_id || undefined,
    meridianCaregiverId: row.meridian_caregiver_id || undefined,
    meridianCaregiverBusinessId: row.meridian_caregiver_business_id || undefined,
    onboarded: row.onboarded === 1 || row.account_type === "admin",
  };
}
