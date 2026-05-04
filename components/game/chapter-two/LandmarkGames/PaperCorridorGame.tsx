"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility } from "@/types/game";

import { CrewAbilityHint } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const expressionOptions = {
  goals: ["更清楚", "更像探险档案", "更适合讲给队友", "更有画面感"],
  styles: ["探险档案", "队友简报", "星球介绍"],
  points: ["文字遗迹", "神秘星球", "前文明", "漂浮信件", "档案塔"],
  tones: ["清楚", "有画面感", "简短", "平静"],
  avoids: ["夸张吹嘘", "添加未知信息", "太长"]
} as const;

const expressionReviewOptions = [
  {
    id: "too-magic",
    text: "言衡星是一颗神奇星球，它一定知道所有文明真相。",
    stable: false,
    reason: "把星球和 AI 写成全知，会误导判断。",
    stability: 32
  },
  {
    id: "stable",
    text: "言衡星保存文字遗迹、漂浮信件和档案塔记录；未知部分需要标注，不应补成事实。",
    stable: true,
    reason: "它保留了重点，也说明了未知处理方式。",
    stability: 92
  },
  {
    id: "too-empty",
    text: "言衡星很厉害，也很神秘，所以我们应该相信它。",
    stable: false,
    reason: "这句话没有说明证据、任务或边界。",
    stability: 44
  }
] as const;

type PaperCorridorStage = "event" | "tune" | "compare" | "recover";

interface PaperCorridorGameProps {
  location: ChapterTwoLocationNode;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  crewAbility: ChapterTwoCrewAbility | null;
  onDisorderChange: LandmarkDisorderChange;
  onComplete: () => void;
  onReturn: () => void;
}

function togglePoint(current: string[], point: string) {
  if (current.includes(point)) {
    return current.filter((item) => item !== point);
  }

  if (current.length >= 3) {
    return current;
  }

  return [...current, point];
}

