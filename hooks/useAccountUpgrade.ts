"use client";

import { useState } from "react";

import { getCloudBaseAuth } from "@/lib/cloudbase/client";
import type { CloudAccountUpgradeResponse, CloudSession } from "@/types/cloud-save";

type UpgradeStage = "idle" | "sending" | "code-sent" | "verifying" | "success" | "error";

interface UseAccountUpgradeOptions {
  session: CloudSession | null;
  onUpgraded: () => Promise<void>;
}

function buildRequestHeaders(accessToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function useAccountUpgrade({ session, onUpgraded }: UseAccountUpgradeOptions) {
  const [stage, setStage] = useState<UpgradeStage>("idle");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verifyOtp, setVerifyOtp] = useState<((payload: { token: string; messageId?: string }) => Promise<any>) | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requestCode = async (rawEmail: string) => {
    const email = normalizeEmail(rawEmail);
    const auth = getCloudBaseAuth();

    if (!session?.accessToken || !auth) {
      throw new Error("当前身份还没有接入完成。");
    }

    setStage("sending");
    setError(null);
    setMessage("正在把验证码送往家长邮箱。");

    try {
      const result = await (auth as any).signUp({
        email,
        anonymous_token: session.accessToken
      });
      const resultError = result?.error;
      const nextVerifyOtp = result?.data?.verifyOtp ?? result?.verifyOtp ?? null;

      if (resultError) {
        throw new Error(resultError.message ?? "验证码发送失败。");
      }

      if (typeof nextVerifyOtp !== "function") {
        throw new Error("CloudBase 未返回邮箱验证码确认入口。");
      }

      setVerifyOtp(() => nextVerifyOtp);
      setPendingEmail(email);
      setStage("code-sent");
      setMessage("验证码已送出。请让家长打开邮箱，把 6 位验证码带回来。");
    } catch (requestError) {
      const nextError = requestError instanceof Error ? requestError.message : "验证码发送失败。";
      setStage("error");
      setError(nextError);
      setMessage("邮箱绑定暂时没有接通。");
      throw new Error(nextError);
    }
  };

  const confirmUpgrade = async ({ rawEmail, code }: { rawEmail: string; code: string }) => {
    const email = normalizeEmail(rawEmail);
    const verificationCode = code.trim();
    const auth = getCloudBaseAuth();

    if (!session?.accessToken || !auth) {
      throw new Error("当前身份还没有接入完成。");
    }

    setStage("verifying");
    setError(null);
    setMessage("正在把当前主舰存档升级为正式账号。");

    try {
      if (!verifyOtp) {
        throw new Error("请先获取邮箱验证码。");
      }

      const signInResult = await verifyOtp({ token: verificationCode });
      const signInError = signInResult?.error;
      if (signInError) {
        throw new Error(signInError.message ?? "验证码确认失败。");
      }
      const signedUser = signInResult?.data?.user ?? signInResult?.user ?? null;

      const loginState = await auth.getLoginState();
      const user = loginState?.user ?? (await auth.getCurrentUser());
      const nextAuthUid = signedUser?.uid ?? user?.uid ?? session.authUid;

      const response = await fetch("/api/account-upgrade", {
        method: "POST",
        headers: buildRequestHeaders(session.accessToken),
        cache: "no-store",
        body: JSON.stringify({
          previousAuthUid: session.authUid,
          nextAuthUid,
          loginType: "EMAIL",
          email
        })
      });
      const data = (await response.json().catch(() => null)) as CloudAccountUpgradeResponse | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error ?? "正式账号升级失败。");
      }

      await onUpgraded();
      setPendingEmail(email);
      setVerifyOtp(null);
      setStage("success");
      setMessage("主舰存档已升级为正式账号，作品与船员档案都已绑定。");
      return true;
    } catch (upgradeError) {
      const nextError = upgradeError instanceof Error ? upgradeError.message : "正式账号升级失败。";
      setStage("error");
      setError(nextError);
      setMessage("升级链路短暂失焦，当前本地与匿名存档仍会保留。");
      throw new Error(nextError);
    }
  };

  return {
    stage,
    pendingEmail,
    message,
    error,
    isBusy: stage === "sending" || stage === "verifying",
    requestCode,
    confirmUpgrade
  };
}
