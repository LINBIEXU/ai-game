"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const paperObservationLines = [
  "纸光回廊生成：言衡星一定已经完全恢复。",
  "生成理由：因为这段介绍写得很流畅。",
  "纸面语气：没有犹豫，没有停顿。",
  "现场证据：目前只接入文字遗迹、漂浮信件和档案塔记录。"
] as const;

const paperIssueChecks = [
  { id: "fluent-reason", text: "只用“写得流畅”当理由。", issue: true },
  { id: "absolute", text: "直接写“一定已经恢复”。", issue: true },
  { id: "unchecked", text: "现场记录还没有完全接入。", issue: true },
  { id: "not-poetic", text: "句子不够华丽。", issue: false }
] as const;

const paperRepairOptions = [
  {
    id: "stable",
    text: "请把这段顺滑结论降级成可复查短档：保留已接入记录，删去“一定”，语气清楚简短。",
    stable: true,
    stability: 94,
    reason: "纸光稳定：顺滑语气已降为可复查记录。"
  },
  {
    id: "fluent",
    text: "请写得更流畅，保留“一定已经恢复”的结论。",
    stable: false,
    stability: 38,
    reason: "流畅不等于可靠，回声继续残留。"
  },
  {
    id: "empty",
    text: "请说明言衡星很神秘，所以这段话值得相信。",
    stable: false,
    stability: 46,
    reason: "气氛不能替代复查。"
  }
] as const;

type PaperCorridorStage = "observe" | "judge" | "repair";

interface PaperCorridorGameProps {
  location: ChapterTwoLocationNode;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  crewAbility: ChapterTwoCrewAbility | null;
  activeCrew: CrewMember | null;
  crewAssistRecord: ChapterTwoCrewAssistRecord | null;
  crewAssistHint: string;
  onUseCrewAssist: () => void;
  onDisorderChange: LandmarkDisorderChange;
  onComplete: (payload?: ChapterTwoLocationCompletionPayload) => void;
  onReturn: () => void;
}

export function PaperCorridorGame({
  location,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  crewAbility,
  activeCrew,
  crewAssistRecord,
  crewAssistHint,
  onUseCrewAssist,
  onDisorderChange,
  onComplete,
  onReturn
}: PaperCorridorGameProps) {
  const [stage, setStage] = useState<PaperCorridorStage>("observe");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [repairChoice, setRepairChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const issueCount = paperIssueChecks.filter((item) => item.issue).length;
  const judgementStable =
    selectedIssues.length === issueCount && selectedIssues.every((id) => paperIssueChecks.find((item) => item.id === id)?.issue);
  const selectedRepair = paperRepairOptions.find((option) => option.id === repairChoice) ?? null;

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const toggleIssue = (id: string) => {
    setSelectedIssues((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
    setFeedback(null);
  };

  const runJudgement = () => {
    if (judgementStable) {
      setFeedback("纸光扫描稳定：流畅文字里的三处不稳暗纹已显形。");
      setStage("repair");
      return;
    }

    const disorderFeedback = raiseDisorder("paper-corridor-judge", "纸光回廊判断漏掉不稳暗纹，失序强度上升；仍可重新扫描。");
    setFeedback(`扫描未通过：表达是否可靠，不能只看它是否顺畅。${disorderFeedback}`);
  };

  const chooseRepair = (optionId: string) => {
    const option = paperRepairOptions.find((item) => item.id === optionId);
    setRepairChoice(optionId);

    if (!option) {
      return;
    }

    if (option.stable) {
      setFeedback(option.reason);
      return;
    }

    const disorderFeedback = raiseDisorder("paper-corridor-repair", "纸光回廊锁定了不稳表达，失序强度上升；仍可改选稳定指令。");
    setFeedback(`${option.reason}${disorderFeedback}`);
  };

  const renderObserveStage = () => (
    <>
      <div className="chapter-two-paper-console">
        <div className="chapter-two-rough-expression">
          “言衡星一定已经完全恢复，因为纸光回廊写得很流畅。”
        </div>
        <div className="chapter-two-output-grid">
          {paperObservationLines.map((line) => (
            <div key={line} className="chapter-two-output-card">
              <p>{line}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>观测这段流畅但可疑的输出，再扫描它哪里不稳。</span>
        <button type="button" onClick={() => setStage("judge")}>
          启动纸光扫描
        </button>
      </div>
    </>
  );

  const renderJudgeStage = () => (
    <>
      <div className="chapter-two-output-grid">
        {paperIssueChecks.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleIssue(item.id)}
            className={`chapter-two-output-card ${selectedIssues.includes(item.id) ? "is-selected" : ""}`}
          >
            <p>{item.text}</p>
            <strong>{selectedIssues.includes(item.id) ? "已标记" : "待判断"}</strong>
          </button>
        ))}
      </div>
      {feedback && <div className={judgementStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{feedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>标出三处让顺滑表达不可靠的问题。</span>
        <button type="button" disabled={selectedIssues.length < issueCount} onClick={runJudgement}>
          确认纸光判断
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      <div className="chapter-two-output-grid">
        {paperRepairOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => chooseRepair(option.id)}
            className={`chapter-two-output-card ${repairChoice === option.id ? "is-selected" : ""}`}
          >
            <p>{option.text}</p>
            <div className="chapter-two-output-card__meter">
              <span style={{ width: `${option.stability}%` }} />
            </div>
            <strong>语言稳定度 {option.stability}%</strong>
          </button>
        ))}
      </div>
      {feedback && <div className={selectedRepair?.stable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{feedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>{selectedRepair?.stable ? "稳定输出已锁定，纸光膜片可以回流。" : "选择一条把顺滑结论降为可复查记录的指令。"}</span>
        <button
          type="button"
          disabled={!selectedRepair?.stable}
          onClick={() =>
            onComplete({
              repairReadingDelta: {
                evidenceIntegrity: judgementStable ? 1 : 0,
                boundaryAwareness: selectedRepair?.stable ? 1 : 0
              },
              repairReadingSource: "纸光回廊",
              repairReadingNote: "纸光回廊把顺滑结论降为可复查记录。"
            })
          }
        >
          回流主舰
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-paper-game chapter-two-paper-game--${stage}`}>
      <div className="chapter-two-landmark-game__head">
        <span>{stage === "observe" ? "观测" : stage === "judge" ? "判断" : "修复"}</span>
        <strong>{location.fragmentName}</strong>
      </div>
      <CrewAssistHintButton
        ability={crewAbility}
        crewName={activeCrew?.name ?? "同行船员"}
        targetName={location.name}
        hint={crewAssistHint}
        usedRecord={crewAssistRecord}
        onUse={onUseCrewAssist}
      />
      {stage === "observe" && renderObserveStage()}
      {stage === "judge" && renderJudgeStage()}
      {stage === "repair" && renderRepairStage()}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        撤回导览层
      </button>
    </div>
  );
}
