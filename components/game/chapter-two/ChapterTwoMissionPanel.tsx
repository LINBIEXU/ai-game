"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import {
  chapterTwoBlackboxFragmentLocationIds,
  chapterTwoEvidenceFragmentLocationId,
  chapterTwoPlanetNodes,
  chapterTwoSceneAssets,
  chapterTwoSceneLabelMap,
  chapterTwoSurfaceLocations
} from "@/lib/chapter-two-exploration";
import { createChapterTwoCrewAssistHint, resolveChapterTwoCrewAbility } from "@/lib/crew-abilities";
import type {
  ChapterTwoCrewAbility,
  ChapterTwoCrewAssistRecord,
  ChapterTwoCrewAssistRequest,
  ChapterTwoLocationCompletionPayload,
  ChapterTwoLocationId,
  ChapterTwoLocationRewardClaim,
  ChapterTwoPlanetId,
  ChapterTwoRepairReadings,
  ChapterTwoSceneState,
  ChapterTwoState,
  ChapterTwoSystemReadings,
  CrewMember
} from "@/types/game";

import { EvidenceWellTrial } from "@/components/game/chapter-two/EvidenceWellTrial";
import {
  ArchiveTowerGame,
  EngravedValleyGame,
  LetterPortGame,
  PaperCorridorGame
} from "@/components/game/chapter-two/LandmarkGames";
import { CrewAssistHintButton } from "@/components/game/chapter-two/LandmarkGames/CrewAbilityHint";

interface ChapterTwoMissionPanelProps {
  mission: ChapterTwoState;
  crewRoster: CrewMember[];
  onSetSceneState: (sceneState: ChapterTwoSceneState) => void;
  onFocusPlanet: (planetId: ChapterTwoPlanetId | null) => void;
  onFocusLocation: (locationId: ChapterTwoLocationId | null) => void;
  onUpdateDisorder: (next: {
    disorderLevel?: number;
    mistakeCount?: number;
    pollutedRecords?: string[];
    statusNote?: string;
    repairReadingDelta?: Partial<ChapterTwoRepairReadings>;
    repairReadingSource?: string;
    repairReadingNote?: string;
  }) => void;
  onUseCrewAssist: (request: ChapterTwoCrewAssistRequest) => void;
  onExploreLocation: (locationId: ChapterTwoLocationId, payload?: ChapterTwoLocationCompletionPayload) => void;
  onAdvance: () => void;
  onComplete: () => void;
}

const streamNodeGlyphs: Record<ChapterTwoPlanetId, string[]> = {
  mother: ["LOG", "BASE", "01", "REST"],
  language: ["TXT", "AI?", "??", "01"]
};

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
      const timer = window.setTimeout(() => onSetSceneState("launch_sequence"), 1300);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "launch_sequence") {
      const timer = window.setTimeout(() => onSetSceneState("warp_travel"), 1650);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "warp_travel") {
      const timer = window.setTimeout(() => onSetSceneState("sector_view"), 1950);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "planet_descent") {
      const timer = window.setTimeout(() => onSetSceneState("planet_surface"), 1100);
      return () => window.clearTimeout(timer);
    }
  }, [currentStep, onSetSceneState, sceneState]);
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

const archiveCategories = ["已知事实", "合理推测", "仍需确认"] as const;

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

const systemReadingItems: Array<{ key: keyof ChapterTwoSystemReadings; label: string; mode: "high" | "low" }> = [
  { key: "languageStability", label: "语言稳定度", mode: "high" },
  { key: "evidenceChainIntegrity", label: "证据链完整度", mode: "high" },
  { key: "echoInterferenceResidue", label: "回声干扰残留", mode: "low" },
  { key: "blackBoxSyncRate", label: "黑匣同步率", mode: "high" }
];

