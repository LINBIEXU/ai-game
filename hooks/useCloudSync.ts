"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { STORAGE_KEY } from "@/lib/game-constants";
import { buildSaveSummary, buildWorkRecords, restoreStateFromSnapshot } from "@/lib/cloud-save/serializers";
import { getLocalStorageUpdatedAtKey } from "@/hooks/useLocalStorage";
import type {
  CloudSaveResponse,
  CloudSaveStatus,
  CloudSaveSummary,
  CloudSessionState,
  CloudUserRecord,
  CloudWorkRecord
} from "@/types/cloud-save";
import type { GameState } from "@/types/game";

interface UseCloudSyncOptions {
  sessionState: CloudSessionState;
  state: GameState;
  isHydrated: boolean;
  replaceState: (next: GameState) => void;
}

function buildRequestHeaders(accessToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
}

function hasRecoverableLocalProgress(state: GameState) {
  return Boolean(
    state.generatedCrew ||
      state.crewRoster.length > 0 ||
      state.crewOnboard ||
      state.chapterComplete ||
      state.chapterTwoUnlocked ||
      state.chapterTwoComplete ||
      state.planetCatalog.length > 0 ||
      state.shipLogs.length > 0 ||
      Boolean(state.taskDesk.latestResult) ||
      state.signalMission.planet.status !== "input" ||
      state.signalMission.faultRun.status !== "locked" ||
      state.signalMission.faultRun.history.length > 0
  );
}

function readLocalUpdatedAt() {
  const raw = window.localStorage.getItem(getLocalStorageUpdatedAtKey(STORAGE_KEY));
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildRecentWorkList(state: GameState, authUid: string) {
  return buildWorkRecords(
    state,
    authUid,
    {
      repairedSignal: state.signalMission.repairedSignal,
      chapterTwoOutcome: state.chapterTwo.outcome
    }
  )
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 6);
}

function buildSummaryFromState(state: GameState, authUid: string) {
  return buildSaveSummary(state, buildRecentWorkList(state, authUid));
}

function getSyncMessages(state: GameState) {
  if (state.currentScene === "crew-bay" || state.currentScene === "crew-chat" || state.currentScene === "crew-result") {
    return {
      saving: "船员记录正在写入主舰名册。",
      saved: "船员记录已写入主舰名册。"
    };
  }

  if (state.chapterTwo.echo && !state.chapterTwo.outcome) {
    return {
      saving: "第二章黑匣进度正在同步。",
      saved: "第二章黑匣进度已写入。"
    };
  }

  if (state.signalMission.planet.status === "restored") {
    return {
      saving: "航行记忆与星图档案正在同步。",
      saved: "航行记忆已同步到主舰档案。"
    };
  }

  return {
    saving: "主舰档案正在更新。",
    saved: "主舰档案已更新。"
  };
}

