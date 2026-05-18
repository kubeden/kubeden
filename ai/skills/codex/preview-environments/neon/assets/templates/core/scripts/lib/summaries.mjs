import { execFileSync } from "node:child_process";
import { readTextIfExists } from "./files.mjs";

function truncate(value, maxLength = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function redact(text) {
  return String(text || "")
    .replace(/DATABASE_URL=\S+/g, "DATABASE_URL=[redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted database url]")
    .replace(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi, "references #$1");
}

export function bulletize(text, fallback, maxItems = 5) {
  const lines = redact(text)
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .trim()
    )
    .filter(Boolean)
    .filter((line) => !line.startsWith("```"))
    .filter((line) => !/^(summary|tests?|changes?|what changed|verification)$/i.test(line));

  const unique = [];
  for (const line of lines) {
    const item = truncate(line);
    if (item && !unique.includes(item)) unique.push(item);
    if (unique.length >= maxItems) break;
  }
  return (unique.length ? unique : [fallback]).map((line) => `- ${line}`);
}

export async function codexSummary(path = ".agent/runtime/codex-final.md") {
  const text = await readTextIfExists(path);
  return bulletize(text, "Implemented the requested issue changes.");
}

export function changedFilesSummary(maxItems = 8) {
  let output = "";
  try {
    output = execFileSync("git", ["show", "--name-status", "--format=", "HEAD"], {
      encoding: "utf8"
    });
  } catch {
    return ["- Changed files were not available from git."];
  }

  const labels = { A: "Added", C: "Copied", D: "Deleted", M: "Modified", R: "Renamed", T: "Changed type", U: "Updated", X: "Changed" };
  const files = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, ...paths] = line.split(/\t+/);
      const path = paths.at(-1);
      if (!path) return "";
      return `- ${labels[status[0]] || "Changed"}: \`${path}\``;
    })
    .filter(Boolean);

  if (!files.length) return ["- No committed file list was available."];
  return files.slice(0, maxItems);
}

export function configuredCheckSummary(commands = {}) {
  const checks = ["migrate", "lint", "test", "build"]
    .map((name) => [name, commands[name]])
    .filter(([, command]) => command)
    .map(([name, command]) => `- ${name}: \`${command}\``);
  return checks.length ? checks : ["- No checks were configured."];
}

export function sourceIssueNumberFromText(text) {
  const patterns = [
    /Related issue:\s*#(\d+)/i,
    /Source issue:\s*#(\d+)/i,
    /Implements\s+#(\d+)/i,
    /Addresses\s+#(\d+)/i
  ];
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match) return Number(match[1]);
  }
  return 0;
}

export function extractSummaryFromPullBody(text) {
  const lines = String(text || "").split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+Summary\s*$/i.test(line.trim()));
  if (start === -1) return ["- No PR summary was available."];
  const collected = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s+/.test(line)) break;
    if (line.trim()) collected.push(line);
  }
  return bulletize(collected.join("\n"), "Merged the requested changes.");
}

export function cleanupLine({ deleted, branchName, reason, providerCleanup = "" }) {
  const neonLine = deleted === "true"
    ? `Deleted Neon preview branch \`${branchName}\`.`
    : `Neon preview branch was not deleted: ${reason || "no reason reported"}.`;
  return providerCleanup ? `${neonLine} ${providerCleanup}` : neonLine;
}
