"use client";

import { chapterTwoSceneAssets } from "@/lib/chapter-two-exploration";
import type { CrewMember, PlanetModel, RepairedSignal } from "@/types/game";

interface ChapterTwoPortalSceneProps {
  activeCrew: CrewMember | null;
  planet: PlanetModel | null;
  repairedSignal: RepairedSignal | null;
  completed: boolean;
  routeLocked: boolean;
  onBegin: () => void;
  onReturn: () => void;
}

export function ChapterTwoPortalScene({
  activeCrew,
  planet,
  repairedSignal,
  completed,
  routeLocked,
  onBegin,
  onReturn
}: ChapterTwoPortalSceneProps) {
  const motherName = planet?.name ?? "第一母星";
  const coordinate = repairedSignal?.coordinateLabel ?? planet?.coordinateLabel ?? "母星外环坐标";

  return (
    <section className="scene-reveal chapter-two-portal-shell chapter-two-portal-shell--full min-h-screen">
      <div
        className="chapter-two-portal-shell__backdrop"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(4, 8, 14, 0.22), rgba(4, 8, 14, 0.62)), url(${chapterTwoSceneAssets.shipBridge.imageUrl})`
        }}
      />
      <div className="chapter-two-portal-shell__gate" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20 text-center">
        <div className="chapter-two-portal-title">
          <div className="soft-label text-[11px] text-cyan-100/60">{completed ? "第二章归档 / 已完成" : "第二章入口 / 首次外部远征"}</div>
          <h2>{completed ? "语言黑匣记录已归档" : "远航门已经对准新的文明坐标"}</h2>
          <p>
            {completed ? `${motherName} 已带回言衡星记录。现在适合回看黑匣，不再提示新大关卡。` : `${motherName} 已成为远征母星。目标：言衡星。`}
          </p>
          <div className="chapter-two-portal-title__meta">
            <span>{coordinate}</span>
            <span>{activeCrew ? `${activeCrew.name} 同行` : "主舰自动引导"}</span>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={onBegin}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
            >
              {completed ? "回看黑匣记录" : routeLocked ? "继续这次远征" : "从主舰出发"}
            </button>
            <button
              type="button"
              onClick={onReturn}
              className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/78 transition hover:border-white/24 hover:bg-white/[0.08]"
            >
              返回主舰
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
