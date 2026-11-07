#!/usr/bin/env node
/**
 * Live-inspect the tenant OpenAPI + object discovery.
 * Requires MERIDIAN_API_KEY in the environment or .env.local.
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

const apiKey = process.env.MERIDIAN_API_KEY?.trim();
const baseUrl = (
  process.env.MERIDIAN_BASE_URL || "https://dev.lightleap.ai/meridian"
).replace(/\/$/, "");
const tenant =
  process.env.MERIDIAN_TENANT ||
  "carecircle-ci-rculo-de-cuidado-5fbd81";

if (!apiKey) {
  console.error(
    "MERIDIAN_API_KEY missing. Add it to .env.local or the environment, then re-run.",
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
  console.log("Fetching", openapiUrl);
  const res = await fetch(openapiUrl, { headers });
  const text = await res.text();
  if (!res.ok) {
    console.error("OpenAPI failed", res.status, text.slice(0, 500));
    process.exit(1);
  }
  const spec = JSON.parse(text);
  const paths = Object.keys(spec.paths || {});
  const objects = new Set();
  for (const p of paths) {
    const m = p.match(/\/api\/ext\/v1\/objects\/([^/{]+)/);
    if (m) objects.add(m[1]);
  }
  console.log("\nExposed object paths:");
  for (const name of [...objects].sort()) console.log(" -", name);

  console.log("\nReports:");
  for (const p of paths.filter((x) => x.includes("/reports"))) console.log(" -", p);

  console.log("\nSample path keys:", paths.slice(0, 30));
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
