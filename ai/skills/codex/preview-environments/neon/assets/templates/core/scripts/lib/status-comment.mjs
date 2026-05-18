import { upsertIssueComment } from "./github.mjs";

export const AGENT_PROGRESS_MARKER = "<!-- neon-preview-agent-progress -->";

export async function updateAgentProgressComment(issueNumber, lines) {
  const values = Array.isArray(lines) ? lines : [lines];
  const body = values
    .flatMap((line) => (Array.isArray(line) ? line : [line]))
    .filter((line) => line !== undefined && line !== null && line !== false)
    .join("\n");

  return upsertIssueComment(issueNumber, AGENT_PROGRESS_MARKER, body);
}

export function statusList(items, currentStage, terminalStage = "") {
  const currentIndex = items.findIndex((item) => item.stage === currentStage);
  const terminalIndex = terminalStage
    ? items.findIndex((item) => item.stage === terminalStage)
    : -1;
  const activeIndex = terminalIndex >= 0 ? terminalIndex : currentIndex;

  return items.map((item, index) => {
    const done = activeIndex >= 0 && index <= activeIndex;
    return `- [${done ? "x" : " "}] ${item.label}`;
  });
}
