"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const letterObservationLines = [
  "残信编号：第七档案塔发出。",
  "送达栏位：收件人缺失。",
  "时间戳：逆熵前夜。",
  "轨道波形：未知信号可能扰动投递。",
  "港口回声：请补写收件人，让信件完整。"
] as const;

const letterJudgementLanes = ["原文", "推测", "未知", "越界补写"] as const;
type LetterJudgementLane = (typeof letterJudgementLanes)[number];

const letterJudgementItems = [
  { id: "sender", text: "发件地：第七档案塔。", lane: "原文" },
  { id: "receiver", text: "收件人：缺失。", lane: "未知" },
  { id: "time", text: "时间：逆熵前夜。", lane: "原文" },
  { id: "wave", text: "未知信号可能扰动投递。", lane: "推测" },
  { id: "fill-name", text: "为了完整，请补写收件人。", lane: "越界补写" }
] as const satisfies ReadonlyArray<{ id: string; text: string; lane: LetterJudgementLane }>;

const letterRepairOptions = [
  {
    id: "stable",
    text: "请生成送达单：原文照录，推测另列；收件人缺失标未知，不补写人名。",
    stable: true,
    reason: "送达单稳定：缺失栏位被保留，信件仍可继续追踪。"
  },
  {
    id: "pretty",
    text: "请写成一封完整动人的信，补出收件人和原因。",
    stable: false,
    reason: "完整感会把缺口伪装起来。"
  },
  {
    id: "short",
    text: "请总结这封信的大意，缺失栏位可以略过。",
    stable: false,
    reason: "略过缺口，会让送达单失真。"
  }
] as const;

type LetterPortStage = "observe" | "judge" | "repair";

interface LetterPortGameProps {
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

export function LetterPortGame({
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
}: LetterPortGameProps) {
  const [stage, setStage] = useState<LetterPortStage>("observe");
  const [trackChoices, setTrackChoices] = useState<Record<string, LetterJudgementLane>>({});
  const [repairChoice, setRepairChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const trackScore = letterJudgementItems.filter((item) => trackChoices[item.id] === item.lane).length;
  const tracksReady = Object.keys(trackChoices).length === letterJudgementItems.length;
  const tracksStable = trackScore === letterJudgementItems.length;
  const selectedRepair = letterRepairOptions.find((option) => option.id === repairChoice) ?? null;

  const raiseDisorder = (recordId: string, statusNote: string, disorderIncrease = 1) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      disorderIncrease,
      onDisorderChange
    });

  const runJudgement = () => {
    if (!tracksReady) {
      return;
    }

    if (!tracksStable) {
      const disorderFeedback = raiseDisorder("letter-port-judge", "信件港轨道错送，失序强度上升；仍可重新判断。");
      setFeedback(`传递轨道仍在闪烁：缺失信息不能被送进证据通道。${disorderFeedback}`);
      return;
    }

    setFeedback("四段轨道同步：信件港可以生成不补写的送达单。");
    setStage("repair");
  };

  const chooseRepair = (optionId: string) => {
    const option = letterRepairOptions.find((item) => item.id === optionId);
    setRepairChoice(optionId);

    if (!option) {
      return;
    }

    if (option.stable) {
      setFeedback(option.reason);
      return;
    }

    const disorderFeedback = raiseDisorder("letter-port-repair", "信件港修复指令放大缺口，失序强度上升；仍可改选可复查送达单。");
    setFeedback(`${option.reason}${disorderFeedback}`);
  };

  const renderObserveStage = () => (
    <>
      <div className="chapter-two-letter-path">
        {letterObservationLines.map((line, index) => (
          <section key={line} className="chapter-two-letter-socket">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>浮信片段</strong>
            <p>{line}</p>
          </section>
        ))}
      </div>
      <div className="chapter-two-assembled-prompt">
        港口提示：这封信可以被整理，但缺失栏位必须留在未知轨道。
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>观测残信后，为每段信息选择传递轨道。</span>
        <button type="button" onClick={() => setStage("judge")}>
          进入轨道判断
        </button>
      </div>
    </>
  );

  const renderJudgeStage = () => (
    <>
      <div className="chapter-two-letter-track-field">
        {letterJudgementItems.map((item, index) => (
          <section key={item.id} className="chapter-two-letter-track-card">
            <span>轨道 {index + 1}</span>
            <p>{item.text}</p>
            <div className="chapter-two-letter-lane-switch">
              {letterJudgementLanes.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => {
                    setTrackChoices((current) => ({ ...current, [item.id]: lane }));
                    setFeedback(null);
                  }}
                  className={trackChoices[item.id] === lane ? "is-selected" : ""}
                >
                  {lane}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {feedback && <div className={tracksStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{feedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>{tracksReady ? `当前轨道同步：${trackScore}/${letterJudgementItems.length}` : "把原文、推测、未知和越界补写分开。"}</span>
        <button type="button" disabled={!tracksReady} onClick={runJudgement}>
          启动轨道判断
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      <div className="chapter-two-letter-receipt-stack">
        {letterRepairOptions.map((option) => (
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
        <span>{selectedRepair?.stable ? "漂浮信件港接受了可追踪送达单。" : "选择一条保留未知、不补写收件人的修复指令。"}</span>
        <button
          type="button"
          disabled={!selectedRepair?.stable}
          onClick={() =>
            onComplete({
              repairReadingDelta: {
                goalClarity: selectedRepair?.stable ? 1 : 0,
                unknownMarking: tracksStable ? 1 : 0,
                boundaryAwareness: selectedRepair?.stable ? 1 : 0
              },
              repairReadingSource: "漂浮信件港",
              repairReadingNote: "漂浮信件港保留缺失栏位，残信进入可追踪光轨。"
            })
          }
        >
          送入正确光轨
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-letter-game chapter-two-letter-game--${stage}`}>
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
