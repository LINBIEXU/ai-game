"use client";

import type { ChapterTwoOutcome, CrewMember } from "@/types/game";

import { SystemFeedback } from "@/components/game/SystemFeedback";

interface ChapterTwoResultPanelProps {
  outcome: ChapterTwoOutcome;
  leadCrew: CrewMember | null;
  supportCrew: CrewMember | null;
  onReturn: () => void;
}

export function ChapterTwoResultPanel({ outcome, leadCrew, supportCrew, onReturn }: ChapterTwoResultPanelProps) {
  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="panel-surface hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-fuchsia-100/60">第二章完成</div>
        <h2 className="mt-3 text-4xl font-semibold text-white">{outcome.title}</h2>
        <p className="mt-4 text-base leading-7 text-white/68">{outcome.summary}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SystemFeedback eyebrow="区域推进" title={outcome.scannedZone} body={outcome.worldChange} tone="success" />
          <SystemFeedback eyebrow="第三章钩子" title="更深的回应还没结束" body={outcome.chapterThreeHook} tone="warm" />
        </div>

        <div className="mt-6">
          <SystemFeedback eyebrow="主舰归档方式" title="这次不是普通完成记录" body={outcome.logSummary} />
        </div>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">协作结果已写入主舰</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{leadCrew?.name ?? "主分析员"}</div>
              <div className="mt-2 text-xs leading-6 text-white/54">{outcome.leadDossierNote}</div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{supportCrew?.name ?? "支援船员"}</div>
              <div className="mt-2 text-xs leading-6 text-white/54">{outcome.supportDossierNote}</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturn}
          className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          返回主舰
        </button>
      </div>

      <div className="space-y-6">
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/42">第二章留下的痕迹</div>
          <div className="mt-4 space-y-3">
            <div className="rounded-[20px] border border-fuchsia-200/16 bg-fuchsia-200/10 px-4 py-4 text-sm text-white">新区域第一层已被扫描</div>
            <div className="rounded-[20px] border border-fuchsia-200/16 bg-fuchsia-200/10 px-4 py-4 text-sm text-white">两位船员档案同步更新</div>
            <div className="rounded-[20px] border border-fuchsia-200/16 bg-fuchsia-200/10 px-4 py-4 text-sm text-white">主舰日志新增更深远征记录</div>
            <div className="rounded-[20px] border border-fuchsia-200/16 bg-fuchsia-200/10 px-4 py-4 text-sm text-white">第三章线索在远航门边缘闪烁</div>
          </div>
        </div>

        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/42">新的感觉</div>
          <p className="mt-3 text-sm leading-7 text-white/62">
            这一次不是你单独点亮一颗星，而是你带着两位船员一起把未知区域撬开了一层。后面的门显然更大，也更像在等你再次靠近。
          </p>
        </div>
      </div>
    </section>
  );
}
