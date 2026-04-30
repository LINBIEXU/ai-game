function normalizeBoolean(value?: string | null, fallback = false) {
  if (value == null) {
    return fallback;
  }

  return value !== "false";
}

export interface CloudBaseClientConfig {
  enabled: boolean;
  envId: string | null;
}

export interface CloudBaseServerConfig {
  enabled: boolean;
  envId: string | null;
  secretId: string | null;
  secretKey: string | null;
  sessionToken: string | null;
  useCurrentRuntime: boolean;
}

export function getCloudBaseClientConfig(): CloudBaseClientConfig {
  const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID?.trim() ?? null;

  return {
    enabled: Boolean(envId),
    envId
  };
}

export function getCloudBaseServerConfig(): CloudBaseServerConfig {
  const envId = process.env.CLOUDBASE_ENV_ID?.trim() ?? process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID?.trim() ?? null;
  const useCurrentRuntime =
    normalizeBoolean(process.env.CLOUDBASE_USE_RUNTIME_ENV, true) &&
    Boolean(process.env.TENCENTCLOUD_RUNENV || process.env.SCF_NAMESPACE || process.env.K_SERVICE);

  return {
    enabled: Boolean(useCurrentRuntime || (envId && process.env.CLOUDBASE_SECRET_ID && process.env.CLOUDBASE_SECRET_KEY)),
    envId,
    secretId: process.env.CLOUDBASE_SECRET_ID?.trim() ?? null,
    secretKey: process.env.CLOUDBASE_SECRET_KEY?.trim() ?? null,
    sessionToken: process.env.CLOUDBASE_SESSION_TOKEN?.trim() ?? null,
    useCurrentRuntime
  };
}
