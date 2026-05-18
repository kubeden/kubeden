#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { readPreviewMetadata, requiredEnv, slug } from "./lib/preview.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "argocd-gitops");
const prNumber = requiredEnv("PR_NUMBER");
const preview = await readPreviewMetadata({});
const gitopsRepo = adapter.repository || requiredEnv("GITOPS_REPOSITORY");
const gitopsPath = adapter.checkoutPath || ".agent/runtime/gitops";
const gitopsBranch = process.env.GITOPS_BRANCH || adapter.previewBranch || "preview-environments";
const previewRoot = adapter.previewRoot || "previews";
const appPrefix = adapter.appPrefix || "preview-pr";
const appName = preview.resourceName || `${slug(appPrefix)}-${prNumber}`;
const relativePreviewDir = preview.details?.relativePreviewDir || `${previewRoot}/${appName}`;
const previewDir = join(gitopsPath, relativePreviewDir);

function git(args, options = {}) {
  execFileSync("git", args, { stdio: "inherit", cwd: gitopsPath, ...options });
}

function cloneGitopsRepo() {
  const token = requiredEnv("GITOPS_TOKEN");
  const encoded = Buffer.from(`x-access-token:${token}`).toString("base64");
  execFileSync("git", ["clone", `https://github.com/${gitopsRepo}.git`, gitopsPath], {
    stdio: "inherit",
    env: {
      ...process.env,
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${encoded}`
    }
  });
  git(["config", "user.name", "preview-bot"]);
  git(["config", "user.email", "preview-bot@users.noreply.github.com"]);
  git(["fetch", "origin", gitopsBranch]);
  git(["checkout", "-B", gitopsBranch, `origin/${gitopsBranch}`]);
}

cloneGitopsRepo();
try {
  git(["rm", "-r", "--ignore-unmatch", relativePreviewDir]);
} catch {
  // ignore
}
await rm(previewDir, { recursive: true, force: true });

const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: gitopsPath });
if (diff.status === 0) {
  console.log(`No GitOps preview manifests found for ${appName}.`);
  process.exit(0);
}
if (diff.status !== 1) throw new Error(`git diff failed with status ${diff.status}.`);
git(["commit", "-m", `Remove preview for PR #${prNumber}`]);
git(["push", "origin", `HEAD:${gitopsBranch}`]);
console.log(`Removed GitOps preview manifests for ${appName}.`);
