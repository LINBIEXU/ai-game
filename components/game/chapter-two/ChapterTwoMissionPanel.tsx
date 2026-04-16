"use client";

import {
  chapterTwoDutyOptions,
  chapterTwoFinalChoiceOptions,
  chapterTwoFocusOptions,
  chapterTwoRefinementOptions
} from "@/lib/game-constants";
import type { AIOperationState } from "@/types/ai";
import type { ChapterTwoDuty, ChapterTwoState, CrewMember } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";
import { GenerationStatus } from "@/components/game/GenerationStatus";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface ChapterTwoMissionPanelProps {
  mission: ChapterTwoState;
  crewRoster: CrewMember[];
  canRunRoundOne: boolean;
  canRunRoundTwo: boolean;
  canComplete: boolean;
  responseOperation: AIOperationState;
  assignmentOperation: AIOperationState;
  roundOneOperation: AIOperationState;
  roundTwoOperation: AIOperationState;
  completionOperation: AIOperationState;
  onAdvance: () => void;
  onSetResponsePrompt: (prompt: string) => void;
  onAnalyzeResponse: () => void;
  onRetryAnalyzeResponse?: () => void;
  onSetCrew: (slot: "leadCrewId" | "supportCrewId", crewId: string) => void;
  onSetDuty: (slot: "leadDuty" | "supportDuty", duty: ChapterTwoDuty) => void;
  onSetAssignmentPrompt: (prompt: string) => void;
  onAnalyzeAssignment: () => void;
  onRetryAnalyzeAssignment?: () => void;
  onSetRoundOneFocus: (focus: typeof chapterTwoFocusOptions[number]) => void;
  onSetRoundOnePrompt: (prompt: string) => void;
  onAnalyzeRoundOne: () => void;
  onRunRoundOne: () => void;
  onRetryRoundOne?: () => void;
  onSetRefinement: (refinement: typeof chapterTwoRefinementOptions[number]) => void;
  onSetSupportMode: (mode: "维持原分工" | "让支援船员介入") => void;
  onSetRoundTwoPrompt: (prompt: string) => void;
  onAnalyzeRoundTwo: () => void;
  onRunRoundTwo: () => void;
  onRetryRoundTwo?: () => void;
  onSetFinalChoice: (choice: typeof chapterTwoFinalChoiceOptions[number]) => void;
  onComplete: () => void;
  onRetryComplete?: () => void;
  onRecoverBySwap: () => void;
  onRecoverByStrategy: () => void;
}

const objectiveMap: Record<ChapterTwoState["currentStep"], string> = {
  response: "先说你怀疑这段回应在藏什么",
  assign: "告诉系统两位船员该怎么协作",
  "round-one": "先让系统按你的方向做第一次解读",
  "round-two": "用第二次补充把结果调得更准",
  decision: "最后相信哪条路，仍由你决定"
};

const responseHints = [
  "我怀疑它在藏某个人的身份，不只是给坐标。",
  "这更像试探，不像真正求救。",
  "先查这段回应为什么会先认出我们的船员。"
];

const assignmentHints = [
  "让前线位先拆异常语气，支援位稳住碎片顺序。",
  "先由擅长找线索的人碰回应，再让后方把假坐标筛掉。",
  "这轮别急着追远处坐标，先把谁在说话查清。"
];

const roundOneHints = [
  "先保住发讯人的痕迹，不要急着信坐标。",
  "如果它在试探我们，先看重复词序和异常语气。",
  "先确认这是不是专门冲着船上某个人来的。"
];

const roundTwoHints = [
  "我现在更怀疑它在拿假门拖时间，先别被好看的坐标带走。",
  "让支援船员提前介入，先确认这是不是针对某个船员的回应。",
  "如果要继续修正，我更想确认入口结构，不想先下最终结论。"
];

function appendHint(current: string, hint: string) {
  return current.trim().length === 0 ? hint : `${current.trim()} ${hint}`;
}

