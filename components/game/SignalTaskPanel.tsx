"use client";

import { brokenSignalLines, missingInfoOptions, signalNatureOptions } from "@/lib/game-constants";
import type { CrewMember, MissingInfo, RepairedSignal, SignalNature, SignalChoices } from "@/types/game";

import { SystemFeedback } from "./SystemFeedback";

interface SignalTaskPanelProps {
  crew: CrewMember;
  choices: SignalChoices;
  repairedSignal: RepairedSignal | null;
  ignoreHintSeen: boolean;
  canRepair: boolean;
  isRepairing: boolean;
  onChoiceChange: (field: "nature" | "missingInfo", value: SignalNature | MissingInfo) => void;
  onRepair: () => void;
  onIgnore: () => void;
  onMark: () => void;
}

export function SignalTaskPanel({
  crew,
  choices,
  repairedSignal,
  ignoreHintSeen,
  canRepair,
  isRepairing,
  onChoiceChange,
  onRepair,
  onIgnore,
  onMark
}: SignalTaskPanelProps) {
  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="panel-surface rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-white/45">失落信号任务</div>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          {repairedSignal ? "信号已经接回来了。" : "先判断这段碎讯像什么。"}
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className={`rounded-[22px] border px-4 py-4 text-sm ${choices.nature ? "border-cyan-300/30 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/48"}`}>
            1. 先判断重点
          </div>
          <div className={`rounded-[22px] border px-4 py-4 text-sm ${repairedSignal ? "border-cyan-300/30 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/48"}`}>
            2. 让系统补全
          </div>
          <div className={`rounded-[22px] border px-4 py-4 text-sm ${repairedSignal ? "border-amber-200/30 bg-amber-200/10 text-white" : "border-white/8 bg-white/[0.03] text-white/48"}`}>
            3. 最后由你决定
          </div>
        </div>
        <div className="mt-8 space-y-4 rounded-[28px] border border-white/8 bg-slate-950/55 p-5">
          {(repairedSignal ? [repairedSignal.summary, repairedSignal.crewComment, repairedSignal.aiLine] : brokenSignalLines).map((line) => (
            <p key={line} className="signal-line text-sm leading-7">
              {line}
            </p>
          ))}
        </div>

        {!repairedSignal && (
          <div className="mt-8 space-y-6">
            <SystemFeedback
              eyebrow="任务提示"
              title="先选重点，再让系统动手"
              body="你先判断它像什么、缺了什么，系统补全出来的结果才会更准。"
            />
            <div>
              <div className="mb-3 text-sm font-semibold text-white/84">判断 1：这段信号更像什么？</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {signalNatureOptions.map((option) => {
                  const selected = option.value === choices.nature;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChoiceChange("nature", option.value)}
                      className={`rounded-[22px] border px-4 py-4 text-sm font-semibold transition ${
                        selected
                          ? "border-cyan-300/60 bg-cyan-300/12 text-white"
                          : "border-white/8 bg-white/[0.03] text-white/72 hover:border-white/18"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-white/84">判断 2：缺失的是哪一类信息？</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {missingInfoOptions.map((option) => {
                  const selected = option.value === choices.missingInfo;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChoiceChange("missingInfo", option.value)}
                      className={`rounded-[22px] border px-4 py-4 text-sm font-semibold transition ${
                        selected
                          ? "border-cyan-300/60 bg-cyan-300/12 text-white"
                          : "border-white/8 bg-white/[0.03] text-white/72 hover:border-white/18"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={onRepair}
              disabled={!canRepair || isRepairing}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
            >
              修复信号
            </button>
          </div>
        )}

        {repairedSignal && (
          <div className="mt-8 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <SystemFeedback
                eyebrow="修复总结"
                title="你先选了重点，信号才会修得更准"
                body="系统负责把碎片拼回完整内容，但哪条路线值得相信，还是由你来决定。"
                tone="success"
              />
              <SystemFeedback
                eyebrow="最终判断"
                title="系统给出补全，你来拍板"
                body="现在你可以标记这段坐标，也可以先继续忽略。生成只是帮你看清，决定权还在你手里。"
                tone="warm"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onMark}
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
              >
                标记这段坐标
              </button>
              <button
                type="button"
                onClick={onIgnore}
                className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/78 transition hover:border-white/24 hover:bg-white/[0.08]"
              >
                继续忽略
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div className="panel-surface rounded-[32px] p-6">
          <div className="soft-label text-[11px] text-white/45">协作反馈</div>
          <div className="mt-4 text-2xl font-semibold text-white">{crew.name}</div>
          <p className="mt-3 text-sm leading-7 text-white/68">
            {repairedSignal
              ? repairedSignal.crewComment
              : `${crew.name}已经站到你的右侧，等你给出前两个判断。`}
          </p>
        </div>

        <div className="panel-surface hologram-sweep rounded-[32px] p-6">
          <div className="soft-label text-[11px] text-white/45">当前判断</div>
          <div className="mt-4 space-y-3 text-sm text-white/72">
            <div>更像：{choices.nature ? signalNatureOptions.find((option) => option.value === choices.nature)?.label : "未选择"}</div>
            <div>
              缺失：{choices.missingInfo ? missingInfoOptions.find((option) => option.value === choices.missingInfo)?.label : "未选择"}
            </div>
            {repairedSignal && <div>记录：{repairedSignal.coordinateLabel}</div>}
          </div>
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/58">
            {!repairedSignal
              ? "你的判断会先缩小范围，再让系统去补全内容。"
              : "这一次是你先定方向，系统再把碎片接上。"}
          </div>
          {ignoreHintSeen && (
            <div className="mt-5 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-100">
              你们暂时没有失去机会，只是这段回声正在变弱。先把坐标标记下来更稳妥。
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
