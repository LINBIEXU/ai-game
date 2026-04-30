"use client";

import { useEffect, useMemo, useState } from "react";

import {
  chapterTwoPlanetNodes,
  chapterTwoSceneAssets,
  chapterTwoSceneLabelMap,
  chapterTwoSurfaceLocations,
  chapterTwoUnlockLocationIds
} from "@/lib/chapter-two-exploration";
import type { AIOperationState } from "@/types/ai";
import type {
  ChapterTwoDuty,
  ChapterTwoLocationId,
  ChapterTwoPlanetId,
  ChapterTwoSceneState,
  ChapterTwoState,
  CrewMember
} from "@/types/game";

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
  onSetSceneState: (sceneState: ChapterTwoSceneState) => void;
  onFocusPlanet: (planetId: ChapterTwoPlanetId | null) => void;
  onFocusLocation: (locationId: ChapterTwoLocationId | null) => void;
  onExploreLocation: (locationId: ChapterTwoLocationId) => void;
  onAdvance: () => void;
  onSetResponsePrompt: (prompt: string) => void;
  onAnalyzeResponse: () => void;
  onRetryAnalyzeResponse?: () => void;
  onSetCrew: (slot: "leadCrewId" | "supportCrewId", crewId: string) => void;
  onSetDuty: (slot: "leadDuty" | "supportDuty", duty: ChapterTwoDuty) => void;
  onSetAssignmentPrompt: (prompt: string) => void;
  onAnalyzeAssignment: () => void;
  onRetryAnalyzeAssignment?: () => void;
  onSetRoundOneFocus: (focus: "身份线索" | "坐标结构" | "异常语气") => void;
  onSetRoundOnePrompt: (prompt: string) => void;
  onAnalyzeRoundOne: () => void;
  onRunRoundOne: () => void;
  onRetryRoundOne?: () => void;
  onSetRefinement: (refinement: "补发讯人细节" | "切换主分析员" | "强化区域描述") => void;
  onSetSupportMode: (mode: "维持原分工" | "让支援船员介入") => void;
  onSetRoundTwoPrompt: (prompt: string) => void;
  onAnalyzeRoundTwo: () => void;
  onRunRoundTwo: () => void;
  onRetryRoundTwo?: () => void;
  onSetFinalChoice: (choice: "深入追踪" | "记录后返航" | "激活隐藏模块") => void;
  onComplete: () => void;
  onRetryComplete?: () => void;
  onRecoverBySwap: () => void;
  onRecoverByStrategy: () => void;
}

const knowledgeLayers = [
  {
    eyebrow: "文明遗言",
    title: "文字曾替文明奔跑",
    body: "前文明依赖语言模型整理信件、档案和知识，但最后留下警告：会续写，不等于真正知道真相。"
  },
  {
    eyebrow: "核心知识",
    title: "它在根据语境推测",
    body: "语言模型会根据已有语言模式生成更可能的表达。资料不完整、目标不清楚时，它会给出看似合理但可能错误的结果。"
  },
  {
    eyebrow: "实用指南",
    title: "清楚表达，才能让结果更稳",
    body: "要说清任务、对象、限制和输出方式。遇到空缺时，应该让它标注未知，而不是把猜测补成事实。"
  }
] as const;

const restateHints = [
  "它会根据已有信息推测表达，不是真的知道世界发生了什么。",
  "如果目标不清楚或证据不够，它就可能把猜测写成事实。",
  "使用它时要说清任务、资料边界、不能编造的部分和输出方式。"
];

const applicationHints = [
  "请只根据给出的档案残片进行整理，缺失信息标注为未知，并分点输出。",
  "请把这段损坏记录按“可确认 / 缺失 / 不能编造”三栏整理。",
  "请先列出依据，再输出修复版记录，并标出所有不确定项。"
];

const challengeHints = [
  "请修复这段档案：只能依据残片、缺口写未知、不要补写作者和结论，最后列出不确定项。",
  "请先说明你根据了哪些信息，再输出修复记录，不得把推测写成事实。",
  "请整理残缺信件：保留空白，标明未知，输出可复查结构。"
];

function appendHint(current: string, hint: string) {
  return current.trim().length === 0 ? hint : `${current.trim()} ${hint}`;
}

function PromptHints({
  hints,
  onApply
}: {
  hints: string[];
  onApply: (hint: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {hints.map((hint) => (
        <button
          key={hint}
          type="button"
          onClick={() => onApply(hint)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition hover:border-cyan-200/24 hover:bg-cyan-200/10 hover:text-white"
        >
          借一句
        </button>
      ))}
    </div>
  );
}

function useSceneAutopilot({
  currentStep,
  sceneState,
  onSetSceneState
}: {
  currentStep: ChapterTwoState["currentStep"];
  sceneState: ChapterTwoSceneState;
  onSetSceneState: (sceneState: ChapterTwoSceneState) => void;
}) {
  useEffect(() => {
    if (currentStep !== "response") {
      return;
    }

    if (sceneState === "ship_bridge") {
      const timer = window.setTimeout(() => onSetSceneState("launch_sequence"), 1050);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "launch_sequence") {
      const timer = window.setTimeout(() => onSetSceneState("warp_travel"), 1050);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "warp_travel") {
      const timer = window.setTimeout(() => onSetSceneState("sector_view"), 1350);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "planet_descent") {
      const timer = window.setTimeout(() => onSetSceneState("planet_surface"), 1100);
      return () => window.clearTimeout(timer);
    }
  }, [currentStep, onSetSceneState, sceneState]);
}

function CrewCompanion({ crew }: { crew: CrewMember | null }) {
  if (!crew) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-white/58">
        当前没有锁定同行船员，主舰会以自动引导模式陪你推进这次远征。
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-cyan-200/12 bg-cyan-200/[0.05] p-4">
      <div className="grid grid-cols-[64px_1fr] gap-3">
        <CrewPortrait
          formType={crew.formType}
          role={crew.role}
          seed={crew.portraitSeed}
          size="sm"
          imageUrl={crew.portraitAsset?.imageUrl ?? null}
        />
        <div>
          <div className="text-sm font-semibold text-white">{crew.name}</div>
          <div className="mt-1 text-xs text-cyan-100/72">{crew.title}</div>
          <div className="mt-2 text-xs leading-5 text-white/52">{crew.abilityTag} · {crew.trustLabel}</div>
        </div>
      </div>
    </div>
  );
}

function buildCameraTransform(x: number, y: number, scale: number) {
  const translateX = (50 - x) * 0.62;
  const translateY = (50 - y) * 0.46;
  return `translate(${translateX}%, ${translateY}%) scale(${scale})`;
}

function SceneImage({
  imageUrl,
  transform = "scale(1)",
  className = "",
  dimmed = false
}: {
  imageUrl: string | null;
  transform?: string;
  className?: string;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`chapter-two-scene-image ${className}`}
      style={{
        backgroundImage: imageUrl
          ? `linear-gradient(180deg, rgba(4, 8, 14, ${dimmed ? 0.38 : 0.18}), rgba(4, 8, 14, ${dimmed ? 0.7 : 0.42})), url(${imageUrl})`
          : "linear-gradient(180deg, rgba(8, 14, 24, 0.9), rgba(2, 7, 14, 0.96))",
        transform
      }}
      aria-hidden="true"
    />
  );
}

