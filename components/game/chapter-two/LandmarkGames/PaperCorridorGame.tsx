"use client";

import { useEffect, useState } from "react";

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

const paperCivilizationTrace = [
  "回廊墙面残留一段公共说明：它写得温柔、整齐、毫无停顿。",
  "旁边却有手写批注：越像已经结束，越要问有没有证据。",
  "纸光可以让表达变清楚，但不能让缺失自动消失。"
] as const;

const paperNoiseTypes = [
  { id: "unsupported", label: "无证据断言", hint: "直接给出结论，却没有来源支撑。" },
  { id: "guess-as-fact", label: "推测冒充事实", hint: "把可能性写成已经确认。" },
  { id: "missing-unknown", label: "未知缺失", hint: "缺口没有标未知，反而被略过或补写。" },
  { id: "format-drift", label: "格式跑偏", hint: "没有按可复查格式输出。" }
] as const;

type PaperNoiseTypeId = (typeof paperNoiseTypes)[number]["id"];

const paperTextSegments = [
  { id: "absolute", text: "言衡星已经完全恢复，所有系统都稳定运行。", issue: "unsupported" },
  { id: "source", text: "未知信号可能扰动投递，所以它就是逆熵打击的真正来源。", issue: "guess-as-fact" },
  { id: "receiver", text: "残信收件人可以直接补为前文明档案官。", issue: "missing-unknown" },
  { id: "format", text: "最后写成一段胜利赞歌，不必列出依据。", issue: "format-drift" },
  { id: "clean", text: "目前只接入档案塔、信件港和山谷读数。", issue: null }
] as const satisfies ReadonlyArray<{ id: string; text: string; issue: PaperNoiseTypeId | null }>;

