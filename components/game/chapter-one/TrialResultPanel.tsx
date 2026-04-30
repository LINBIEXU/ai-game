"use client";

import type { CloudSaveStatus } from "@/types/cloud-save";
import type { ChapterTwoOutcome, CrewMember, FaultRunState, PlanetModel, ShipLogEntry } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";

interface TrialResultPanelProps {
  crew: CrewMember | null;
  planet: PlanetModel | null;
  faultRun: FaultRunState;
  chapterTwoOutcome: ChapterTwoOutcome | null;
  technologyPoints: number;
  aiCapabilityLevel: number;
  aiCapabilityUnlocks: string[];
  shipLogs: ShipLogEntry[];
  saveStatus: CloudSaveStatus;
  lastSavedAt: number | null;
  onReturnToHub: () => void;
  onRestartTrial: () => void;
  onOpenParentSummary: () => void;
}

function formatSaveTime(timestamp: number | null) {
  if (!timestamp) return "等待写入";

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function saveLabel(status: CloudSaveStatus) {
  if (status === "saved") return "成果已保存";
  if (status === "saving") return "主舰正在写入本地档案";
  if (status === "error") return "本地保存异常，课堂记忆仍保留";
  if (status === "disabled") return "本地记忆已保留";
  return "存档准备中";
}

export function TrialResultPanel({
  crew,
  planet,
  chapterTwoOutcome,
  technologyPoints,
  aiCapabilityLevel,
  aiCapabilityUnlocks,
  shipLogs,
  saveStatus,
  lastSavedAt,
  onReturnToHub,
  onRestartTrial,
  onOpenParentSummary
}: TrialResultPanelProps) {
  const latestLogs = shipLogs.slice(0, 4);
  const latestUnlocks = aiCapabilityUnlocks.slice(-3);

  return (
    <section className="trial-result-panel scene-reveal grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="completion-hero panel-surface hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="completion-lighting" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="soft-label text-[11px] text-cyan-200/60">试听课成果总页</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">你完成了第一次主舰修复与文明远征。</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
          这次试听留下了第一位伙伴、第一颗母星和第一枚科技黑匣记录。它们不是临时展示，而是会进入主舰档案，后续可以继续调用。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
            <div className="soft-label text-[10px] text-white/42">第一位船员</div>
            {crew ? (
              <div className="mt-4 grid grid-cols-[70px_1fr] items-center gap-4">
                <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" imageUrl={crew.portraitAsset?.imageUrl ?? null} alt={`${crew.name} 的角色图`} />
                <div>
                  <div className="text-lg font-semibold text-white">{crew.name}</div>
                  <div className="mt-1 text-sm text-cyan-100/70">{crew.title}</div>
                  <div className="mt-2 text-xs leading-5 text-white/52">{crew.bondStatus}</div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-white/52">本轮还没有完成船员招募。</div>
            )}
          </div>

          <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
            <div className="soft-label text-[10px] text-white/42">第一颗星球</div>
            {planet ? (
              <>
                <div className="mt-3 text-xl font-semibold text-white">{planet.name}</div>
                <div className="mt-2 text-sm leading-6 text-white/62">{planet.summary}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {planet.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full border border-cyan-200/12 bg-cyan-200/[0.05] px-3 py-1 text-xs text-cyan-100/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 text-sm text-white/52">本轮还没有完成星球建模。</div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-[26px] border border-cyan-200/14 bg-cyan-200/[0.055] p-5">
          <div className="soft-label text-[10px] text-cyan-100/55">第二章黑匣成果</div>
          {chapterTwoOutcome ? (
            <div className="mt-3 grid gap-4 md:grid-cols-[0.86fr_1.14fr]">
              <div>
                <div className="text-xl font-semibold text-white">{chapterTwoOutcome.blackBoxTitle ?? chapterTwoOutcome.title}</div>
                <div className="mt-2 text-sm leading-6 text-white/62">{chapterTwoOutcome.summary}</div>
                <div className="mt-4 text-sm text-cyan-100/70">
                  科技点 +{chapterTwoOutcome.technologyPointsAwarded ?? 0} · 当前 AI 等级 {aiCapabilityLevel}
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded-[18px] border border-white/8 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-white/62">
                  远征星球：{chapterTwoOutcome.planetName ?? "言衡星 · 语言与信息文明星"}
                </div>
                <div className="rounded-[18px] border border-white/8 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-white/62">
                  文明记录：{chapterTwoOutcome.civilizationRecord ?? chapterTwoOutcome.logSummary}
                </div>
                <div className="rounded-[18px] border border-white/8 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-white/62">
                  AI 升级：{chapterTwoOutcome.aiUpgrade ?? (latestUnlocks.join(" / ") || "语言理解模块已增强")}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-white/56">第二章还没有完成黑匣挑战。老师可以从试听控制直接进入文明远征。</div>
          )}
        </div>

        <div className="mt-5 rounded-[26px] border border-emerald-200/12 bg-emerald-200/[0.045] p-5">
          <div className="soft-label text-[10px] text-emerald-100/55">主舰 AI 成长</div>
          <div className="mt-3 text-sm leading-6 text-white/62">
            当前科技点：{technologyPoints}。已写入能力：
            {latestUnlocks.length > 0 ? latestUnlocks.join(" / ") : "基础理解"}。
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onReturnToHub}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
          >
            回到主舰
          </button>
          <button
            type="button"
            onClick={onRestartTrial}
            className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/24 hover:bg-white/[0.08]"
          >
            从头再跑一次试听
          </button>
          <button
            type="button"
            onClick={onOpenParentSummary}
            className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/24 hover:bg-white/[0.08]"
          >
            查看体验说明
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/45">新增记录 / 保存状态</div>
          <div className="mt-3 rounded-[18px] border border-cyan-200/12 bg-cyan-200/[0.05] px-4 py-3 text-sm text-cyan-100/76">
            {saveLabel(saveStatus)} · 最近保存 {formatSaveTime(lastSavedAt)}
          </div>
          <div className="mt-4 space-y-3">
            {latestLogs.map((log) => (
              <div key={log.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-white">{log.title}</div>
                <div className="mt-2 text-xs leading-5 text-white/54">{log.body}</div>
              </div>
            ))}
            {latestLogs.length === 0 && <div className="text-sm text-white/52">主舰还在等待第一条试听记录。</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