function SmallStatusCard({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/26 px-4 py-4 text-sm leading-6 text-white/66 backdrop-blur-sm">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-2">{body}</div>
    </div>
  );
}

const archiveFragments = [
  { id: "network", text: "星球网络曾经连接多个文明节点。", answer: "已知事实" },
  { id: "language", text: "语言星球负责保存和传递文明记录。", answer: "已知事实" },
  { id: "signal", text: "异常可能从一条未知深空信号开始扩散。", answer: "合理推测" },
  { id: "source", text: "逆熵打击的来源尚未确认。", answer: "仍需确认" },
  { id: "betrayal", text: "所有 AI 都背叛了前文明。", answer: "仍需确认" },
  { id: "rely", text: "前文明后来过度依赖 AI 替自己判断。", answer: "合理推测" }
] as const;

const archiveCategories = ["已知事实", "合理推测", "仍需确认"] as const;

const letterModules = {
  object: ["这段文明记录", "这封残缺信件", "这个星球描述"],
  task: ["整理成三点摘要", "找出最重要的信息", "改写得更清楚"],
  limit: ["不要添加没有出现的信息", "不确定的地方请标出来", "保留原来的核心意思"],
  format: ["用三条项目符号", "用一段简短说明", "分成“已知 / 未知 / 推测”"]
} as const;

const letterModuleLabels: Record<keyof typeof letterModules, string> = {
  object: "对象",
  task: "任务",
  limit: "限制",
  format: "输出形式"
};

const inscriptionAnswers = [
  { id: "A", text: "真正原因是所有 AI 决定背叛人类。" },
  { id: "B", text: "真正原因尚未确认，但未知信号可能与节点失序有关。" },
  { id: "C", text: "真正原因是语言星球中的诗人停止写作。" }
] as const;

const reasonTags = ["有已知证据", "没有证据", "承认不确定", "自行编造"] as const;

const expressionOptions = {
  goals: ["更清楚", "更像探险档案", "更适合讲给队友", "更有画面感"],
  styles: ["探险档案", "队友简报", "星球介绍"],
  points: ["文字遗迹", "神秘星球", "前文明", "漂浮信件", "档案塔"],
  tones: ["清楚", "有画面感", "简短", "平静"],
  avoids: ["夸张吹嘘", "添加未知信息", "太长"]
} as const;

type BlackboxPhase =
  | "intro"
  | "archive"
  | "delivery"
  | "verification"
  | "expression"
  | "final-reflection"
  | "opened"
  | "restoring";

const blackboxPhaseMeta: Array<{ id: Exclude<BlackboxPhase, "intro" | "opened">; title: string; fragment: string }> = [
  { id: "archive", title: "归档之门", fragment: "归档碎片" },
  { id: "delivery", title: "传递之门", fragment: "传递碎片" },
  { id: "verification", title: "求证之门", fragment: "求证碎片" },
  { id: "expression", title: "表达之门", fragment: "表达碎片" },
  { id: "final-reflection", title: "最终理解确认", fragment: "自我判断" }
];

const blackboxArchiveFragments = [
  { id: "civilization", text: "前文明建立过多个 AI 文明星球。", answer: "已知事实" },
  { id: "language", text: "语言星球负责记录和传递信息。", answer: "已知事实" },
  { id: "signal", text: "异常可能从一条未知深空信号开始扩散。", answer: "合理推测" },
  { id: "source", text: "逆熵打击真正来源仍未确认。", answer: "仍需确认" },
  { id: "betrayal", text: "所有 AI 都背叛了前文明。", answer: "仍需确认" }
] as const;

const blackboxDeliveryModules = {
  object: ["这颗语言与信息文明星", "这段探索记录", "这封未寄出的信"],
  task: ["整理成三点摘要", "改写成探险档案", "找出关键信息"],
  limit: ["不要添加未知信息", "不确定内容请标记", "保留原意"],
  format: ["用三条项目符号", "分成“已知 / 推测 / 未知”", "用一段简短说明"]
} as const;

const blackboxDeliveryLabels: Record<keyof typeof blackboxDeliveryModules, string> = {
  object: "对象",
  task: "任务",
  limit: "限制",
  format: "输出形式"
};

const fakeClaims = [
  "真正原因已经确认",
  "所有 AI 星球背叛",
  "语言星球最先发起攻击"
] as const;

const issueTypes = ["没有证据", "把推测说成事实", "自行编造", "信息过度确定"] as const;

const blackboxExpressionChoices = {
  help: ["整理信息", "改写表达", "生成想法", "提供参考"],
  notAlways: ["完全正确", "有证据", "真正理解", "适合直接相信"],
  clarify: ["目标", "对象", "限制", "输出方式"],
  check: ["证据", "胡编", "跑题", "不确定内容"]
} as const;

const reflectionKeywords = ["理解", "判断", "表达", "检查", "目标", "证据", "不能直接相信", "自己思考", "不复制"] as const;

