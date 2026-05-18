#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "./lib/args.mjs";
import { loadConfig } from "./lib/config.mjs";
import { readJson, writeText } from "./lib/files.mjs";
import { setOutput } from "./lib/output.mjs";

const args = parseArgs();
const context = await readJson(args.context || ".agent/runtime/issue-context.json");
const neon = await readJson(args.neon || ".agent/runtime/neon.json", { enabled: false });
const config = await loadConfig();
const templatePath = args.template || ".agent/prompts/implement-issue.md";
const template = await readFile(templatePath, "utf8");

const comments = context.comments.length
  ? context.comments.map((comment) => `### ${comment.author} at ${comment.createdAt}\n\n${comment.body}`).join("\n\n")
  : "No comments.";

const commandList = Object.entries(config.commands)
  .filter(([, command]) => command)
  .map(([name, command]) => `- ${name}: \`${command}\``)
  .join("\n") || "- No commands configured.";

const neonSummary = neon.enabled
  ? [
      `- Neon branch: ${neon.branchName} (${neon.branchId})`,
      `- Database: ${neon.databaseName}`,
      `- Role: ${neon.roleName}`,
      `- Expires at: ${neon.expiresAt || "not set"}`,
      "- DATABASE_URL is available in the environment. Treat it as secret."
    ].join("\n")
  : "No Neon preview branch is available for this run.";

const prompt = template
  .replaceAll("{{provider}}", context.provider)
  .replaceAll("{{issue_number}}", String(context.issue.number))
  .replaceAll("{{trigger_body}}", context.trigger?.body || "No trigger request body.")
  .replaceAll("{{issue_title}}", context.issue.title)
  .replaceAll("{{issue_body}}", context.issue.body || "No body.")
  .replaceAll("{{issue_url}}", context.issue.htmlUrl)
  .replaceAll("{{comments}}", comments)
  .replaceAll("{{commands}}", commandList)
  .replaceAll("{{neon}}", neonSummary);

const outputPath = args.output || ".agent/runtime/prompt.md";
await writeText(outputPath, prompt);
setOutput("prompt_file", outputPath);
