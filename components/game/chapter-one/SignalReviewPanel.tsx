"use client";

import type { AIOperationState } from "@/types/ai";
import type { CrewMember, CrewRole, FaultChoiceEffect, FaultOutcomeGrade, SignalMissionState } from "@/types/game";

import { GenerationStatus } from "@/components/game/GenerationStatus";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface SignalReviewPanelProps {
  crew: CrewMember;
  mission: SignalMissionState;
  canStartFaultRun: boolean;
  canContinueFaultRun: boolean;
  canFinalize: boolean;
  operation: AIOperationState;
  onBack: () => void;
  onStartFaultRun: () => void;
  onChooseFaultOption: (choiceId: string) => void;
  onRetryFaultRun: () => void;
  onFinalize: () => void;
}

const roleLabels: Record<CrewRole, string> = {
  scout: "侦察",
  repair: "修补",
  record: "记录",
  pilot: "领航"
};

const gradeLabels: Record<FaultOutcomeGrade, string> = {
  success: "完整成功",
  partial: "部分恢复",
  fail: "回溯崩塌"
};

function effectLabel(effect: FaultChoiceEffect) {
  const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

  return `稳定 ${signed(effect.stability)} / 证据 ${signed(effect.evidence)} / 时间 ${signed(effect.time)}`;
}

function statusTone(value: number, type: "stability" | "evidence" | "time") {
  if (type === "time") {
    if (value <= 4) return "text-red-100";
    if (value <= 10) return "text-amber-100";
    return "text-cyan-100";
  }

  if (value < 28) return "text-red-100";
  if (value < 48) return "text-amber-100";
  return "text-cyan-100";
}

function meterWidth(value: number, max = 100) {
  return `${Math.max(4, Math.min(100, (value / max) * 100))}%`;
}

