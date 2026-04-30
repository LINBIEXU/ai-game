"use client";

import { useCallback, useEffect, useState } from "react";

import { getCloudBaseAuth } from "@/lib/cloudbase/client";
import type { CloudSessionState } from "@/types/cloud-save";

const LOCAL_SESSION_KEY = "starship-local-anonymous-session-v1";

const disabledState: CloudSessionState = {
  stage: "disabled",
  session: null,
  error: null
};

function normalizeLoginType(loginType: string | undefined, email: string | null) {
  if (email) {
    return "EMAIL";
  }

  return loginType ?? "ANONYMOUS";
}

function isLocalHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
}

function shouldUseLocalAnonymousSession() {
  return isLocalHost() && process.env.NEXT_PUBLIC_CLOUDBASE_ENABLE_LOCAL_AUTH !== "true";
}

function createLocalAnonymousSession(): NonNullable<CloudSessionState["session"]> {
  const stored = window.localStorage.getItem(LOCAL_SESSION_KEY);
  const authUid = stored || `local-${window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  if (!stored) {
    window.localStorage.setItem(LOCAL_SESSION_KEY, authUid);
  }

  return {
    authUid,
    loginType: "ANONYMOUS",
    accessToken: `local-token-${authUid}`,
    email: null,
    isAnonymous: true
  };
}

export function useCloudSession() {
  const [state, setState] = useState<CloudSessionState>({
    stage: "connecting",
    session: null,
    error: null
  });
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshSession = useCallback(async () => {
    setRefreshTick((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (shouldUseLocalAnonymousSession()) {
      setState({
        stage: "ready",
        session: createLocalAnonymousSession(),
        error: null
      });
      return;
    }

    const auth = getCloudBaseAuth();

    if (!auth) {
      setState(disabledState);
      return;
    }

    const readyAuth = auth;

    async function bootstrap() {
      try {
        setState((current) => ({
          ...current,
          stage: "connecting",
          error: null
        }));

        let loginState = await readyAuth.getLoginState();

        if (!loginState?.user?.uid) {
          await readyAuth.signInAnonymously();
          loginState = await readyAuth.getLoginState();
        }

        const user = loginState?.user ?? (await readyAuth.getCurrentUser());
        const token = await readyAuth.getAccessToken();
        const email = user?.email?.trim() ?? null;

        if (!user?.uid || !token?.accessToken) {
          throw new Error("当前身份未能完成接入。");
        }

        if (cancelled) {
          return;
        }

        setState({
          stage: "ready",
          session: {
            authUid: user.uid,
            loginType: normalizeLoginType(user.loginType, email),
            accessToken: token.accessToken,
            email,
            isAnonymous: !email
          },
          error: null
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          stage: "error",
          session: null,
          error: error instanceof Error ? error.message : "匿名登录失败。"
        });
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return {
    ...state,
    refreshSession
  };
}
