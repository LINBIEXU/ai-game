"use client";

import { useEffect, useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const letterPortMoments = [
  {
    id: "pile",
    eyebrow: "外港 / 信堆边",
    title: "信件堆得像一场没下完的雪",
    scene: [
      "它们没有排队，也没有等待谁来考验你。",
      "你只是弯腰，随手捡起了最靠近脚边的一封。",
      "信封边角被海风磨白，收件人那一栏只剩一块空洞。"
    ],
    artifactTitle: "残信抬头",
    artifactLines: ["发件地：第七档案塔", "时间：逆熵前夜", "收件人：栏位损坏"],
    voice: "衡灯没有立刻说话，只把灯举低了一点，好让你看清纸面。",
    action: "读下去"
  },
  {
    id: "original",
    eyebrow: "残信 / 原文",
    title: "字写得很急，却没有乱",
    scene: [
      "如果这封信晚到，请先别担心。",
      "我今晚还在第七档案塔值班，孩子们给新星球取的名字已经存好了。",
      "系统可以帮我整理格式，但最后那句我想你们，还是想自己写。"
    ],
    artifactTitle: "原信留下的东西",
    artifactLines: ["发件地和时间可以确认", "收件人缺失", "情感来自写信的人，不来自整理系统"],
    voice: "衡灯轻声说：别急着替它完整，先听它缺了什么。",
    action: "继续读"
  },
  {
    id: "slip",
    eyebrow: "港口 / 时间错位",
    title: "纸面忽然亮了一下",
    scene: [
      "海港的光轨倒着流，远处的塔影像被水面揉开。",
      "你看见一个档案员坐在灯下，把最后一行写了又划掉。",
      "那不是影像回放，更像一小段没能送出去的夜晚。"
    ],
    artifactTitle: "错位读数",
    artifactLines: ["轨道波形受到未知信号扰动", "写信人身份不可确认", "只能保留看见的片段"],
    voice: "衡灯的声音隔着很远传来：抓住已知，别被光带走。",
    action: "稳住信纸"
  },
  {
    id: "draft",
    eyebrow: "自动整理草稿",
    title: "另一封信自己补得很完整",
    scene: [
      "港口系统生成了一份更顺的版本。",
      "它补出了收件人的名字，也替那个人写了告别原因。",
      "读起来没有破口，却像把真正写信的人从纸上擦掉了。"
    ],
    artifactTitle: "草稿问题",
    artifactLines: ["格式更完整", "缺失被当作内容补上", "顺滑不等于真实"],
    voice: "衡灯说：这就是危险的地方。它很会整理，也很会让空白看起来不像空白。",
    action: "回到港口"
  },
  {
    id: "return",
    eyebrow: "外港 / 现实回声",
    title: "风声回来了",
    scene: [
      "信纸还在你手里，港口的光轨重新向前流。",
      "那封信没有变完整，但它终于不再被错误的完整推着走。",
      "你知道下一步不是补名字，而是给每个字段找到该去的轨道。"
    ],
    artifactTitle: "待接轨字段",
    artifactLines: ["已知内容照录", "缺失未知保留", "允许整理与禁止补全分开"],
    voice: "衡灯把灯芯贴近光轨：现在，让这封信按真实的重量走。",
    action: "进入字段接线"
  }
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
  const [letterMomentIndex, setLetterMomentIndex] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, LetterTrackLaneId>>({});
  const [unstableLane, setUnstableLane] = useState<LetterFacilityPulse | null>(null);
  const [recentConnection, setRecentConnection] = useState<LetterRecentConnection | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentMoment = letterPortMoments[letterMomentIndex] ?? letterPortMoments[0];
  const isLastMoment = letterMomentIndex >= letterPortMoments.length - 1;
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

  const advanceLetterMoment = () => {
    if (isLastMoment) {
      setStage("operate");
      return;
    }

    setLetterMomentIndex((index) => Math.min(index + 1, letterPortMoments.length - 1));
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
      <div className={`chapter-two-letter-story chapter-two-letter-story--${currentMoment.id}`} aria-label="漂浮信件港残信观测">
        <div className="chapter-two-letter-story__rail" aria-hidden="true">
          {letterPortMoments.map((moment, index) => (
            <span key={moment.id} className={`${index === letterMomentIndex ? "is-active" : ""} ${index < letterMomentIndex ? "is-read" : ""}`} />
          ))}
        </div>
        <section className="chapter-two-letter-story__scene">
          <div className="chapter-two-letter-story__head">
            <span>{currentMoment.eyebrow}</span>
            <strong>{currentMoment.title}</strong>
          </div>
          <div className="chapter-two-letter-story__lines">
            {currentMoment.scene.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="chapter-two-letter-story__voice">
            <span>衡灯</span>
            <p>{currentMoment.voice}</p>
          </div>
        </section>
        <aside className="chapter-two-letter-story__artifact">
          <span>{currentMoment.artifactTitle}</span>
          {currentMoment.artifactLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </aside>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>{isLastMoment ? "残信已经回到现实。下一步，把字段接回正确光轨。" : "先读完这封信，不急着替它补完。"}</span>
        <button type="button" onClick={advanceLetterMoment}>
          {currentMoment.action}
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
        <div className="chapter-two-letter-receipt chapter-two-letter-receipt--wake">
          <span>醒</span>
          <p>你回到港口石阶时，衡灯的灯芯贴在你手边。它说你刚才像睡着了，但那封信一直没有松开。</p>
        </div>
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
