"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const valleyObservationLines = [
  "旧刻痕：对象是言衡星地表记录。",
  "旧刻痕：任务是整理成可回看档案。",
  "断层空格：可使用资料范围未刻明。",
  "新刻痕 A：请写得完整一点。",
  "新刻痕 B：输出样式未标。"
] as const;

const inscriptionClaimChecks = [
  { id: "vague-complete", text: "“写得完整一点。”", overreach: true },
  { id: "missing-source", text: "“可使用资料范围未刻明。”", overreach: true },
  { id: "missing-format", text: "“输出样式未标。”", overreach: true },
  { id: "object", text: "“对象是言衡星地表记录。”", overreach: false },
  { id: "task", text: "“任务是整理成可回看档案。”", overreach: false }
] as const;

const inscriptionRepairOptions = [
  {
    id: "stable",
    text: "请整理言衡星地表记录：对象=地表记录；语境=远征归档；边界=只用已回收资料；格式=三条短档案。",
    stable: true,
    reason: "可靠铭文稳定：目标、语境、边界和格式都已刻明。"
  },
  {
    id: "dramatic",
    text: "请把铭文写得更完整、更有气势。",
    stable: false,
    reason: "完整不是指令，山谷无法校准。"
  },
  {
    id: "avoid",
    text: "请随便整理成一段好看的话。",
    stable: false,
    reason: "缺少边界和格式，刻痕会漂移。"
  }
] as const;

type EngravedValleyStage = "observe" | "judge" | "repair";

interface EngravedValleyGameProps {
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

export function EngravedValleyGame({
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
}: EngravedValleyGameProps) {
  const [stage, setStage] = useState<EngravedValleyStage>("observe");
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [repairChoice, setRepairChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const overreachCount = inscriptionClaimChecks.filter((claim) => claim.overreach).length;
  const scanStable =
    selectedClaims.length === overreachCount &&
    selectedClaims.every((id) => inscriptionClaimChecks.find((claim) => claim.id === id)?.overreach);
  const selectedRepair = inscriptionRepairOptions.find((option) => option.id === repairChoice) ?? null;

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const toggleClaim = (id: string) => {
    setSelectedClaims((current) => (current.includes(id) ? current.filter((claimId) => claimId !== id) : [...current, id]));
    setFeedback(null);
  };

  const runJudgement = () => {
    if (scanStable) {
      setFeedback("铭文扫描稳定：三处缺口已标红。");
      setStage("repair");
      return;
    }

    const disorderFeedback = raiseDisorder("engraved-valley-judge", "刻字山谷缺口扫描误判，失序强度上升；仍可重新标记。");
    setFeedback(`扫描未通过：对象和任务已经刻明，不要把它们标红。${disorderFeedback}`);
  };

  const chooseRepair = (optionId: string) => {
    const option = inscriptionRepairOptions.find((item) => item.id === optionId);
    setRepairChoice(optionId);

    if (!option) {
      return;
    }

    if (option.stable) {
      setFeedback(option.reason);
      return;
    }

    const disorderFeedback = raiseDisorder("engraved-valley-repair", "刻字山谷修复铭文仍然模糊，失序强度上升；仍可改写。");
    setFeedback(`${option.reason}${disorderFeedback}`);
  };

  const renderObserveStage = () => (
    <>
      <div className="chapter-two-valley-record">
        刻字山谷保留目标、语境、边界和格式。新的刻痕看起来有气势，但缺了关键刻度。
      </div>
      <div className="chapter-two-rune-scanner">
        {valleyObservationLines.map((line) => (
          <div key={line} className="chapter-two-rune-slab">
            <span>现场刻痕</span>
            <strong>{line}</strong>
          </div>
        ))}
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>观测岩层后，标出让指令漂移的缺口。</span>
        <button type="button" onClick={() => setStage("judge")}>
          进入断言扫描
        </button>
      </div>
    </>
  );

  const renderJudgeStage = () => (
    <>
      <div className="chapter-two-rune-scanner">
        {inscriptionClaimChecks.map((claim) => (
          <button
            key={claim.id}
            type="button"
            onClick={() => toggleClaim(claim.id)}
            className={`chapter-two-rune-slab ${selectedClaims.includes(claim.id) ? "is-scanned" : ""}`}
          >
            <span>{selectedClaims.includes(claim.id) ? "已标红" : "待判断"}</span>
            <strong>{claim.text}</strong>
          </button>
        ))}
      </div>
      {feedback && <div className={scanStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{feedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>选择三处缺少目标、语境、边界或格式的刻痕。</span>
        <button type="button" disabled={selectedClaims.length < overreachCount} onClick={runJudgement}>
          启动断言扫描
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      <div className="chapter-two-chisel-field">
        {inscriptionRepairOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => chooseRepair(option.id)}
            className={`chapter-two-chisel-slab ${repairChoice === option.id ? "is-chiseled" : ""} ${option.stable ? "is-stable" : ""}`}
          >
            <span>{option.stable ? "稳定铭文" : "失序铭文"}</span>
            <p>{option.text}</p>
          </button>
        ))}
      </div>
      {feedback && <div className={selectedRepair?.stable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{feedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>{selectedRepair?.stable ? "可靠铭文已写入山谷。" : "选择一条四个刻度都清楚的修复铭文。"}</span>
        <button
          type="button"
          disabled={!selectedRepair?.stable}
          onClick={() =>
            onComplete({
              repairReadingDelta: {
                goalClarity: scanStable ? 2 : 1,
                boundaryAwareness: selectedRepair?.stable ? 2 : 1
              },
              repairReadingSource: "刻字山谷",
              repairReadingNote: "刻字山谷写入目标、语境、边界和格式清楚的可靠铭文。"
            })
          }
        >
          稳定可靠铭文
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-valley-game chapter-two-valley-game--${stage}`}>
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
