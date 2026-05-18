#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { readPreviewMetadata, run, requiredEnv } from "./lib/preview.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "vercel");
const preview = await readPreviewMetadata({});

if (!adapter.cleanup || adapter.cleanup === "none") {
  console.log("Vercel preview cleanup is configured as no-op.");
  process.exit(0);
}

if (adapter.cleanup === "remove-alias" && preview.details?.aliasUrl) {
  const token = requiredEnv("VERCEL_TOKEN");
  const team = adapter.team || process.env.VERCEL_TEAM || "";
  const host = new URL(preview.details.aliasUrl).host;
  run("npx", ["vercel", "alias", "rm", host, "--yes", "--token", token, ...(team ? ["--scope", team] : [])]);
  console.log(`Removed Vercel alias ${host}.`);
  process.exit(0);
}

console.log(`Vercel cleanup mode ${adapter.cleanup} is not implemented by this template; adapt cleanup-preview.mjs if deletion is required.`);