export function useCloudSync({ sessionState, state, isHydrated, replaceState }: UseCloudSyncOptions) {
  const [status, setStatus] = useState<CloudSaveStatus>(sessionState.stage === "disabled" ? "disabled" : "authenticating");
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [recentWorks, setRecentWorks] = useState<CloudWorkRecord[]>([]);
  const [didRestoreHistory, setDidRestoreHistory] = useState(false);
  const [saveSummary, setSaveSummary] = useState<CloudSaveSummary | null>(null);
  const [accountUser, setAccountUser] = useState<CloudUserRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState("主舰记忆正在接入。");
  const hasRestoredRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");
  const saveTimerRef = useRef<number | null>(null);
  const lastAuthUidRef = useRef<string | null>(null);
  const cloudSaveDisabledRef = useRef(false);

  const serializedState = useMemo(() => JSON.stringify(state), [state]);
  const latestStateRef = useRef(state);
  const latestSerializedRef = useRef(serializedState);
  const latestSessionRef = useRef(sessionState.session);

  useEffect(() => {
    latestStateRef.current = state;
    latestSerializedRef.current = serializedState;
    latestSessionRef.current = sessionState.session;
  }, [serializedState, sessionState.session, state]);

  useEffect(() => {
    const authUid = sessionState.session?.authUid ?? null;

    if (lastAuthUidRef.current === authUid) {
      return;
    }

    lastAuthUidRef.current = authUid;
    hasRestoredRef.current = false;
    lastSavedSnapshotRef.current = "";
    setRecentWorks([]);
    setSaveSummary(null);
    setAccountUser(null);
    setDidRestoreHistory(false);
    setLastSavedAt(null);
    cloudSaveDisabledRef.current = false;
  }, [sessionState.session?.authUid]);

  const restoreFromCloud = useCallback(
    async ({ preferLocal = true }: { preferLocal?: boolean } = {}) => {
      if (!isHydrated || sessionState.stage !== "ready" || !sessionState.session) {
        return false;
      }

      setStatus("restoring");
      setError(null);
      setStatusMessage("主舰正在接续你上次离开的航线。");

      try {
        const response = await fetch(
          `/api/cloud-save?authUid=${encodeURIComponent(sessionState.session.authUid)}&loginType=${encodeURIComponent(
            sessionState.session.loginType
          )}`,
          {
            method: "GET",
            cache: "no-store",
            headers: buildRequestHeaders(sessionState.session.accessToken)
          }
        );
        const data = (await response.json().catch(() => null)) as CloudSaveResponse | null;

        if (!response.ok || !data?.ok || !data.snapshot) {
          throw new Error(data?.error ?? "云端存档暂时没有回应。");
        }

        const restored = restoreStateFromSnapshot(data.snapshot);
        const session = sessionState.session;

        setAccountUser(data.snapshot.user);

        if (data.cloudDisabled) {
          const localUpdatedAt = readLocalUpdatedAt();

          cloudSaveDisabledRef.current = true;
          lastSavedSnapshotRef.current = latestSerializedRef.current;
          setLastSavedAt(localUpdatedAt ?? Date.now());
          setRecentWorks(buildRecentWorkList(latestStateRef.current, session.authUid));
          setSaveSummary(buildSummaryFromState(latestStateRef.current, session.authUid));
          setDidRestoreHistory(hasRecoverableLocalProgress(latestStateRef.current));
          hasRestoredRef.current = true;
          setStatus("disabled");
          setStatusMessage("本地开发未接入 CloudBase 服务端密钥，已切到本地记忆舱。");
          return true;
        }

        const localUpdatedAt = readLocalUpdatedAt();
        const shouldPreferLocal =
          preferLocal &&
          hasRecoverableLocalProgress(latestStateRef.current) &&
          Boolean(localUpdatedAt) &&
          (!restored || (localUpdatedAt ?? 0) > restored.restoredAt);

        if (shouldPreferLocal) {
          lastSavedSnapshotRef.current = latestSerializedRef.current;
          setLastSavedAt(localUpdatedAt);
          setRecentWorks(buildRecentWorkList(latestStateRef.current, session.authUid));
          setSaveSummary(buildSummaryFromState(latestStateRef.current, session.authUid));
          setDidRestoreHistory(true);
          setStatusMessage("检测到较新的本地航线记录，已优先接续当前设备上的进度。");
        } else if (restored) {
          replaceState(restored.state);
          lastSavedSnapshotRef.current = JSON.stringify(restored.state);
          setLastSavedAt(restored.restoredAt);
          setRecentWorks(restored.works.slice(0, 6));
          setSaveSummary(data.snapshot.progress?.summary ?? buildSummaryFromState(restored.state, session.authUid));
          setDidRestoreHistory(true);
          setStatusMessage("已接续上次探索，主舰档案恢复完成。");
        } else {
          lastSavedSnapshotRef.current = latestSerializedRef.current;
          setRecentWorks([]);
          setSaveSummary(buildSummaryFromState(latestStateRef.current, session.authUid));
          setDidRestoreHistory(false);
          setStatusMessage("已建立新的匿名航线档案。");
        }

        hasRestoredRef.current = true;
        setStatus("saved");
        return true;
      } catch (restoreError) {
        hasRestoredRef.current = true;
        lastSavedSnapshotRef.current = latestSerializedRef.current;
        setStatus("error");
        setError(restoreError instanceof Error ? restoreError.message : "云端存档恢复失败。");
        setStatusMessage("同步链路异常，主舰将先沿用本地记忆。");
        return false;
      }
    },
    [isHydrated, replaceState, sessionState.session, sessionState.stage]
  );

  const persistSnapshot = useCallback(
    async ({ keepalive = false, silent = false }: { keepalive?: boolean; silent?: boolean } = {}) => {
      if (!isHydrated || sessionState.stage !== "ready" || !hasRestoredRef.current) {
        return false;
      }

      const session = latestSessionRef.current;
      const snapshot = latestStateRef.current;
      const serializedSnapshot = latestSerializedRef.current;

      if (!session || serializedSnapshot === lastSavedSnapshotRef.current) {
        return true;
      }

      if (cloudSaveDisabledRef.current) {
        lastSavedSnapshotRef.current = serializedSnapshot;
        const savedAt = Date.now();
        setLastSavedAt(savedAt);
        setRecentWorks(buildRecentWorkList(snapshot, session.authUid));
        setSaveSummary(buildSummaryFromState(snapshot, session.authUid));
        setStatus("disabled");
        setStatusMessage("本地记忆舱已更新；部署到 CloudBase 后会自动走云端存档。");
        return true;
      }

      try {
        if (!silent) {
          setStatus("saving");
          setError(null);
          setStatusMessage(getSyncMessages(snapshot).saving);
        }

        const response = await fetch("/api/cloud-save", {
          method: "POST",
          headers: buildRequestHeaders(session.accessToken),
          body: JSON.stringify({
            authUid: session.authUid,
            loginType: session.loginType,
            email: session.email,
            isAnonymous: session.isAnonymous,
            state: snapshot
          }),
          cache: "no-store",
          keepalive
        });
        const data = (await response.json().catch(() => null)) as CloudSaveResponse | null;

        if (!response.ok || !data?.ok || !data.saveMeta) {
          throw new Error(data?.error ?? "云端存档写入失败。");
        }

        if (data.cloudDisabled) {
          cloudSaveDisabledRef.current = true;
        }

        lastSavedSnapshotRef.current = serializedSnapshot;
        setLastSavedAt(data.saveMeta.updatedAt);
        setRecentWorks(buildRecentWorkList(snapshot, session.authUid));
        setSaveSummary(data.saveMeta.summary);
        setAccountUser((current) =>
          current
            ? {
                ...current,
                loginType: session.loginType,
                email: session.email ?? current.email,
                isAnonymous: session.email ? false : session.isAnonymous,
                lastLoginAt: Date.now(),
                boundAt: session.email ? (current.boundAt ?? Date.now()) : current.boundAt
              }
            : current
        );

        if (!silent) {
          if (data.cloudDisabled) {
            setStatus("disabled");
            setStatusMessage("本地记忆舱已更新；部署到 CloudBase 后会自动走云端存档。");
            return true;
          }

          setStatus("saved");
          setStatusMessage(getSyncMessages(snapshot).saved);
        }

        return true;
      } catch (saveError) {
        if (!silent) {
          setStatus("error");
          setError(saveError instanceof Error ? saveError.message : "云端存档写入失败。");
          setStatusMessage("同步异常，本地记忆仍在继续保存。");
        }

        return false;
      }
    },
    [isHydrated, sessionState.stage]
  );

  useEffect(() => {
    if (sessionState.stage === "disabled") {
      setStatus("disabled");
      setStatusMessage("当前仍在使用本地记忆舱。");
      return;
    }

    if (sessionState.stage === "connecting") {
      setStatus("authenticating");
      setStatusMessage("匿名航海编号正在生成。");
      return;
    }

    if (sessionState.stage === "error") {
      setStatus("error");
      setError(sessionState.error);
      setStatusMessage("同步链路短暂失焦，本地记录仍会继续保留。");
    }
  }, [sessionState.error, sessionState.stage]);

  useEffect(() => {
    if (!isHydrated || sessionState.stage !== "ready" || hasRestoredRef.current) {
      return;
    }

    void restoreFromCloud();
  }, [isHydrated, restoreFromCloud, sessionState.stage]);

  useEffect(() => {
    if (!isHydrated || sessionState.stage !== "ready" || !hasRestoredRef.current) {
      return;
    }

    if (serializedState === lastSavedSnapshotRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistSnapshot();
    }, 1200);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [isHydrated, persistSnapshot, serializedState, sessionState.stage]);

  useEffect(() => {
    if (!isHydrated || sessionState.stage !== "ready") {
      return;
    }

    const flushPendingSync = () => {
      if (!hasRestoredRef.current || latestSerializedRef.current === lastSavedSnapshotRef.current) {
        return;
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      void persistSnapshot({ keepalive: true, silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingSync();
      }
    };

    window.addEventListener("pagehide", flushPendingSync);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushPendingSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isHydrated, persistSnapshot, sessionState.stage]);

  return {
    status,
    error,
    lastSavedAt,
    recentWorks,
    didRestoreHistory,
    saveSummary,
    statusMessage,
    hasCloudIdentity: sessionState.stage === "ready" && Boolean(sessionState.session?.authUid),
    authUid: sessionState.session?.authUid ?? null,
    loginType: accountUser?.loginType ?? sessionState.session?.loginType ?? null,
    accountEmail: accountUser?.email ?? sessionState.session?.email ?? null,
    isAnonymousAccount: accountUser?.isAnonymous ?? sessionState.session?.isAnonymous ?? true,
    refreshRemoteSnapshot: restoreFromCloud
  };
}