type PaperCorridorStage = "observe" | "operate" | "repair";
type PaperFacilityPulse = { issueId: PaperNoiseTypeId; tick: number };
type PaperRecentMark = { segmentId: string; issueId: PaperNoiseTypeId; tick: number };

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
  const [activeLens, setActiveLens] = useState<PaperNoiseTypeId | null>(null);
  const [segmentMarks, setSegmentMarks] = useState<Partial<Record<string, PaperNoiseTypeId>>>({});
  const [unstableIssue, setUnstableIssue] = useState<PaperFacilityPulse | null>(null);
  const [recentMark, setRecentMark] = useState<PaperRecentMark | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const issueSegments = paperTextSegments.filter((segment) => segment.issue);
  const markedCount = Object.keys(segmentMarks).length;
  const scanStable =
    issueSegments.every((segment) => segmentMarks[segment.id] === segment.issue) &&
    paperTextSegments.filter((segment) => !segment.issue).every((segment) => !segmentMarks[segment.id]);
  const scanReady = issueSegments.every((segment) => Boolean(segmentMarks[segment.id]));

  useEffect(() => {
    if (!unstableIssue) {
      return;
    }

    const timer = window.setTimeout(() => setUnstableIssue(null), 1150);
    return () => window.clearTimeout(timer);
  }, [unstableIssue]);

  useEffect(() => {
    if (!recentMark) {
      return;
    }

    const timer = window.setTimeout(() => setRecentMark(null), 820);
    return () => window.clearTimeout(timer);
  }, [recentMark]);

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const triggerUnstableIssue = (issueId: PaperNoiseTypeId) => {
    setUnstableIssue({ issueId, tick: Date.now() });
  };

  const markSegment = (segmentId: string) => {
    if (!activeLens) {
      setFeedback("先选择一枚扫描镜，再照向纸光文本。");
      return;
    }

    setSegmentMarks((current) => ({ ...current, [segmentId]: activeLens }));
    setRecentMark({ segmentId, issueId: activeLens, tick: Date.now() });
    setFeedback(null);
  };

  const clearSegment = (segmentId: string) => {
    setSegmentMarks((current) => {
      const next = { ...current };
      delete next[segmentId];
      return next;
    });
    setFeedback(null);
  };

  const runScan = () => {
    if (!scanReady) {
      setFeedback("纸光里还有暗纹没有标出，顺滑文字仍会扩散。");
      return;
    }

    if (!scanStable) {
      const disorderFeedback = raiseDisorder("paper-corridor-scan", "纸光回廊幻光扩散，顺滑句子遮住了证据缺口；仍可重新扫描。");
      const firstWrongSegment = paperTextSegments.find((segment) =>
        segment.issue ? segmentMarks[segment.id] !== segment.issue : Boolean(segmentMarks[segment.id])
      );
      triggerUnstableIssue(
        firstWrongSegment
          ? segmentMarks[firstWrongSegment.id] ?? firstWrongSegment.issue ?? "unsupported"
          : "unsupported"
      );
      setFeedback(`扫描未通过：流畅不等于可靠，四种噪声需要分别标出。${disorderFeedback}`);
      return;
    }

    setFeedback("纸光扫描稳定：无证据断言、推测冒充事实、未知缺失和格式跑偏都已显形。");
    setStage("repair");
  };

  const renderPaperFacility = () => (
    <div
      className={`chapter-two-facility chapter-two-facility--paper ${stage === "repair" ? "is-repaired" : ""} ${unstableIssue ? "has-unstable" : ""}`}
      aria-label="纸光膜扫描污染层"
    >
      <div className="chapter-two-facility__title">
        <span>纸光膜</span>
        <strong>扫描污染层</strong>
      </div>
      <div className="chapter-two-paper-membrane">
        {paperNoiseTypes.map((noise) => {
          const linkedSegment = paperTextSegments.find((segment) => segment.issue === noise.id);
          const cleared = Boolean(linkedSegment && segmentMarks[linkedSegment.id] === noise.id);

          return (
            <div
              key={`${noise.id}-${unstableIssue?.issueId === noise.id ? unstableIssue.tick : "stable"}-${recentMark?.issueId === noise.id ? recentMark.tick : "idle"}`}
              className={`chapter-two-paper-stain ${cleared ? "is-cleared" : ""} ${unstableIssue?.issueId === noise.id ? "is-unstable" : ""} ${
                recentMark?.issueId === noise.id ? "is-receiving" : ""
              }`}
            >
              <i aria-hidden="true" />
              <span>{noise.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderObserveStage = () => (
    <>
      <div className="chapter-two-paper-console">
        <div className="chapter-two-story-trace chapter-two-story-trace--paper">
          <span>纸光膜旁注</span>
          {paperCivilizationTrace.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
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
        <span>观测这段流畅但可疑的输出，再用扫描镜标出暗纹。</span>
        <button type="button" onClick={() => setStage("operate")}>
          启动纸光扫描
        </button>
      </div>
    </>
  );

  const renderOperateStage = () => (
    <>
      {renderPaperFacility()}
      <div className="chapter-two-operation-console chapter-two-operation-console--paper" aria-label="纸光回廊操作链">
        <div className="chapter-two-operation-console__head">
          <span>操作链</span>
          <strong>{activeLens ? "照向句段" : scanReady ? "准备除噪" : "选择扫描镜"}</strong>
        </div>
        <div className="chapter-two-operation-steps" aria-hidden="true">
          <span className={activeLens || markedCount > 0 ? "is-complete" : "is-active"}>1 选扫描镜</span>
          <span className={activeLens ? "is-active" : markedCount > 0 ? "is-complete" : ""}>2 标句段</span>
          <span className={scanReady ? "is-active" : ""}>3 确认除噪</span>
        </div>
        <p>
          {activeLens
            ? `当前扫描镜：${paperNoiseTypes.find((noise) => noise.id === activeLens)?.label}`
            : scanReady
              ? "所有可疑句段都已标出，确认扫描后纸光膜会检查是否误标。"
              : "先选一种暗纹，再点文本中可疑的句段。"}
        </p>
      </div>
      <div className="chapter-two-paper-console">
        <div className="chapter-two-scan-lenses" aria-label="纸光扫描镜">
          {paperNoiseTypes.map((noise) => (
            <button
              key={noise.id}
              type="button"
              onClick={() => {
                setActiveLens(noise.id);
                setFeedback(null);
              }}
              className={activeLens === noise.id ? "is-selected" : ""}
            >
              <strong>{noise.label}</strong>
              <span>{noise.hint}</span>
            </button>
          ))}
        </div>
        <div className="chapter-two-text-scan" aria-label="待扫描纸光文本">
          {paperTextSegments.map((segment) => {
            const mark = paperNoiseTypes.find((noise) => noise.id === segmentMarks[segment.id]) ?? null;
            return (
              <div key={segment.id} className={`chapter-two-text-segment ${mark ? "is-marked" : ""} ${recentMark?.segmentId === segment.id ? "is-just-placed" : ""}`}>
                <button type="button" onClick={() => markSegment(segment.id)}>
                  <p>{segment.text}</p>
                  <strong>{mark?.label ?? "未标记"}</strong>
                </button>
                {mark ? (
                  <button type="button" onClick={() => clearSegment(segment.id)} className="chapter-two-text-segment__clear">
                    清除
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {feedback && (
        <div className={`${scanStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"} ${unstableIssue ? "chapter-two-feedback-pulse--unstable" : ""}`}>
          {feedback}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>{activeLens ? `当前扫描镜：${paperNoiseTypes.find((noise) => noise.id === activeLens)?.label}` : `已标记 ${markedCount}/${issueSegments.length} 处暗纹。`}</span>
        <button type="button" disabled={!scanReady} onClick={runScan}>
          确认除噪扫描
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      {renderPaperFacility()}
      <div className="chapter-two-paper-recovery">
        <strong>纸光膜片完成除噪。</strong>
        <p>稳定输出：目前已接入档案塔、信件港和山谷读数；仍缺失的来源标为未知；不要把推测写成事实；按可复查短档输出。</p>
      </div>
      <div className="chapter-two-output-grid">
        {paperNoiseTypes.map((noise) => (
          <div key={noise.id} className="chapter-two-output-card is-selected">
            <p>{noise.label}</p>
            <div className="chapter-two-output-card__meter">
              <span style={{ width: "92%" }} />
            </div>
            <strong>噪声已压低</strong>
          </div>
        ))}
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>稳定输出已锁定，纸光膜片可以回流。</span>
        <button
          type="button"
          onClick={() =>
            onComplete({
              evidenceLines: paperTextSegments.map((segment) => {
                const mark = paperNoiseTypes.find((noise) => noise.id === segmentMarks[segment.id]);
                return `${mark?.label ?? "可保留"}：${segment.text}`;
              }),
              repairReadingDelta: {
                goalClarity: 1,
                evidenceIntegrity: 1,
                unknownMarking: 1,
                boundaryAwareness: 1
              },
              repairReadingSource: "纸光回廊",
              repairReadingNote: "纸光回廊完成流畅文本扫描除噪：四类不稳表达被标出并压回复查层。"
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
