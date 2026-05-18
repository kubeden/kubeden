export function repoContext() {
  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
  if (!owner || !repo) throw new Error("GITHUB_REPOSITORY must be set as owner/repo.");
  return { owner, repo };
}

export async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required.");
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${data?.message ?? response.statusText}`);
  }
  return data;
}

export async function fetchIssue(issueNumber) {
  const { owner, repo } = repoContext();
  return githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}`);
}

export async function fetchPullRequest(pullNumber) {
  const { owner, repo } = repoContext();
  return githubRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
}

export async function fetchIssueComments(issueNumber) {
  const { owner, repo } = repoContext();
  const comments = [];
  for (let page = 1; ; page += 1) {
    const batch = await githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100&page=${page}`);
    comments.push(...batch);
    if (batch.length < 100) return comments;
  }
}

export async function createIssueComment(issueNumber, body) {
  const { owner, repo } = repoContext();
  return githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
}

export async function updateIssueComment(commentId, body) {
  const { owner, repo } = repoContext();
  return githubRequest(`/repos/${owner}/${repo}/issues/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ body })
  });
}

export async function upsertIssueComment(issueNumber, marker, body) {
  const markedBody = `${marker}\n${body}`;
  const comments = await fetchIssueComments(issueNumber);
  const existing = comments.find((comment) => String(comment.body || "").includes(marker));
  if (existing) return updateIssueComment(existing.id, markedBody);
  return createIssueComment(issueNumber, markedBody);
}

export async function findOpenPullByHead(headBranch) {
  const { owner, repo } = repoContext();
  const head = `${owner}:${headBranch}`;
  const pulls = await githubRequest(`/repos/${owner}/${repo}/pulls?state=open&head=${encodeURIComponent(head)}`);
  return pulls[0] ?? null;
}

export async function createPullRequest({ title, body, head, base, draft = true }) {
  const { owner, repo } = repoContext();
  return githubRequest(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, body, head, base, draft })
  });
}

export async function dispatchWorkflow(workflowId, { ref, inputs = {} }) {
  const { owner, repo } = repoContext();
  return githubRequest(`/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref, inputs })
  });
}

export async function addIssueLabels(issueNumber, labels) {
  if (!labels.length) return null;
  const { owner, repo } = repoContext();
  try {
    return await githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      method: "POST",
      body: JSON.stringify({ labels })
    });
  } catch (error) {
    console.warn(`Could not add labels: ${error.message}`);
    return null;
  }
}
