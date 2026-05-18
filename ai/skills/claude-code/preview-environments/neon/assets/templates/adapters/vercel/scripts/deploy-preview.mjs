#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { requiredEnv, run, runCapture, slug, writePreviewMetadata } from "./lib/preview.mjs";
import { setOutput } from "./lib/output.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "vercel");
const prNumber = requiredEnv("PR_NUMBER");
const token = requiredEnv("VERCEL_TOKEN");
const databaseUrl = process.env.DATABASE_URL || "";
const authUrl = process.env.VITE_NEON_AUTH_URL || "";
const dataApiUrl = process.env.VITE_NEON_DATA_API_URL || "";
const aliasSuffix = adapter.aliasDomainSuffix || "";
const team = adapter.team || process.env.VERCEL_TEAM || "";
const orgId = process.env.VERCEL_ORG_ID || adapter.orgId || "";
const projectId = process.env.VERCEL_PROJECT_ID || adapter.projectId || "";
const deployArgs = [
  "vercel",
  "deploy",
  "--yes",
  "--token",
  token
];

if (team) deployArgs.push("--scope", team);
if (databaseUrl) deployArgs.push("--env", `DATABASE_URL=${databaseUrl}`);
if (authUrl) deployArgs.push("--build-env", `VITE_NEON_AUTH_URL=${authUrl}`);
if (dataApiUrl) deployArgs.push("--build-env", `VITE_NEON_DATA_API_URL=${dataApiUrl}`);
if (process.env.HEAD_BRANCH) deployArgs.push("--meta", `githubCommitRef=${process.env.HEAD_BRANCH}`);

const output = runCapture("npx", deployArgs, {
  env: {
    ...process.env,
    ...(orgId ? { VERCEL_ORG_ID: orgId } : {}),
    ...(projectId ? { VERCEL_PROJECT_ID: projectId } : {})
  }
});
const url = output.split(/\s+/).reverse().find((part) => /^https?:\/\//.test(part)) || output.trim();
if (!/^https?:\/\//.test(url)) throw new Error(`Could not parse Vercel preview URL from output: ${output}`);

let finalUrl = url;
if (aliasSuffix) {
  const alias = `${slug(adapter.projectName || "preview")}-pr-${prNumber}.${aliasSuffix}`;
  run("npx", ["vercel", "alias", "set", url, alias, "--token", token, ...(team ? ["--scope", team] : [])]);
  finalUrl = `https://${alias}`;
}

await writePreviewMetadata({
  provider: "vercel",
  url: finalUrl,
  resourceName: `vercel-pr-${prNumber}`,
  resourceId: url,
  cleanup: { enabled: adapter.cleanup && adapter.cleanup !== "none" },
  details: { deploymentUrl: url, aliasUrl: finalUrl === url ? "" : finalUrl }
});

setOutput("url", finalUrl);
setOutput("deployment_id", url);
console.log(`Preview URL: ${finalUrl}`);
