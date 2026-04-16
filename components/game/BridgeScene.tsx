"use client";

import { getCrewSummary } from "@/lib/mock-generators";
import type { CrewMember } from "@/types/game";

import { CrewPortrait } from "./CrewPortrait";
import { StarMapPanel } from "./StarMapPanel";
import { SystemFeedback } from "./SystemFeedback";

interface BridgeSceneProps {
  crew: CrewMember | null;
  crewOnboard: boolean;
  firstStarLit: boolean;
  missionComplete: boolean;
  coordinateLabel?: string | null;
  onRecruit: () => void;
  onRepair: () => void;
}

export function BridgeScene({
  crew,
  crewOnboard,
  firstStarLit,
  missionComplete,
  coordinateLabel,
  onRecruit,
  onRepair
}: BridgeSceneProps) {
  const robotHint = !crewOnboard
    ? "引导机器人：主舱还缺第一位船员。先把协作位点亮吧。"
    : missionComplete
      ? "引导机器人：新坐标已写入星图。主舱亮度提升，第一颗航星在线。"
      : "引导机器人：收到一段破碎信号。你和船员现在可以一起修复它。";

  const bridgeStatus = !crewOnboard
    ? "协作位离线"
    : missionComplete
      ? "新坐标已解锁"
      : "信号台待接入";

  return (
    <section className="scene-reveal grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
      <div className={`panel-surface panel-grid rounded-[32px] p-6 md:p-8 ${crewOnboard ? "hologram-sweep" : ""}`}>
        <div className="soft-label text-[11px] text-white/45">飞船主舱</div>
        <h2 className="mt-4 text-3xl font-semibold text-white">主舱已重连，但还不完整。</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
          {!crewOnboard && "一个船员位空着，第一颗航星仍在黑暗里。"}
          {crewOnboard && !missionComplete && "第一位船员已到位，你们刚好能处理那段失落信号。"}
          {missionComplete && "船员在岗，第一颗航星已经亮起，新的待探索坐标正在主舱回响。"}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <SystemFeedback eyebrow="引导机器人" title={bridgeStatus} body={robotHint} tone={crewOnboard ? "success" : "info"} />
          <div className={`rounded-[24px] border px-4 py-4 ${missionComplete ? "border-amber-200/20 bg-amber-200/10" : "border-white/8 bg-slate-950/45"}`}>
            <div className="soft-label text-[10px] text-white/45">主舱变化</div>
            <div className="mt-2 text-sm font-semibold text-white">
              {!crewOnboard && "等待第一位船员接入"}
              {crewOnboard && !missionComplete && "协作模块已点亮"}
              {missionComplete && "第一颗航星上线，新坐标开始回响"}
            </div>
            <div className="mt-2 text-sm leading-6 text-white/62">
              {!crewOnboard && "先招募，再让系统和你一起把第一段回路接通。"}
              {crewOnboard && !missionComplete && "你已经把伙伴带上船，下一步轮到你们一起判断并修复信号。"}
              {missionComplete && "主舱已经记住这次配合，下一步不再是黑暗，而是待探索坐标。"}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {!crewOnboard && (
            <button
              type="button"
              onClick={onRecruit}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
            >
              招募第一位船员
            </button>
          )}

          {crewOnboard && !missionComplete && (
            <button
              type="button"
              onClick={onRepair}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
            >
              一起修复
            </button>
          )}

          {missionComplete && (
            <div className="rounded-full border border-amber-200/25 bg-amber-200/10 px-5 py-3 text-sm font-medium text-amber-100">
              新坐标待探索
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className={`panel-surface rounded-[28px] p-5 ${crewOnboard ? "unlock-burst" : "panel-reveal"}`}>
          <div className="soft-label text-[11px] text-white/45">协作位</div>
          {!crewOnboard || !crew ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-white/14 bg-white/[0.03] p-6 text-white/55">
              <div className="text-lg font-semibold text-white/72">空着的船员位</div>
              <p className="mt-2 text-sm leading-6">这里还没有伙伴。飞船正等待第一位愿意登船的船员。</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 md:grid-cols-[96px_1fr]">
              <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" />
              <div>
                <div className="text-lg font-semibold text-white">{crew.name}</div>
                <div className="mt-1 text-sm text-cyan-100/75">{crew.title}</div>
                <div className="mt-3 text-sm leading-6 text-white/68">{crew.intro}</div>
                <div className="mt-3 inline-flex rounded-full border border-cyan-200/18 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-100">
                  {getCrewSummary(crew)}
                </div>
                <div className="mt-3 text-xs leading-6 text-white/48">你先定义了伙伴的方向，系统才把他具体带到主舱里。</div>
              </div>
            </div>
          )}
        </div>

        <StarMapPanel firstStarLit={firstStarLit} coordinateLabel={coordinateLabel} />
      </div>
    </section>
  );
}
