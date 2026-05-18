#!/usr/bin/env node
import { parseArgs } from "./lib/args.mjs";
import { loadConfig } from "./lib/config.mjs";
import { writeJson } from "./lib/files.mjs";
import {
  createNeonBranch,
  deleteNeonBranch,
  findBranchByName,
  getConnectionUri,
  neonConfigured,
  redactDatabaseUrl,
  resolvePublicUrls
} from "./lib/neon.mjs";
import { previewBranchName } from "./lib/names.mjs";
import { mask, setOutput } from "./lib/output.mjs";

const args = parseArgs();
const command = args._?.[0];
const config = await loadConfig();
if (!["create", "delete"].includes(command)) throw new Error("Usage: node scripts/neon-preview.mjs <create|delete>");

function configuredBranchName() {
  if (args.branchName || process.env.NEON_BRANCH_NAME) return args.branchName || process.env.NEON_BRANCH_NAME;
  const headBranch = process.env.HEAD_BRANCH || process.env.GITHUB_HEAD_REF || "";
  if (headBranch) return previewBranchName({ headBranch });
  return previewBranchName({ pullNumber: process.env.PR_NUMBER || process.env.ISSUE_NUMBER });
}

function boolOption(envName, fallback = false) {
  const value = process.env[envName];
  if (value === undefined || value === "") return Boolean(fallback);
  return !["0", "false", "no", "off"].includes(value.toLowerCase());
}

function listOption(envName) {
  return (process.env[envName] || "")
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

if (!neonConfigured()) {
  if (process.env.NEON_REQUIRED === "true") throw new Error("Neon is required but NEON_API_KEY or NEON_PROJECT_ID is missing.");
  const disabled = { enabled: false, reason: "NEON_API_KEY or NEON_PROJECT_ID not configured." };
  await writeJson(".agent/runtime/neon.json", disabled);
  setOutput("enabled", "false");
  setOutput("reason", disabled.reason);
  process.exit(0);
}

if (command === "create") {
  const branchName = configuredBranchName();
  const databaseName = process.env.NEON_DATABASE_NAME || config.neon.databaseName;
  const roleName = process.env.NEON_ROLE_NAME || config.neon.roleName;
  const pooled = (process.env.NEON_POOLED ?? String(config.neon.pooled)) !== "false";
  const existing = await findBranchByName(branchName);
  const branch = existing
    ? {
        projectId: process.env.NEON_PROJECT_ID,
        branchId: existing.id,
        branchName: existing.name,
        endpointId: "",
        databaseName,
        roleName,
        expiresAt: existing.expires_at || "",
        databaseUrl: await getConnectionUri({ branchId: existing.id, databaseName, roleName, pooled }),
        databaseUrlRedacted: ""
      }
    : await createNeonBranch({
        name: branchName,
        ttlHours: args.ttlHours || process.env.NEON_DEFAULT_TTL_HOURS || config.neon.ttlHours,
        databaseName,
        roleName,
        pooled
      });

  if (!branch.databaseUrlRedacted) branch.databaseUrlRedacted = redactDatabaseUrl(branch.databaseUrl);

  const publicUrls = await resolvePublicUrls({
    branchId: branch.branchId,
    databaseName,
    databaseUrl: branch.databaseUrl,
    getAuthUrl: boolOption("NEON_GET_AUTH_URL", config.neon.publicUrls.auth),
    getDataApiUrl: boolOption("NEON_GET_DATA_API_URL", config.neon.publicUrls.dataApi),
    requirePublicUrls: boolOption("NEON_REQUIRE_PUBLIC_URLS", config.neon.publicUrls.required),
    provisionAuth: boolOption("NEON_PROVISION_AUTH", config.neon.publicUrls.provisionAuth),
    provisionDataApi: boolOption("NEON_PROVISION_DATA_API", config.neon.publicUrls.provisionDataApi),
    authProvider: process.env.NEON_AUTH_PROVIDER || config.neon.publicUrls.authProvider,
    dataApiAuthProvider: process.env.NEON_DATA_API_AUTH_PROVIDER || config.neon.publicUrls.dataApiAuthProvider,
    authTrustedDomains: listOption("NEON_AUTH_TRUSTED_DOMAINS")
  });

  mask(branch.databaseUrl);
  await writeJson(".agent/runtime/neon.json", {
    enabled: true,
    projectId: branch.projectId,
    branchId: branch.branchId,
    branchName: branch.branchName,
    endpointId: branch.endpointId,
    databaseName: branch.databaseName,
    roleName: branch.roleName,
    expiresAt: branch.expiresAt,
    databaseUrlRedacted: branch.databaseUrlRedacted,
    authUrl: publicUrls.authUrl,
    dataApiUrl: publicUrls.dataApiUrl
  });

  setOutput("enabled", "true");
  setOutput("branch_id", branch.branchId);
  setOutput("branch_name", branch.branchName);
  setOutput("endpoint_id", branch.endpointId);
  setOutput("expires_at", branch.expiresAt);
  setOutput("database_url", branch.databaseUrl);
  setOutput("database_url_redacted", branch.databaseUrlRedacted);
  setOutput("auth_url", publicUrls.authUrl);
  setOutput("data_api_url", publicUrls.dataApiUrl);
}

if (command === "delete") {
  if (config.neon.deleteOnPrClose === false) {
    setOutput("deleted", "false");
    setOutput("reason", "neon.deleteOnPrClose is false.");
    process.exit(0);
  }
  const branchName = configuredBranchName();
  const branch = await findBranchByName(branchName);
  if (!branch) {
    setOutput("deleted", "false");
    setOutput("reason", `No Neon branch named ${branchName} found.`);
    process.exit(0);
  }
  await deleteNeonBranch(branch.id);
  setOutput("deleted", "true");
  setOutput("branch_id", branch.id);
  setOutput("branch_name", branch.name);
}
