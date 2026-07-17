---
name: deploy-app
description: >-
  Deploy a web application to production by exploring the codebase first, then walking one of
  three lanes the user picks: Vercel (managed, default for Next.js), Kubernetes (existing
  cluster, GitOps-aware), or a virtual machine over SSH (systemd + reverse proxy). Discovers
  the framework, build output, env contract, database/migration story, and any existing
  deploy config before proposing anything; asks the user for the target, then executes that
  lane end to end and smoke-tests the result. House-stack aware (Next.js 16 standalone,
  Drizzle + Neon, committed .npmrc date pin) but works for any Node web app.
argument-hint: "[vercel|k8s|vm] [environment]"
disable-model-invocation: true
---

# infrastructure/deploy-app — one app, three lanes, no guessing

This skill takes a working codebase to a running production URL. It is **interactive by
design**: it inspects before it proposes, asks before it targets, and verifies after it
ships. It is manual-invocation only because deploying is outward-facing and touches
secrets — invoke it explicitly with `/deploy-app`.

> **Mental model:** deployment is a *contract check*, not an adventure. The app already
> states what it needs — build command, runtime, env keys, migrations, port. Your job is to
> read that contract out of the repo, pick the lane, and satisfy the contract on that lane
> exactly. Anything you "discover" mid-deploy that isn't in the contract means Step 0 was
> done badly — go back.

---

## Step 0 — Mandatory discovery gate

Explore the codebase before saying anything about deployment. Collect, minimum:

- **Framework & build**: `package.json` scripts (`build`, `start`), framework and major
  version, build output (`.next/`? `output: 'standalone'` set? static export?), Node
  version constraints (`engines`, `.nvmrc`), package manager and lockfile.
- **npm quirks**: a committed `.npmrc` (the house template pins `before=` for
  supply-chain reproducibility — CI/build machines will honor it; that is intended).
- **Env contract**: `.env.example` (the authoritative key list), which keys are
  `NEXT_PUBLIC_*` (baked at **build time** — a build without them is a broken build),
  which are server-only secrets.
- **Data layer**: database provider, ORM, migration tool and state
  (`drizzle-kit migrate`? committed migrations?). Where the production database lives
  (Neon branch? region — Neon platform betas are `us-east-2` only).
- **Gate/runtime specifics**: `proxy.ts` / `middleware.ts` (Next 16 proxy runs on the
  **Node runtime** — do not move it to edge), API routes, websockets/long-lived work
  (rules out serverless if present), background jobs/cron.
- **Existing deploy signals**: `vercel.json`, Dockerfile, k8s manifests, Helm/Kustomize,
  Argo CD apps, GitHub Actions, `PROJECT.md` (Hosting line), infra dirs in the repo.
- **Git state**: deploy from a clean, committed state — never from a dirty tree.

Summarize the contract in a few lines back to the user. If the tree is dirty or the build
is broken locally (`npm run build`), stop — fix or get agreement first.

## Step 1 — Ask the user for the lane

One question, three options (plus whatever discovery already rules in/out — say so):

1. **Vercel** — managed, zero-ops, native Next.js. Recommend by default for the house
   stack; pick the deploy region closest to the database region.
2. **Kubernetes** — the user has a cluster and wants to own the runtime. Requires
   containerizing; respects existing cluster conventions (GitOps, ingress, cert-manager).
3. **Virtual machine over SSH** — a box the user controls; systemd + reverse proxy +
   TLS. Simplest mental model, most manual ops.

