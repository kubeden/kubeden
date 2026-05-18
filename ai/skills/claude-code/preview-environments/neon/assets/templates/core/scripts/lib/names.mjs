export function slugify(value, maxLength = 48) {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return (slug || "task").slice(0, maxLength).replace(/-+$/g, "") || "task";
}

export function safeGitBranch(value) {
  return String(value)
    .replace(/[^A-Za-z0-9._/-]/g, "-")
    .replace(/\/{2,}/g, "/")
    .replace(/(^[/.]+|[/.]+$)/g, "")
    .replace(/\.lock$/g, "-lock")
    .slice(0, 120);
}

export function issueBranchName({ provider, issueNumber, title }) {
  return safeGitBranch(`agent/${provider}/issue-${issueNumber}-${slugify(title, 36)}`);
}

export function previewBranchName({ pullNumber, headBranch }) {
  if (pullNumber) return `preview-pr-${pullNumber}`;
  return `preview-${slugify(headBranch, 48)}`;
}

export function previewResourceName({ prefix = "preview-pr", prNumber }) {
  return `${slugify(prefix, 32)}-${String(prNumber)}`;
}
