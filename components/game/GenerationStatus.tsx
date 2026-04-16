"use client";

import type { AIOperationState } from "@/types/ai";

interface GenerationStatusProps {
  title: string;
  operation: AIOperationState;
  onRetry?: () => void;
}

export function GenerationStatus({ title, operation, onRetry }: GenerationStatusProps) {
  if (operation.status === "idle") {
    return null;
  }

  const isLoading = operation.status === "loading";
  const isError = operation.status === "error";
  const isFallback = operation.usedFallback;
  const isEcho = title.includes("回响") || title.includes("形象");

  return (
    <div
      className={`rounded-[20px] border px-4 py-3 text-sm ${
        isError
          ? "border-amber-200/24 bg-amber-200/10 text-amber-50"
          : isLoading
            ? "border-cyan-300/18 bg-cyan-300/10 text-cyan-50"
            : "border-white/8 bg-white/[0.03] text-white/72"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold">{title}</div>
        {isLoading && <span className="text-[11px] tracking-[0.18em] text-cyan-100/75">RUNNING</span>}
        {!isLoading && isFallback && <span className="text-[11px] tracking-[0.18em] text-amber-100/80">LOCAL LOOP</span>}
      </div>
      <div className="mt-2 leading-6">
        {isLoading && (isEcho ? "系统正在接收这位伙伴的平行宇宙外形回响。" : "系统正在整理这段输入。")}
        {operation.status === "success" &&
          isFallback &&
          (operation.error ?? (isEcho ? "外部回响暂时变弱，主舰已切回本地外形回路。" : "外部频道这次没有稳定接通，当前回复来自主舰本地回路。"))}
        {isError && (operation.error ?? (isEcho ? "这条宇宙回响暂时没有稳定落下。" : "系统短暂失去回应。"))}
      </div>
      {operation.canRetry && onRetry && !isLoading && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78 transition hover:border-white/22 hover:bg-white/[0.08]"
        >
          {isEcho ? "重新接收回响" : "重试这一步"}
        </button>
      )}
    </div>
  );
}
