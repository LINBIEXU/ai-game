"use client";

import { useState } from "react";

import { SystemFeedback } from "@/components/game/SystemFeedback";

interface ShipSignalBriefingProps {
  onComplete: () => void;
}

const transmissions = [
  {
    eyebrow: "本舰来信",
    title: "你现在站在一艘还没完全醒来的船上。",
    body: "大部分旧记录已经失焦。还能确定的只有一件事：外面的航星曾经一颗颗暗下去，而这艘船还没放弃找回它们。"
  },
  {
    eyebrow: "同步说明",
    title: "这里不会替你做决定，但会记住你做过的判断。",
    body: "船员、信号、日志和远处的新区域，都会因为你的选择留下不同的回声。你不是在看故事，是在把它往前推。"
  },
  {
    eyebrow: "首要任务",
    title: "先把第一位船员带上船。",
    body: "主舰现在还缺一个真正能和你并肩工作的伙伴。先去招募台，把空着的协作位点亮，后面的门才会慢慢打开。"
  }
];

export function ShipSignalBriefing({ onComplete }: ShipSignalBriefingProps) {
  const [index, setIndex] = useState(0);
  const current = transmissions[index];
  const isLast = index === transmissions.length - 1;
  const progressLabel = `${index + 1} / ${transmissions.length}`;

  return (
    <section className="scene-reveal relative overflow-hidden rounded-[38px] border border-cyan-200/10 bg-slate-950/70 px-6 py-7 md:px-10 md:py-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,226,255,0.08),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(255,255,255,0.06),transparent_18%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />

      <div className="relative mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="fleet-broadcast panel-surface min-w-0 rounded-full px-4 py-2">
            <div className="fleet-broadcast-track">
              {["本舰同步频道已建立", "首要任务：招募第一位船员", "本舰同步频道已建立"].map((item, itemIndex) => (
                <span key={`${item}-${itemIndex}`} className="fleet-broadcast-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] tracking-[0.18em] text-white/46">
            CHANNEL {progressLabel}
          </div>
        </div>

        <div className="max-w-3xl">
          <SystemFeedback eyebrow={current.eyebrow} title={current.title} body={current.body} tone="warm" />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
            {!isLast ? (
              <button
                type="button"
                onClick={() => setIndex((currentIndex) => Math.min(transmissions.length - 1, currentIndex + 1))}
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
              >
                继续接收
              </button>
            ) : (
              <button
                type="button"
                onClick={onComplete}
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
              >
                进入控制台，前往招募台
              </button>
            )}

            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/52">
              {isLast ? "来信接收完成" : "本舰仍在发送下一段同步内容"}
            </div>
        </div>
      </div>
    </section>
  );
}