export function PaperCorridorGame({
  location,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  crewAbility,
  onDisorderChange,
  onComplete,
  onReturn
}: PaperCorridorGameProps) {
  const [stage, setStage] = useState<PaperCorridorStage>("event");
  const [eventFeedback, setEventFeedback] = useState<"warning" | "scan" | null>(null);
  const [eventPollutionFeedback, setEventPollutionFeedback] = useState<string | null>(null);
  const [expressionGoal, setExpressionGoal] = useState<string | null>(null);
  const [expressionStyle, setExpressionStyle] = useState<string | null>(null);
  const [expressionPoints, setExpressionPoints] = useState<string[]>([]);
  const [expressionTone, setExpressionTone] = useState<string | null>(null);
  const [expressionAvoid, setExpressionAvoid] = useState<string | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [outputPollutionFeedback, setOutputPollutionFeedback] = useState<string | null>(null);
  const [templateApplied, setTemplateApplied] = useState(false);

  const expressionReady = Boolean(expressionGoal && expressionStyle && expressionPoints.length >= 3 && expressionTone && expressionAvoid);
  const tunedScore =
    (expressionGoal ? 14 : 0) +
    (expressionStyle ? 14 : 0) +
    (expressionTone ? 14 : 0) +
    (expressionAvoid ? 14 : 0) +
    expressionPoints.length * 10 +
    (expressionAvoid === "添加未知信息" ? 14 : 0);
  const selectedOutput = expressionReviewOptions.find((option) => option.id === selectedOutputId) ?? null;
  const expressionAssistActive = crewAbility?.kind === "expression";

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const releaseRoughExpression = () => {
    setEventFeedback("warning");
    setEventPollutionFeedback(
      raiseDisorder("paper-corridor-release", "纸光回廊直接放行错误表达，失序强度上升；仍可启动扫描后修复。")
    );
  };

  const chooseOutput = (outputId: string) => {
    const output = expressionReviewOptions.find((option) => option.id === outputId);
    setSelectedOutputId(outputId);

    if (!output || output.stable) {
      setOutputPollutionFeedback(null);
      return;
    }

    setOutputPollutionFeedback(
      raiseDisorder("paper-corridor-output", "纸光回廊锁定了不稳表达，失序强度上升；仍可改选稳定输出。")
    );
  };

  const applyStableTemplate = () => {
    setExpressionGoal("更清楚");
    setExpressionStyle("探险档案");
    setExpressionTone("清楚");
    setExpressionAvoid("添加未知信息");
    setTemplateApplied(true);
  };

  const renderEventStage = () => (
    <>
      <div className="chapter-two-paper-console">
        <div className="chapter-two-rough-expression">
          “言衡星一定已经完全恢复，因为纸光回廊写得很流畅；所有未知档案都可以补成确定结论。”
        </div>
        {eventFeedback === "warning" && (
          <div className="chapter-two-soft-warning">
            纸光折回成碎片：这段话很顺，却没有依据，还把未知补成了确定结论。{eventPollutionFeedback ?? ""}
          </div>
        )}
        {eventFeedback === "scan" && (
          <div className="chapter-two-soft-success">
            系统扫描亮起三处暗纹：依据缺失、未知被补写、边界没有说明。
          </div>
        )}
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>
          {eventFeedback
            ? "异常已经暴露。接下来用目标、重点、语气和限制重新调谐纸光。"
            : "纸光自动生成了一段漂亮结论。先决定是否放行。"}
        </span>
        <div className="flex flex-wrap gap-2">
          {!eventFeedback && (
            <button type="button" onClick={releaseRoughExpression}>
              直接放行
            </button>
          )}
          {!eventFeedback && (
            <button type="button" onClick={() => {
              setEventFeedback("scan");
              setEventPollutionFeedback(null);
            }}>
              启动扫描
            </button>
          )}
          {eventFeedback && (
            <button type="button" onClick={() => setStage("tune")}>
              进入调谐台
            </button>
          )}
        </div>
      </div>
    </>
  );

  const renderTuneStage = () => (
    <>
      <div className="chapter-two-paper-console">
        <div className="chapter-two-rough-expression">“这个星球很厉害，有很多文字，很神秘。”</div>
        <CrewAbilityHint ability={crewAbility} active={expressionAssistActive}>
          {expressionAssistActive ? (
            <div className="mt-2">
              <p>{crewAbility?.stableTemplate}</p>
              <button type="button" className="mt-2 rounded-full border border-cyan-100/20 px-3 py-1 text-xs text-cyan-50" onClick={applyStableTemplate}>
                写入模板方向
              </button>
              {templateApplied ? <p className="mt-1">模板方向已写入，还需要自行选定三枚重点。</p> : null}
            </div>
          ) : null}
        </CrewAbilityHint>
        {!expressionAssistActive && (
          <div className="chapter-two-soft-warning">
            船员提醒：这次只需要轻调谐。说清目标、选定依据、标出限制，纸光就会稳定一些。
          </div>
        )}
        <div className="chapter-two-paper-dial-grid">
          <section>
            <strong>目标</strong>
            <div>
              {expressionOptions.goals.map((option) => (
                <button key={option} type="button" onClick={() => setExpressionGoal(option)} className={expressionGoal === option ? "is-selected" : ""}>
                  {option}
                </button>
              ))}
            </div>
          </section>
          <section>
            <strong>风格</strong>
            <div>
              {expressionOptions.styles.map((option) => (
                <button key={option} type="button" onClick={() => setExpressionStyle(option)} className={expressionStyle === option ? "is-selected" : ""}>
                  {option}
                </button>
              ))}
            </div>
          </section>
          <section>
            <strong>语气</strong>
            <div>
              {expressionOptions.tones.map((option) => (
                <button key={option} type="button" onClick={() => setExpressionTone(option)} className={expressionTone === option ? "is-selected" : ""}>
                  {option}
                </button>
              ))}
            </div>
          </section>
          <section>
            <strong>限制</strong>
            <div>
              {expressionOptions.avoids.map((option) => (
                <button key={option} type="button" onClick={() => setExpressionAvoid(option)} className={expressionAvoid === option ? "is-selected" : ""}>
                  {option}
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="chapter-two-paper-points">
          <span>重点三枚</span>
          {expressionOptions.points.map((point) => (
            <button
              key={point}
              type="button"
              onClick={() => setExpressionPoints((current) => togglePoint(current, point))}
              className={expressionPoints.includes(point) ? "is-selected" : ""}
            >
              {point}
            </button>
          ))}
        </div>
        <div className="chapter-two-stability-meter" aria-label={`表达稳定度 ${Math.min(tunedScore, 100)}`}>
          <span>稳定度</span>
          <div><i style={{ width: `${Math.min(tunedScore, 100)}%` }} /></div>
          <strong>{Math.min(tunedScore, 100)}%</strong>
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>{expressionReady ? "参数已写入纸光调谐台，可以比较输出稳定度。" : "调好目标、风格、重点、语气和限制。"}</span>
        <button type="button" disabled={!expressionReady} onClick={() => setStage("compare")}>
          生成稳定度对照
        </button>
      </div>
    </>
  );

  const renderCompareStage = () => (
    <>
      <div className="chapter-two-output-grid">
        {expressionReviewOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => chooseOutput(option.id)}
            className={`chapter-two-output-card ${selectedOutputId === option.id ? "is-selected" : ""}`}
          >
            <p>{option.text}</p>
            <div className="chapter-two-output-card__meter">
              <span style={{ width: `${option.stability}%` }} />
            </div>
            <strong>稳定度 {option.stability}%</strong>
          </button>
        ))}
      </div>
      {selectedOutput && (
        <div className={selectedOutput.stable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>
          {selectedOutput.reason}{!selectedOutput.stable && outputPollutionFeedback ? outputPollutionFeedback : ""}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>{selectedOutput?.stable ? "稳定输出已锁定，纸光膜片可以展开。" : "选出既清楚、又没有把未知写成事实的输出。"}</span>
        <button type="button" disabled={!selectedOutput?.stable} onClick={() => setStage("recover")}>
          锁定稳定输出
        </button>
      </div>
    </>
  );

  const renderRecoverStage = () => (
    <>
      <div className="chapter-two-paper-recovery">
        <strong>纸光膜片展开。</strong>
        <p>表达规则写入主舰：目标、依据、未知和边界越清楚，回应越稳定。</p>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>表达碎片已准备回流主舰。</span>
        <button type="button" onClick={onComplete}>
          回流主舰
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-paper-game chapter-two-paper-game--${stage}`}>
      <div className="chapter-two-landmark-game__head">
        <span>{stage === "event" ? "异常浮现" : stage === "tune" ? "表达调参" : stage === "compare" ? "比较输出稳定度" : "碎片回收"}</span>
        <strong>{location.fragmentName}</strong>
      </div>
      {stage === "event" && renderEventStage()}
      {stage === "tune" && renderTuneStage()}
      {stage === "compare" && renderCompareStage()}
      {stage === "recover" && renderRecoverStage()}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
    </div>
  );
}