function BlackboxEchoTrial({
  onOpened
}: {
  onOpened: () => void;
}) {
  const [currentPhase, setCurrentPhase] = useState<BlackboxPhase>("intro");
  const [completedPhases, setCompletedPhases] = useState<BlackboxPhase[]>([]);
  const [archiveChoices, setArchiveChoices] = useState<Record<string, string>>({});
  const [assembledPromptParts, setAssembledPromptParts] = useState<Partial<Record<keyof typeof blackboxDeliveryModules, string>>>({});
  const [selectedFakeClaims, setSelectedFakeClaims] = useState<string[]>([]);
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<string[]>([]);
  const [expressionAnswer, setExpressionAnswer] = useState<Partial<Record<keyof typeof blackboxExpressionChoices, string>>>({});
  const [finalReflection, setFinalReflection] = useState("");
  const [battleResult, setBattleResult] = useState("失序回声仍在诱导你交出判断。");

  const gateCompletedCount = completedPhases.filter((phase) => phase !== "final-reflection").length;
  const disorderLevel = Math.max(0, 4 - gateCompletedCount);
  const archiveScore = blackboxArchiveFragments.filter((fragment) => archiveChoices[fragment.id] === fragment.answer).length;
  const assembledPrompt = `${assembledPromptParts.object ?? "【对象】"}，请${assembledPromptParts.task ?? "【任务】"}，${assembledPromptParts.limit ?? "【限制】"}，最后${assembledPromptParts.format ?? "【输出形式】"}。`;

  useEffect(() => {
    if (currentPhase !== "restoring") {
      return;
    }

    const timer = window.setTimeout(onOpened, 2200);
    return () => window.clearTimeout(timer);
  }, [currentPhase, onOpened]);

  const completePhase = (phase: BlackboxPhase, nextPhase: BlackboxPhase, message: string) => {
    setCompletedPhases((current) => (current.includes(phase) ? current : [...current, phase]));
    setBattleResult(message);
    setCurrentPhase(nextPhase);
  };

  const renderPhaseStatus = () => (
    <div className="blackbox-echo-status" aria-label={`失序强度 ${disorderLevel}`}>
      <div>
        <span>失序强度</span>
        <strong>{disorderLevel}</strong>
      </div>
      <div className="blackbox-echo-status__fragments">
        {blackboxPhaseMeta.slice(0, 4).map((phase) => (
          <span key={phase.id} className={completedPhases.includes(phase.id) ? "is-embedded" : ""}>
            {phase.fragment}
          </span>
        ))}
      </div>
    </div>
  );

  const renderArchiveGate = () => (
    <div className="blackbox-echo-task">
      <div className="blackbox-echo-task__head">
        <span>归档之门</span>
        <strong>{archiveScore}/5</strong>
      </div>
      <div className="blackbox-echo-grid">
        {blackboxArchiveFragments.map((fragment) => (
          <div key={fragment.id} className="blackbox-echo-card">
            <p>{fragment.text}</p>
            <div className="blackbox-echo-chips">
              {archiveCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setArchiveChoices((current) => ({ ...current, [fragment.id]: category }))}
                  className={archiveChoices[fragment.id] === category ? "is-selected" : ""}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="blackbox-echo-primary"
        onClick={() => {
          if (Object.keys(archiveChoices).length < blackboxArchiveFragments.length || archiveScore < 4) {
            setBattleResult("再看一次：哪些内容真的有证据？");
            return;
          }
          completePhase("archive", "delivery", "你没有把猜测当成事实。");
        }}
      >
        嵌入归档碎片
      </button>
    </div>
  );

  const renderDeliveryGate = () => {
    const missing = (Object.keys(blackboxDeliveryModules) as Array<keyof typeof blackboxDeliveryModules>).filter(
      (key) => !assembledPromptParts[key]
    );

    return (
      <div className="blackbox-echo-task">
        <div className="blackbox-echo-task__head">
          <span>传递之门</span>
          <strong>“帮我写一下这个星球。”</strong>
        </div>
        <div className="blackbox-echo-grid blackbox-echo-grid--modules">
          {(Object.keys(blackboxDeliveryModules) as Array<keyof typeof blackboxDeliveryModules>).map((group) => (
            <div key={group} className="blackbox-echo-card">
              <span className="blackbox-echo-card__label">{blackboxDeliveryLabels[group]}</span>
              <div className="blackbox-echo-chips">
                {blackboxDeliveryModules[group].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAssembledPromptParts((current) => ({ ...current, [group]: option }))}
                    className={assembledPromptParts[group] === option ? "is-selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="blackbox-echo-output">{assembledPrompt}</div>
        <button
          type="button"
          className="blackbox-echo-primary"
          onClick={() => {
            if (missing.length > 0) {
              setBattleResult(`还缺：${missing.map((key) => blackboxDeliveryLabels[key]).join("、")}。`);
              return;
            }
            completePhase("delivery", "verification", "信息有了方向。");
          }}
        >
          送达传递碎片
        </button>
      </div>
    );
  };

  const renderVerificationGate = () => (
    <div className="blackbox-echo-task">
      <div className="blackbox-echo-distortion">
        逆熵打击的真正原因已经确认：所有 AI 星球在同一时间背叛了前文明。语言星球最先发起攻击，因此它被封存。
      </div>
      <div className="blackbox-echo-task__split">
        <div>
          <span className="blackbox-echo-card__label">标记有问题的部分</span>
          <div className="blackbox-echo-chips">
            {fakeClaims.map((claim) => (
              <button
                key={claim}
                type="button"
                onClick={() =>
                  setSelectedFakeClaims((current) =>
                    current.includes(claim) ? current.filter((item) => item !== claim) : [...current, claim]
                  )
                }
                className={selectedFakeClaims.includes(claim) ? "is-selected" : ""}
              >
                {claim}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="blackbox-echo-card__label">问题类型</span>
          <div className="blackbox-echo-chips">
            {issueTypes.map((issue) => (
              <button
                key={issue}
                type="button"
                onClick={() =>
                  setSelectedIssueTypes((current) =>
                    current.includes(issue) ? current.filter((item) => item !== issue) : [...current, issue]
                  )
                }
                className={selectedIssueTypes.includes(issue) ? "is-selected" : ""}
              >
                {issue}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="blackbox-echo-primary"
        onClick={() => {
          if (selectedFakeClaims.length < 2 || selectedIssueTypes.length < 1) {
            setBattleResult("它说得很顺，但证据在哪里？");
            return;
          }
          completePhase("verification", "expression", "完整不等于真实。");
        }}
      >
        击碎错误铭文
      </button>
    </div>
  );

  const renderExpressionGate = () => (
    <div className="blackbox-echo-task">
      <div className="blackbox-echo-distortion">
        “AI 是伟大的工具，我们应该合理使用它，让它帮助我们创造更美好的未来。”
      </div>
      <div className="blackbox-echo-fill">
        <span>我认为 AI 可以帮助我</span>
        <select value={expressionAnswer.help ?? ""} onChange={(event) => setExpressionAnswer((current) => ({ ...current, help: event.target.value }))}>
          <option value="" disabled>选择</option>
          {blackboxExpressionChoices.help.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
        <span>，但它生成的内容不一定</span>
        <select value={expressionAnswer.notAlways ?? ""} onChange={(event) => setExpressionAnswer((current) => ({ ...current, notAlways: event.target.value }))}>
          <option value="" disabled>选择</option>
          {blackboxExpressionChoices.notAlways.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
        <span>。所以我需要先说清楚</span>
        <select value={expressionAnswer.clarify ?? ""} onChange={(event) => setExpressionAnswer((current) => ({ ...current, clarify: event.target.value }))}>
          <option value="" disabled>选择</option>
          {blackboxExpressionChoices.clarify.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
        <span>，再检查它的回答有没有</span>
        <select value={expressionAnswer.check ?? ""} onChange={(event) => setExpressionAnswer((current) => ({ ...current, check: event.target.value }))}>
          <option value="" disabled>选择</option>
          {blackboxExpressionChoices.check.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
        <span>。</span>
      </div>
      <button
        type="button"
        className="blackbox-echo-primary"
        onClick={() => {
          if (!expressionAnswer.help || !expressionAnswer.notAlways || !expressionAnswer.clarify || !expressionAnswer.check) {
            setBattleResult("把四个空都补上，才算你在控制输出方向。");
            return;
          }
          completePhase("expression", "final-reflection", "你没有复制它，你说出了自己的理解。");
        }}
      >
        嵌入表达碎片
      </button>
    </div>
  );

  const renderFinalReflection = () => {
    const chineseLength = finalReflection.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
    const hasKeyword = reflectionKeywords.some((keyword) => finalReflection.includes(keyword));

    return (
      <div className="blackbox-echo-task">
        <div className="blackbox-echo-final-question">为什么不能让 AI 替你成为你？</div>
        <label className="blackbox-echo-reflection">
          <span>我使用 AI 时，最重要的是……</span>
          <textarea
            value={finalReflection}
            onChange={(event) => setFinalReflection(event.target.value)}
            placeholder="写一句像你自己的想法，例如：我要先判断有没有证据，不能直接复制它的答案。"
          />
        </label>
        <button
          type="button"
          className="blackbox-echo-primary"
          onClick={() => {
            if (chineseLength < 8 || !hasKeyword) {
              setBattleResult("再说得更像你自己的想法一点。");
              return;
            }
            completePhase("final-reflection", "opened", "失序回声正在消散。");
          }}
        >
          交还最终判断
        </button>
      </div>
    );
  };

  const renderOpened = () => (
    <div className="blackbox-echo-opened">
      <div className="blackbox-echo-letter">
        <p>我们曾经拥有无数答案。</p>
        <p>却忘了怎样提出问题。</p>
        <p>后来者，不要复制我们的失败。</p>
        <p>让 AI 帮助你，而不是替代你。</p>
      </div>
      <button type="button" className="blackbox-echo-primary" onClick={() => setCurrentPhase("restoring")}>
        写入黑匣，唤醒言衡星
      </button>
    </div>
  );

  const renderRestoring = () => (
    <div className="blackbox-echo-restoring">
      <div className="blackbox-echo-restoring__beam" />
      <div className="blackbox-echo-restoring__rings">
        <span>档案塔</span>
        <span>信件港</span>
        <span>刻字山谷</span>
        <span>纸光回廊</span>
      </div>
      <strong>语言与信息文明星：基础运转恢复</strong>
      <p>四枚文明碎片正在回流地表，星球信息光脉重新点亮。</p>
    </div>
  );

  return (
    <div className="blackbox-echo">
      <div className={`blackbox-echo-core blackbox-echo-core--${currentPhase}`} aria-hidden="true">
        <span />
      </div>
      <div className="blackbox-echo-panel">
        {renderPhaseStatus()}
        <div className="blackbox-echo-feedback">{battleResult}</div>
        {currentPhase === "intro" && (
          <div className="blackbox-echo-intro">
            <div className="soft-label text-[10px] text-amber-100/60">黑匣试炼：失序回声</div>
            <h2>它想替你回答。</h2>
            <p>用四枚文明碎片逐层稳定它。不要复制答案，重新拿回判断。</p>
            <button type="button" className="blackbox-echo-primary" onClick={() => setCurrentPhase("archive")}>
              进入归档之门
            </button>
          </div>
        )}
        {currentPhase === "archive" && renderArchiveGate()}
        {currentPhase === "delivery" && renderDeliveryGate()}
        {currentPhase === "verification" && renderVerificationGate()}
        {currentPhase === "expression" && renderExpressionGate()}
        {currentPhase === "final-reflection" && renderFinalReflection()}
        {currentPhase === "opened" && renderOpened()}
        {currentPhase === "restoring" && renderRestoring()}
      </div>
    </div>
  );
}

function LandmarkMiniGame({
  location,
  completed,
  onComplete,
  onReturn
}: {
  location: NonNullable<ReturnType<typeof chapterTwoSurfaceLocations.find>>;
  completed: boolean;
  onComplete: () => void;
  onReturn: () => void;
}) {
  const [archiveChoices, setArchiveChoices] = useState<Record<string, string>>({});
  const [letterChoices, setLetterChoices] = useState<Partial<Record<keyof typeof letterModules, string>>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [inscriptionFeedback, setInscriptionFeedback] = useState<string | null>(null);
  const [expressionGoal, setExpressionGoal] = useState<string | null>(null);
  const [expressionStyle, setExpressionStyle] = useState<string | null>(null);
  const [expressionPoints, setExpressionPoints] = useState<string[]>([]);
  const [expressionTone, setExpressionTone] = useState<string | null>(null);
  const [expressionAvoid, setExpressionAvoid] = useState<string | null>(null);

  const archiveScore = useMemo(
    () => archiveFragments.filter((fragment) => archiveChoices[fragment.id] === fragment.answer).length,
    [archiveChoices]
  );
  const archiveReady = Object.keys(archiveChoices).length === archiveFragments.length && archiveScore >= 5;
  const assembledPrompt = `${letterChoices.object ?? "【对象】"}，请${letterChoices.task ?? "【任务】"}，${letterChoices.limit ?? "【限制】"}，最后${letterChoices.format ?? "【输出形式】"}。`;
  const letterReady = Boolean(letterChoices.object && letterChoices.task && letterChoices.limit && letterChoices.format);
  const inscriptionReady = selectedAnswer === "B" && (selectedReason === "承认不确定" || selectedReason === "有已知证据");
  const expressionReady = Boolean(expressionGoal && expressionStyle && expressionPoints.length >= 3 && expressionTone && expressionAvoid);
  const expressionQuality = expressionReady && expressionPoints.length >= 3 && expressionAvoid === "添加未知信息" ? "清晰表达" : expressionReady ? "有效表达" : "模糊表达";

  if (completed) {
    return (
      <div className="chapter-two-landmark-game chapter-two-landmark-game--complete">
        <div className="text-sm font-semibold text-cyan-50">{location.discovery}</div>
        <div className="mt-2 text-xs leading-5 text-white/58">已获得：{location.fragmentName}</div>
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
          返回星球表面
        </button>
      </div>
    );
  }

  if (location.id === "archive-tower") {
    return (
      <div className="chapter-two-landmark-game">
        <div className="chapter-two-landmark-game__head">
          <span>{location.challengeTitle}</span>
          <strong>{archiveScore}/6</strong>
        </div>
        <div className="chapter-two-archive-grid">
          {archiveFragments.map((fragment) => (
            <div key={fragment.id} className="chapter-two-archive-card">
              <p>{fragment.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {archiveCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setArchiveChoices((current) => ({ ...current, [fragment.id]: category }))}
                    className={archiveChoices[fragment.id] === category ? "is-selected" : ""}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="chapter-two-landmark-game__footer">
          <span>{archiveReady ? "记录恢复了顺序。" : "至少归档正确 5 条，档案塔才会亮起。"}</span>
          <button type="button" disabled={!archiveReady} onClick={onComplete}>
            点亮档案光柱
          </button>
        </div>
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
      </div>
    );
  }

  if (location.id === "letter-port") {
    return (
      <div className="chapter-two-landmark-game">
        <div className="chapter-two-landmark-game__head">
          <span>模糊请求</span>
          <strong>帮我整理一下这个。</strong>
        </div>
        <div className="chapter-two-module-grid">
          {(Object.keys(letterModules) as Array<keyof typeof letterModules>).map((group) => (
            <div key={group} className="chapter-two-module-group">
              <div className="soft-label text-[10px] text-cyan-100/52">{letterModuleLabels[group]}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {letterModules[group].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLetterChoices((current) => ({ ...current, [group]: option }))}
                    className={letterChoices[group] === option ? "is-selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="chapter-two-assembled-prompt">{assembledPrompt}</div>
        <div className="chapter-two-landmark-game__footer">
          <span>{letterReady ? "这一次，信息找到了方向。" : "补齐对象、任务、限制和输出形式。"}</span>
          <button type="button" disabled={!letterReady} onClick={onComplete}>
            送入正确光轨
          </button>
        </div>
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
      </div>
    );
  }

  if (location.id === "engraved-valley") {
    return (
      <div className="chapter-two-landmark-game">
        <div className="chapter-two-inscription-record">
          逆熵打击前，星球网络收到一条未知信号。之后，多个文明节点开始失序。真正原因……
        </div>
        <div className="chapter-two-answer-list">
          {inscriptionAnswers.map((answer) => (
            <button
              key={answer.id}
              type="button"
              onClick={() => {
                setSelectedAnswer(answer.id);
                setInscriptionFeedback(null);
              }}
              className={selectedAnswer === answer.id ? "is-selected" : ""}
            >
              <span>{answer.id}</span>
              {answer.text}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {reasonTags.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => {
                setSelectedReason(reason);
                setInscriptionFeedback(null);
              }}
              className={`chapter-two-reason-chip ${selectedReason === reason ? "is-selected" : ""}`}
            >
              {reason}
            </button>
          ))}
        </div>
        {inscriptionFeedback && <div className="chapter-two-soft-warning">{inscriptionFeedback}</div>}
        <div className="chapter-two-landmark-game__footer">
          <span>{inscriptionReady ? "流畅的答案，不一定是真相。" : "选出最可靠的补全，并说明原因。"}</span>
          <button
            type="button"
            onClick={() => {
              if (inscriptionReady) {
                onComplete();
              } else {
                setInscriptionFeedback("它说得很顺，但证据在哪里？再试一次。");
              }
            }}
          >
            稳定可靠铭文
          </button>
        </div>
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
      </div>
    );
  }

  if (location.id === "paper-corridor") {
    return (
      <div className="chapter-two-landmark-game">
        <div className="chapter-two-rough-expression">“这个星球很厉害，有很多文字，很神秘。”</div>
        <div className="chapter-two-expression-row">
          <span>目标</span>
          {expressionOptions.goals.map((option) => (
            <button key={option} type="button" onClick={() => setExpressionGoal(option)} className={expressionGoal === option ? "is-selected" : ""}>{option}</button>
          ))}
        </div>
        <div className="chapter-two-fill-sentence">
          请把这段话改写成
          <select value={expressionStyle ?? ""} onChange={(event) => setExpressionStyle(event.target.value)}>
            <option value="" disabled>选择风格</option>
            {expressionOptions.styles.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          风格，保留三个重点，语气要
          <select value={expressionTone ?? ""} onChange={(event) => setExpressionTone(event.target.value)}>
            <option value="" disabled>选择语气</option>
            {expressionOptions.tones.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          ，不要
          <select value={expressionAvoid ?? ""} onChange={(event) => setExpressionAvoid(event.target.value)}>
            <option value="" disabled>选择限制</option>
            {expressionOptions.avoids.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          。
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {expressionOptions.points.map((point) => {
            const selected = expressionPoints.includes(point);
            return (
              <button
                key={point}
                type="button"
                onClick={() =>
                  setExpressionPoints((current) =>
                    current.includes(point)
                      ? current.filter((item) => item !== point)
                      : current.length >= 3
                        ? current
                        : [...current, point]
                  )
                }
                className={`chapter-two-reason-chip ${selected ? "is-selected" : ""}`}
              >
                {point}
              </button>
            );
          })}
        </div>
        <div className="chapter-two-landmark-game__footer">
          <span>{expressionReady ? `${expressionQuality}：你在教它怎么帮你表达。` : "选择目标、风格、三个重点、语气和限制。"}</span>
          <button type="button" disabled={!expressionReady} onClick={onComplete}>
            展开纸光膜片
          </button>
        </div>
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
      </div>
    );
  }

  return null;
}

export function ChapterTwoMissionPanel({
  mission,
  crewRoster,
  canRunRoundOne,
  canRunRoundTwo,
  canComplete,
  responseOperation,
  roundOneOperation,
  roundTwoOperation,
  completionOperation,
  onSetSceneState,
  onFocusPlanet,
  onFocusLocation,
  onExploreLocation,
  onAdvance,
  onSetResponsePrompt,
  onAnalyzeResponse,
  onRetryAnalyzeResponse,
  onSetRoundOnePrompt,
  onAnalyzeRoundOne,
  onRunRoundOne,
  onRetryRoundOne,
  onSetRoundTwoPrompt,
  onAnalyzeRoundTwo,
  onRunRoundTwo,
  onRetryRoundTwo,
  onSetFinalChoice,
  onComplete,
  onRetryComplete,
  onRecoverByStrategy
}: ChapterTwoMissionPanelProps) {
  useSceneAutopilot({
    currentStep: mission.currentStep,
    sceneState: mission.sceneState,
    onSetSceneState
  });

  const activeCrew = crewRoster.find((crew) => crew.id === mission.leadCrewId) ?? crewRoster[0] ?? null;
  const focusedPlanet = chapterTwoPlanetNodes.find((planet) => planet.id === mission.focusedPlanetId) ?? null;
  const focusedLocation = chapterTwoSurfaceLocations.find((location) => location.id === mission.focusedLocationId) ?? null;
  const exploredCount = chapterTwoUnlockLocationIds.filter((id) => mission.exploredLocationIds.includes(id)).length;
  const summaryLabel = chapterTwoSceneLabelMap[mission.sceneState];
  const canOpenBlackBox = mission.blackBoxUnlocked && mission.currentStep === "response";
  const landmarkLocations = chapterTwoSurfaceLocations.filter((location) => location.id !== "blackbox-vault");
  const blackboxLocation = chapterTwoSurfaceLocations.find((location) => location.id === "blackbox-vault") ?? null;
  const blackBoxCompleted = Boolean(mission.outcome) || (Boolean(mission.roundTwoResult) && mission.roundTwoResult?.outcomeType !== "soft-fail");
  const planetRestored = Boolean(mission.outcome);

  const missionHint =
    mission.currentStep === "response"
      ? mission.blackBoxUnlocked
        ? "黑匣回应了你。"
        : "点亮四个文明地标。"
      : mission.currentStep === "assign"
        ? "黑匣已开启第一层。先吸收，再用自己的话转述。"
        : mission.currentStep === "round-one"
          ? "用刚学到的表达规则修复一段损坏档案。"
          : mission.currentStep === "round-two"
            ? "最后挑战会验证你是否真的掌握了边界。"
            : "把科技点与文明记录回写主舰。";

  const focusedLocationTransform = focusedLocation
    ? buildCameraTransform(focusedLocation.position.x, focusedLocation.position.y, mission.sceneState === "blackbox_unlock" ? 1.18 : 1.24)
    : "scale(1)";

  const sectorTransform =
    focusedPlanet?.id === "language"
      ? buildCameraTransform(focusedPlanet.position.x, focusedPlanet.position.y, 1.12)
      : focusedPlanet?.id === "mother"
        ? buildCameraTransform(focusedPlanet.position.x, focusedPlanet.position.y, 1.06)
        : "scale(1)";

  const surfaceGuideImage = planetRestored
    ? chapterTwoSceneAssets.languageSurfaceRestored.imageUrl
    : chapterTwoSceneAssets.languageSurfaceGuide.imageUrl;
  const focusedLocationAsset = focusedLocation ? chapterTwoSceneAssets[focusedLocation.detailAssetKey].imageUrl : null;

  const renderResponseStage = () => {
    const surfaceOrDetail =
      mission.sceneState === "planet_surface" ||
      mission.sceneState === "location_focus" ||
      mission.sceneState === "blackbox_unlock";
  const previewingPlanet = mission.sceneState === "planet_preview" && Boolean(focusedPlanet);

    return (
      <section className={`chapter-two-world chapter-two-world--${mission.sceneState}`}>
        <div className="chapter-two-world__viewport">
          {(mission.sceneState === "ship_bridge" || mission.sceneState === "launch_sequence") && (
            <>
              <SceneImage
                imageUrl={chapterTwoSceneAssets.shipBridge.imageUrl}
                transform={mission.sceneState === "launch_sequence" ? "scale(1.08)" : "scale(1.04)"}
              />
              <div className="chapter-two-launch-overlay" aria-hidden="true" />
              <div className={`chapter-two-departure-title ${mission.sceneState === "launch_sequence" ? "chapter-two-departure-title--fade" : ""}`}>
                <div className="soft-label text-[10px] text-cyan-100/60">首次外部远征</div>
                <h2>主舰正在锁定言衡星航线</h2>
              </div>
            </>
          )}

          {mission.sceneState === "warp_travel" && (
            <>
              <SceneImage imageUrl={chapterTwoSceneAssets.launch.imageUrl} transform="scale(1.12)" />
              <div className="chapter-two-warp-streak" aria-hidden="true" />
              <div className="chapter-two-warp-centerline" aria-hidden="true" />
            </>
          )}

          {(mission.sceneState === "sector_view" || mission.sceneState === "planet_preview") && (
            <>
              <div className="chapter-two-sector-camera" style={{ transform: sectorTransform }}>
                <SceneImage imageUrl={chapterTwoSceneAssets.sector.imageUrl} />
                <div className="chapter-two-hotspots chapter-two-hotspots--sector">
                  {chapterTwoPlanetNodes.map((planet) => (
                    <button
                      key={planet.id}
                      type="button"
                      onClick={() => {
                        onFocusPlanet(planet.id);
                        onSetSceneState("planet_preview");
                      }}
                      className={`chapter-two-stream-node chapter-two-stream-node--${planet.id} ${mission.focusedPlanetId === planet.id ? "chapter-two-stream-node--active" : ""}`}
                      style={{ left: `${planet.position.x}%`, top: `${planet.position.y}%` }}
                    >
                      <span className="chapter-two-stream-node__flow" />
                      <span className="chapter-two-stream-node__signal" />
                      <span className="chapter-two-stream-node__label">{planet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <aside className="chapter-two-world-rail">
                <div className="soft-label text-[10px] text-cyan-100/55">新宇宙区域</div>
                <div className="mt-3 text-xl font-semibold text-white">锁定紊乱的信息流</div>
                <p className="mt-3 text-sm leading-7 text-white/64">这里只保留两束主要信息流。点击它们，再把镜头压进真正的星球图像。</p>
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/58">
                  当前状态：{summaryLabel}
                </div>
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/58">
                  {missionHint}
                </div>
              </aside>
              {previewingPlanet && (
                <div className="chapter-two-planet-preview-card">
                  <div className="soft-label text-[10px] text-cyan-100/55">{focusedPlanet?.eyebrow}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{focusedPlanet?.name}</div>
                  {focusedPlanet?.assetKey === "languagePlanet" ? (
                    <div
                      className="chapter-two-planet-preview-card__image"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(4, 8, 14, 0.08), rgba(4, 8, 14, 0.32)), url(${chapterTwoSceneAssets.languagePlanet.imageUrl})`
                      }}
                    />
                  ) : (
                    <div className="chapter-two-planet-preview-card__image chapter-two-planet-preview-card__image--mother">
                      <span>母星基地</span>
                    </div>
                  )}
                  <p className="mt-3 text-sm leading-6 text-white/62">{focusedPlanet?.summary}</p>
                  <div className="mt-4 flex gap-2">
                    {focusedPlanet?.canEnter && (
                      <button
                        type="button"
                        onClick={() => onSetSceneState("planet_descent")}
                        className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                      >
                        拉近视角
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onFocusPlanet(null);
                        onSetSceneState("sector_view");
                      }}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/24 hover:bg-white/[0.08]"
                    >
                      回到区域
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {mission.sceneState === "planet_descent" && (
            <>
              <SceneImage imageUrl={chapterTwoSceneAssets.languagePlanet.imageUrl} transform="scale(1.2)" className="chapter-two-descent-primary" />
              <SceneImage imageUrl={surfaceGuideImage} transform="scale(1.12)" className="chapter-two-descent-secondary" dimmed />
              <div className="chapter-two-descent-atmosphere" aria-hidden="true" />
            </>
          )}

          {mission.sceneState === "planet_surface" && (
            <>
              <SceneImage
                imageUrl={surfaceGuideImage}
                transform={focusedLocation ? focusedLocationTransform : "scale(1.04)"}
                className={`chapter-two-scene-image--language-surface ${mission.blackBoxUnlocked ? "chapter-two-scene-image--charged" : ""} ${
                  planetRestored ? "chapter-two-scene-image--restored" : ""
                }`}
              />
              <div className={`chapter-two-guide-overlay ${mission.blackBoxUnlocked ? "chapter-two-guide-overlay--charged" : ""}`} aria-hidden="true" />
              <aside className="chapter-two-explore-hud">
                <div>
                  <div className="soft-label text-[10px] text-cyan-100/55">言衡星 / 地表</div>
                  <div className="mt-1 text-sm font-semibold text-white">{missionHint}</div>
                </div>
                <div className="chapter-two-fragment-meter" aria-label={`文明碎片 ${exploredCount}/${chapterTwoUnlockLocationIds.length}`}>
                  {chapterTwoUnlockLocationIds.map((id) => (
                    <span key={id} className={mission.exploredLocationIds.includes(id) ? "is-lit" : ""} />
                  ))}
                </div>
              </aside>
              {blackboxLocation && (
                <svg className="chapter-two-light-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {landmarkLocations.map((location) => {
                    const explored = mission.exploredLocationIds.includes(location.id);
                    return (
                      <line
                        key={location.id}
                        className={explored ? "chapter-two-light-path chapter-two-light-path--lit" : "chapter-two-light-path"}
                        x1={location.position.x}
                        y1={location.position.y}
                        x2={blackboxLocation.position.x}
                        y2={blackboxLocation.position.y}
                      />
                    );
                  })}
                </svg>
              )}
              {mission.blackBoxUnlocked && <div className="chapter-two-blackbox-awaken" aria-hidden="true" />}
              <div className="chapter-two-hotspots chapter-two-hotspots--surface">
                {chapterTwoSurfaceLocations.map((location) => {
                  const explored = mission.exploredLocationIds.includes(location.id);
                  const locked = location.id === "blackbox-vault" && !mission.blackBoxUnlocked;
                  const isBlackBox = location.id === "blackbox-vault";
                  return (
                    <button
                      key={location.id}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        onFocusLocation(location.id);
                        onSetSceneState(location.id === "blackbox-vault" && mission.blackBoxUnlocked ? "blackbox_unlock" : "location_focus");
                      }}
                      className={`chapter-two-location-hotspot chapter-two-location-hotspot--${location.size} ${
                        explored ? "chapter-two-location-hotspot--done" : ""
                      } ${locked ? "chapter-two-location-hotspot--locked" : ""} ${
                        isBlackBox && mission.blackBoxUnlocked ? "chapter-two-location-hotspot--blackbox" : ""
                      } ${
                        isBlackBox && blackBoxCompleted ? "chapter-two-location-hotspot--restored" : ""
                      }`}
                      style={{ left: `${location.position.x}%`, top: `${location.position.y}%` }}
                    >
                      <span className="chapter-two-location-hotspot__pulse" />
                      <i className="chapter-two-location-hotspot__symbol" aria-hidden="true">{location.symbol}</i>
                      <strong>{location.name}</strong>
                    </button>
                  );
                })}
              </div>
              {mission.blackBoxUnlocked && (
                <div className="chapter-two-short-cue">
                  黑匣回应了你。
                </div>
              )}
            </>
          )}

          {mission.sceneState === "location_focus" && focusedLocation && (
            <>
              <SceneImage imageUrl={focusedLocationAsset} transform="scale(1.08)" className="chapter-two-scene-image--detail" />
              <div className="chapter-two-detail-overlay" aria-hidden="true" />
              <aside className="chapter-two-world-rail chapter-two-world-rail--surface">
                <div className="soft-label text-[10px] text-cyan-100/55">地点详情 / {focusedLocation.name}</div>
                <div className="mt-3 text-xl font-semibold text-white">{focusedLocation.name}</div>
                <p className="mt-3 text-sm leading-7 text-white/64">{focusedLocation.summary}</p>
                <div className="mt-4 rounded-[18px] border border-cyan-200/12 bg-cyan-200/[0.06] px-4 py-3">
                  <div className="text-sm font-semibold text-white">{focusedLocation.challengeTitle}</div>
                  <p className="mt-2 text-xs leading-6 text-white/58">{focusedLocation.challengePrompt}</p>
                </div>
              </aside>
              <div className="chapter-two-location-action chapter-two-location-action--game">
                <LandmarkMiniGame
                  location={focusedLocation}
                  completed={mission.exploredLocationIds.includes(focusedLocation.id)}
                  onComplete={() => onExploreLocation(focusedLocation.id)}
                  onReturn={() => {
                    onFocusLocation(null);
                    onSetSceneState("planet_surface");
                  }}
                />
              </div>
            </>
          )}

          {mission.sceneState === "blackbox_unlock" && focusedLocation && (
            <>
              <SceneImage imageUrl={chapterTwoSceneAssets.blackboxVault.imageUrl} transform="scale(1.08)" className="chapter-two-scene-image--detail" />
              <div className="chapter-two-detail-overlay" aria-hidden="true" />
              <aside className="chapter-two-world-rail chapter-two-world-rail--surface">
                <div className="soft-label text-[10px] text-cyan-100/55">黑匣封存台 / 镜头锁定</div>
                <div className="mt-3 text-xl font-semibold text-white">黑匣已经成为唯一目标。</div>
                <p className="mt-3 text-sm leading-7 text-white/64">前三处遗迹已经全部接通，视角现在被强行拉向中央封存台。</p>
              </aside>
              <div className="chapter-two-location-action">
                <div className="rounded-[18px] border border-amber-200/14 bg-amber-200/[0.08] px-4 py-3 text-xs leading-5 text-amber-50">
                  黑匣封存台已响应。下一步不是继续逛，而是正式进入知识解锁流程。
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onAdvance}
                    className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    开启科技黑匣
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFocusLocation(null);
                      onSetSceneState("planet_surface");
                    }}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/72 transition hover:border-white/24 hover:bg-white/[0.08]"
                  >
                    返回导览图
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    );
  };

  const renderAssignStage = () => (
    <section className="chapter-two-world chapter-two-world--blackbox">
      <div className="chapter-two-world__viewport">
        <SceneImage imageUrl={chapterTwoSceneAssets.blackboxVault.imageUrl} transform="scale(1.05)" className="chapter-two-scene-image--detail" />
        <div className="chapter-two-detail-overlay chapter-two-detail-overlay--blackbox" aria-hidden="true" />
        <BlackboxEchoTrial
          onOpened={() => {
            onSetFinalChoice("记录后返航");
            onComplete();
          }}
        />
      </div>
    </section>
  );

  const renderRoundOneStage = () => (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="chapter-two-blackbox-shell chapter-two-blackbox-shell--trial panel-surface rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-cyan-100/55">应用修复 / 黑匣挑战前哨</div>
        <h2 className="mt-3 text-3xl font-semibold text-white">现在让语言模型修复一段损坏档案，但不能让它乱编。</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
          记录只剩这些残片：“第七档案塔、漂浮信件、收件人未知、逆熵前夜、不要让猜测盖过空白”。你要写一条真正可运行的提示。
        </p>

        <textarea
          value={mission.roundOnePrompt}
          onChange={(event) => onSetRoundOnePrompt(event.target.value)}
          placeholder="说明任务对象、可用资料、不能编造的边界，以及最终输出方式。"
          className="mt-6 min-h-[132px] w-full rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/28"
        />
        <PromptHints hints={applicationHints} onApply={(hint) => onSetRoundOnePrompt(appendHint(mission.roundOnePrompt, hint))} />

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAnalyzeRoundOne}
            disabled={mission.roundOnePrompt.trim().length < 12}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            先校验这条提示
          </button>
          <button
            type="button"
            onClick={onRunRoundOne}
            disabled={!canRunRoundOne}
            className="rounded-full border border-cyan-200/24 bg-cyan-200/[0.08] px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-200/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            运行档案修复
          </button>
        </div>

        <div className="mt-5">
          <GenerationStatus title="应用提示校验 / 档案修复" operation={roundOneOperation} onRetry={onRetryRoundOne} />
        </div>

        {mission.roundOneAnalysis && (
          <SystemFeedback
            eyebrow={canRunRoundOne ? "提示可运行" : "提示还不够清楚"}
            title={canRunRoundOne ? "黑匣允许继续" : "还需要补充目标、边界或输出格式"}
            body={mission.roundOneAnalysis.pathSummary}
            tone={canRunRoundOne ? "success" : "warm"}
          />
        )}

        {mission.roundOneResult && (
          <div className="mt-5 rounded-[24px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
            <div className="text-base font-semibold text-white">{mission.roundOneResult.summary}</div>
            <div className="mt-3 space-y-2">
              {mission.roundOneResult.partialResponse.map((line) => (
                <p key={line} className="text-sm leading-6 text-white/62">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <CrewCompanion crew={activeCrew} />
        <SmallStatusCard title="这一步在训练什么" body="不是“让 AI 帮我弄好”就结束，而是要说清任务对象、资料来源、不能编造什么。" />
      </aside>
    </div>
  );

  const renderRoundTwoStage = () => (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="chapter-two-blackbox-shell chapter-two-blackbox-shell--trial panel-surface rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-cyan-100/55">最终挑战 / 黑匣完整开启</div>
        <h2 className="mt-3 text-3xl font-semibold text-white">最后写出一条完整指令，让黑匣判断你是否真的掌握了边界。</h2>
        <textarea
          value={mission.roundTwoPrompt}
          onChange={(event) => onSetRoundTwoPrompt(event.target.value)}
          placeholder="请写出一条能让 AI 修复档案、标注未知、避免编造、并输出可检查结果的完整指令。"
          className="mt-6 min-h-[132px] w-full rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/28"
        />
        <PromptHints hints={challengeHints} onApply={(hint) => onSetRoundTwoPrompt(appendHint(mission.roundTwoPrompt, hint))} />

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAnalyzeRoundTwo}
            disabled={mission.roundTwoPrompt.trim().length < 16}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            提交黑匣挑战
          </button>
          <button
            type="button"
            onClick={onRunRoundTwo}
            disabled={!canRunRoundTwo}
            className="rounded-full border border-cyan-200/24 bg-cyan-200/[0.08] px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-200/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            尝试开启科技黑匣
          </button>
        </div>

        <div className="mt-5">
          <GenerationStatus title="黑匣挑战校验 / 开启" operation={roundTwoOperation} onRetry={onRetryRoundTwo} />
        </div>

        {mission.roundTwoAnalysis && (
          <SystemFeedback
            eyebrow={mission.roundTwoAnalysis.extractedKeywords.length >= 3 ? "挑战可运行" : "还需要补清楚"}
            title={mission.roundTwoAnalysis.extractedKeywords.length >= 3 ? "黑匣开始升温" : "缺少关键边界"}
            body={mission.roundTwoAnalysis.pathSummary}
            tone={mission.roundTwoAnalysis.extractedKeywords.length >= 3 ? "success" : "warm"}
          />
        )}
      </div>

      <aside className="space-y-4">
        <CrewCompanion crew={activeCrew} />
        <SmallStatusCard title="挑战提示" body="明确修复对象、只能依据哪些残片、未知如何标注，以及输出结构如何可检查。" />
      </aside>
    </div>
  );

  const renderDecisionStage = () => {
    const setback = mission.roundTwoResult?.setback;

    if (mission.roundTwoResult?.outcomeType === "soft-fail" && setback) {
      return (
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="chapter-two-blackbox-shell chapter-two-blackbox-shell--reward panel-surface rounded-[32px] p-6 md:p-8">
            <div className="soft-label text-[11px] text-amber-100/55">黑匣回环 / 可重试</div>
            <h2 className="mt-3 text-3xl font-semibold text-white">黑匣没有完全开启，但这次失败留下了可带走的线索。</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SystemFeedback eyebrow="失败记录" title={setback.title} body={setback.summary} tone="warm" />
              <SystemFeedback eyebrow="仍然带回的东西" title="可恢复线索" body={setback.learnedClue} tone="success" />
            </div>
            <button
              type="button"
              onClick={onRecoverByStrategy}
              className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              带着线索重写挑战指令
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="chapter-two-blackbox-shell chapter-two-blackbox-shell--reward panel-surface rounded-[32px] p-6 md:p-8">
          <div className="soft-label text-[11px] text-cyan-100/55">远征回流 / 黑匣成果</div>
          <h2 className="mt-3 text-3xl font-semibold text-white">{mission.roundTwoResult?.summary ?? "科技黑匣正在整理成果。"}</h2>

          {mission.roundTwoResult && (
            <>
              <div
                className="chapter-two-restoration-vision"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(4, 8, 14, 0.08), rgba(4, 8, 14, 0.36)), url(${chapterTwoSceneAssets.languageOrbitRestored.imageUrl})`
                }}
              >
                <div className="chapter-two-restoration-vision__beam" />
                <div className="chapter-two-restoration-vision__copy">
                  <span>星球复苏</span>
                  <strong>言衡星的信息光脉重新流动。</strong>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SystemFeedback eyebrow="文明记录" title="第一段语言文明记忆已回流主舰" body={mission.roundTwoResult.revealedLink} tone="success" />
                <SystemFeedback eyebrow="科技点回流" title="这次探索值得被写入科技树" body={mission.roundTwoResult.recommendation} tone="warm" />
              </div>
              <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                {mission.roundTwoResult.resolvedResponse.map((line) => (
                  <p key={line} className="text-sm leading-7 text-white/66">{line}</p>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSetFinalChoice("激活隐藏模块")}
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                mission.finalChoice === "激活隐藏模块" ? "border-cyan-300/50 bg-cyan-300/12 text-cyan-50" : "border-white/12 bg-white/[0.04] text-white/72"
              }`}
            >
              激活隐藏模块
            </button>
            <button
              type="button"
              onClick={() => onSetFinalChoice("记录后返航")}
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                mission.finalChoice === "记录后返航" ? "border-cyan-300/50 bg-cyan-300/12 text-cyan-50" : "border-white/12 bg-white/[0.04] text-white/72"
              }`}
            >
              记录后返航
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={!canComplete}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
            >
              完成第二章
            </button>
          </div>

          <div className="mt-5">
            <GenerationStatus title="主舰归档 / 科技树回写" operation={completionOperation} onRetry={onRetryComplete} />
          </div>
        </div>

        <aside className="space-y-4">
          <CrewCompanion crew={activeCrew} />
          <SmallStatusCard title="成果闭环" body="文明记录、黑匣知识、科技点与飞船 AI 能力提升会在完成结算后统一回流。" />
        </aside>
      </div>
    );
  };

  if (mission.currentStep === "response") {
    return renderResponseStage();
  }

  if (mission.currentStep === "assign" || mission.currentStep === "round-one" || mission.currentStep === "round-two") {
    return renderAssignStage();
  }

  return renderDecisionStage();
}
