/**
 * Tests: login specificity, signup→logout→login, admin approve → loved ones.
 */
import { createRequire } from "node:module";
import { CookieJar } from "./_cookie-jar.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const BASE = process.env.CARE_CIRCLE_BASE || "http://127.0.0.1:3000";
const ADMIN_EMAIL = "admin@carecircle.example";
const ADMIN_PASS = "AdminSecurePass1!";

const results = [];
function report(name, status, detail = "") {
  results.push({ name, status, detail });
  console.log(`[${status.padEnd(7)}] ${name}${detail ? " — " + detail : ""}`);
}

async function login(email, password) {
  const jar = new CookieJar();
  const csrf = await (await jar.fetch(`${BASE}/api/auth/csrf`)).json();
  const res = await jar.fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    redirect: "manual",
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/`,
      json: "true",
    }),
  });
  const hasSession =
    jar.header().includes("authjs.session-token") ||
    jar.header().includes("__Secure-authjs.session-token");
  return { jar, res, hasSession };
}

async function api(jar, path, init = {}) {
  const res = await jar.fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { res, data };
}

async function main() {
  const db = new Database("data/carecircle-auth.sqlite");

  // --- Login error specificity ---
  {
    const missing = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody-unique@example.com", password: "x" }),
    });
    const missingData = await missing.json();
    report(
      "Login: unknown email is specific",
      missing.status === 401 && missingData.code === "ACCOUNT_NOT_FOUND"
        ? "PASS"
        : "FAIL",
      `${missing.status} ${missingData.code}`,
    );
  }

  {
    // Use an account that exists; wrong password
    const email = "jasmin@example.com";
    const wrong = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "DefinitelyWrongPassword!!" }),
    });
    const wrongData = await wrong.json();
    report(
      "Login: wrong password is specific",
      wrong.status === 401 && wrongData.code === "WRONG_PASSWORD" ? "PASS" : "FAIL",
      `${wrong.status} ${wrongData.code}`,
    );
  }

  // --- Signup → login → refresh ---
  const email = `cycle${Date.now()}@example.com`;
  const password = "CyclePass123!";
  {
    const reg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        confirmPassword: password,
        firstName: "Cycle",
        lastName: "Tester",
        preferredLanguage: "English",
        accountType: "family_caregiver",
        termsAccepted: true,
      }),
    });
    const regData = await reg.json();
    const persisted = db
      .prepare("SELECT email, account_type, password_hash FROM users WHERE email=?")
      .get(email);
    report(
      "Signup persists account + password hash",
      reg.status === 201 && persisted?.password_hash?.startsWith("$2b$")
        ? "PASS"
        : "FAIL",
      `${reg.status} ${persisted?.email || ""}`,
    );

    const { hasSession } = await login(email, password);
    report(
      "Login after signup establishes session",
      hasSession ? "PASS" : "FAIL",
      hasSession ? "session cookie set" : "no session",
    );

    // "Logout" = new jar without cookie; login again
    const again = await login(email, password);
    const me = await api(again.jar, "/api/account");
    report(
      "Logout → login → session refresh",
      again.hasSession && me.res.ok && me.data?.profile?.email === email
        ? "PASS"
        : "FAIL",
      `${me.res.status} ${me.data?.profile?.email || me.data?.error || ""}`,
    );
  }

  // --- Existing accounts: hashes present, not wiped ---
  {
    const rows = db
      .prepare(
        `SELECT email, length(password_hash) AS len, account_type FROM users
         WHERE email IN ('juan@example.com','yo@example.com','jasmin@example.com','fish@example.com','demo@example.com')`,
      )
      .all();
    const ok =
      rows.length === 5 && rows.every((r) => r.len === 60);
    report(
      "Existing accounts preserved with password hashes",
      ok ? "PASS" : "FAIL",
      rows.map((r) => r.email).join(", "),
    );
  }

  // --- Admin login + dashboard ---
  let adminJar;
  {
    const check = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
    });
    const checkData = await check.json();
    const logged = await login(ADMIN_EMAIL, ADMIN_PASS);
    adminJar = logged.jar;
    report(
      "Admin can sign in",
      check.ok &&
        checkData.redirectTo === "/admin" &&
        logged.hasSession
        ? "PASS"
        : "FAIL",
      `${check.status} redirect=${checkData.redirectTo} session=${logged.hasSession}`,
    );

    const dash = await adminJar.fetch(`${BASE}/admin`);
    const html = await dash.text();
    report(
      "Admin dashboard loads",
      dash.status === 200 && /Admin Dashboard|administración/i.test(html)
        ? "PASS"
        : "FAIL",
      `status=${dash.status}`,
    );
  }

  // --- Public signup cannot create admin ---
  {
    const reg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `eviladmin${Date.now()}@example.com`,
        password: "EvilAdmin99!",
        confirmPassword: "EvilAdmin99!",
        firstName: "Evil",
        lastName: "Admin",
        accountType: "admin",
        termsAccepted: true,
      }),
    });
    const data = await reg.json();
    const row = db
      .prepare("SELECT account_type FROM users WHERE email=?")
      .get(data?.user?.email || "");
    report(
      "Public signup cannot create Admin",
      reg.status === 201 && data?.user?.accountType === "family_caregiver"
        ? "PASS"
        : "FAIL",
      `${reg.status} type=${data?.user?.accountType} db=${row?.account_type}`,
    );
  }

  // --- Invite → admin approve → loved ones ---
  {
    // Create pending request: patient juan creates invite, caregiver cycle user redeems
    // Need onboarded caregiver with meridian link — use a dedicated caregiver
    const cgEmail = `cgadmin${Date.now()}@example.com`;
    const cgPass = "CaregiverPass123!";
    await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cgEmail,
        password: cgPass,
        confirmPassword: cgPass,
        firstName: "Pending",
        lastName: "Caregiver",
        accountType: "family_caregiver",
        termsAccepted: true,
      }),
    });
    // Mark onboarded without Meridian by updating? Redeem will ensureLiveCaregiverProfile.
    // Patient must create invite — need juan session. We don't know juan password.
    // Use fish patient? unknown password too.
    // Create a fresh patient account, onboard via Meridian if possible, or
    // insert invite row pointing at existing juan meridian ids for the new patient user.
    // Better approach: use admin to create invite on behalf? Not supported.
    // Use API as: create patient user, copy meridian link from juan for test only? That would be fake linking.
    // Instead: create invite in SQLite for juan patient user id, redeem as new caregiver.

    const juan = db.prepare(`SELECT * FROM users WHERE email='juan@example.com'`).get();
    const inviteId = crypto.randomUUID();
    const code = "ADMTEST1";
    db.prepare(`DELETE FROM patient_invites WHERE code=?`).run(code);
    db.prepare(
      `INSERT INTO patient_invites (
        id, code, patient_user_id, meridian_patient_id, meridian_patient_business_id,
        relationship_hint, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, 'Family Member', ?, ?)`,
    ).run(
      inviteId,
      code,
      juan.id,
      juan.meridian_patient_id,
      juan.meridian_patient_business_id,
      new Date().toISOString(),
      new Date(Date.now() + 86400000 * 2).toISOString(),
    );

    const cgLogin = await login(cgEmail, cgPass);
    const redeem = await api(cgLogin.jar, "/api/invites", {
      method: "POST",
      body: JSON.stringify({
        action: "redeem",
        code,
        relationshipType: "Family Member",
      }),
    });
    report(
      "Invite redeem → pending_approval",
      redeem.res.ok && redeem.data.status === "pending_approval" ? "PASS" : "FAIL",
      `${redeem.res.status} ${redeem.data.status || redeem.data.error || ""}`,
    );
    if (!redeem.res.ok) {
      console.log("redeem", JSON.stringify(redeem.data).slice(0, 400));
    }

    const requestId = redeem.data.request?.id;
    const pendingList = await api(
      adminJar,
      "/api/admin/connections?status=pending_approval",
    );
    const listed = (pendingList.data.requests || []).some((r) => r.id === requestId);
    report(
      "Admin sees pending connection request",
      pendingList.res.ok && listed ? "PASS" : "FAIL",
      `listed=${listed} count=${(pendingList.data.requests || []).length}`,
    );

    const approve = await api(adminJar, `/api/connections/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ decision: "approve" }),
    });
    const active =
      approve.res.ok &&
      /^active$/i.test(approve.data.membership?.status || "");
    report(
      "Admin approval sets Meridian membership Active",
      active ? "PASS" : "FAIL",
      `${approve.res.status} ${approve.data.membership?.status || approve.data.error || approve.data.detail || ""}`,
    );
    if (!active) console.log("approve", JSON.stringify(approve.data).slice(0, 500));

    // Caregiver loved ones
    // Session may still have empty meridian ids in JWT but requireAppUser reads DB.
    // Re-login to be safe after ensureLiveCaregiverProfile wrote IDs.
    const cgAgain = await login(cgEmail, cgPass);
    const loved = await cgAgain.jar.fetch(`${BASE}/patients`);
    const html = await loved.text();
    const seesJuan =
      html.includes(juan.meridian_patient_business_id) ||
      html.includes(juan.first_name);
    report(
      "Approved patient appears under caregiver My Loved Ones",
      seesJuan ? "PASS" : "FAIL",
      seesJuan ? "juan visible" : "juan not visible",
    );
  }

  console.log("\n=== SUMMARY ===");
  for (const r of results) {
    console.log(`${r.status}\t${r.name}${r.detail ? " | " + r.detail : ""}`);
  }
  process.exit(results.some((r) => r.status === "FAIL") ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
