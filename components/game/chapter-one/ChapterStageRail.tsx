"use client";

interface ChapterStageRailProps {
  currentIndex: number;
}

const stages = [
  "苏醒",
  "船员招募",
  "主舱恢复",
  "信号任务",
  "世界变化",
  "第一章结算"
];

export function ChapterStageRail({ currentIndex }: ChapterStageRailProps) {
  return (
    <div className="panel-surface panel-grid rounded-[28px] p-4">
      <div className="grid gap-3 md:grid-cols-6">
        {stages.map((stage, index) => {
          const completed = index < currentIndex;
          const active = index === currentIndex;

          return (
            <div
              key={stage}
              className={`rounded-[22px] border px-4 py-4 transition ${
                completed
                  ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-50"
                  : active
                    ? "border-amber-200/35 bg-amber-200/10 text-white"
                    : "border-white/8 bg-white/[0.03] text-white/45"
              }`}
            >
              <div className="text-[10px] tracking-[0.24em] text-white/40">CHAPTER 01</div>
              <div className="mt-1 text-sm font-semibold">{stage}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
