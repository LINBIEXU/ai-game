"use client";

import type { AIOperationState } from "@/types/ai";
import type { CrewMember, SignalMissionState } from "@/types/game";

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

  return (
    <section className="scene-reveal space-y-5">
      <div className="fleet-broadcast panel-surface rounded-full px-4 py-2">
        <div className="fleet-broadcast-track">
          {[
            "第二页：故障回溯演算",
            "这里不是答题，是一轮短回溯",
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
          eyebrow="第二关目标"
          title="回到过去的信息世界，修复故障案例库"
          body="每次进入会围绕一个故障种子生成一条短回溯链。你要靠选择推进，不同状态会把结果推向完整成功、部分恢复或失败回环。"
          tone="warm"
        />
        <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-sm font-semibold text-white">当前基础条件</div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-white/66">
            <div>第一颗星球已写入：{mission.planet.confirmedModel?.name ?? "未命名"}</div>
            <div>已保存的故障片段：{faultRun.partialFragments.length}</div>
            <div>已进行回溯轮数：{faultRun.attemptCount}</div>
          </div>
        </div>
      </div>

      {faultRun.status !== "running" && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">回溯入口</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">开局会随机抽到一种故障种子，然后沿着 5 个节点向前跑。</h2>
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
            <div className="mt-6 grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
              <SystemFeedback
                eyebrow="上一轮结果"
                title={faultRun.result.title}
                body={`${faultRun.result.summary} ${faultRun.result.systemNote}`}
                tone={faultRun.result.grade === "success" ? "success" : "warm"}
              />
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <div className="text-sm font-semibold text-white">这一轮学到的规律</div>
                <div className="mt-3 text-sm leading-6 text-white/66">{faultRun.result.learnedRule}</div>
                <div className="mt-4 text-xs leading-6 text-white/46">{faultRun.result.recommendedNextStep}</div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={faultRun.status === "resolved" ? onRetryFaultRun : onStartFaultRun}
              disabled={!canStartFaultRun}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
            >
              {faultRun.status === "resolved" ? "开启下一轮回溯" : "开始这一轮回溯"}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/76 transition hover:border-white/24 hover:bg-white/[0.08]"
            >
              返回第一页
            </button>
            {mission.repairedSignal && (
              <button
                type="button"
                onClick={onFinalize}
                disabled={!canFinalize}
                className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/36 hover:bg-emerald-300/16 disabled:cursor-not-allowed disabled:opacity-50"
              >
                查看恢复总结
              </button>
            )}
          </div>
        </div>
      )}

      {faultRun.status === "running" && activeNode && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-white/42">系统稳定度</div>
              <div className="mt-2 text-2xl font-semibold text-white">{faultRun.stability}</div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-white/42">证据清晰度</div>
              <div className="mt-2 text-2xl font-semibold text-white">{faultRun.evidence}</div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-white/42">时间窗口</div>
              <div className="mt-2 text-2xl font-semibold text-white">{faultRun.timeWindow}</div>
            </div>
          </div>

          <div className="mt-6 rounded-[26px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
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
                  <div className="text-[11px] text-white/40">{choice.recommendedRoles.join(" / ")}</div>
                </div>
                <div className="mt-2 text-sm leading-6 text-white/64">{choice.summary}</div>
                <div className="mt-3 text-xs leading-6 text-white/46">
                  {choice.principle}
                  {typeof choice.requiresEvidence === "number" ? ` 当前更适合在证据清晰度达到 ${choice.requiresEvidence} 后使用。` : ""}
                </div>
              </button>
            ))}
          </div>

          {faultRun.history.length > 0 && (
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">本轮已留下的回溯记录</div>
              <div className="mt-4 space-y-3">
                {faultRun.history.slice(-3).map((entry) => (
                  <div key={`${entry.nodeId}-${entry.choiceId}`} className="rounded-[18px] border border-white/8 bg-slate-950/55 px-4 py-3">
                    <div className="text-xs text-white/40">{entry.nodeTitle}</div>
                    <div className="mt-1 text-sm text-white/76">{entry.choiceLabel}</div>
                    <div className="mt-2 text-xs leading-6 text-white/48">{entry.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <GenerationStatus title="故障回溯演算" operation={operation} />
          </div>
        </div>
      )}
    </section>
  );
}
