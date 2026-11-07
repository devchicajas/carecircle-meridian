/**
 * Secure Admin provisioning — NOT public signup.
 *
 * Usage:
 *   CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN=... node scripts/provision-admin.mjs \
 *     --email admin@example.com --password '...' --first Admin --last User
 *
 * Or call the authenticated bootstrap API with the same token header.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

loadEnvLocal();

const email = arg("email");
const password = arg("password");
const firstName = arg("first", "CareCircle");
const lastName = arg("last", "Admin");
const token =
  arg("token") || process.env.CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN || "";

if (!email || !password) {
  console.error(
    "Usage: node scripts/provision-admin.mjs --email admin@example.com --password '...' [--first Name] [--last Name]",
  );
  process.exit(1);
}
if (!token) {
  console.error("Set CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN in .env.local or --token");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { randomUUID, timingSafeEqual } = require("node:crypto");
const { hash } = require("bcryptjs");
const Database = require("better-sqlite3");

function assertToken(provided, expected) {
  const a = Buffer.from(String(provided || ""));
  const b = Buffer.from(String(expected || ""));
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid admin bootstrap token.");
  }
}

assertToken(token, process.env.CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN);

const db = new Database(
  process.env.CARECIRCLE_AUTH_DB || "data/carecircle-auth.sqlite",
);
db.pragma("journal_mode = WAL");

// Ensure admin is allowed in CHECK constraint (same migration as app).
const tableSql = db
  .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`)
  .get()?.sql || "";
if (tableSql && !tableSql.includes("'admin'")) {
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

const passwordHash = await hash(password, 12);
const now = new Date().toISOString();
const existing = db
  .prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`)
  .get(email.trim().toLowerCase());

if (existing) {
  db.prepare(
    `UPDATE users SET
      password_hash = ?, first_name = ?, last_name = ?,
      account_type = 'admin', onboarded = 1, updated_at = ?
     WHERE id = ?`,
  ).run(passwordHash, firstName, lastName, now, existing.id);
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: existing.account_type === "admin" ? "updated" : "promoted",
        email: existing.email,
        id: existing.id,
      },
      null,
      2,
    ),
  );
} else {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (
      id, email, password_hash, first_name, last_name, preferred_language,
      account_type, onboarded, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'English', 'admin', 1, ?, ?)`,
  ).run(id, email.trim().toLowerCase(), passwordHash, firstName, lastName, now, now);
  console.log(JSON.stringify({ ok: true, action: "created", email, id }, null, 2));
}