function BlackboxEchoTrial({
  disorderLevel,
  mistakeCount,
  activeCrew,
  crewAbility,
  crewAssistRecord,
  onDisorderChange,
  onUseCrewAssist,
  onOpened
}: {
  disorderLevel: number;
  mistakeCount: number;
  activeCrew: CrewMember | null;
  crewAbility: ChapterTwoCrewAbility | null;
  crewAssistRecord: ChapterTwoCrewAssistRecord | null;
  onDisorderChange: ChapterTwoMissionPanelProps["onUpdateDisorder"];
  onUseCrewAssist: ChapterTwoMissionPanelProps["onUseCrewAssist"];
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
  const [battleResult, setBattleResult] = useState("失序回声想替你回答。");

  const gateCompletedCount = completedPhases.filter((phase) => phase !== "final-reflection").length;
  const visibleDisorderLevel = Math.max(disorderLevel, 4 - gateCompletedCount);
  const localBlackboxReadings: ChapterTwoSystemReadings = {
    languageStability: Math.max(0, Math.min(100, 46 + gateCompletedCount * 10 - visibleDisorderLevel * 3)),
    evidenceChainIntegrity: Math.max(0, Math.min(100, 38 + (completedPhases.includes("archive") ? 20 : 0) + (completedPhases.includes("verification") ? 24 : 0))),
    echoInterferenceResidue: Math.max(0, Math.min(100, visibleDisorderLevel * 14 - gateCompletedCount * 4)),
    blackBoxSyncRate: Math.max(0, Math.min(100, gateCompletedCount * 18 + (completedPhases.includes("final-reflection") ? 10 : 0)))
  };
  const archiveScore = blackboxArchiveFragments.filter((fragment) => archiveChoices[fragment.id] === fragment.answer).length;
  const assembledPrompt = `${assembledPromptParts.object ?? "【对象】"}，请${assembledPromptParts.task ?? "【任务】"}，${assembledPromptParts.limit ?? "【限制】"}，最后${assembledPromptParts.format ?? "【输出形式】"}。`;
  const crewName = activeCrew?.name ?? "同行船员";
  const crewAssistHint = createChapterTwoCrewAssistHint({
    targetId: "blackbox-trial",
    ability: crewAbility,
    crewName,
    phase: currentPhase
  });

  const requestCrewAssist = () => {
    onUseCrewAssist({
      targetId: "blackbox-trial",
      targetName: "黑匣试炼",
      hint: crewAssistHint,
      crewId: activeCrew?.id ?? null,
      crewName,
      abilityKind: crewAbility?.kind
    });
  };

  useEffect(() => {
    if (currentPhase !== "restoring") {
      return;
    }

    const timer = window.setTimeout(onOpened, 2200);
    return () => window.clearTimeout(timer);
  }, [currentPhase, onOpened]);

  const completePhase = (
    phase: BlackboxPhase,
    nextPhase: BlackboxPhase,
    message: string,
    repairReadingDelta: Partial<ChapterTwoRepairReadings>,
    repairReadingNote: string
  ) => {
    setCompletedPhases((current) => (current.includes(phase) ? current : [...current, phase]));
    setBattleResult(message);
    onDisorderChange({
      disorderLevel: Math.max(0, visibleDisorderLevel - 1),
      pollutedRecords: [],
      statusNote: `黑匣试炼稳定：${message}`,
      repairReadingDelta,
      repairReadingSource: blackboxPhaseMeta.find((item) => item.id === phase)?.title ?? "黑匣最终理解确认",
      repairReadingNote
    });
    setCurrentPhase(nextPhase);
  };

  const raiseDisorder = (message: string) => {
    const nextDisorder = Math.min(6, visibleDisorderLevel + 1);
    setBattleResult(message);
    onDisorderChange({
      disorderLevel: nextDisorder,
      mistakeCount: mistakeCount + 1,
      pollutedRecords: [currentPhase],
      statusNote: message
    });
  };

  const renderPhaseStatus = () => (
    <div className="blackbox-echo-status" aria-label={`失序强度 ${visibleDisorderLevel}`}>
      <div>
        <span>失序强度</span>
        <strong>{visibleDisorderLevel}</strong>
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
            raiseDisorder("黑匣噪声升高：先把来源层级分开。");
            return;
          }
          completePhase(
            "archive",
            "delivery",
            "第一扇门稳定。",
            { evidenceIntegrity: 1, unknownMarking: 1 },
            "归档之门完成分层。"
          );
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
              raiseDisorder(`传递门噪声增加，还缺：${missing.map((key) => blackboxDeliveryLabels[key]).join("、")}。`);
              return;
            }
            completePhase(
              "delivery",
              "verification",
              "第二扇门稳定。",
              { goalClarity: 1, boundaryAwareness: 1 },
              "传递之门完成校准。"
            );
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
            raiseDisorder("失序回声变强：顺滑结论仍未拆开。");
            return;
          }
          completePhase(
            "verification",
            "expression",
            "第三扇门稳定。",
            { evidenceIntegrity: 1, unknownMarking: 1 },
            "求证之门完成校准。"
          );
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
            raiseDisorder("表达门仍不稳定：四个空还没有补齐。");
            return;
          }
          completePhase(
            "expression",
            "final-reflection",
            "第四扇门稳定。",
            { goalClarity: 1, boundaryAwareness: 1 },
            "表达之门完成校准。"
          );
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
            placeholder="写一句自己的判断，例如：它可以帮我整理，但不能替我决定。"
          />
        </label>
        <button
          type="button"
          className="blackbox-echo-primary"
          onClick={() => {
            if (chineseLength < 8 || !hasKeyword) {
              raiseDisorder("最终回声仍未消散：再说得更像你自己的想法一点。");
              return;
            }
            completePhase(
              "final-reflection",
              "opened",
              "判断权回来了。",
              { boundaryAwareness: 1 },
              "最终理解确认判断权回写主舰。"
            );
          }}
        >
          交还最终判断
        </button>
      </div>
    );
  };

  const renderOpened = () => (
    <div className="blackbox-echo-opened">
      <div className="blackbox-echo-opened__sync">
        语言黑匣已接入 · 判断权已回写
      </div>
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {systemReadingItems.map((item) => (
            <div key={item.key} className="rounded-[12px] border border-white/8 bg-white/[0.035] px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-white/54">{item.label}</span>
                <strong className={item.mode === "low" && localBlackboxReadings[item.key] <= 25 ? "text-emerald-100" : "text-cyan-50"}>
                  {localBlackboxReadings[item.key]}%
                </strong>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-cyan-200" style={{ width: `${localBlackboxReadings[item.key]}%` }} />
              </div>
            </div>
          ))}
        </div>
        {currentPhase !== "opened" && currentPhase !== "restoring" ? (
          <CrewAssistHintButton
            ability={crewAbility}
            crewName={crewName}
            targetName="黑匣试炼"
            hint={crewAssistHint}
            usedRecord={crewAssistRecord}
            onUse={requestCrewAssist}
          />
        ) : null}
        <div className="blackbox-echo-feedback">{battleResult}</div>
        {currentPhase === "intro" && (
          <div className="blackbox-echo-intro">
            <div className="soft-label text-[10px] text-amber-100/60">黑匣试炼：失序回声</div>
            <h2>它想替你回答。</h2>
            <p>四枚碎片已经在手。最后确认：帮助不能替代你。</p>
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

function LocationCompletedPanel({
  location,
  rewardClaim,
  onReturn
}: {
  location: NonNullable<ReturnType<typeof chapterTwoSurfaceLocations.find>>;
  rewardClaim: ChapterTwoLocationRewardClaim | null;
  onReturn: () => void;
}) {
  const rewards = rewardClaim?.rewards ?? [];
  const settlement = rewardClaim?.settlement ?? null;

  return (
    <div className="chapter-two-landmark-game chapter-two-landmark-game--complete">
      <div className="chapter-two-landmark-complete__summary">
        <span>地点已稳定</span>
        <strong>{location.discovery}</strong>
        <p>已获得：{location.fragmentName}</p>
      </div>
      <div className={`chapter-two-location-rewards ${rewards.length === 0 ? "chapter-two-location-rewards--empty" : ""}`} aria-label={`${location.name}回流清单`}>
        {rewards.length > 0 ? (
          rewards.map((reward) => (
            <div key={reward.id}>
              <span>{reward.label}</span>
              <p>{reward.detail}</p>
            </div>
          ))
        ) : (
          <div>
            <span>回流清单等待同步</span>
            <p>这处地点已稳定，奖励记录暂未写入；返回地表后再次查看会保留完成状态。</p>
          </div>
        )}
      </div>
      {settlement ? (
        <div className="mt-4 rounded-[18px] border border-cyan-200/14 bg-cyan-200/[0.06] p-4">
          <div className="soft-label text-[10px] text-cyan-100/55">主舰结算回报 / {settlement.sourceName}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {systemReadingItems.map((item) => {
              const value = settlement.readings[item.key];
              return (
                <div key={item.key} className="rounded-[14px] border border-white/8 bg-white/[0.035] px-3 py-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white/64">{item.label}</span>
                    <strong className={item.mode === "low" && value <= 25 ? "text-emerald-100" : "text-cyan-50"}>{value}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-cyan-200" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-1 text-xs leading-5 text-white/56">
            {settlement.reportLines.slice(0, 2).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        返回星球表面
      </button>
    </div>
  );
}

function LandmarkMiniGame({
  location,
  completed,
  rewardClaim,
  activeCrew,
  crewAbility,
  crewAssistRecord,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  onUseCrewAssist,
  onUpdateDisorder,
  onComplete,
  onReturn
}: {
  location: NonNullable<ReturnType<typeof chapterTwoSurfaceLocations.find>>;
  completed: boolean;
  rewardClaim: ChapterTwoLocationRewardClaim | null;
  activeCrew: CrewMember | null;
  crewAbility: ChapterTwoCrewAbility | null;
  crewAssistRecord: ChapterTwoCrewAssistRecord | null;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  onUseCrewAssist: ChapterTwoMissionPanelProps["onUseCrewAssist"];
  onUpdateDisorder: ChapterTwoMissionPanelProps["onUpdateDisorder"];
  onComplete: (payload?: ChapterTwoLocationCompletionPayload) => void;
  onReturn: () => void;
}) {
  const [loreChoice, setLoreChoice] = useState<string | null>(null);
  const [loreFeedback, setLoreFeedback] = useState<string | null>(null);
  const crewName = activeCrew?.name ?? "同行船员";
  const crewAssistHint = createChapterTwoCrewAssistHint({
    targetId: location.id,
    ability: crewAbility,
    crewName
  });
  const requestCrewAssist = () => {
    onUseCrewAssist({
      targetId: location.id,
      targetName: location.name,
      hint: crewAssistHint,
      crewId: activeCrew?.id ?? null,
      crewName,
      abilityKind: crewAbility?.kind
    });
  };

  if (completed) {
    return <LocationCompletedPanel location={location} rewardClaim={rewardClaim} onReturn={onReturn} />;
  }

  if (location.id === "evidence-well") {
    return (
      <EvidenceWellTrial
        fragmentName={location.fragmentName}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.id === "archive-tower") {
    return (
      <ArchiveTowerGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.id === "letter-port") {
    return (
      <LetterPortGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.id === "engraved-valley") {
    return (
      <EngravedValleyGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.id === "paper-corridor") {
    return (
      <PaperCorridorGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.role === "lore") {
    const loreCheck = location.loreCheck;
    const loreReady = Boolean(loreCheck && loreChoice === loreCheck.correctOptionId);

    return (
      <div className="chapter-two-landmark-game chapter-two-landmark-game--lore">
        <div className="chapter-two-landmark-game__head">
          <span>{location.challengeTitle}</span>
          <strong>{location.fragmentName}</strong>
        </div>
        <div className="chapter-two-lore-stack">
          {(location.loreLines ?? [location.detail]).map((line, index) => (
            <div key={line} className="chapter-two-lore-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{line}</p>
            </div>
          ))}
        </div>
        <CrewAssistHintButton
          ability={crewAbility}
          crewName={crewName}
          targetName={location.name}
          hint={crewAssistHint}
          usedRecord={crewAssistRecord}
          onUse={requestCrewAssist}
        />
        {loreCheck && (
          <div className="chapter-two-lore-check">
            <div className="soft-label text-[10px] text-cyan-100/52">导览确认</div>
            <p>{loreCheck.question}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {loreCheck.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setLoreChoice(option.id);
                    setLoreFeedback(option.explanation);
                  }}
                  className={loreChoice === option.id ? "is-selected" : ""}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {loreFeedback && (
              <div className={loreReady ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>
                {loreFeedback}
              </div>
            )}
          </div>
        )}
        <div className="chapter-two-landmark-game__footer">
          <span>{loreReady ? loreCheck?.success : loreCheck?.retry ?? "读完导览后，确认这处设施的作用。"}</span>
          <button
            type="button"
            disabled={!loreReady}
            onClick={() =>
              onComplete({
                repairReadingDelta:
                  location.id === "semantic-dispatch"
                    ? { goalClarity: 1 }
                    : location.id === "boundary-beacon"
                      ? { unknownMarking: 1, boundaryAwareness: 2 }
                      : undefined,
                repairReadingSource: location.name,
                repairReadingNote:
                  location.id === "semantic-dispatch"
                    ? "分流庭确认信息请求需要先拆清目标。"
                    : location.id === "boundary-beacon"
                      ? "边界灯标确认协助范围。"
                      : `${location.name}导览确认完成。`
              })
            }
          >
            写入星球职能图
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
  onSetSceneState,
  onFocusPlanet,
  onFocusLocation,
  onUpdateDisorder,
  onUseCrewAssist,
  onExploreLocation,
  onAdvance,
  onComplete
}: ChapterTwoMissionPanelProps) {
  useSceneAutopilot({
    currentStep: mission.currentStep,
    sceneState: mission.sceneState,
    onSetSceneState
  });

  const activeCrew = crewRoster.find((crew) => crew.id === mission.leadCrewId) ?? crewRoster[0] ?? null;
  const crewAbility = resolveChapterTwoCrewAbility(activeCrew);
  const getCrewAssistRecord = (targetId: ChapterTwoCrewAssistRequest["targetId"]) =>
    mission.crewAssistRecords.find((record) => record.targetId === targetId) ?? null;
  const focusedPlanet = chapterTwoPlanetNodes.find((planet) => planet.id === mission.focusedPlanetId) ?? null;
  const focusedLocation = chapterTwoSurfaceLocations.find((location) => location.id === mission.focusedLocationId) ?? null;
  const evidenceWellCompleted = mission.exploredLocationIds.includes(chapterTwoEvidenceFragmentLocationId);
  const blackboxFragmentCount = chapterTwoBlackboxFragmentLocationIds.filter((id) => mission.exploredLocationIds.includes(id)).length;
  const summaryLabel = chapterTwoSceneLabelMap[mission.sceneState];
  const landmarkLocations = chapterTwoSurfaceLocations.filter((location) => chapterTwoBlackboxFragmentLocationIds.includes(location.id));
  const blackboxLocation = chapterTwoSurfaceLocations.find((location) => location.id === "blackbox-vault") ?? null;
  const evidenceWellLocation = chapterTwoSurfaceLocations.find((location) => location.id === "evidence-well") ?? null;
  const scoutRevealLocation = (crewAbility?.kind === "scout" || mission.baseScanHints.length > 0) && !evidenceWellCompleted ? evidenceWellLocation : null;
  const blackBoxCompleted = Boolean(mission.outcome);
  const planetRestored = Boolean(mission.outcome);
  const [recentCompletedLocation, setRecentCompletedLocation] = useState<{
    id: ChapterTwoLocationId;
    name: string;
    detail: string;
  } | null>(null);
  const [blackboxReadyCue, setBlackboxReadyCue] = useState(false);
  const previousExploredLocationIdsRef = useRef(mission.exploredLocationIds);
  const previousBlackBoxUnlockedRef = useRef(mission.blackBoxUnlocked);

  const missionHint =
    mission.currentStep === "response"
      ? mission.blackBoxUnlocked
        ? "黑匣回应了你。"
        : evidenceWellCompleted
          ? "点亮四个文明地标。"
          : "证据回声井出现污染记录。"
      : "黑匣试炼正在进行：归档、传递、求证、表达会在同一处完成。";

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

  useEffect(() => {
    const previousExplored = new Set(previousExploredLocationIdsRef.current);
    const newlyExploredId = mission.exploredLocationIds.find((locationId) => !previousExplored.has(locationId));

    if (newlyExploredId) {
      const location = chapterTwoSurfaceLocations.find((item) => item.id === newlyExploredId);
      const detail =
        newlyExploredId === chapterTwoEvidenceFragmentLocationId
          ? "证据光路已回流"
          : chapterTwoBlackboxFragmentLocationIds.includes(newlyExploredId)
            ? "通向黑匣的光路更亮了"
            : "星球职能图已写入";

      setRecentCompletedLocation({
        id: newlyExploredId,
        name: location?.name ?? "言衡星地点",
        detail
      });
    }

    if (mission.blackBoxUnlocked && !previousBlackBoxUnlockedRef.current) {
      setBlackboxReadyCue(true);
    }

    previousExploredLocationIdsRef.current = mission.exploredLocationIds;
    previousBlackBoxUnlockedRef.current = mission.blackBoxUnlocked;
  }, [mission.blackBoxUnlocked, mission.exploredLocationIds]);

  useEffect(() => {
    if (mission.sceneState !== "planet_surface") {
      return;
    }

    const timers: number[] = [];

    if (recentCompletedLocation) {
      timers.push(window.setTimeout(() => setRecentCompletedLocation(null), 3000));
    }

    if (blackboxReadyCue) {
      timers.push(window.setTimeout(() => setBlackboxReadyCue(false), 3600));
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [blackboxReadyCue, mission.sceneState, recentCompletedLocation]);

  const renderResponseStage = () => {
    const previewingPlanet = mission.sceneState === "planet_preview" && Boolean(focusedPlanet);

    return (
      <section
        className={`chapter-two-world chapter-two-world--${mission.sceneState} ${
          mission.blackBoxUnlocked ? "chapter-two-world--blackbox-ready" : ""
        } ${blackboxReadyCue ? "chapter-two-world--blackbox-ready-new" : ""}`}
      >
        <div className="chapter-two-world__viewport">
          {(mission.sceneState === "ship_bridge" || mission.sceneState === "launch_sequence") && (
            <>
              <SceneImage
                imageUrl={chapterTwoSceneAssets.shipBridge.imageUrl}
                transform={mission.sceneState === "launch_sequence" ? "scale(1.08)" : "scale(1.04)"}
              />
              <div className="chapter-two-launch-overlay" aria-hidden="true" />
              <div className="chapter-two-launch-drive" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="chapter-two-launch-vector" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
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
              <div className="chapter-two-warp-rift" aria-hidden="true">
                <span />
                <span />
                <span />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="chapter-two-warp-flash" aria-hidden="true" />
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
                      style={{
                        left: `${planet.position.x}%`,
                        top: `${planet.position.y}%`,
                        "--stream-size": `${planet.size}px`
                      } as CSSProperties}
                      aria-label={`${planet.name} 信息流`}
                    >
                      <span className="chapter-two-stream-node__cloud" aria-hidden="true" />
                      <span className="chapter-two-stream-node__noise" aria-hidden="true" />
                      <span className="chapter-two-stream-node__bands" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="chapter-two-stream-node__glyphs" aria-hidden="true">
                        {streamNodeGlyphs[planet.id].map((glyph) => (
                          <i key={glyph}>{glyph}</i>
                        ))}
                      </span>
                      <span className="chapter-two-stream-node__signal" aria-hidden="true" />
                      <span className="chapter-two-stream-node__signal chapter-two-stream-node__signal--secondary" aria-hidden="true" />
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
                  <div className="mt-2 text-xs leading-5 text-white/58">
                    失序强度 {mission.disorderLevel}/6{mission.mistakeCount > 0 ? ` · 误触 ${mission.mistakeCount}` : ""}
                  </div>
                </div>
                <div
                  className="chapter-two-progress-stack"
                  aria-label={`证据碎片${evidenceWellCompleted ? "已回流" : "未回流"}；黑匣解锁碎片 ${blackboxFragmentCount}/${chapterTwoBlackboxFragmentLocationIds.length}`}
                >
                  <div className={`chapter-two-evidence-status ${evidenceWellCompleted ? "chapter-two-evidence-status--lit" : ""}`}>
                    <span>证据碎片</span>
                    <strong>{evidenceWellCompleted ? "已回流" : "待回流"}</strong>
                  </div>
                  <div>
                    <div
                      className="chapter-two-fragment-meter"
                      aria-label={`黑匣解锁碎片 ${blackboxFragmentCount}/${chapterTwoBlackboxFragmentLocationIds.length}，包含档案塔、漂浮信件港、刻字山谷、纸光回廊`}
                    >
                      {chapterTwoBlackboxFragmentLocationIds.map((id) => (
                        <span key={id} className={mission.exploredLocationIds.includes(id) ? "is-lit" : ""} />
                      ))}
                    </div>
                    <small>黑匣碎片 {blackboxFragmentCount}/{chapterTwoBlackboxFragmentLocationIds.length}</small>
                  </div>
                </div>
              </aside>
              {blackboxLocation && (
                <svg className="chapter-two-light-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {evidenceWellLocation ? (
                    <line
                      className={`chapter-two-light-path chapter-two-light-path--evidence ${evidenceWellCompleted ? "chapter-two-light-path--lit" : ""} ${
                        recentCompletedLocation?.id === chapterTwoEvidenceFragmentLocationId ? "chapter-two-light-path--just-lit" : ""
                      } ${blackboxReadyCue ? "chapter-two-light-path--blackbox-ready" : ""}`}
                      x1={evidenceWellLocation.position.x}
                      y1={evidenceWellLocation.position.y}
                      x2={blackboxLocation.position.x}
                      y2={blackboxLocation.position.y}
                    />
                  ) : null}
                  {landmarkLocations.map((location) => {
                    const explored = mission.exploredLocationIds.includes(location.id);
                    return (
                      <line
                        key={location.id}
                        className={`${explored ? "chapter-two-light-path chapter-two-light-path--main chapter-two-light-path--lit" : "chapter-two-light-path chapter-two-light-path--main"} ${
                          recentCompletedLocation?.id === location.id ? "chapter-two-light-path--just-lit" : ""
                        } ${blackboxReadyCue ? "chapter-two-light-path--blackbox-ready" : ""}`}
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
                      className={`chapter-two-location-hotspot chapter-two-location-hotspot--${location.size} chapter-two-location-hotspot--${location.id} ${
                        explored ? "chapter-two-location-hotspot--done" : ""
                      } ${locked ? "chapter-two-location-hotspot--locked" : ""} ${
                        isBlackBox && mission.blackBoxUnlocked ? "chapter-two-location-hotspot--blackbox" : ""
                      } ${
                        isBlackBox && blackBoxCompleted ? "chapter-two-location-hotspot--restored" : ""
                      } ${
                        recentCompletedLocation?.id === location.id ? "chapter-two-location-hotspot--just-completed" : ""
                      }`}
                      style={{ left: `${location.position.x}%`, top: `${location.position.y}%` }}
                      aria-label={`${location.name}，${locked ? "尚未响应" : explored ? "已修复" : location.challengeTitle}`}
                    >
                      <span className="chapter-two-location-hotspot__pulse" />
                      <strong>{location.name}</strong>
                    </button>
                  );
                })}
              </div>
              {scoutRevealLocation && (
                <button
                  type="button"
                  className="chapter-two-scout-reveal"
                  style={{
                    left: `${scoutRevealLocation.position.x + 5}%`,
                    top: `${scoutRevealLocation.position.y - 8}%`
                  }}
                  onClick={() => {
                    onFocusLocation(scoutRevealLocation.id);
                    onSetSceneState("location_focus");
                  }}
                >
                  <span>{mission.baseScanHints.length > 0 ? "基地扫描" : "侦察回波"}</span>
                  <strong>{mission.baseScanHints[0] ?? "井沿暗纹"}</strong>
                </button>
              )}
              {mission.baseEffectNotes.length > 0 && (
                <div className="chapter-two-base-effect-strip">
                  {mission.baseEffectNotes.slice(0, 3).map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
              )}
              {mission.baseScanHints.length > 0 && (
                <div className="chapter-two-base-scan-hints" aria-label="基地初始证据提示">
                  <span>初始证据提示</span>
                  {mission.baseScanHints.map((hint) => (
                    <strong key={hint}>{hint}</strong>
                  ))}
                </div>
              )}
              {mission.blackBoxUnlocked && (
                <div className="chapter-two-short-cue">
                  {blackboxReadyCue ? "四束信息光已汇聚，黑匣已响应。" : "黑匣回应了你。"}
                </div>
              )}
              {recentCompletedLocation && (
                <div className="chapter-two-completion-cue" aria-live="polite">
                  <span>地点稳定</span>
                  <strong>{recentCompletedLocation.name}</strong>
                  <small>{recentCompletedLocation.detail}</small>
                </div>
              )}
              {blackboxReadyCue && (
                <div className="chapter-two-blackbox-ready-cue" aria-live="polite">
                  <span>黑匣封存台</span>
                  <strong>四束信息光已汇聚</strong>
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
                  <div className="text-sm font-semibold text-white">
                    {focusedLocation.id === "paper-corridor" ? "异常事件" : focusedLocation.challengeTitle}
                  </div>
                  <p className="mt-2 text-xs leading-6 text-white/58">
                    {focusedLocation.id === "paper-corridor"
                      ? "纸光已经自行写出结论。先观察它哪里太顺，再让扫描给出修复线索。"
                      : focusedLocation.challengePrompt}
                  </p>
                </div>
              </aside>
              <div className="chapter-two-location-action chapter-two-location-action--game">
                <LandmarkMiniGame
                  key={focusedLocation.id}
                  location={focusedLocation}
                  completed={mission.exploredLocationIds.includes(focusedLocation.id)}
                  rewardClaim={mission.locationRewardClaims.find((claim) => claim.locationId === focusedLocation.id) ?? null}
                  activeCrew={activeCrew}
                  crewAbility={crewAbility}
                  crewAssistRecord={getCrewAssistRecord(focusedLocation.id)}
                  disorderLevel={mission.disorderLevel}
                  mistakeCount={mission.mistakeCount}
                  pollutedRecords={mission.pollutedRecords}
                  onUseCrewAssist={onUseCrewAssist}
                  onUpdateDisorder={onUpdateDisorder}
                  onComplete={(payload) => onExploreLocation(focusedLocation.id, payload)}
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
                <p className="mt-3 text-sm leading-7 text-white/64">四处文明地标已经全部接通，视角现在被强行拉向中央封存台。</p>
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
          disorderLevel={mission.disorderLevel}
          mistakeCount={mission.mistakeCount}
          activeCrew={activeCrew}
          crewAbility={crewAbility}
          crewAssistRecord={getCrewAssistRecord("blackbox-trial")}
          onDisorderChange={onUpdateDisorder}
          onUseCrewAssist={onUseCrewAssist}
          onOpened={onComplete}
        />
      </div>
    </section>
  );

  if (mission.currentStep === "response") {
    return renderResponseStage();
  }

  return renderAssignStage();
}
