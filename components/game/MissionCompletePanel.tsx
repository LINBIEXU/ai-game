"use client";

import { StarMapPanel } from "./StarMapPanel";
import { SystemFeedback } from "./SystemFeedback";

interface MissionCompletePanelProps {
  coordinateLabel: string;
  onReturn: () => void;
}

const resultItems = [
  "第一颗航星点亮",
  "船员关系推进：第一次共同行动完成",
  "新坐标已记录",
  "主舱状态已更新"
];

export function MissionCompletePanel({ coordinateLabel, onReturn }: MissionCompletePanelProps) {
  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="panel-surface hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-cyan-200/60">任务完成</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">第一颗航星亮了。</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
          你完成了这艘船的第一次共同行动。主舱已经记住这次配合，也记住了那个新的坐标。
        </p>
        <div className="mt-6">
          <SystemFeedback
            eyebrow="下一步已解锁"
            title="系统帮你点亮了结果，但前进方向是你一步一步选出来的"
            body="先给出清楚信号，再让系统补全，再由你做决定。这就是你们第一次真正的配合。"
            tone="success"
          />
        </div>

        <div className="mt-8 grid gap-3">
          {resultItems.map((item) => (
            <div
              key={item}
              className="rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-4 text-sm font-medium text-white"
            >
              {item}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onReturn}
          className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          返回主舱
        </button>
      </div>

      <StarMapPanel firstStarLit coordinateLabel={coordinateLabel} />
    </section>
  );
}
