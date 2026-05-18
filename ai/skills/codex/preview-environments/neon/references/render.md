# Render Adapter

Use this adapter when Render services or blueprints are the user's deployment surface.

## Required Facts

- Service ID or blueprint/environment model.
- Whether Render native preview environments are enabled.
- Deploy hook URL or Render API key/service ID.
- How environment variables are set for preview builds.
- Public URL discovery method.

## Required Secrets

- `RENDER_API_KEY` or `RENDER_DEPLOY_HOOK_URL`

## Adapter Options

For native Render preview environments, prefer letting Render create the preview from the PR, then use the workflow to poll/report the preview URL.

For API-driven deploys, adapt the template to update env vars, trigger a deploy, and poll deploy status. Render setup varies by service type, so inspect the existing `render.yaml` or dashboard assumptions before installing.

Cleanup is provider/setup dependent. Do not delete shared services; only remove PR-specific preview services/environments when the install created them.
