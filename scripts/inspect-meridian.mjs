#!/usr/bin/env node
/**
 * Live-inspect the tenant OpenAPI + list exposed CareCircle objects.
 * Requires MERIDIAN_API_KEY in the environment (published app) or .env.local.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const EXPECTED = [
  "patient",
  "caregiver",
  "carePlan",
  "appointment",
  "medication",
  "careTask",
  "notification",
];

const apiKey = process.env.MERIDIAN_API_KEY?.trim();
const baseUrl = (
  process.env.MERIDIAN_BASE_URL || "https://dev.lightleap.ai/meridian"
).replace(/\/$/, "");
const tenant =
  process.env.MERIDIAN_TENANT ||
  "carecircle-ci-rculo-de-cuidado-5fbd81";

if (!apiKey) {
  console.error(
    "MERIDIAN_API_KEY missing in this runtime. On Cursor publish it is injected; locally set .env.local.",
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "x-meridian-api-key": apiKey,
  Accept: "application/json",
};

async function main() {
  const openapiUrl = `${baseUrl}/api/ext/v1/openapi?tenant=${encodeURIComponent(tenant)}`;
  console.log("Fetching OpenAPI…");
  const res = await fetch(openapiUrl, { headers });
  const text = await res.text();
  if (!res.ok) {
    let code = "HTTP_ERROR";
    let traceId = res.headers.get("x-trace-id");
    try {
      const d = JSON.parse(text);
      code = d.code || code;
      traceId = d.traceId || traceId;
      console.error("OpenAPI failed", { status: res.status, code, detail: d.detail, traceId });
    } catch {
      console.error("OpenAPI failed", res.status, text.slice(0, 300));
    }
    process.exit(1);
  }

  const spec = JSON.parse(text);
  const paths = Object.keys(spec.paths || {});
  const objects = new Set();
  const methodsByObject = new Map();

  for (const [p, ops] of Object.entries(spec.paths || {})) {
    const m = p.match(/\/api\/ext\/v1\/objects\/([^/{]+)/);
    if (!m) continue;
    objects.add(m[1]);
    const methods = Object.keys(ops)
      .filter((k) => !k.startsWith("x-"))
      .map((k) => k.toUpperCase());
    const prev = methodsByObject.get(m[1]) || new Set();
    methods.forEach((x) => prev.add(x));
    methodsByObject.set(m[1], prev);
  }

  console.log("\nExposed objects in OpenAPI:");
  for (const name of [...objects].sort()) {
    const methods = [...(methodsByObject.get(name) || [])].sort().join(", ");
    console.log(` - ${name}: ${methods || "(no methods listed)"}`);
  }

  console.log("\nExpected CareCircle objects:");
  for (const name of EXPECTED) {
    const ok = objects.has(name);
    console.log(` - ${name}: ${ok ? "present" : "MISSING from OpenAPI paths"}`);
  }

  console.log("\nSample record counts (GET list, limit=5):");
  for (const name of EXPECTED) {
    const r = await fetch(
      `${baseUrl}/api/ext/v1/objects/${encodeURIComponent(name)}?limit=5`,
      { headers },
    );
    const body = await r.text();
    if (!r.ok) {
      let code = "HTTP_ERROR";
      let traceId;
      try {
        const d = JSON.parse(body);
        code = d.code || code;
        traceId = d.traceId;
      } catch {}
      console.log(` - ${name}: FAIL HTTP ${r.status} ${code}${traceId ? ` trace ${traceId}` : ""}`);
      continue;
    }
    let count = 0;
    try {
      const d = JSON.parse(body);
      const rows = d.records || d.data || d.items || (Array.isArray(d) ? d : []);
      count = Array.isArray(rows) ? rows.length : 0;
    } catch {
      count = -1;
    }
    console.log(` - ${name}: ok (${count} row(s) in page)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
