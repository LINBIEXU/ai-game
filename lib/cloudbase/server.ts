import tcb from "@cloudbase/node-sdk";

import { getCloudBaseServerConfig } from "@/lib/cloudbase/config";

let appInstance: ReturnType<typeof tcb.init> | null = null;

function buildServerConfig() {
  const config = getCloudBaseServerConfig();

  if (!config.enabled) {
    return null;
  }

  if (config.useCurrentRuntime) {
    return {
      env: tcb.SYMBOL_CURRENT_ENV
    };
  }

  if (!config.envId || !config.secretId || !config.secretKey) {
    return null;
  }

  return {
    env: config.envId,
    secretId: config.secretId,
    secretKey: config.secretKey,
    sessionToken: config.sessionToken ?? undefined
  };
}

export function getServerCloudBaseApp() {
  const serverConfig = buildServerConfig();

  if (!serverConfig) {
    return null;
  }

  if (!appInstance) {
    appInstance = tcb.init(serverConfig);
  }

  return appInstance;
}
