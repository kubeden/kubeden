#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { requiredEnv, run, slug, tryRun, writePreviewMetadata } from "./lib/preview.mjs";
import { setOutput } from "./lib/output.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "fly");
const prNumber = requiredEnv("PR_NUMBER");
requiredEnv("FLY_API_TOKEN");

const appName = process.env.FLY_APP_NAME || `${slug(adapter.appPrefix || "preview-pr")}-${prNumber}`;
const org = process.env.FLY_ORG || adapter.org || "";
const region = process.env.FLY_REGION || adapter.region || "";

function ensureFlyctl() {
  if (tryRun("fly", ["version"])) return;
  run("bash", ["-lc", "curl -L https://fly.io/install.sh | sh"]);
  process.env.PATH = `${process.env.HOME}/.fly/bin:${process.env.PATH}`;
}

ensureFlyctl();

if (!tryRun("fly", ["apps", "show", appName])) {
  run("fly", ["apps", "create", appName, ...(org ? ["--org", org] : [])]);
}

const secrets = [];
for (const [key, value] of Object.entries({
  DATABASE_URL: process.env.DATABASE_URL,
  VITE_NEON_AUTH_URL: process.env.VITE_NEON_AUTH_URL,
  VITE_NEON_DATA_API_URL: process.env.VITE_NEON_DATA_API_URL
})) {
  if (value) secrets.push(`${key}=${value}`);
}
if (secrets.length) run("fly", ["secrets", "set", "--app", appName, "--stage", ...secrets]);

run("fly", [
  "deploy",
  "--remote-only",
  "--app",
  appName,
  "--yes",
  ...(region ? ["--region", region] : []),
  ...(process.env.VITE_NEON_AUTH_URL ? ["--env", `VITE_NEON_AUTH_URL=${process.env.VITE_NEON_AUTH_URL}`] : []),
  ...(process.env.VITE_NEON_DATA_API_URL ? ["--env", `VITE_NEON_DATA_API_URL=${process.env.VITE_NEON_DATA_API_URL}`] : [])
]);

const url = `https://${appName}.fly.dev`;
await writePreviewMetadata({
  provider: "fly",
  url,
  resourceName: appName,
  resourceId: appName,
  cleanup: { enabled: true },
  details: { appName, org, region }
});

setOutput("url", url);
console.log(`Preview URL: ${url}`);
