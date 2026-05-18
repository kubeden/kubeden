#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig, adapterConfig } from "./lib/config.mjs";
import { requiredEnv, run, slug, writePreviewMetadata } from "./lib/preview.mjs";
import { setOutput } from "./lib/output.mjs";

const config = await loadConfig();
const adapter = adapterConfig(config, "argocd-gitops");
const prNumber = requiredEnv("PR_NUMBER");
const authUrl = process.env.VITE_NEON_AUTH_URL || "";
const dataApiUrl = process.env.VITE_NEON_DATA_API_URL || "";
const imageRepository = process.env.PREVIEW_IMAGE_REPOSITORY || adapter.imageRepository;
if (!imageRepository) throw new Error("adapters.argocdGitops.imageRepository is required.");

const shortSha = (process.env.PR_HEAD_SHA || process.env.GITHUB_SHA || "local").slice(0, 7);
const image = `${imageRepository}:pr-${prNumber}-${shortSha}`;
const registryHost = imageRepository.split("/")[0];
const imagePlatform = process.env.PREVIEW_IMAGE_PLATFORM || adapter.imagePlatform || "linux/amd64";
const appPrefix = adapter.appPrefix || "preview-pr";
const appName = `${slug(appPrefix)}-${prNumber}`;
const hostSuffix = adapter.hostSuffix || requiredEnv("PREVIEW_DOMAIN_SUFFIX");
const host = `${appName}.${hostSuffix}`;
const previewUrl = `https://${host}`;
const gitopsRepo = adapter.repository || requiredEnv("GITOPS_REPOSITORY");
const gitopsPath = adapter.checkoutPath || ".agent/runtime/gitops";
const gitopsBranch = process.env.GITOPS_BRANCH || adapter.previewBranch || "preview-environments";
const gitopsBaseBranch = process.env.GITOPS_BASE_BRANCH || adapter.baseBranch || "development";
const previewRoot = adapter.previewRoot || "previews";
const relativePreviewDir = `${previewRoot}/${appName}`;
const previewDir = join(gitopsPath, relativePreviewDir);
const serviceName = `${appName}-service`;
const gatewayName = `${appName}-gateway`;
const tlsName = `${appName}-tls`;
const containerPort = Number(adapter.containerPort || 3000);
const servicePort = Number(adapter.servicePort || 80);

function dockerLogin() {
  const username = requiredEnv("REGISTRY_USERNAME");
  const password = requiredEnv("REGISTRY_PASSWORD");
  console.log(`+ docker login ${registryHost} --password-stdin`);
  const result = spawnSync("docker", ["login", registryHost, "-u", username, "--password-stdin"], {
    input: `${password}\n`,
    stdio: ["pipe", "inherit", "inherit"]
  });
  if (result.status !== 0) throw new Error(`docker login failed with status ${result.status}.`);
}

function git(args, options = {}) {
  execFileSync("git", args, { stdio: "inherit", cwd: gitopsPath, ...options });
}

function gitCapture(args) {
  return execFileSync("git", args, { encoding: "utf8", cwd: gitopsPath }).trim();
}

function cloneGitopsRepo() {
  const token = requiredEnv("GITOPS_TOKEN");
  const encoded = Buffer.from(`x-access-token:${token}`).toString("base64");
  execFileSync("git", ["clone", `https://github.com/${gitopsRepo}.git`, gitopsPath], {
    stdio: "inherit",
    env: {
      ...process.env,
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${encoded}`
    }
  });
  git(["config", "user.name", "preview-bot"]);
  git(["config", "user.email", "preview-bot@users.noreply.github.com"]);
  try {
    git(["fetch", "origin", gitopsBranch]);
    git(["checkout", "-B", gitopsBranch, `origin/${gitopsBranch}`]);
  } catch {
    git(["fetch", "origin", gitopsBaseBranch]);
    git(["checkout", "-B", gitopsBranch, `origin/${gitopsBaseBranch}`]);
  }
}

async function writeManifests() {
  await rm(previewDir, { recursive: true, force: true });
  await mkdir(previewDir, { recursive: true });
  await writeFile(join(previewDir, "kustomization.yml"), `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yml
  - service.yml
  - gateway.yml
`);
  await writeFile(join(previewDir, "deployment.yml"), `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
        - name: app
          image: ${image}
          imagePullPolicy: Always
          ports:
            - containerPort: ${containerPort}
`);
  await writeFile(join(previewDir, "service.yml"), `apiVersion: v1
kind: Service
metadata:
  name: ${serviceName}
spec:
  selector:
    app: ${appName}
  ports:
    - protocol: TCP
      port: ${servicePort}
      targetPort: ${containerPort}
`);
  await writeFile(join(previewDir, "gateway.yml"), `---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ${tlsName}
  namespace: ${appName}
spec:
  secretName: ${tlsName}
  issuerRef:
    name: ${adapter.clusterIssuer || "letsencrypt-prod"}
    kind: ClusterIssuer
  dnsNames:
    - ${JSON.stringify(host)}
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: ${gatewayName}
  namespace: ${appName}
spec:
  gatewayClassName: ${adapter.gatewayClassName || "traefik"}
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: ${JSON.stringify(host)}
      tls:
        mode: Terminate
        certificateRefs:
          - group: ''
            kind: Secret
            name: ${tlsName}
      allowedRoutes:
        namespaces:
          from: Same
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ${appName}
  namespace: ${appName}
spec:
  parentRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: ${gatewayName}
      namespace: ${appName}
  hostnames:
    - ${JSON.stringify(host)}
  rules:
    - backendRefs:
        - group: ''
          kind: Service
          name: ${serviceName}
          port: ${servicePort}
`);
}

dockerLogin();
run("docker", [
  "buildx", "build",
  "--platform", imagePlatform,
  ...(authUrl ? ["--build-arg", `VITE_NEON_AUTH_URL=${authUrl}`] : []),
  ...(dataApiUrl ? ["--build-arg", `VITE_NEON_DATA_API_URL=${dataApiUrl}`] : []),
  "-t", image,
  "--push",
  "."
]);

cloneGitopsRepo();
await writeManifests();
git(["add", relativePreviewDir]);
const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: gitopsPath });
if (diff.status === 1) {
  git(["commit", "-m", `Deploy preview for PR #${prNumber}`]);
  git(["push", "origin", `HEAD:${gitopsBranch}`]);
}
const gitopsCommit = gitCapture(["rev-parse", "--short", "HEAD"]);

await writePreviewMetadata({
  provider: "argocd-gitops",
  url: previewUrl,
  resourceName: appName,
  resourceId: appName,
  cleanup: { enabled: true },
  details: { image, gitopsRepo, gitopsBranch, gitopsCommit, relativePreviewDir }
});

setOutput("url", previewUrl);
setOutput("image", image);
setOutput("gitops_commit", gitopsCommit);
console.log(`Preview URL: ${previewUrl}`);
