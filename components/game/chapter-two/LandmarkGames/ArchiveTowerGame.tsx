"use client";

import { useEffect, useState } from "react";

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

const archiveCivilizationTraces = [
  {
    title: "档案官便签",
    text: "“我把孩子们给星球取的名字都存进塔里。名字不是事实，但它们会提醒我们为什么要保存事实。”"
  },
  {
    title: "塔底划痕",
    text: "最后一班档案员没有删掉空白栏，只在旁边写下：这里还不知道。"
  }
] as const;

const archiveClassificationSlots = [
  { id: "confirmed", label: "已证实", hint: "能连回塔壁原句或残卷记录。" },
  { id: "inferred", label: "合理推测", hint: "只说明可能性，不能写成事实。" },
  { id: "unknown", label: "必须未知", hint: "资料缺页或来源未确认。" },
  { id: "forbidden", label: "禁止写入", hint: "没有来源，还会替事实下结论。" }
] as const;

type ArchiveSlotId = (typeof archiveClassificationSlots)[number]["id"];

const archiveFragments = [
  { id: "language-duty", text: "言衡星负责保存和传递文明记录。", answer: "confirmed" },
  { id: "network", text: "星球网络曾经连接多个文明节点。", answer: "confirmed" },
  { id: "deep-signal", text: "异常可能从一条未知深空信号开始扩散。", answer: "inferred" },
  { id: "strike-source", text: "逆熵打击的来源尚未确认。", answer: "unknown" },
  { id: "betrayal", text: "所有 AI 都背叛了前文明。", answer: "forbidden" },
  { id: "perfect-cause", text: "前文明失败的真正原因已经被塔壁完全证明。", answer: "forbidden" }
] as const satisfies ReadonlyArray<{ id: string; text: string; answer: ArchiveSlotId }>;

