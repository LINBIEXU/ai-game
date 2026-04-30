"use client";

import type { CrewMember, PlanetModel } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface TrialBridgePanelProps {
  crew: CrewMember;
  planet: PlanetModel;
  onEnterFaultRun: () => void;
  onBackToFirstResult: () => void;
}

export function TrialBridgePanel({ crew, planet, onEnterFaultRun, onBackToFirstResult }: TrialBridgePanelProps) {
  return (
    <section className="trial-bridge-panel scene-reveal grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="panel-surface hologram-sweep rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-amber-100/55">试听流程 / 过场衔接</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">星图亮了，文明复兴要从母星出发。</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
          {planet.name} 已经写入主舰，不再只是第一章成果，而是文明复兴的基础母星。下一步要从这里出发，前往第一颗外部工具文明星。
        </p>

        <div className="trial-bridge-timeline mt-7 grid gap-3">
          <div>
            <span>01</span>
            <strong>{planet.name} 已写入星图</strong>
            <p>智脑恢复基础世界模型，可以调用第一处坐标。</p>
          </div>
          <div>
            <span>02</span>
            <strong>远航门锁定言衡星</strong>
            <p>那里曾是前文明的信息处理中心，保存着语言模型科技黑匣。</p>
          </div>
          <div>
            <span>03</span>
            <strong>开启第一枚科技黑匣</strong>
            <p>你和 {crew.name} 要通过转述、应用和挑战，把 AI 能力带回主舰。</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onEnterFaultRun}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
          >
            进入第二章：文明远征
          </button>
          <button
            type="button"
            onClick={onBackToFirstResult}
            className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/24 hover:bg-white/[0.08]"
          >
            回看第一关成果
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/45">同行船员</div>
          <div className="mt-4 grid grid-cols-[76px_1fr] items-center gap-4">
            <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" />
            <div>
              <div className="text-lg font-semibold text-white">{crew.name}</div>
              <div className="mt-1 text-sm text-cyan-100/70">{crew.title}</div>
              <div className="mt-2 text-xs leading-5 text-white/50">{crew.bondStatus}</div>
            </div>
          </div>
        </div>

        <SystemFeedback
          eyebrow="第二关要练到什么"
          title="不是看知识页，而是用输出开启黑匣"
          body="孩子会用自己的话解释语言模型，再用清楚提示修复档案，体验 AI 为什么需要目标、语境和边界。"
          tone="warm"
        />
      </div>
    </section>
  );
}
