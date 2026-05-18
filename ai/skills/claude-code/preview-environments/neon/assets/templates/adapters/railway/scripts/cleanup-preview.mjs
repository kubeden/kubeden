#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { readPreviewMetadata, run, requiredEnv } from "./lib/preview.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "railway");
const preview = await readPreviewMetadata({});
requiredEnv("RAILWAY_TOKEN");

const environment = preview.details?.environment || process.env.RAILWAY_ENVIRONMENT || "";
if (!environment) {
  console.log("No Railway preview environment was recorded; cleanup skipped.");
  process.exit(0);
}

if (adapter.cleanup === "delete-environment") {
  run("npx", ["@railway/cli", "environment", "delete", environment, "--yes"]);
  console.log(`Deleted Railway environment ${environment}.`);
} else {
  console.log(`Railway cleanup default is no-op for environment ${environment}. Set adapters.railway.cleanup to delete-environment after verifying this is safe.`);
}
