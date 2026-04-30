"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createInitialGameState } from "@/lib/game-constants";
import type { ClassroomImageAsset, GameState } from "@/types/game";

const PROFILE_KEY = "starship-classroom-profile-name";

interface UploadOptions {
  kind: ClassroomImageAsset["kind"];
  ownerId: string;
  file: File;
}

export function useClassroomProfile({
  state,
  isHydrated,
  replaceState
}: {
  state: GameState;
  isHydrated: boolean;
  replaceState: (state: GameState) => void;
}) {
  const [profileName, setProfileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("请输入学员姓名，接入本地课堂档案。");
  const loadedRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    const savedName = window.localStorage.getItem(PROFILE_KEY);

    if (savedName) {
      void login(savedName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (name: string) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      setStatus("loading");
      setMessage("正在读取本地课堂档案...");

      try {
        const response = await fetch(`/api/classroom-profile?name=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
        const data = (await response.json()) as { exists?: boolean; name?: string; state?: { state?: GameState } | GameState | null };
        const nextName = data.name ?? trimmed;
        const savedState = data.state && "state" in data.state ? data.state.state : data.state;

        if (savedState) {
          skipNextSaveRef.current = true;
          replaceState(savedState as GameState);
          setMessage(`已接续 ${nextName} 的本地课堂档案。`);
        } else {
          skipNextSaveRef.current = true;
          replaceState(createInitialGameState());
          setMessage(`${nextName} 还没有历史档案，将从新的主舰记录开始。`);
        }

        window.localStorage.setItem(PROFILE_KEY, nextName);
        setProfileName(nextName);
        loadedRef.current = true;
        setStatus("ready");
      } catch (error) {
        console.warn("Failed to load classroom profile", error);
        setStatus("error");
        setMessage("本地课堂档案读取失败，请确认本地服务正在运行。");
      }
    },
    [replaceState]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(PROFILE_KEY);
    loadedRef.current = false;
    setProfileName(null);
    setStatus("idle");
    setMessage("已退出当前课堂档案。");
  }, []);

  useEffect(() => {
    if (!isHydrated || !profileName || !loadedRef.current) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setStatus("saving");
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/classroom-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: profileName, state })
        });
        setStatus("saved");
        setMessage(`${profileName} 的课堂档案已保存到本地文件夹。`);
      } catch (error) {
        console.warn("Failed to save classroom profile", error);
        setStatus("error");
        setMessage("本地课堂档案保存失败。");
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [isHydrated, profileName, state]);

  const uploadImage = useCallback(
    async ({ kind, ownerId, file }: UploadOptions) => {
      if (!profileName) {
        throw new Error("请先输入学员姓名，接入课堂档案。");
      }

      const formData = new FormData();
      formData.set("name", profileName);
      formData.set("kind", kind);
      formData.set("ownerId", ownerId);
      formData.set("file", file);

      const response = await fetch("/api/classroom-profile/upload", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as { ok?: boolean; asset?: ClassroomImageAsset; error?: string };

      if (!response.ok || !data.asset) {
        throw new Error(data.error ?? "图片导入失败");
      }

      setMessage("图像已导入本地课堂档案。");
      return data.asset;
    },
    [profileName]
  );

  return {
    profileName,
    status,
    message,
    isReady: Boolean(profileName),
    login,
    logout,
    uploadImage
  };
}
