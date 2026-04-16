"use client";

import { getCrewDirectiveSummary } from "@/lib/mock-generators";
import type { CrewMember, RepairedSignal } from "@/types/game";

import { StarMapPanel } from "@/components/game/StarMapPanel";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface ChapterCompletePanelProps {
  crew: CrewMember;
  repairedSignal: RepairedSignal;
  onReturnToBridge: () => void;
}

export function ChapterCompletePanel({ crew, repairedSignal, onReturnToBridge }: ChapterCompletePanelProps) {
  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="panel-surface hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-cyan-200/60">第一章结算</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">记忆库抢救</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
          这一章里，你完成了苏醒、招募第一位伙伴、修复主舱核心，并把智脑最重要的三类基础记忆接了回来。现在这艘船终于能重新根据过去记录做出推测。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SystemFeedback
            eyebrow="本章完成"
            title="你做成了什么"
            body={`招募了 ${crew.name}，修好了航行记忆、故障记忆和船员记忆，并让 ${repairedSignal.coordinateLabel} 重新出现在导航盘上。`}
            tone="success"
          />
          <SystemFeedback
            eyebrow="AI 协作感"
            title="它可以推测，但不能凭空知道"
            body={repairedSignal.aiLine}
          />
        </div>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">新船员档案</div>
          <div className="mt-2 text-sm text-cyan-100/75">{crew.name} · {crew.title}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {getCrewDirectiveSummary(crew).map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/72">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">下一步已解锁</div>
          <p className="mt-3 text-sm leading-6 text-white/64">
            {repairedSignal.nextLead} 远航门已经记住这条线索。第二章会从主舰重新获得的推测能力继续向外展开。
          </p>
        </div>

        <button
          type="button"
          onClick={onReturnToBridge}
          className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          返回主舱，准备下一章
        </button>
      </div>

      <div className="space-y-6">
        <StarMapPanel firstStarLit coordinateLabel={repairedSignal.coordinateLabel} />
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/45">章节奖励</div>
          <div className="mt-3 space-y-3">
            <div className="rounded-[20px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-white">导航盘恢复</div>
            <div className="rounded-[20px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-white">故障分析台上线</div>
            <div className="rounded-[20px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-white">船员档案完整写入</div>
            <div className="rounded-[20px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-white">远航门出现下一章闪烁</div>
          </div>
        </div>
      </div>
    </section>
  );
}
