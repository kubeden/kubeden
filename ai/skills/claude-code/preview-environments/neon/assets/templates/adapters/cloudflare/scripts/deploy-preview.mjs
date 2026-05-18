#!/usr/bin/env node
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { requiredEnv, runCapture, writePreviewMetadata } from "./lib/preview.mjs";
import { setOutput } from "./lib/output.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "cloudflare");
const prNumber = requiredEnv("PR_NUMBER");
const token = requiredEnv("CLOUDFLARE_API_TOKEN");
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || adapter.accountId;
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || adapter.projectName;
const outputDir = process.env.CLOUDFLARE_PAGES_OUTPUT_DIR || adapter.outputDir;
if (!accountId) throw new Error("Cloudflare account ID is required.");
if (!projectName) throw new Error("Cloudflare Pages project name is required.");
if (!outputDir) throw new Error("Cloudflare Pages output directory is required.");

const branch = `${adapter.branchPrefix || "pr"}-${prNumber}`;
const output = runCapture("npx", [
  "wrangler",
  "pages",
  "deploy",
  outputDir,
  "--project-name",
  projectName,
  "--branch",
  branch,
  "--commit-dirty=true"
], {
  env: {
    ...process.env,
    CLOUDFLARE_API_TOKEN: token,
    CLOUDFLARE_ACCOUNT_ID: accountId
  }
});

const url = output.match(/https:\/\/[^\s]+\.pages\.dev[^\s]*/)?.[0] ||
  output.match(/https?:\/\/[^\s]+/)?.[0] ||
  "";
if (!url) throw new Error(`Could not parse Cloudflare Pages URL from Wrangler output: ${output}`);

await writePreviewMetadata({
  provider: "cloudflare",
  url,
  resourceName: `${projectName}:${branch}`,
  resourceId: branch,
  cleanup: { enabled: false },
  details: { projectName, branch }
});

setOutput("url", url);
console.log(`Preview URL: ${url}`);