function CrewPickCard({
  crew,
  selected,
  onClick,
  suffix
}: {
  crew: CrewMember;
  selected: boolean;
  onClick: () => void;
  suffix: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition ${
        selected ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/8 bg-white/[0.03]"
      }`}
    >
      <div className="grid gap-4 md:grid-cols-[72px_1fr]">
        <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" />
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-white">{crew.name}</div>
            <span className="text-xs text-white/42">{suffix}</span>
          </div>
          <div className="mt-2 text-sm text-white/58">{crew.title}</div>
          <div className="mt-2 text-xs text-white/46">{crew.trustLabel} · {crew.abilityTag}</div>
        </div>
      </div>
    </button>
  );
}

function AnalysisLayer({
  title,
  summary,
  keywords,
  crewFit,
  riskHint
}: {
  title: string;
  summary: string;
  keywords: string[];
  crewFit: string;
  riskHint: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
      <SystemFeedback eyebrow="系统理解" title={title} body={summary} tone="success" />
      <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
        <div className="flex flex-wrap gap-2">
          {keywords.map((item) => (
            <span key={item} className="rounded-full border border-cyan-200/14 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-100">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 text-sm leading-6 text-white/64">{crewFit}</div>
        <div className="mt-3 text-xs leading-6 text-white/42">{riskHint}</div>
      </div>
    </div>
  );
}

function PromptHints({
  title,
  hints,
  onApply
}: {
  title: string;
  hints: string[];
  onApply: (hint: string) => void;
}) {
  return (
    <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-xs tracking-[0.18em] text-white/38">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {hints.map((hint) => (
          <button
            key={hint}
            type="button"
            onClick={() => onApply(hint)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/72 transition hover:border-cyan-200/24 hover:bg-cyan-200/10 hover:text-white"
          >
            {hint}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChapterTwoMissionPanel({
  mission,
  crewRoster,
  canRunRoundOne,
  canRunRoundTwo,
  canComplete,
  responseOperation,
  assignmentOperation,
  roundOneOperation,
  roundTwoOperation,
  completionOperation,
  onAdvance,
  onSetResponsePrompt,
  onAnalyzeResponse,
  onRetryAnalyzeResponse,
  onSetCrew,
  onSetDuty,
  onSetAssignmentPrompt,
  onAnalyzeAssignment,
  onRetryAnalyzeAssignment,
  onSetRoundOneFocus,
  onSetRoundOnePrompt,
  onAnalyzeRoundOne,
  onRunRoundOne,
  onRetryRoundOne,
  onSetRefinement,
  onSetSupportMode,
  onSetRoundTwoPrompt,
  onAnalyzeRoundTwo,
  onRunRoundTwo,
  onRetryRoundTwo,
  onSetFinalChoice,
  onComplete,
  onRetryComplete,
  onRecoverBySwap,
  onRecoverByStrategy
}: ChapterTwoMissionPanelProps) {
  const headline = mission.echo?.title ?? "沉默坐标";
  const clue = mission.echo?.linkedClue ?? "回应仍在重新组织。";
  const canAdvanceFromResponse = Boolean(mission.responseAnalysis);
  const canAdvanceFromAssign =
    Boolean(mission.assignmentAnalysis) &&
    Boolean(mission.leadCrewId) &&
    Boolean(mission.supportCrewId) &&
    Boolean(mission.leadDuty) &&
    Boolean(mission.supportDuty);

  return (
    <section className="scene-reveal space-y-5">
      <div className="fleet-broadcast panel-surface rounded-full px-4 py-2">
        <div className="fleet-broadcast-track">
          {[objectiveMap[mission.currentStep], clue, "沉默坐标仍在主动回应", objectiveMap[mission.currentStep], clue].map((item, index) => (
            <span key={`${item}-${index}`} className="fleet-broadcast-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <SystemFeedback eyebrow="当前目标" title={objectiveMap[mission.currentStep]} body={headline} tone="warm" />
        <SystemFeedback eyebrow="回声线索" title="这段回应先碰到了船员频谱" body={clue} />
      </div>

      {mission.lastSetback && (
        <SystemFeedback eyebrow="主舰已记住上一次误判" title={mission.lastSetback.title} body={mission.lastSetback.learnedClue} />
      )}

      {mission.currentStep === "response" && mission.echo && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">异常回应</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">先说，你觉得它最像在隐藏什么。</h2>
          <div className="mt-6 space-y-3 rounded-[28px] border border-white/8 bg-slate-950/55 p-5">
            {mission.echo.lines.map((line) => (
              <p key={line} className="signal-line text-sm leading-7">
                {line}
              </p>
            ))}
          </div>

          <textarea
            value={mission.responsePrompt}
            onChange={(event) => onSetResponsePrompt(event.target.value)}
            placeholder="比如：我怀疑它在故意藏起某个人的身份，也可能是在拿假的坐标试探我们。"
            className="mt-6 min-h-[124px] w-full rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/28"
          />
          <PromptHints title="不知道怎么说时，可以先借一句" hints={responseHints} onApply={(hint) => onSetResponsePrompt(appendHint(mission.responsePrompt, hint))} />

          <button
            type="button"
            onClick={onAnalyzeResponse}
            disabled={mission.responsePrompt.trim().length === 0}
            className="mt-6 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            让系统理解我的判断
          </button>

          <div className="mt-5">
            <GenerationStatus title="回应解析" operation={responseOperation} onRetry={onRetryAnalyzeResponse} />
          </div>

          {mission.responseAnalysis && (
            <div className="mt-6">
              <AnalysisLayer
                title={`当前更像在查 ${mission.responseAnalysis.inferredFocus}`}
                summary={mission.responseAnalysis.pathSummary}
                keywords={mission.responseAnalysis.extractedKeywords}
                crewFit={mission.responseAnalysis.crewFit}
                riskHint={mission.responseAnalysis.riskHint}
              />
              <div className="mt-4 rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-cyan-50">
                系统已锁定当前方向：{mission.responseAnalysis.inferredFocus}。如果继续，就按这个理解进入下一步。
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onAdvance}
            disabled={!canAdvanceFromResponse}
            className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            按这个方向安排协作
          </button>
        </div>
      )}

      {mission.currentStep === "assign" && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">双船员协作</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">不只是选谁，还要说这轮希望谁怎样介入。</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white/84">前线位</div>
              {crewRoster.map((crew) => (
                <CrewPickCard key={`lead-${crew.id}`} crew={crew} selected={mission.leadCrewId === crew.id} onClick={() => onSetCrew("leadCrewId", crew.id)} suffix="前线位" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white/84">支援位</div>
              {crewRoster.map((crew) => (
                <CrewPickCard key={`support-${crew.id}`} crew={crew} selected={mission.supportCrewId === crew.id} onClick={() => onSetCrew("supportCrewId", crew.id)} suffix="支援位" />
              ))}
            </div>
          </div>

          <textarea
            value={mission.assignmentPrompt}
            onChange={(event) => onSetAssignmentPrompt(event.target.value)}
            placeholder="比如：先让前线船员从异常语气里找人，再让后方船员稳住碎片，不要让假坐标把整段回应带偏。"
            className="mt-6 min-h-[124px] w-full rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/28"
          />
          <PromptHints title="你也可以这样安排协作" hints={assignmentHints} onApply={(hint) => onSetAssignmentPrompt(appendHint(mission.assignmentPrompt, hint))} />

          <button
            type="button"
            onClick={onAnalyzeAssignment}
            disabled={!mission.leadCrewId || !mission.supportCrewId || mission.assignmentPrompt.trim().length === 0}
            className="mt-6 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            让系统排布这次协作
          </button>

          <div className="mt-5">
            <GenerationStatus title="协作排布" operation={assignmentOperation} onRetry={onRetryAnalyzeAssignment} />
          </div>

          {mission.assignmentAnalysis && (
            <div className="mt-6 space-y-4">
              <AnalysisLayer
                title={mission.assignmentAnalysis.collaborationSummary}
                summary={mission.assignmentAnalysis.pathSummary}
                keywords={mission.assignmentAnalysis.extractedKeywords}
                crewFit={mission.assignmentAnalysis.crewFit}
                riskHint={mission.assignmentAnalysis.riskHint}
              />

	              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-3 text-sm font-semibold text-white/84">前线职责微调</div>
                  <div className="grid gap-3">
                    {chapterTwoDutyOptions.map((duty) => (
                      <button
                        key={`lead-duty-${duty}`}
                        type="button"
                        onClick={() => onSetDuty("leadDuty", duty)}
                        className={`rounded-[20px] border px-4 py-3 text-left text-sm transition ${
                          mission.leadDuty === duty ? "border-cyan-300/35 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/68"
                        }`}
                      >
                        {duty}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-sm font-semibold text-white/84">支援职责微调</div>
                  <div className="grid gap-3">
                    {chapterTwoDutyOptions.map((duty) => (
                      <button
                        key={`support-duty-${duty}`}
                        type="button"
                        onClick={() => onSetDuty("supportDuty", duty)}
                        className={`rounded-[20px] border px-4 py-3 text-left text-sm transition ${
                          mission.supportDuty === duty ? "border-cyan-300/35 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/68"
                        }`}
                      >
                        {duty}
                      </button>
                    ))}
                  </div>
                </div>
	              </div>
                <div className="rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-cyan-50">
                  当前协作锁定：前线 {mission.leadDuty ?? mission.assignmentAnalysis.inferredLeadDuty} / 支援 {mission.supportDuty ?? mission.assignmentAnalysis.inferredSupportDuty}。系统会先按这套分工理解你们的协作方式。
                </div>
	            </div>
	          )}

          <button
            type="button"
            onClick={onAdvance}
            disabled={!canAdvanceFromAssign}
            className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            带着这套协作进入第一轮
          </button>
        </div>
      )}

      {mission.currentStep === "round-one" && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">第一轮解读</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">先告诉系统这轮最该保留哪层信息。</h2>

          <textarea
            value={mission.roundOnePrompt}
            onChange={(event) => onSetRoundOnePrompt(event.target.value)}
            placeholder="比如：先保住谁在说话这条线，不要急着相信它给出的坐标；如果出现重复词序，优先看是不是在试探我们。"
            className="mt-6 min-h-[124px] w-full rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/28"
          />
          <PromptHints title="这轮不知道怎么指挥时" hints={roundOneHints} onApply={(hint) => onSetRoundOnePrompt(appendHint(mission.roundOnePrompt, hint))} />

          <button
            type="button"
            onClick={onAnalyzeRoundOne}
            disabled={mission.roundOnePrompt.trim().length === 0}
            className="mt-6 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            先让系统理解这一轮意图
          </button>

          <div className="mt-5">
            <GenerationStatus title="第一轮分析 / 执行" operation={roundOneOperation} onRetry={onRetryRoundOne} />
          </div>

          {mission.roundOneAnalysis && (
            <div className="mt-6 space-y-4">
              <AnalysisLayer
                title={`这一轮系统更偏向 ${mission.roundOneAnalysis.inferredFocus}`}
                summary={mission.roundOneAnalysis.pathSummary}
                keywords={mission.roundOneAnalysis.extractedKeywords}
                crewFit={mission.roundOneAnalysis.crewFit}
                riskHint={mission.roundOneAnalysis.riskHint}
              />

	              <div className="grid gap-3 md:grid-cols-3">
                {chapterTwoFocusOptions.map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => onSetRoundOneFocus(focus)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      mission.roundOneFocus === focus ? "border-cyan-300/35 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/68"
                    }`}
                  >
                    <div className="font-semibold">{focus}</div>
                  </button>
                ))}
	              </div>
                <div className="rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-cyan-50">
                  当前保留重点：{mission.roundOneFocus ?? mission.roundOneAnalysis.inferredFocus}。系统会先围绕这层做第一轮解读。
                </div>
	            </div>
	          )}

          <button
            type="button"
            onClick={onRunRoundOne}
            disabled={!canRunRoundOne}
            className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            运行第一轮协作
          </button>
        </div>
      )}

      {mission.currentStep === "round-two" && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">第二轮修正</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">再补一句，让系统知道你现在更信哪一条。</h2>

          {mission.roundOneResult && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SystemFeedback eyebrow="第一轮结果" title={mission.roundOneResult.summary} body={mission.roundOneResult.newQuestion} tone="warm" />
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                {mission.roundOneResult.partialResponse.map((line) => (
                  <p key={line} className="text-sm leading-7 text-white/66">{line}</p>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={mission.roundTwoPrompt}
            onChange={(event) => onSetRoundTwoPrompt(event.target.value)}
            placeholder="比如：如果另一位船员介入，我更想确认这是不是专门冲着我们船上的某个人来的，不要先追太远。"
            className="mt-6 min-h-[124px] w-full rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/28"
          />
          <PromptHints title="这轮修正可以这样开口" hints={roundTwoHints} onApply={(hint) => onSetRoundTwoPrompt(appendHint(mission.roundTwoPrompt, hint))} />

          <button
            type="button"
            onClick={onAnalyzeRoundTwo}
            disabled={mission.roundTwoPrompt.trim().length === 0}
            className="mt-6 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            先让系统理解这次修正
          </button>

          <div className="mt-5">
            <GenerationStatus title="第二轮修正 / 执行" operation={roundTwoOperation} onRetry={onRetryRoundTwo} />
          </div>

          {mission.roundTwoAnalysis && (
            <div className="mt-6 space-y-4">
              <AnalysisLayer
                title={`第二轮系统更偏向 ${mission.roundTwoAnalysis.inferredFocus}`}
                summary={mission.roundTwoAnalysis.pathSummary}
                keywords={mission.roundTwoAnalysis.extractedKeywords}
                crewFit={mission.roundTwoAnalysis.crewFit}
                riskHint={mission.roundTwoAnalysis.riskHint}
              />

              <div className="grid gap-3 md:grid-cols-3">
                {chapterTwoRefinementOptions.map((refinement) => (
                  <button
                    key={refinement}
                    type="button"
                    onClick={() => onSetRefinement(refinement)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      mission.roundTwoRefinement === refinement ? "border-cyan-300/35 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/68"
                    }`}
                  >
                    <div className="font-semibold">{refinement}</div>
                  </button>
                ))}
              </div>

	              <div className="grid gap-3 md:grid-cols-2">
                {(["维持原分工", "让支援船员介入"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSetSupportMode(mode)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      mission.roundTwoSupportMode === mode ? "border-cyan-300/35 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/68"
                    }`}
                  >
                    <div className="font-semibold">{mode}</div>
                  </button>
                ))}
	              </div>
                <div className="rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-cyan-50">
                  当前修正锁定：{mission.roundTwoRefinement ?? mission.roundTwoAnalysis.inferredFocus} · {mission.roundTwoSupportMode ?? "维持原分工"}
                </div>
	            </div>
	          )}

          <button
            type="button"
            onClick={onRunRoundTwo}
            disabled={!canRunRoundTwo}
            className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            运行第二轮修正
          </button>
        </div>
      )}

      {mission.currentStep === "decision" && mission.roundTwoResult && (
        <div className="panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-white/42">最终判断</div>
          {mission.roundTwoResult.outcomeType === "soft-fail" && mission.roundTwoResult.setback ? (
            <>
              <h2 className="mt-3 text-3xl font-semibold text-white">这次回响先把你们带偏了。</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SystemFeedback eyebrow="误判记录" title={mission.roundTwoResult.setback.title} body={mission.roundTwoResult.setback.summary} tone="warm" />
                <SystemFeedback eyebrow="主舰学到的新信息" title="这次失败不是白做" body={mission.roundTwoResult.setback.learnedClue} tone="success" />
              </div>
              <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-sm leading-7 text-white/66">{mission.roundTwoResult.setback.reasonHint}</p>
                <p className="mt-3 text-sm leading-7 text-white/56">{mission.roundTwoResult.setback.crewHint}</p>
                <p className="mt-3 text-sm leading-7 text-white/56">{mission.roundTwoResult.setback.strategyHint}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onRecoverBySwap}
                  className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
                >
                  返回主舰，换一位船员
                </button>
                <button
                  type="button"
                  onClick={onRecoverByStrategy}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.08]"
                >
                  保留当前船员，改写策略
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-3xl font-semibold text-white">现在该由你决定。</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SystemFeedback eyebrow="第二轮结果" title={mission.roundTwoResult.summary} body={mission.roundTwoResult.recommendation} tone="success" />
                <SystemFeedback eyebrow="关键关联" title="回应开始反过来看你们" body={mission.roundTwoResult.revealedLink} tone="warm" />
              </div>
              <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                {mission.roundTwoResult.resolvedResponse.map((line) => (
                  <p key={line} className="text-sm leading-7 text-white/66">{line}</p>
                ))}
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {chapterTwoFinalChoiceOptions.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => onSetFinalChoice(choice)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      mission.finalChoice === choice ? "border-cyan-300/35 bg-cyan-300/10 text-white" : "border-white/8 bg-white/[0.03] text-white/68"
                    }`}
                  >
                    <div className="font-semibold">{choice}</div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onComplete}
                disabled={!canComplete}
                className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
              >
                完成第二章判断
              </button>
              <div className="mt-5">
                <GenerationStatus title="章节归档" operation={completionOperation} onRetry={onRetryComplete} />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