export function SignalReviewPanel({
  crew,
  mission,
  canStartFaultRun,
  canContinueFaultRun,
  canFinalize,
  operation,
  onBack,
  onStartFaultRun,
  onChooseFaultOption,
  onRetryFaultRun,
  onFinalize
}: SignalReviewPanelProps) {
  const faultRun = mission.faultRun;
  const activeNode = faultRun.nodes[faultRun.currentNodeIndex] ?? null;
  const latestHistory = faultRun.history[faultRun.history.length - 1] ?? null;
  const resolvedTone = faultRun.result?.grade === "success" ? "success" : faultRun.result?.grade === "fail" ? "danger" : "partial";

  return (
    <section className={`scene-reveal fault-memory-stage fault-memory-stage--${faultRun.status} fault-memory-stage--${resolvedTone} space-y-5`}>
      <div className="fleet-broadcast panel-surface rounded-full px-4 py-2">
        <div className="fleet-broadcast-track">
          {[
            "可选旧档案挑战",
            "这里是早期主舰资料的短回路校准，不是第二章主线",
            `${crew.name} 的能力会直接影响节点收益`,
            "稳定度、证据清晰度、时间窗口会一起推动局势"
          ].map((item, index) => (
            <span key={`${item}-${index}`} className="fleet-broadcast-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.96fr_1.04fr]">
        <SystemFeedback
          eyebrow="可选旧档案挑战"
          title="补一段主舰早期事故资料"
          body="这一段是旧资料补档，用来练证据选择和风险判断；它不是第二章主线。第二章主线会从母星出发，进入语言与信息文明星寻找科技黑匣。"
          tone="warm"
        />
        <div className="fault-memory-panel rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">当前基础条件</div>
            {faultRun.activeSeed && (
              <span className="rounded-full border border-amber-200/18 bg-amber-200/[0.06] px-3 py-1 text-xs text-amber-100/70">
                本轮种子：{faultRun.activeSeed.type}
              </span>
            )}
          </div>
          <div className="fault-chain-visual mt-4" aria-hidden="true">
            <span className="fault-chain-node" />
            <span className="fault-chain-node" />
            <span className="fault-chain-node" />
            <span className="fault-chain-node" />
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-white/66">
            <div>第一颗星球已写入：{mission.planet.confirmedModel?.name ?? "未命名"}</div>
            <div>已保存的旧资料片段：{faultRun.partialFragments.length}</div>
            <div>已进行校准轮数：{faultRun.attemptCount}</div>
          </div>
        </div>
      </div>

      {faultRun.status !== "running" && (
        <div className="fault-memory-panel panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">可选旧档案入口</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {faultRun.status === "resolved" ? "这一轮回溯已经结算，可以归档或快速重试。" : "开局会随机抽到一种故障种子，然后沿着 5 个节点向前跑。"}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-white/42">系统稳定度</div>
              <div className="mt-2 text-sm leading-6 text-white/66">太低会让回溯提前崩塌。</div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-white/42">证据清晰度</div>
              <div className="mt-2 text-sm leading-6 text-white/66">很多关键选择都要求你先把证据堆起来。</div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-white/42">时间窗口</div>
              <div className="mt-2 text-sm leading-6 text-white/66">时间耗尽不会黑屏，只会迫使你带着碎片撤退。</div>
            </div>
          </div>

          {faultRun.status === "resolved" && faultRun.result ? (
            <div className="fault-result-card mt-6 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[26px] border border-cyan-200/14 bg-cyan-200/[0.055] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="soft-label text-[10px] text-cyan-100/55">本轮结算</div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/66">
                    {gradeLabels[faultRun.result.grade]}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-white">{faultRun.result.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/66">{faultRun.result.summary}</p>
                <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-white/52">
                    <span>旧资料恢复程度</span>
                    <span>{faultRun.result.recoveryPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="fault-recovery-bar h-full rounded-full bg-cyan-300" style={{ width: `${faultRun.result.recoveryPercent}%` }} />
                  </div>
                </div>
                <div className="mt-4 text-sm leading-6 text-cyan-100/72">事故主因：{faultRun.result.truthFragment}</div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-white">带回主舰的信息</div>
                    <div className="mt-3 space-y-2">
                      {faultRun.result.broughtBack.map((item) => (
                        <div key={item} className="rounded-[16px] border border-white/8 bg-slate-950/45 px-3 py-2 text-xs leading-5 text-white/58">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">船员贡献</div>
                    <p className="mt-3 text-sm leading-6 text-white/62">{faultRun.result.crewContribution}</p>
                    <div className="mt-4 rounded-[16px] border border-amber-200/12 bg-amber-200/[0.045] px-3 py-2 text-xs leading-5 text-amber-50/62">
                      {faultRun.result.hallucinationNote}
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-white">这一轮学到的 AI 规律</div>
                  <div className="mt-2 text-sm leading-6 text-white/66">{faultRun.result.learnedRule}</div>
                  <div className="mt-3 text-xs leading-5 text-white/46">{faultRun.result.recommendedNextStep}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {faultRun.result && (
              <button
                type="button"
                onClick={onFinalize}
                disabled={!canFinalize}
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
              >
                {mission.repairedSignal ? "写入恢复总结" : "带着片段进入成果页"}
              </button>
            )}
            {faultRun.status !== "resolved" && (
              <button
                type="button"
                onClick={onStartFaultRun}
                disabled={!canStartFaultRun}
                className={`rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40 ${
                  mission.repairedSignal
                    ? "border border-white/12 bg-white/[0.04] text-white/76 hover:border-white/24 hover:bg-white/[0.08]"
                    : "bg-cyan-300 text-slate-950 hover:scale-[1.02] hover:bg-cyan-200"
                }`}
              >
                开始可选旧档案挑战
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/76 transition hover:border-white/24 hover:bg-white/[0.08]"
            >
              返回第一页
            </button>
          </div>
        </div>
      )}

      {faultRun.status === "running" && activeNode && (
        <div className="fault-memory-panel panel-surface rounded-[32px] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="soft-label text-[10px] text-amber-100/45">进入可选旧档案校准层</div>
              <h2 className="mt-2 text-3xl font-semibold text-white">{faultRun.activeSeed?.title ?? "旧资料演算链"}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">{faultRun.activeSeed?.summary}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/58">
              节点 {faultRun.currentNodeIndex + 1} / {faultRun.nodes.length}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="fault-state-card rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-white/42">
                <span>系统稳定度</span>
                {latestHistory && <span>{latestHistory.delta.stability > 0 ? "+" : ""}{latestHistory.delta.stability}</span>}
              </div>
              <div className={`mt-2 text-2xl font-semibold ${statusTone(faultRun.stability, "stability")}`}>{faultRun.stability}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: meterWidth(faultRun.stability) }} />
              </div>
            </div>
            <div className="fault-state-card rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-white/42">
                <span>证据清晰度</span>
                {latestHistory && <span>{latestHistory.delta.evidence > 0 ? "+" : ""}{latestHistory.delta.evidence}</span>}
              </div>
              <div className={`mt-2 text-2xl font-semibold ${statusTone(faultRun.evidence, "evidence")}`}>{faultRun.evidence}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-emerald-300" style={{ width: meterWidth(faultRun.evidence) }} />
              </div>
            </div>
            <div className="fault-state-card rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-white/42">
                <span>时间窗口</span>
                {latestHistory && <span>{latestHistory.delta.time > 0 ? "+" : ""}{latestHistory.delta.time}</span>}
              </div>
              <div className={`mt-2 text-2xl font-semibold ${statusTone(faultRun.timeWindow, "time")}`}>{faultRun.timeWindow}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-amber-300" style={{ width: meterWidth(faultRun.timeWindow, 30) }} />
              </div>
            </div>
          </div>

          <div className="fault-node-card mt-6 rounded-[26px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
            <div className="soft-label text-[10px] text-cyan-100/54">{activeNode.stage}</div>
            <div className="mt-2 text-xl font-semibold text-white">{activeNode.title}</div>
            <div className="mt-3 text-sm leading-7 text-white/68">{activeNode.body}</div>
            <div className="mt-3 text-xs text-cyan-100/72">{activeNode.guidance}</div>
          </div>

          <div className="mt-5 grid gap-4">
            {activeNode.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChooseFaultOption(choice.id)}
                disabled={!canContinueFaultRun}
                className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-left transition hover:border-cyan-300/24 hover:bg-cyan-300/8 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-base font-semibold text-white">{choice.label}</div>
                  <div className="text-[11px] text-white/40">{choice.recommendedRoles.map((role) => roleLabels[role]).join(" / ")}</div>
                </div>
                <div className="mt-2 text-sm leading-6 text-white/64">{choice.summary}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs leading-6 text-white/46">
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{effectLabel(choice.effect)}</span>
                  <span className="rounded-full border border-cyan-200/12 bg-cyan-200/[0.045] px-3 py-1">{choice.principle}</span>
                  {typeof choice.requiresEvidence === "number" ? ` 当前更适合在证据清晰度达到 ${choice.requiresEvidence} 后使用。` : ""}
                </div>
              </button>
            ))}
          </div>

          {faultRun.history.length > 0 && (
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">本轮已留下的校准记录</div>
              <div className="mt-4 space-y-3">
                {faultRun.history.slice(-3).map((entry) => (
                  <div key={`${entry.nodeId}-${entry.choiceId}`} className="rounded-[18px] border border-white/8 bg-slate-950/55 px-4 py-3">
                    <div className="text-xs text-white/40">{entry.nodeTitle}</div>
                    <div className="mt-1 text-sm text-white/76">{entry.choiceLabel}</div>
                    <div className="mt-2 text-xs leading-6 text-white/48">{entry.summary}</div>
                    {entry.crewSupport && <div className="mt-2 text-xs leading-5 text-cyan-100/58">{entry.crewSupport}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <GenerationStatus title="可选旧档案补档演算" operation={operation} />
          </div>
        </div>
      )}
    </section>
  );
}
