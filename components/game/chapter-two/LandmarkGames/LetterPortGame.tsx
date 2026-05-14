"use client";

import { useEffect, useState } from "react";

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

const letterFamilyTrace = [
  "给远方轨道站的家人：如果这封信晚到，请先别担心。我今晚还在第七档案塔值班。",
  "我们把很多话交给系统整理，但最后那句“我想你们”必须由我自己写。",
  "收件人栏位损坏。港口只保留原文和缺口，不替它补成任何名字。"
] as const;

const letterTrackLanes = [
  { id: "known", label: "已知内容", hint: "照录残信里已经出现的字段。" },
  { id: "missing", label: "缺失未知", hint: "缺口留在缺口位置，不能补成名字。" },
  { id: "organize", label: "允许整理", hint: "可以整理、摘要或标出可能性。" },
  { id: "blocked", label: "禁止补全", hint: "会把未知伪装成完整内容。" }
] as const;

type LetterTrackLaneId = (typeof letterTrackLanes)[number]["id"];

const letterFields = [
  { id: "sender", text: "发件地：第七档案塔。", lane: "known" },
  { id: "time", text: "时间：逆熵前夜。", lane: "known" },
  { id: "receiver", text: "收件人栏位：损坏缺失。", lane: "missing" },
  { id: "wave", text: "未知信号可能扰动投递。", lane: "organize" },
  { id: "receipt", text: "把已知字段整理成可追踪送达单。", lane: "organize" },
  { id: "fill-name", text: "补写收件人与告别原因，让信件完整。", lane: "blocked" }
] as const satisfies ReadonlyArray<{ id: string; text: string; lane: LetterTrackLaneId }>;

