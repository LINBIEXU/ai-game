"use client";

import type { CrewMember, RepairedSignal } from "@/types/game";

import { SystemFeedback } from "@/components/game/SystemFeedback";

interface ChapterTwoPortalSceneProps {
  activeCrew: CrewMember | null;
  repairedSignal: RepairedSignal | null;
  completed: boolean;
  routeLocked: boolean;
  onBegin: () => void;
  onReturn: () => void;
}

const regionName = "雾带深井";

export function ChapterTwoPortalScene({
  activeCrew,
  repairedSignal,
  completed,
  routeLocked,
  onBegin,
  onReturn
}: ChapterTwoPortalSceneProps) {
  const coordinate = repairedSignal?.coordinateLabel ?? "深空坐标已锁定";
  const hook = activeCrew
    ? `主舰在更远的雾带里收到了主动回应，而且那段回应像是认得 ${activeCrew.name} 留下的频谱习惯。`
    : "主舰在更远的雾带里收到了主动回应，那段回应不像单纯的噪音，更像有人在等你靠近。";

  return (
    <section className="scene-reveal relative overflow-hidden rounded-[36px] border border-cyan-200/12 bg-[radial-gradient(circle_at_top,#1f3d59_0%,#07101c_45%,#02050b_100%)] p-6 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(125,211,252,0.18),transparent_25%),radial-gradient(circle_at_20%_80%,rgba(251,191,36,0.1),transparent_20%)]" />
      <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="soft-label text-[11px] text-cyan-100/60">第二章入口 · 新区域前厅</div>
          <h2 className="mt-4 text-4xl font-semibold text-white">{regionName}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/74">
            第一章修复的失落信号没有停在主舰附近。它把星图继续拉向更远处，在雾带深井边缘点亮了一道新的入口。
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SystemFeedback eyebrow="区域背景" title={coordinate} body="这不是第一章的回声延长线，而是一片真正独立的深空区域。进入后，你会暂时离开熟悉的主舰主控视野。" tone="success" />
            <SystemFeedback eyebrow="核心悬念" title="那段回应像认识你们" body={hook} tone="warm" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SystemFeedback
              eyebrow="推荐分工"
              title="更适合带两类船员"
              body="优先考虑侦察 / 破译型船员，再搭配能修补或想点子的伙伴。第二章会更像一次真正的远征协同。"
            />
            <SystemFeedback
              eyebrow="任务感"
              title="下一段故事更远，也更主动"
              body="这一次不只是你去找线索，而是未知区域已经先把某种回应丢回主舰。"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBegin}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
            >
              {completed ? "再次查看第二章航线" : routeLocked ? "进入沉默坐标" : "开始第二章"}
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

        <div className="rounded-[28px] border border-cyan-200/14 bg-black/25 p-5 backdrop-blur-sm">
          <div className="soft-label text-[11px] text-cyan-100/55">跃迁前厅</div>
          <div className="mt-4 rounded-[24px] border border-cyan-200/12 bg-cyan-200/[0.06] p-5">
            <div className="text-lg font-semibold text-white">深空门已展开</div>
            <p className="mt-3 text-sm leading-7 text-white/64">
              舱外视野已经切到陌生区域。前方不再是主舰外壳和熟悉的航点，而是一口像会回望你的雾色深井。
            </p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/72">新区域名称已写入星图</div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/72">远征入口从主舰远航门展开</div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/72">第二章将从这道新坐标前厅开始</div>
          </div>
        </div>
      </div>
    </section>
  );
}
