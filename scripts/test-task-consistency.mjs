#!/usr/bin/env node
/**
 * Launcher for the TypeScript consistency test via tsx (resolves @/ aliases).
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  "npx",
  ["--yes", "tsx", "--tsconfig", "tsconfig.json", "scripts/test-task-consistency.ts"],
  {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    stdio: "inherit",
  },
);
process.exit(result.status ?? 1);
