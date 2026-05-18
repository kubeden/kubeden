const API_BASE = "https://console.neon.tech/api/v2";

export function neonConfigured() {
  return Boolean(process.env.NEON_API_KEY && process.env.NEON_PROJECT_ID);
}

export async function neonRequest(path, options = {}) {
  if (!neonConfigured()) throw new Error("NEON_API_KEY and NEON_PROJECT_ID are required.");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${process.env.NEON_API_KEY}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(`Neon API ${response.status}: ${data?.message ?? response.statusText}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function redactDatabaseUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "REDACTED";
    return parsed.toString();
  } catch {
    return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:REDACTED@");
  }
}

export async function createNeonBranch({
  name,
  ttlHours,
  databaseName,
  roleName,
  pooled,
  parentBranchId = process.env.NEON_PARENT_BRANCH_ID || ""
}) {
  const projectId = process.env.NEON_PROJECT_ID;
  const expiresAt = ttlHours
    ? new Date(Date.now() + Number(ttlHours) * 60 * 60 * 1000).toISOString()
    : "";
  const body = {
    branch: {
      name,
      ...(parentBranchId ? { parent_id: parentBranchId } : {}),
      ...(expiresAt ? { expires_at: expiresAt } : {})
    },
    endpoints: [{ type: "read_write" }]
  };
  const created = await neonRequest(`/projects/${projectId}/branches`, {
    method: "POST",
    body: JSON.stringify(body)
  });
  const branch = created.branch;
  const endpoint = created.endpoints?.[0] ?? null;
  const params = new URLSearchParams({
    branch_id: branch.id,
    database_name: databaseName,
    role_name: roleName,
    pooled: String(Boolean(pooled))
  });
  if (endpoint?.id) params.set("endpoint_id", endpoint.id);
  const connection = await neonRequest(`/projects/${projectId}/connection_uri?${params}`);
  return {
    projectId,
    branchId: branch.id,
    branchName: branch.name,
    endpointId: endpoint?.id ?? "",
    databaseName,
    roleName,
    expiresAt,
    databaseUrl: connection.uri,
    databaseUrlRedacted: redactDatabaseUrl(connection.uri)
  };
}

export async function getConnectionUri({ branchId, databaseName, roleName, pooled }) {
  const projectId = process.env.NEON_PROJECT_ID;
  const params = new URLSearchParams({
    branch_id: branchId,
    database_name: databaseName,
    role_name: roleName,
    pooled: String(Boolean(pooled))
  });
  const connection = await neonRequest(`/projects/${projectId}/connection_uri?${params}`);
  return connection.uri;
}

export async function findBranchByName(name) {
  const projectId = process.env.NEON_PROJECT_ID;
  const params = new URLSearchParams({ search: name });
  const data = await neonRequest(`/projects/${projectId}/branches?${params}`);
  return (data.branches ?? []).find((branch) => branch.name === name) ?? null;
}

export async function deleteNeonBranch(branchId) {
  const projectId = process.env.NEON_PROJECT_ID;
  return neonRequest(`/projects/${projectId}/branches/${branchId}`, { method: "DELETE" });
}

function findUrl(value, preferredKeys) {
  if (!value || typeof value !== "object") return "";
  for (const key of preferredKeys) {
    if (typeof value[key] === "string" && /^https?:\/\//.test(value[key])) return value[key];
  }
  for (const nested of Object.values(value)) {
    if (!nested || typeof nested !== "object") continue;
    const url = findUrl(nested, preferredKeys);
    if (url) return url;
  }
  return "";
}

function authUrlFrom(data) {
  return findUrl(data, ["auth_url", "authUrl", "auth_endpoint", "authEndpoint", "url"]);
}

function dataApiUrlFrom(data) {
  return findUrl(data, ["data_api_url", "dataApiUrl", "data_api_endpoint", "dataApiEndpoint", "url"]);
}

function derivePublicUrlsFromDatabaseUrl({ databaseUrl, databaseName }) {
  if (!databaseUrl) return { authUrl: "", dataApiUrl: "" };
  try {
    const { hostname } = new URL(databaseUrl);
    const [firstLabel, ...rest] = hostname.split(".");
    const endpoint = firstLabel.replace(/-pooler$/, "");
    if (!endpoint || rest.length === 0) return { authUrl: "", dataApiUrl: "" };
    const publicSuffix = rest.join(".");
    return {
      authUrl: `https://${endpoint}.neonauth.${publicSuffix}/${databaseName}/auth`,
      dataApiUrl: `https://${endpoint}.apirest.${publicSuffix}/${databaseName}/rest/v1`
    };
  } catch {
    return { authUrl: "", dataApiUrl: "" };
  }
}

