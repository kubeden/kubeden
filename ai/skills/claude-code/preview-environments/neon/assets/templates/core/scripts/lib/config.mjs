import { readJson } from "./files.mjs";

const DEFAULT_CONFIG = {
  baseBranch: "development",
  allowedActors: [],
  allowedAuthorAssociations: ["OWNER", "MEMBER", "COLLABORATOR"],
  labels: {
    agentPr: "agent",
    preview: "preview"
  },
  commands: {},
  preview: {
    enabled: true,
    adapter: "",
    workflowFile: "preview-neon.yml",
    urlFile: ".agent/runtime/preview-url.txt",
    metadataFile: ".agent/runtime/preview.json",
    commands: {
      deploy: "node scripts/deploy-preview.mjs",
      wait: "node scripts/wait-preview.mjs",
      cleanup: "node scripts/cleanup-preview.mjs"
    }
  },
  production: {
    enabled: false,
    migrateCommand: "",
    deployCommand: "",
    url: ""
  },
  neon: {
    databaseName: "neondb",
    roleName: "neondb_owner",
    pooled: true,
    ttlHours: 48,
    deleteOnPrClose: true,
    publicUrls: {
      auth: false,
      dataApi: false,
      required: false,
      provisionAuth: false,
      provisionDataApi: false,
      authProvider: "",
      dataApiAuthProvider: "neon_auth"
    }
  },
  adapters: {}
};

function mergeObject(base, override) {
  return { ...base, ...(override ?? {}) };
}

export async function loadConfig() {
  const config = await readJson("agent.config.json", {});
  return {
    ...DEFAULT_CONFIG,
    ...config,
    labels: mergeObject(DEFAULT_CONFIG.labels, config.labels),
    commands: mergeObject(DEFAULT_CONFIG.commands, config.commands),
    preview: {
      ...DEFAULT_CONFIG.preview,
      ...(config.preview ?? {}),
      commands: mergeObject(DEFAULT_CONFIG.preview.commands, config.preview?.commands)
    },
    production: mergeObject(DEFAULT_CONFIG.production, config.production),
    neon: {
      ...DEFAULT_CONFIG.neon,
      ...(config.neon ?? {}),
      publicUrls: mergeObject(DEFAULT_CONFIG.neon.publicUrls, config.neon?.publicUrls)
    },
    adapters: mergeObject(DEFAULT_CONFIG.adapters, config.adapters)
  };
}

export function selectedAdapter(config) {
  const adapter = config.preview?.adapter;
  if (!adapter) throw new Error("preview.adapter must be set in agent.config.json.");
  return adapter;
}

export function adapterConfig(config, name = selectedAdapter(config)) {
  const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return config.adapters?.[key] ?? config.adapters?.[name] ?? {};
}