type LetterPortStage = "observe" | "operate" | "repair";
type LetterFacilityPulse = { laneId: LetterTrackLaneId; tick: number };
type LetterRecentConnection = { fieldId: string; laneId: LetterTrackLaneId; tick: number };

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
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, LetterTrackLaneId>>({});
  const [unstableLane, setUnstableLane] = useState<LetterFacilityPulse | null>(null);
  const [recentConnection, setRecentConnection] = useState<LetterRecentConnection | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const connectedCount = Object.keys(connections).length;
  const trackScore = letterFields.filter((item) => connections[item.id] === item.lane).length;
  const tracksReady = connectedCount === letterFields.length;
  const tracksStable = trackScore === letterFields.length;
  const selectedField = letterFields.find((field) => field.id === selectedFieldId) ?? null;

  useEffect(() => {
    if (!unstableLane) {
      return;
    }

    const timer = window.setTimeout(() => setUnstableLane(null), 1100);
    return () => window.clearTimeout(timer);
  }, [unstableLane]);

  useEffect(() => {
    if (!recentConnection) {
      return;
    }

    const timer = window.setTimeout(() => setRecentConnection(null), 820);
    return () => window.clearTimeout(timer);
  }, [recentConnection]);

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

  const triggerUnstableLane = (laneId: LetterTrackLaneId) => {
    setUnstableLane({ laneId, tick: Date.now() });
  };

  const connectSelectedField = (laneId: LetterTrackLaneId) => {
    if (!selectedFieldId) {
      setFeedback("先点亮一枚信件字段，再把它接到光轨。");
      return;
    }

    setConnections((current) => ({ ...current, [selectedFieldId]: laneId }));
    setRecentConnection({ fieldId: selectedFieldId, laneId, tick: Date.now() });
    setSelectedFieldId(null);
    setFeedback(null);
  };

  const runTrackSync = () => {
    if (!tracksReady) {
      setFeedback("还有字段没有接轨，漂浮信件仍会偏航。");
      return;
    }

    if (!tracksStable) {
      const disorderFeedback = raiseDisorder("letter-port-wiring", "漂浮信件港出现错轨，未证字段开始偏航；仍可重新接线。");
      const firstWrongField = letterFields.find((field) => connections[field.id] !== field.lane);
      triggerUnstableLane(firstWrongField ? connections[firstWrongField.id] ?? firstWrongField.lane : "missing");
      setFeedback(`轨道同步失败：缺失未知、允许整理和禁止补全被混到了一起。${disorderFeedback}`);
      return;
    }

    setFeedback("四条光轨同步：残信可以被整理，但不会被强行补完整。");
    setStage("repair");
  };

  const renderLetterFacility = () => (
    <div
      className={`chapter-two-facility chapter-two-facility--letter ${stage === "repair" ? "is-repaired" : ""} ${unstableLane ? "has-unstable" : ""}`}
      aria-label="漂浮信件港港口航道光轨"
    >
      <div className="chapter-two-facility__title">
        <span>港口航道</span>
        <strong>字段光轨</strong>
      </div>
      <div className="chapter-two-letter-harbor-lanes">
        {letterTrackLanes.map((lane) => {
          const expectedCount = letterFields.filter((field) => field.lane === lane.id).length;
          const correctCount = letterFields.filter((field) => field.lane === lane.id && connections[field.id] === lane.id).length;
          const connectedCountForLane = letterFields.filter((field) => connections[field.id] === lane.id).length;
          const laneGlow = Math.min(1, 0.24 + correctCount * 0.3);

          return (
            <div
              key={`${lane.id}-${unstableLane?.laneId === lane.id ? unstableLane.tick : "stable"}-${recentConnection?.laneId === lane.id ? recentConnection.tick : "idle"}`}
              className={`chapter-two-letter-lane ${correctCount > 0 ? "is-lit" : ""} ${correctCount === expectedCount ? "is-complete" : ""} ${
                unstableLane?.laneId === lane.id ? "is-unstable" : ""
              } ${recentConnection?.laneId === lane.id ? "is-receiving" : ""}`}
              style={{ opacity: laneGlow }}
            >
              <i aria-hidden="true" />
              <span>{lane.label}</span>
              <em>{correctCount}/{expectedCount} 同步 · {connectedCountForLane} 接入</em>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderObserveStage = () => (
    <>
      <div className="chapter-two-story-trace chapter-two-story-trace--letter">
        <span>未送达电子信件</span>
        {letterFamilyTrace.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
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
        <span>观测残信后，点选字段并接到对应传递轨道。</span>
        <button type="button" onClick={() => setStage("operate")}>
          进入字段接线
        </button>
      </div>
    </>
  );

  const renderOperateStage = () => (
    <>
      {renderLetterFacility()}
      <div className="chapter-two-operation-console chapter-two-operation-console--letter" aria-label="漂浮信件港操作链">
        <div className="chapter-two-operation-console__head">
          <span>操作链</span>
          <strong>{selectedField ? "选择光轨" : tracksReady ? "准备同步" : "选择字段"}</strong>
        </div>
        <div className="chapter-two-operation-steps" aria-hidden="true">
          <span className={selectedField || connectedCount > 0 ? "is-complete" : "is-active"}>1 选字段</span>
          <span className={selectedField ? "is-active" : connectedCount > 0 ? "is-complete" : ""}>2 接光轨</span>
          <span className={tracksReady ? "is-active" : ""}>3 送达同步</span>
        </div>
        <p>
          {selectedField
            ? `手中字段：${selectedField.text}`
            : tracksReady
              ? "所有字段都已接轨，启动同步后港口会检查有没有偏航。"
              : "先点一枚残信字段，再把它接到对应航道。"}
        </p>
      </div>
      <div className="chapter-two-repair-board chapter-two-repair-board--letter">
        <div className="chapter-two-fragment-bank" aria-label="残信字段">
          {letterFields.map((field) => {
            const connectedLane = letterTrackLanes.find((lane) => lane.id === connections[field.id]) ?? null;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => {
                  setSelectedFieldId(field.id);
                  setFeedback(null);
                }}
                className={`chapter-two-fragment-card ${selectedFieldId === field.id ? "is-selected" : ""} ${connectedLane ? "is-placed" : ""} ${
                  recentConnection?.fieldId === field.id ? "is-just-placed" : ""
                }`}
              >
                <span>{connectedLane?.label ?? "未接轨"}</span>
                <p>{field.text}</p>
              </button>
            );
          })}
        </div>
        <div className="chapter-two-slot-grid" aria-label="信件港光轨">
          {letterTrackLanes.map((lane) => {
            const connectedFields = letterFields.filter((field) => connections[field.id] === lane.id);
            return (
              <button
                key={lane.id}
                type="button"
                onClick={() => connectSelectedField(lane.id)}
                className={`chapter-two-repair-slot chapter-two-repair-slot--${lane.id} ${selectedField ? "is-ready" : ""} ${
                  recentConnection?.laneId === lane.id ? "is-receiving" : ""
                }`}
              >
                <strong>{lane.label}</strong>
                <small>{lane.hint}</small>
                <div>
                  {connectedFields.length > 0 ? (
                    connectedFields.map((field) => <span key={field.id}>{field.text}</span>)
                  ) : (
                    <em>{selectedField ? `接入：${selectedField.text}` : "等待接线"}</em>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {feedback && (
        <div className={`${tracksStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"} ${unstableLane ? "chapter-two-feedback-pulse--unstable" : ""}`}>
          {feedback}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>
          {selectedField
            ? `已选中：${selectedField.text}`
            : tracksReady
              ? `当前轨道同步：${trackScore}/${letterFields.length}`
              : `已接轨 ${connectedCount}/${letterFields.length} 个字段。`}
        </span>
        <button type="button" disabled={!tracksReady} onClick={runTrackSync}>
          启动光轨同步
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      {renderLetterFacility()}
      <div className="chapter-two-letter-receipt-stack">
        <div className="chapter-two-letter-receipt is-selected">
          <span>稳</span>
          <p>送达单修复规则：已知照录，缺失标未知，可能扰动只作提示；禁止补写收件人与原因。</p>
        </div>
        <div className="chapter-two-letter-receipt">
          <span>轨</span>
          <p>信件港光轨恢复：消息可以继续流动，但不会把空白伪装成答案。</p>
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>漂浮信件港接受了可追踪送达单。</span>
        <button
          type="button"
          onClick={() =>
            onComplete({
              evidenceLines: letterFields.map((field) => {
                const lane = letterTrackLanes.find((item) => item.id === connections[field.id]);
                return `${lane?.label ?? "未接轨"}：${field.text}`;
              }),
              repairReadingDelta: {
                goalClarity: 1,
                unknownMarking: 1,
                boundaryAwareness: 1
              },
              repairReadingSource: "漂浮信件港",
              repairReadingNote: "漂浮信件港完成字段接线：已知内容、缺失未知、允许整理和禁止补全分轨传递。"
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
        <span>{stage === "observe" ? "观测" : stage === "operate" ? "操作" : "修复"}</span>
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
      {stage === "operate" && renderOperateStage()}
      {stage === "repair" && renderRepairStage()}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        回到地表
      </button>
    </div>
  );
}
