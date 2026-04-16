"use client";

import type { AIOperationState } from "@/types/ai";
import type { CrewMember, RepairedSignal } from "@/types/game";

import { GenerationStatus } from "@/components/game/GenerationStatus";
import { StarMapPanel } from "@/components/game/StarMapPanel";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface SignalAftermathPanelProps {
  crew: CrewMember;
  repairedSignal: RepairedSignal;
  completionOperation: AIOperationState;
  onContinue: () => void;
  onRetryContinue?: () => void;
}

export function SignalAftermathPanel({ crew, repairedSignal, completionOperation, onContinue, onRetryContinue }: SignalAftermathPanelProps) {
  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <div className="panel-surface hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-cyan-200/60">信息库恢复</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">智脑重新找回了推测航路的能力。</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
          你们不是只修好了一块零件，而是把主舰最基础的三类记忆接了回来。现在它终于能重新翻找旧记录，给出最接近的航路推测。
        </p>

        <div className="mt-8 grid gap-3">
          {repairedSignal.restoredFeatures.map((item) => (
            <div key={item} className="rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-4 text-sm font-medium text-white">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SystemFeedback
            eyebrow="导航变化"
            title={repairedSignal.coordinateLabel}
            body={`${repairedSignal.summary} 新的可追踪区域：${repairedSignal.unlockedSector}。`}
            tone="success"
          />
          <SystemFeedback
            eyebrow="智脑回应"
            title="主舰重新开口"
            body={repairedSignal.aiLine}
          />
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          查看第一章结算
        </button>
        <div className="mt-5">
          <GenerationStatus title="第一章归档" operation={completionOperation} onRetry={onRetryContinue} />
        </div>
      </div>

      <div className="space-y-6">
        <StarMapPanel firstStarLit coordinateLabel={repairedSignal.coordinateLabel} />
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/45">新坐标</div>
          <div className="mt-3 text-lg font-semibold text-white">{crew.name} 的档案与导航盘同时更新</div>
          <p className="mt-3 text-sm leading-6 text-white/64">{repairedSignal.nextLead}</p>
        </div>
      </div>
    </section>
  );
}
