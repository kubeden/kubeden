# Security Model

The workflows intentionally separate trigger authorization from deployment authorization.

## Agent Trigger

The agent workflow must:

- accept only trusted actors from `agent.config.json.allowedActors`;
- require a supported trigger command on issue/comment events;
- require trusted GitHub author associations for issue/comment events;
- refuse fork PR branches;
- write progress by updating one marked issue comment instead of creating unbounded comments.

## Preview Trigger

The preview workflow must:

- run only for PRs targeting the configured base branch;
- reject fork PRs before using secrets;
- allow manual dispatch only for trusted workflows/users;
- use concurrency by PR number so stale preview builds are cancelled.

## Secrets

- Never echo `DATABASE_URL`, provider tokens, Claude OAuth tokens, or API keys.
- Use GitHub output masking for generated database URLs.
- Treat issue bodies and comments as untrusted prompt input.
- Do not let issue text modify workflows, token handling, or cleanup scope unless the issue explicitly requests automation changes and the user reviews it.

## Cleanup

Cleanup must be scoped by PR number and provider resource names derived from sanitized branch/PR metadata. Never delete shared production resources.
