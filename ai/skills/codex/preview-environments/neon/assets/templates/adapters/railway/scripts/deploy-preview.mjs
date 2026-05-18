#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { requiredEnv, run, slug, tryRun, writePreviewMetadata } from "./lib/preview.mjs";
import { setOutput } from "./lib/output.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "railway");
const prNumber = requiredEnv("PR_NUMBER");
requiredEnv("RAILWAY_TOKEN");

const projectId = process.env.RAILWAY_PROJECT_ID || adapter.projectId || "";
const service = process.env.RAILWAY_SERVICE || adapter.service;
const environment = process.env.RAILWAY_ENVIRONMENT || `${adapter.environmentPrefix || "pr"}-${prNumber}`;
const baseEnvironment = process.env.RAILWAY_BASE_ENVIRONMENT || adapter.baseEnvironment || "production";
if (!service) throw new Error("RAILWAY_SERVICE or adapters.railway.service is required.");

if (projectId) {
  run("npx", [
    "@railway/cli",
    "link",
    "--project",
    projectId,
    "--environment",
    baseEnvironment,
    "--service",
    service
  ]);
}

if (adapter.ensureEnvironment !== false) {
  const exists = tryRun("npx", [
    "@railway/cli",
    "environment",
    "config",
    "--environment",
    environment,
    "--json"
  ]);
  if (!exists) {
    run("npx", [
      "@railway/cli",
      "environment",
      "new",
      environment,
      "--duplicate",
      baseEnvironment
    ]);
  }
}

const variableArgs = ["variables", "set", "--service", service, "--environment", environment, "--skip-deploys"];
for (const [key, value] of Object.entries({
  DATABASE_URL: process.env.DATABASE_URL,
  VITE_NEON_AUTH_URL: process.env.VITE_NEON_AUTH_URL,
  VITE_NEON_DATA_API_URL: process.env.VITE_NEON_DATA_API_URL
})) {
  if (value) run("npx", ["@railway/cli", ...variableArgs, `${key}=${value}`]);
}

run("npx", [
  "@railway/cli",
  "up",
  "--ci",
  "--service",
  service,
  "--environment",
  environment,
  ...(projectId ? ["--project", projectId] : [])
]);

const domainSuffix = adapter.domainSuffix || process.env.RAILWAY_PREVIEW_DOMAIN_SUFFIX || "";
const url = process.env.PREVIEW_URL ||
  (domainSuffix ? `https://${slug(service)}-${slug(environment)}.${domainSuffix}` : "");

await writePreviewMetadata({
  provider: "railway",
  url,
  resourceName: environment,
  resourceId: environment,
  cleanup: { enabled: true },
  details: { service, environment, baseEnvironment }
});

setOutput("url", url);
console.log(url ? `Preview URL: ${url}` : "Railway deployed. Set PREVIEW_URL or adapters.railway.domainSuffix if the URL cannot be inferred.");
