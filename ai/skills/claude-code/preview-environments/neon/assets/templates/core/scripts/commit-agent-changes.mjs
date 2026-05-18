#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readJson } from "./lib/files.mjs";
import { setOutput } from "./lib/output.mjs";

function git(args, options = {}) {
  const output = execFileSync("git", args, { encoding: "utf8", ...options });
  return typeof output === "string" ? output.trim() : "";
}

const context = await readJson(".agent/runtime/issue-context.json");
const status = git(["status", "--porcelain=v1"]);
if (!status) {
  setOutput("changed", "false");
  console.log("No agent changes to commit.");
  process.exit(0);
}

git(["config", "user.name", "agent-preview-bot"]);
git(["config", "user.email", "agent-preview-bot@users.noreply.github.com"]);
git(["add", "-A"], { stdio: "inherit" });

try {
  git(["diff", "--cached", "--quiet"]);
  setOutput("changed", "false");
  process.exit(0);
} catch {
  // git diff --quiet exits non-zero when changes are staged.
}

const subject = `${context.provider}: implement issue #${context.issue.number}`;
git(["commit", "-m", subject], { stdio: "inherit" });
setOutput("changed", "true");
setOutput("commit_subject", subject);