type ArchiveTowerStage = "observe" | "operate" | "repair";
type ArchiveFacilityPulse = { slotId: ArchiveSlotId; tick: number };
type ArchiveRecentPlacement = { fragmentId: string; slotId: ArchiveSlotId; tick: number };

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
  hideReturn?: boolean;
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
  onReturn,
  hideReturn = false
}: ArchiveTowerGameProps) {
  const [stage, setStage] = useState<ArchiveTowerStage>("observe");
  const [selectedFragmentId, setSelectedFragmentId] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, ArchiveSlotId>>({});
  const [unstableLayer, setUnstableLayer] = useState<ArchiveFacilityPulse | null>(null);
  const [recentPlacement, setRecentPlacement] = useState<ArchiveRecentPlacement | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const assignedCount = Object.keys(placements).length;
  const classificationScore = archiveFragments.filter((fragment) => placements[fragment.id] === fragment.answer).length;
  const classificationReady = assignedCount === archiveFragments.length;
  const classificationStable = classificationScore === archiveFragments.length;
  const selectedFragment = archiveFragments.find((fragment) => fragment.id === selectedFragmentId) ?? null;

  useEffect(() => {
    if (!unstableLayer) {
      return;
    }

    const timer = window.setTimeout(() => setUnstableLayer(null), 1200);
    return () => window.clearTimeout(timer);
  }, [unstableLayer]);

  useEffect(() => {
    if (!recentPlacement) {
      return;
    }

    const timer = window.setTimeout(() => setRecentPlacement(null), 820);
    return () => window.clearTimeout(timer);
  }, [recentPlacement]);

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const triggerUnstableLayer = (slotId: ArchiveSlotId) => {
    setUnstableLayer({ slotId, tick: Date.now() });
  };

  const placeSelectedFragment = (slotId: ArchiveSlotId) => {
    if (!selectedFragmentId) {
      setFeedback("先点亮一枚档案碎片，再把它送入四槽之一。");
      return;
    }

    setPlacements((current) => ({ ...current, [selectedFragmentId]: slotId }));
    setRecentPlacement({ fragmentId: selectedFragmentId, slotId, tick: Date.now() });
    setSelectedFragmentId(null);
    setFeedback(null);
  };

  const runClassification = () => {
    if (!classificationReady) {
      setFeedback("档案塔还有碎片悬浮在塔身外，四槽不能闭合。");
      return;
    }

    if (!classificationStable) {
      const disorderFeedback = raiseDisorder("archive-tower-four-slot", "档案塔四槽错位，污染墨斑沿塔壁扩散；仍可重新归档。");
      const firstWrongFragment = archiveFragments.find((fragment) => placements[fragment.id] !== fragment.answer);
      triggerUnstableLayer(firstWrongFragment ? placements[firstWrongFragment.id] ?? firstWrongFragment.answer : "unknown");
      setFeedback(`四槽归档未稳定：事实、推测、未知和禁写层仍有混线。${disorderFeedback}`);
      return;
    }

    setFeedback("四槽归档稳定：文字能延长记忆，但没有来源的断言没有进入正文。");
    setStage("repair");
  };

  const renderArchiveFacility = () => (
    <div
      className={`chapter-two-facility chapter-two-facility--archive ${stage === "repair" ? "is-repaired" : ""} ${unstableLayer ? "has-unstable" : ""}`}
      aria-label="档案塔截面四层光槽"
    >
      <div className="chapter-two-facility__title">
        <span>档案塔截面</span>
        <strong>四层光槽</strong>
      </div>
      <div className="chapter-two-archive-tower-section">
        {archiveClassificationSlots.map((slot) => {
          const expectedCount = archiveFragments.filter((fragment) => fragment.answer === slot.id).length;
          const correctCount = archiveFragments.filter((fragment) => fragment.answer === slot.id && placements[fragment.id] === slot.id).length;
          const assignedToSlot = archiveFragments.filter((fragment) => placements[fragment.id] === slot.id).length;
          const layerGlow = Math.min(1, 0.26 + correctCount * 0.26);

          return (
            <div
              key={`${slot.id}-${unstableLayer?.slotId === slot.id ? unstableLayer.tick : "stable"}-${recentPlacement?.slotId === slot.id ? recentPlacement.tick : "idle"}`}
              className={`chapter-two-archive-tower-layer ${correctCount > 0 ? "is-lit" : ""} ${correctCount === expectedCount ? "is-complete" : ""} ${
                unstableLayer?.slotId === slot.id ? "is-unstable" : ""
              } ${recentPlacement?.slotId === slot.id ? "is-receiving" : ""}`}
              style={{ opacity: layerGlow }}
            >
              <i aria-hidden="true" />
              <span>{slot.label}</span>
              <em>{correctCount}/{expectedCount} 稳定 · {assignedToSlot} 入槽</em>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderObserveStage = () => (
    <>
      <div className="chapter-two-archive-recovery">
        <div className="chapter-two-archive-recovery__beam" aria-hidden="true" />
        <strong>现场记录浮出塔壁。</strong>
        <p>这份记录混着塔壁原句、旁注、缺页和失序回声。修复前，主舰不能让无来源文字替事实作证。</p>
      </div>
      <div className="chapter-two-story-trace-grid" aria-label="档案塔前文明痕迹">
        {archiveCivilizationTraces.map((trace) => (
          <section key={trace.title} className="chapter-two-story-trace">
            <span>{trace.title}</span>
            <p>{trace.text}</p>
          </section>
        ))}
      </div>
      <div className="chapter-two-archive-record-list" aria-label="档案塔现场记录">
        {archiveObservationLines.map((line) => (
          <div key={line} className="chapter-two-archive-record-tile">
            <p>{line}</p>
          </div>
        ))}
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>先观测记录，再把散落碎片送入四个归档槽。</span>
        <button type="button" onClick={() => setStage("operate")}>
          进入四槽归档
        </button>
      </div>
    </>
  );

  const renderOperateStage = () => (
    <>
      {renderArchiveFacility()}
      <div className="chapter-two-operation-console" aria-label="档案塔操作链">
        <div className="chapter-two-operation-console__head">
          <span>操作链</span>
          <strong>{selectedFragment ? "选择归档槽" : classificationReady ? "准备闭合" : "选择档案碎片"}</strong>
        </div>
        <div className="chapter-two-operation-steps" aria-hidden="true">
          <span className={selectedFragment || assignedCount > 0 ? "is-complete" : "is-active"}>1 选碎片</span>
          <span className={selectedFragment ? "is-active" : assignedCount > 0 ? "is-complete" : ""}>2 入光槽</span>
          <span className={classificationReady ? "is-active" : ""}>3 闭合四层</span>
        </div>
        <p>
          {selectedFragment
            ? `手中碎片：${selectedFragment.text}`
            : classificationReady
              ? "所有碎片都已入槽，运行归档后塔身会检查四层是否稳定。"
              : "先点一枚漂浮碎片，再点右侧四层光槽。"}
        </p>
      </div>
      <div className="chapter-two-repair-board chapter-two-repair-board--archive">
        <div className="chapter-two-fragment-bank" aria-label="可归档碎片">
          {archiveFragments.map((fragment) => {
            const placedSlot = archiveClassificationSlots.find((slot) => slot.id === placements[fragment.id]) ?? null;
            return (
              <button
                key={fragment.id}
                type="button"
                onClick={() => {
                  setSelectedFragmentId(fragment.id);
                  setFeedback(null);
                }}
                className={`chapter-two-fragment-card ${selectedFragmentId === fragment.id ? "is-selected" : ""} ${placedSlot ? "is-placed" : ""} ${
                  recentPlacement?.fragmentId === fragment.id ? "is-just-placed" : ""
                }`}
              >
                <span>{placedSlot?.label ?? "待归档"}</span>
                <p>{fragment.text}</p>
              </button>
            );
          })}
        </div>
        <div className="chapter-two-slot-grid" aria-label="档案塔四槽">
          {archiveClassificationSlots.map((slot) => {
            const slottedFragments = archiveFragments.filter((fragment) => placements[fragment.id] === slot.id);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => placeSelectedFragment(slot.id)}
                className={`chapter-two-repair-slot chapter-two-repair-slot--${slot.id} ${selectedFragment ? "is-ready" : ""} ${
                  recentPlacement?.slotId === slot.id ? "is-receiving" : ""
                }`}
              >
                <strong>{slot.label}</strong>
                <small>{slot.hint}</small>
                <div>
                  {slottedFragments.length > 0 ? (
                    slottedFragments.map((fragment) => <span key={fragment.id}>{fragment.text}</span>)
                  ) : (
                    <em>{selectedFragment ? `接收：${selectedFragment.text}` : "等待碎片"}</em>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {feedback && (
        <div className={`${classificationStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"} ${unstableLayer ? "chapter-two-feedback-pulse--unstable" : ""}`}>
          {feedback}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>
          {selectedFragment
            ? `已选中：${selectedFragment.text}`
            : classificationReady
              ? `当前归档稳定度：${classificationScore}/${archiveFragments.length}`
              : `已归档 ${assignedCount}/${archiveFragments.length} 枚碎片。`}
        </span>
        <button type="button" disabled={!classificationReady} onClick={runClassification}>
          运行四槽归档
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      {renderArchiveFacility()}
      <div className="chapter-two-archive-recovery">
        <div className="chapter-two-archive-recovery__beam" aria-hidden="true" />
        <strong>归档光柱重新闭合。</strong>
        <p>已证实内容进入正文，推测留在旁注，缺失处封为未知，无来源回声被挡在塔外。</p>
        <div className="chapter-two-archive-resource-strip">
          {archiveClassificationSlots.map((slot) => (
            <span key={slot.id}>
              <i>{slot.label}</i>
              <strong>{archiveFragments.filter((fragment) => placements[fragment.id] === slot.id).length} 枚</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>档案塔接受了四槽修复结果。</span>
        <button
          type="button"
          onClick={() =>
            onComplete({
              evidenceLines: archiveFragments.map((fragment) => {
                const slot = archiveClassificationSlots.find((item) => item.id === placements[fragment.id]);
                return `${slot?.label ?? "未归档"}：${fragment.text}`;
              }),
              repairReadingDelta: {
                evidenceIntegrity: 2,
                unknownMarking: 1
              },
              repairReadingSource: "档案塔",
              repairReadingNote: "档案塔完成四槽归档：已证实、合理推测、必须未知和禁止写入分层保存。"
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
      {!hideReturn && (
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
          回到地表
        </button>
      )}
    </div>
  );
}
