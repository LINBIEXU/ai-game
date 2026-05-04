"use client";

import { shipSecondarySceneAssets } from "@/lib/ship-secondary-scenes";
import type { ShipLogEntry } from "@/types/game";

interface LogbookPanelProps {
  shipLogs: ShipLogEntry[];
}

export function LogbookPanel({ shipLogs }: LogbookPanelProps) {
  const latest = shipLogs[0] ?? null;

  return (
    <section className="scene-reveal ship-secondary-stage">
      <div className="ship-secondary-stage__bg" style={{ backgroundImage: `url(${shipSecondarySceneAssets.archiveHall})` }} />
      <div className="ship-secondary-stage__overlay" />
      <div className="ship-secondary-stage__content space-y-5">
      <div className="fleet-broadcast panel-surface rounded-full px-4 py-2">
        <div className="fleet-broadcast-track">
          {[`航海记录 ${shipLogs.length}`, "主舰会记住谁去了哪里", "世界变化会沉到日志里", `航海记录 ${shipLogs.length}`, "主舰会记住谁去了哪里"].map((item, index) => (
            <span key={`${item}-${index}`} className="fleet-broadcast-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="panel-surface ship-secondary-panel rounded-[32px] p-6 md:p-8">
      <div className="soft-label text-[11px] text-white/42">航海日志舱</div>
      <h2 className="mt-3 text-3xl font-semibold text-white">主舰正在记住每一次出动。</h2>

      <div className="mt-6 rounded-[24px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
        <div className="text-sm font-semibold text-white">这次航行留下了什么</div>
        <div className="mt-2 text-sm leading-6 text-white/64">
          {latest ? `${latest.title} · ${latest.body}` : "先完成一次招募或任务，这里就会留下你这次表达和判断带来的结果。"}
        </div>
        {latest?.rewardSummary ? (
          <div className="mt-3 rounded-[18px] border border-cyan-100/14 bg-cyan-100/[0.06] px-4 py-3 text-xs leading-6 text-cyan-50/72">
            带回清单：{latest.rewardSummary}
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-4">
        {shipLogs.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-white/14 bg-white/[0.03] p-6 text-sm leading-6 text-white/56">
            日志舱还没有写入新的航海记录。先去完成一次任务，主舰才会开始留下痕迹。
          </div>
        )}
        {shipLogs.map((entry) => (
          <article key={entry.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-base font-semibold text-white">{entry.title}</div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.18em] text-white/46">
                {entry.tag}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/62">{entry.body}</p>
            {entry.rewards && entry.rewards.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.rewards.map((reward) => (
                  <span key={reward} className="rounded-full border border-cyan-100/12 bg-cyan-100/[0.06] px-3 py-1 text-[11px] text-cyan-50/70">
                    {reward}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      </div>
      </div>
    </section>
  );
}