async function getNeonAuth({ branchId }) {
  const projectId = process.env.NEON_PROJECT_ID;
  return neonRequest(`/projects/${projectId}/branches/${branchId}/auth`);
}

async function createNeonAuth({ branchId, databaseName, authProvider }) {
  if (!authProvider) throw new Error("NEON_AUTH_PROVIDER is required to provision Neon Auth.");
  const projectId = process.env.NEON_PROJECT_ID;
  return neonRequest(`/projects/${projectId}/branches/${branchId}/auth`, {
    method: "POST",
    body: JSON.stringify({
      auth_provider: authProvider,
      ...(databaseName ? { database_name: databaseName } : {})
    })
  });
}

async function addNeonAuthTrustedDomain({ branchId, domain, authProvider }) {
  if (!domain) return null;
  if (!authProvider) throw new Error("NEON_AUTH_PROVIDER is required to add Neon Auth domains.");
  const projectId = process.env.NEON_PROJECT_ID;
  try {
    return await neonRequest(`/projects/${projectId}/branches/${branchId}/auth/domains`, {
      method: "POST",
      body: JSON.stringify({ domain, auth_provider: authProvider })
    });
  } catch (error) {
    const message = String(error.data?.message ?? error.message);
    if (error.status === 409 || message.includes("DOMAIN_ALREADY_EXISTS")) return null;
    throw error;
  }
}

async function getNeonDataApi({ branchId, databaseName }) {
  const projectId = process.env.NEON_PROJECT_ID;
  return neonRequest(`/projects/${projectId}/branches/${branchId}/data-api/${databaseName}`);
}

async function createNeonDataApi({ branchId, databaseName, authProvider }) {
  const projectId = process.env.NEON_PROJECT_ID;
  return neonRequest(`/projects/${projectId}/branches/${branchId}/data-api/${databaseName}`, {
    method: "POST",
    body: JSON.stringify({
      auth_provider: authProvider,
      ...(authProvider === "neon_auth" ? { skip_auth_schema: true } : {})
    })
  });
}

export async function resolvePublicUrls({
  branchId,
  databaseName,
  databaseUrl,
  getAuthUrl,
  getDataApiUrl,
  requirePublicUrls,
  provisionAuth,
  provisionDataApi,
  authProvider,
  dataApiAuthProvider,
  authTrustedDomains = []
}) {
  const result = { authUrl: "", dataApiUrl: "" };
  const derived = derivePublicUrlsFromDatabaseUrl({ databaseUrl, databaseName });

  if (getAuthUrl || provisionAuth) {
    try {
      result.authUrl = authUrlFrom(await getNeonAuth({ branchId }));
    } catch (error) {
      if (![404, 409].includes(error.status)) throw error;
    }
    if (!result.authUrl && provisionAuth) {
      try {
        result.authUrl = authUrlFrom(await createNeonAuth({ branchId, databaseName, authProvider }));
      } catch (error) {
        if (error.status !== 409) throw error;
      }
    }
    if (!result.authUrl) result.authUrl = derived.authUrl;
  }

  if (result.authUrl && authTrustedDomains.length) {
    await Promise.all(authTrustedDomains.map((domain) =>
      addNeonAuthTrustedDomain({ branchId, domain, authProvider })
    ));
  }

  if (getDataApiUrl || provisionDataApi) {
    try {
      result.dataApiUrl = dataApiUrlFrom(await getNeonDataApi({ branchId, databaseName }));
    } catch (error) {
      if (![404, 409].includes(error.status)) throw error;
    }
    if (!result.dataApiUrl && provisionDataApi) {
      try {
        result.dataApiUrl = dataApiUrlFrom(await createNeonDataApi({
          branchId,
          databaseName,
          authProvider: dataApiAuthProvider
        }));
      } catch (error) {
        if (error.status !== 409) throw error;
      }
    }
    if (!result.dataApiUrl) result.dataApiUrl = derived.dataApiUrl;
  }

  if (requirePublicUrls) {
    if ((getAuthUrl || provisionAuth) && !result.authUrl) throw new Error("Could not resolve Neon Auth URL.");
    if ((getDataApiUrl || provisionDataApi) && !result.dataApiUrl) throw new Error("Could not resolve Neon Data API URL.");
  }

  return result;
}
