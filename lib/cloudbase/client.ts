"use client";

import cloudbase from "@cloudbase/js-sdk";

import { getCloudBaseClientConfig } from "@/lib/cloudbase/config";

let appInstance: ReturnType<typeof cloudbase.init> | null = null;
let authInstance: ReturnType<ReturnType<typeof cloudbase.init>["auth"]> | null = null;

export function getCloudBaseApp() {
  const config = getCloudBaseClientConfig();

  if (!config.enabled || !config.envId) {
    return null;
  }

  if (!appInstance) {
    appInstance = cloudbase.init({
      env: config.envId
    });
  }

  return appInstance;
}

export function getCloudBaseAuth() {
  const app = getCloudBaseApp();

  if (!app) {
    return null;
  }

  if (!authInstance) {
    authInstance = app.auth({
      persistence: "local"
    });
  }

  return authInstance;
}
