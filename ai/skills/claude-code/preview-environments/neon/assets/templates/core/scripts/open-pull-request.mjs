#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { loadConfig } from "./lib/config.mjs";
import { readJson } from "./lib/files.mjs";
import { addIssueLabels, createPullRequest, dispatchWorkflow, findOpenPullByHead } from "./lib/github.mjs";
import { setOutput } from "./lib/output.mjs";
import { statusList, updateAgentProgressComment } from "./lib/status-comment.mjs";
import { agentSummary, changedFilesSummary, configuredCheckSummary } from "./lib/summaries.mjs";

const context = await readJson(".agent/runtime/issue-context.json");
const neon = await readJson(".agent/runtime/neon.json", { enabled: false });
const config = await loadConfig();
const summary = await agentSummary();
const changedFiles = changedFilesSummary();
const checks = configuredCheckSummary(config.commands);
const agentStages = [
  { stage: "pickedUp", label: "Agent accepted the request" },
  { stage: "neonReady", label: "Preview database branch is ready" },
  { stage: "runningAgent", label: "Claude is making changes" },
  { stage: "checksPassed", label: "Configured checks passed" },
  { stage: "prReady", label: "Draft PR is ready" }
];

function currentHeadSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function dispatchPreviewWorkflow({ pullNumber, baseBranch, headBranch }) {
  if (!config.preview?.enabled) return;
  await dispatchWorkflow(config.preview.workflowFile || "preview-neon.yml", {
    ref: baseBranch,
    inputs: {
      pr_number: String(pullNumber),
      head_branch: headBranch,
      head_sha: currentHeadSha()
    }
  });
}

const existing = await findOpenPullByHead(context.headBranch);
const body = [
  `Related issue: #${context.issue.number}`,
  "",
  "## Summary",
  ...summary,
  "",
  "## Important Changes",
  ...changedFiles,
  "",
  "## Checks",
  ...checks,
  "",
  "## Preview",
  "- The preview workflow will post the review URL after it finishes.",
  neon.enabled
    ? `- Neon branch: ${neon.branchName} (${neon.branchId}), expires ${neon.expiresAt || "not set"}`
    : "- Neon branch: not configured",
  "",
  "## Reviewer Notes",
  "- Check the preview deployment before merging.",
  "- Confirm migrations and data changes are expected.",
  "- This PR was generated after I was tagged in the issue."
].join("\n");

if (context.target?.kind === "pull_request") {
  const prNumber = context.target.number;
  await addIssueLabels(prNumber, [config.labels.agentPr].filter(Boolean));
  await dispatchPreviewWorkflow({
    pullNumber: prNumber,
    baseBranch: context.target.baseBranch,
    headBranch: context.target.headBranch
  });
  await updateAgentProgressComment(prNumber, [
    "Status: PR updated",
    "",
    ...statusList(agentStages, "prReady"),
    "",
    "Summary:",
    ...summary,
    "",
    "Checks passed:",
    ...checks,
    "",
    config.preview?.enabled ? "I dispatched the preview workflow for this update." : ""
  ]);
  setOutput("pr_number", prNumber);
  setOutput("pr_url", context.target.htmlUrl);
  process.exit(0);
}

const openedNewPull = !existing;
const pull =
  existing ??
  (await createPullRequest({
    title: context.prTitle,
    body,
    head: context.headBranch,
    base: context.baseBranch,
    draft: true
  }));

await addIssueLabels(pull.number, [config.labels.agentPr].filter(Boolean));
await dispatchPreviewWorkflow({ pullNumber: pull.number, baseBranch: pull.base.ref, headBranch: pull.head.ref });

const comment = [
  openedNewPull ? "Status: draft PR opened" : "Status: draft PR updated",
  "",
  ...statusList(agentStages, "prReady"),
  "",
  openedNewPull
    ? `I opened draft PR #${pull.number}: ${pull.html_url}`
    : `I updated draft PR #${pull.number}: ${pull.html_url}`,
  "",
  "Summary:",
  ...summary,
  "",
  "Checks passed:",
  ...checks,
  "",
  neon.enabled ? `I used Neon preview branch \`${neon.branchName}\` (${neon.databaseUrlRedacted}).` : "No Neon preview branch was configured.",
  config.preview?.enabled ? "I dispatched the preview workflow." : "",
  "",
  "The PR is draft so the diff, migration behavior, and preview can be reviewed before merge."
];

await updateAgentProgressComment(context.issue.number, comment);
setOutput("pr_number", pull.number);
setOutput("pr_url", pull.html_url);