Also settle, in the same exchange when unknown: **environment name** (production only, or
staging too), **domain** (or "platform URL is fine for now"), and **where secret values
come from** (the user's filled `.env.local`, a secret manager, or "I'll paste them").

## Step 2 — Shared pre-flight (every lane)

1. **Env matrix**: for each key in `.env.example`, a production value must exist or be
   consciously deferred. Flag placeholders. `NEXT_PUBLIC_APP_URL` gets the real domain.
2. **External-service config follows the domain**: auth providers need the production
   URL registered (for Neon Auth: the deployed origin/callback in the Neon console);
   CORS/allowed-origins lists likewise. A deploy that forgets this fails only at login —
   put it on the checklist now.
3. **Migrations run from a controlled step** — locally or CI against the production
   database (`npx drizzle-kit migrate`), **never from the app's build**. Build machines
   must not hold DB write credentials as a side effect.
4. Fresh local `npm run build` passes at the commit being deployed.

## Step 3a — Vercel lane

- `vercel whoami` — if unauthenticated, have the user run `! vercel login` (interactive).
- `vercel link` in the repo (new or existing project as appropriate).
- Push env: for each key from the matrix, `vercel env add <KEY> production` — values come
  from the user's source of truth, entered by them or read from their filled `.env.local`
  with their consent. Never invent values; never log them back.
- Region: set the function region nearest the database (check Vercel's current region
  list against the DB region) via project settings or `vercel.json`.
- The committed `.npmrc` makes Vercel's `npm install` reproduce the pinned tree — leave it.
- Deploy: `vercel deploy --prod` (or push to the linked production branch if the user
  prefers git-driven). Watch the build log to completion — do not fire-and-forget.
- Domain: `vercel domains add` / DNS instructions; then update `NEXT_PUBLIC_APP_URL` env
  and redeploy if it changed (build-time bake).

## Step 3b — Kubernetes lane

Discover cluster conventions **before writing YAML**: `kubectl config current-context`,
namespaces, ingress class, cert-manager issuers, how existing apps in the cluster/repo are
shaped (Argo CD? Helm? plain manifests?). Match the house pattern; do not introduce a new
one silently. If Argo CD/GitOps exists, produce manifests into the GitOps repo path and
let the operator sync — do not `kubectl apply` around the GitOps flow.

1. **Containerize** (if no Dockerfile): for Next.js set `output: 'standalone'` in
   `next.config.ts`, then a multi-stage Dockerfile — deps stage (`npm ci`, the committed
   `.npmrc` applies), build stage (needs `NEXT_PUBLIC_*` as build args), runtime stage
   (slim Node LTS image, copy `.next/standalone` + `.next/static` + `public`, non-root
   user, `EXPOSE`/`PORT`, `HOSTNAME=0.0.0.0`). Build and push to the registry the user
   names (check for an in-repo registry convention first).
2. **Secrets**: `kubectl create secret generic <app>-env --from-env-file=<file>` (or the
   cluster's sealed-secrets/external-secrets tool if that's the convention). Secret
   values never enter committed YAML.
3. **Manifests**: Deployment (envFrom the Secret; readiness + liveness probes against a
   cheap route; resource requests/limits; 2 replicas unless told otherwise), Service,
   Ingress with TLS via the cluster's issuer.
4. **Migrations**: a Job (same image, command `npx drizzle-kit migrate`) run before the
   rollout — as an Argo pre-sync hook where GitOps rules, otherwise applied manually
   first.
5. Roll out, then `kubectl rollout status`; smoke-test through the Ingress (or
   port-forward until DNS lands).

## Step 3c — Virtual machine over SSH lane

Confirm first: host, SSH user, sudo availability, OS/distro, what already listens on
80/443 (existing nginx/caddy?), and whether other apps share the box.

1. **Runtime**: Node LTS on the VM (distro package or nvm — match what the box already
   uses). Verify `node -v` meets the app's requirement.
2. **Code + build on the VM**: clone/pull the repo at the deploy commit into
   `/opt/<app>/` (or the box's convention), `npm ci && npm run build` there. If the VM is
   too small to build, build locally and rsync the artifacts (`.next/standalone`,
   `.next/static`, `public`, `package.json`) — pick one strategy and note it in the repo.
3. **Env**: write `/etc/<app>.env` from the matrix (owner root, mode 600). Transfer
   values without leaving them in shell history (scp a locally-written file, then shred
   it, or paste via the user).
4. **systemd**: a unit running the standalone server (`node .next/standalone/server.js`,
   `EnvironmentFile=/etc/<app>.env`, fixed `PORT`, `Restart=on-failure`,
   `WantedBy=multi-user.target`, non-root `User=`). `enable --now`, check
   `systemctl status` and `journalctl -u <app>`.
5. **Reverse proxy + TLS**: Caddy (automatic certs, two-line config) unless nginx is
   already resident — then an nginx server block + certbot. Proxy the domain to the app
   port; confirm HTTP→HTTPS redirect.
6. **Migrations**: run `npx drizzle-kit migrate` on the VM (env file supplies
   `DATABASE_URL`) before first start and on each deploy that adds migrations.
7. **Redeploy path**: document the loop you just did (pull → ci → build → migrate →
   `systemctl restart`) as a small `deploy.sh` in the repo so the next deploy is one
   command. Keep the previous build dir until the new one passes smoke tests.

## Step 4 — Post-deploy verification (every lane)

- Probe the live URL: public routes 200; gated routes redirect to login when
  unauthenticated; auth login round-trips (this is what catches unregistered callback
  origins); API seams respond with their designed codes.
- `NEXT_PUBLIC_APP_URL` and any auth-provider origin config match the real domain.
- Migrations applied: the app's first DB-touching flow works against production.
- Note the rollback move for the chosen lane while it's fresh: Vercel — promote the
  previous deployment; k8s — `kubectl rollout undo` / revert the GitOps commit; VM —
  restart onto the kept previous build. Tell the user what it is.

## Refusals

- **No deploys from a dirty tree** — commit first; the deployed artifact must be
  reproducible from git.
- **No secrets in git, build args that persist, logs, or chat echoes.** `.env.example`
  stays empty-valued; real values live in the platform's secret store, an env file with
  0600 perms, or the user's head.
- **No migrations inside the app build step**, any lane.
- **No lane-mixing** — don't put Docker on the VM lane or `kubectl apply` around a GitOps
  flow because it feels faster. The user picked the lane; changing it is a new decision,
  not an implementation detail.
- **No edge-runtime conversion of the Next 16 `proxy.ts`** — the auth middleware needs
  the Node runtime.

## Escape hatches

- **CI/CD automation** (deploy-on-push, PR preview environments) is a separate install —
  see the `neon-preview-environments` skill; this skill gets one environment live and
  documents the manual loop.
- **Staging**: rerun the chosen lane with a second environment name, separate database
  branch, and separate env matrix — never share the production database.
- **Serverless disqualifiers** (websockets, long-running jobs) discovered in Step 0 mean
  Vercel functions won't fit that piece — surface it at the lane question, don't discover
  it in production.
- **Region mismatch**: if the platform can't deploy near the database region, say the
  latency cost out loud and let the user decide.
