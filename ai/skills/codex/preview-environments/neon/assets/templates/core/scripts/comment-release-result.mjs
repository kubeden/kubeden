#!/usr/bin/env node
import { loadConfig } from "./lib/config.mjs";
import { fetchPullRequest } from "./lib/github.mjs";
import { statusList, updateAgentProgressComment } from "./lib/status-comment.mjs";
import { cleanupLine, extractSummaryFromPullBody, sourceIssueNumberFromText } from "./lib/summaries.mjs";

const config = await loadConfig();
const prNumber = Number(process.env.PR_NUMBER || 0);
if (!prNumber) throw new Error("PR_NUMBER is required.");

const pull = await fetchPullRequest(prNumber);
const merged = process.env.MERGED === "true";
const sourceIssueNumber = sourceIssueNumberFromText(pull.body);
const summary = extractSummaryFromPullBody(pull.body);
const releaseStages = [
  { stage: "productionStarted", label: "Production deploy started" },
  { stage: "previewCleanup", label: "Preview cleanup started" },
  { stage: "releaseDone", label: "Release and cleanup completed" }
];
const productionUrl = process.env.PRODUCTION_URL || config.production?.url || "";
const cleanup = cleanupLine({
  deleted: process.env.NEON_DELETED,
  branchName: process.env.NEON_BRANCH_NAME,
  reason: process.env.NEON_DELETE_REASON,
  providerCleanup: process.env.PROVIDER_CLEANUP_RESULT || ""
});
const productionDetails = [
  productionUrl ? `Production: ${productionUrl}` : "",
  process.env.IMAGE ? `Image: \`${process.env.IMAGE}\`` : "",
  process.env.TRACE_IMAGE ? `Trace image: \`${process.env.TRACE_IMAGE}\`` : "",
  process.env.DEPLOYMENT_ID ? `Deployment: \`${process.env.DEPLOYMENT_ID}\`` : ""
].filter(Boolean);

const prBody = merged
  ? [
      "Status: merged and deployed",
      "",
      ...statusList(releaseStages, "releaseDone"),
      "",
      `PR: #${prNumber} ${pull.title}`,
      "",
      "Merged changes:",
      ...summary,
      "",
      ...productionDetails,
      cleanup
    ].filter(Boolean).join("\n")
  : [
      "Status: PR closed without merge",
      "",
      "- [x] Preview cleanup completed",
      "",
      `PR: #${prNumber} ${pull.title}`,
      cleanup
    ].filter(Boolean).join("\n");

await updateAgentProgressComment(prNumber, prBody);

if (sourceIssueNumber && sourceIssueNumber !== prNumber) {
  const issueBody = merged
    ? [
        "Status: merged and deployed",
        "",
        ...statusList(releaseStages, "releaseDone"),
        "",
        `PR #${prNumber} was merged and deployed to production.`,
        "",
        "Merged changes:",
        ...summary,
        "",
        productionUrl ? `Production: ${productionUrl}` : "",
        cleanup,
        "",
        "I left this issue open for your review."
      ].filter(Boolean).join("\n")
    : [
        "Status: PR closed without merge",
        "",
        "- [x] Preview cleanup completed",
        "",
        `PR #${prNumber} was closed without merge.`,
        "",
        cleanup,
        "",
        "No production deploy was run."
      ].filter(Boolean).join("\n");
  await updateAgentProgressComment(sourceIssueNumber, issueBody);
}
