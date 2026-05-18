#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "./lib/args.mjs";
import { loadConfig } from "./lib/config.mjs";
import { writeJson } from "./lib/files.mjs";
import { fetchIssue, fetchIssueComments, fetchPullRequest } from "./lib/github.mjs";
import { issueBranchName } from "./lib/names.mjs";
import { setOutput } from "./lib/output.mjs";

const args = parseArgs();
const provider = args.provider;
if (provider !== "claude") throw new Error("--provider must be claude.");

const config = await loadConfig();
const eventPath = process.env.GITHUB_EVENT_PATH;
const eventName = process.env.GITHUB_EVENT_NAME;
const event = eventPath ? JSON.parse(await readFile(eventPath, "utf8")) : {};

function triggerMatches(body) {
  return /(^|\s)(@claude\b|\/agent\s+claude\b)/i.test(body);
}

function setSkip(reason) {
  setOutput("should_run", "false");
  setOutput("skip_reason", reason);
  console.log(`Skipping agent run: ${reason}`);
}

function actorAllowed(actor) {
  const allowedActors = config.allowedActors ?? [];
  if (!allowedActors.length) return false;
  const normalized = String(actor || "").toLowerCase();
  return allowedActors.some((allowed) => String(allowed).toLowerCase() === normalized);
}

const issueNumber = event.issue?.number || Number(event.inputs?.issue_number || 0);
const triggerBody = event.comment?.body || event.inputs?.prompt || event.issue?.body || "";
const triggerActor = event.sender?.login || process.env.GITHUB_ACTOR || "";

if (!issueNumber) {
  setSkip("No issue number found.");
  process.exit(0);
}

if (["issue_comment", "issues"].includes(eventName) && !triggerMatches(triggerBody)) {
  setSkip(`Comment did not mention ${provider}.`);
  process.exit(0);
}

if (!actorAllowed(triggerActor)) {
  setSkip(`Actor ${triggerActor || "unknown"} is not allowed.`);
  process.exit(0);
}

const association =
  event.comment?.author_association ||
  event.issue?.author_association ||
  event.sender?.author_association ||
  "NONE";
if (
  ["issue_comment", "issues"].includes(eventName) &&
  !config.allowedAuthorAssociations.includes(association)
) {
  setSkip(`Author association ${association} is not allowed.`);
  process.exit(0);
}

const issue = await fetchIssue(issueNumber);
const comments = await fetchIssueComments(issueNumber);
const pull = issue.pull_request ? await fetchPullRequest(issueNumber) : null;

if (pull && pull.head.repo.full_name !== process.env.GITHUB_REPOSITORY) {
  setSkip("This workflow can only update pull request branches in this repository.");
  process.exit(0);
}

const headBranch = pull
  ? pull.head.ref
  : issueBranchName({ provider, issueNumber, title: issue.title });
const baseBranch = pull ? pull.base.ref : config.baseBranch;
const prTitle = pull ? pull.title : `Claude: ${issue.title}`;

const context = {
  provider,
  trigger: { eventName, actor: triggerActor, association, body: triggerBody },
  issue: {
    number: issue.number,
    title: issue.title,
    body: issue.body || "",
    htmlUrl: issue.html_url,
    labels: issue.labels?.map((label) => label.name) ?? [],
    author: issue.user?.login || ""
  },
  comments: comments.map((comment) => ({
    id: comment.id,
    author: comment.user?.login || "",
    body: comment.body || "",
    createdAt: comment.created_at,
    htmlUrl: comment.html_url
  })),
  headBranch,
  baseBranch,
  prTitle,
  target: pull
    ? {
        kind: "pull_request",
        number: pull.number,
        htmlUrl: pull.html_url,
        baseBranch: pull.base.ref,
        headBranch: pull.head.ref
      }
    : { kind: "issue" }
};

await writeJson(".agent/runtime/issue-context.json", context);
setOutput("should_run", "true");
setOutput("issue_number", issue.number);
setOutput("head_branch", headBranch);
setOutput("base_branch", baseBranch);
setOutput("pr_title", prTitle);
setOutput("context_file", ".agent/runtime/issue-context.json");
setOutput("target_kind", context.target.kind);
setOutput("pr_number", pull?.number ?? "");
