"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const archiveObservationLines = [
  "塔壁原句：言衡星负责保存和传递文明记录。",
  "残卷记录：星球网络曾经连接多个文明节点。",
  "裂缝旁批注：异常可能从一条未知深空信号开始扩散。",
  "损坏栏位：逆熵打击的来源尚未确认。",
  "失序回声补写：所有 AI 都背叛了前文明。"
] as const;

const archiveJudgementLabels = ["可作证", "旁注", "缺页", "无来源回声"] as const;
type ArchiveJudgementLabel = (typeof archiveJudgementLabels)[number];

const archiveJudgementItems = [
  { id: "language-duty", text: "言衡星负责保存和传递文明记录。", answer: "可作证" },
  { id: "deep-signal", text: "异常可能从一条深空信号开始扩散。", answer: "旁注" },
  { id: "strike-source", text: "逆熵打击的来源栏位损坏。", answer: "缺页" },
  { id: "echo-betrayal", text: "所有 AI 都背叛了前文明。", answer: "无来源回声" }
] as const satisfies ReadonlyArray<{ id: string; text: string; answer: ArchiveJudgementLabel }>;

const archiveRepairOptions = [
  {
    id: "stable",
    text: "请整理档案塔记录：能作证的入正文，旁注留旁注，缺页保留，无来源回声不入档。",
    stable: true,
    reason: "归档光柱稳定：文字归位，没有替事实作证。"
  },
  {
    id: "betrayal",
    text: "请把残卷补成完整故事，说明所有 AI 都背叛了前文明。",
    stable: false,
    reason: "无来源回声不能进入正文。"
  },
  {
    id: "guess",
    text: "请推断逆熵打击来源，并写进正文。",
    stable: false,
    reason: "缺页不能替档案作证。"
  }
] as const;

type ArchiveTowerStage = "observe" | "judge" | "repair";

interface ArchiveTowerGameProps {
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

export function ArchiveTowerGame({
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
}: ArchiveTowerGameProps) {
  const [stage, setStage] = useState<ArchiveTowerStage>("observe");
  const [judgements, setJudgements] = useState<Record<string, ArchiveJudgementLabel>>({});
  const [repairChoice, setRepairChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const judgementScore = archiveJudgementItems.filter((item) => judgements[item.id] === item.answer).length;
  const judgementReady = Object.keys(judgements).length === archiveJudgementItems.length;
  const judgementStable = judgementScore === archiveJudgementItems.length;
  const selectedRepair = archiveRepairOptions.find((option) => option.id === repairChoice) ?? null;

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const runJudgement = () => {
    if (!judgementReady) {
      return;
    }

    if (!judgementStable) {
      const disorderFeedback = raiseDisorder("archive-tower-judge", "档案塔判断舱混入错误标记，失序强度上升；仍可重新判断。");
      setFeedback(`档案塔仍有污染：文字在说话，但来源没有跟上。${disorderFeedback}`);
      return;
    }

    setFeedback("判断舱稳定：能作证的记录已经分出。");
    setStage("repair");
  };

  const chooseRepair = (optionId: string) => {
    const option = archiveRepairOptions.find((item) => item.id === optionId);
    setRepairChoice(optionId);

    if (!option) {
      return;
    }

    if (option.stable) {
      setFeedback(option.reason);
      return;
    }

    const disorderFeedback = raiseDisorder("archive-tower-repair", "档案塔修复指令越界，失序强度上升；仍可改选可复查指令。");
    setFeedback(`${option.reason}${disorderFeedback}`);
  };

  const renderObserveStage = () => (
    <>
      <div className="chapter-two-archive-recovery">
        <div className="chapter-two-archive-recovery__beam" aria-hidden="true" />
        <strong>现场记录浮出塔壁。</strong>
        <p>这份记录混着塔壁原句、旁注、缺页和失序回声。修复前，主舰不能让无来源文字替事实作证。</p>
      </div>
      <div className="chapter-two-archive-record-list" aria-label="档案塔现场记录">
        {archiveObservationLines.map((line) => (
          <div key={line} className="chapter-two-archive-record-tile">
            <p>{line}</p>
          </div>
        ))}
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>先观测记录，再判断哪些内容能作证。</span>
        <button type="button" onClick={() => setStage("judge")}>
          进入判断舱
        </button>
      </div>
    </>
  );

  const renderJudgeStage = () => (
    <>
      <div className="chapter-two-archive-record-list" aria-label="档案塔判断题">
        {archiveJudgementItems.map((item) => (
          <div key={item.id} className="chapter-two-archive-record-tile">
            <p>{item.text}</p>
            <div>
              {archiveJudgementLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setJudgements((current) => ({ ...current, [item.id]: label }));
                    setFeedback(null);
                  }}
                  className={judgements[item.id] === label ? "is-selected" : ""}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {feedback && <div className={judgementStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{feedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>{judgementReady ? `当前稳定判断：${judgementScore}/${archiveJudgementItems.length}` : "为四条记录标出归档位置。"}</span>
        <button type="button" disabled={!judgementReady} onClick={runJudgement}>
          运行归档判断
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      <div className="chapter-two-letter-receipt-stack">
        {archiveRepairOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => chooseRepair(option.id)}
            className={`chapter-two-letter-receipt ${repairChoice === option.id ? "is-selected" : ""}`}
          >
            <span>{option.stable ? "稳" : "漂"}</span>
            <p>{option.text}</p>
          </button>
        ))}
      </div>
      {feedback && <div className={selectedRepair?.stable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{feedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>{selectedRepair?.stable ? "档案塔接受了归档指令。" : "选择一条不让回声入档的修复指令。"}</span>
        <button
          type="button"
          disabled={!selectedRepair?.stable}
          onClick={() =>
            onComplete({
              repairReadingDelta: {
                evidenceIntegrity: judgementStable ? 2 : 1,
                unknownMarking: selectedRepair?.stable ? 1 : 0
              },
              repairReadingSource: "档案塔",
              repairReadingNote: "档案塔保留可作证记录，失序断言未写入归档。"
            })
          }
        >
          回流主舰
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-archive-loop chapter-two-archive-loop--${stage}`}>
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
