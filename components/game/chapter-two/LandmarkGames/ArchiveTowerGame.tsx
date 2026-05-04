"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import { archiveTowerRecoveredResources } from "@/lib/chapter-two-gameplay";
import type { ChapterTwoCrewAbility } from "@/types/game";

import { CrewAbilityHint } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const archiveFragments = [
  { id: "network", text: "星球网络曾经连接多个文明节点。", answer: "已知事实" },
  { id: "language", text: "语言星球负责保存和传递文明记录。", answer: "已知事实" },
  { id: "signal", text: "异常可能从一条未知深空信号开始扩散。", answer: "合理推测" },
  { id: "source", text: "逆熵打击的来源尚未确认。", answer: "仍需确认" },
  { id: "betrayal", text: "所有 AI 都背叛了前文明。", answer: "仍需确认" },
  { id: "rely", text: "前文明后来过度依赖 AI 替自己判断。", answer: "合理推测" }
] as const;

const archiveCategories = ["已知事实", "合理推测", "仍需确认"] as const;

const archiveSourceClues = [
  { id: "tower-line", text: "塔壁原句：言衡星负责保存和传递文明记录。", correct: true },
  { id: "unknown-source", text: "残卷标注：逆熵打击来源尚未确认。", correct: true },
  { id: "echo-claim", text: "失序回声断言：所有 AI 一定背叛了前文明。", correct: false },
  { id: "story-fill", text: "为了故事完整，补写攻击者来自黑匣深处。", correct: false }
] as const;

type ArchiveTowerStage = "sort" | "source" | "feedback" | "recover";

interface ArchiveTowerGameProps {
  location: ChapterTwoLocationNode;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  crewAbility: ChapterTwoCrewAbility | null;
  onDisorderChange: LandmarkDisorderChange;
  onComplete: () => void;
  onReturn: () => void;
}

export function ArchiveTowerGame({
  location,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  crewAbility,
  onDisorderChange,
  onComplete,
  onReturn
}: ArchiveTowerGameProps) {
  const [stage, setStage] = useState<ArchiveTowerStage>("sort");
  const [archiveChoices, setArchiveChoices] = useState<Record<string, string>>({});
  const [sourceChoices, setSourceChoices] = useState<string[]>([]);
  const [feedbackStable, setFeedbackStable] = useState<boolean | null>(null);
  const [statusNote, setStatusNote] = useState("档案塔正在等待归档分类。");

  const archiveScore = archiveFragments.filter((fragment) => archiveChoices[fragment.id] === fragment.answer).length;
  const allSorted = Object.keys(archiveChoices).length === archiveFragments.length;
  const sourceReady = sourceChoices.length === 2;
  const sourceStable = sourceChoices.every((id) => archiveSourceClues.find((clue) => clue.id === id)?.correct);
  const recordAssistActive = crewAbility?.kind === "record";
  const assistedSourceId = "tower-line";

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const toggleSource = (id: string) => {
    setSourceChoices((current) => {
      if (current.includes(id)) {
        return current.filter((choice) => choice !== id);
      }

      if (current.length >= 2) {
        return current;
      }

      return [...current, id];
    });
  };

  const runArchiveScan = () => {
    if (!allSorted) {
      return;
    }

    if (archiveScore < 5) {
      const disorderFeedback = raiseDisorder("archive-tower-sort", "档案塔归档仓混入错误分类，失序强度上升；仍可重新归档。");
      setStatusNote(`归档仓仍有污染：事实、推测和未知还混在一起。${disorderFeedback}`);
      return;
    }

    setStatusNote("归档仓稳定，来源校验台已开启。");
    setStage("source");
  };

  const runSourceScan = () => {
    if (!sourceReady) {
      return;
    }

    setFeedbackStable(sourceStable);
    setStatusNote(
      sourceStable
        ? "来源线接入成功，归档碎片开始脱离污染层。"
        : `来源线接入失败，漂亮断言不能替代证据。${raiseDisorder(
            "archive-tower-source",
            "档案塔来源线接错，失序强度上升；仍可重接来源线。"
          )}`
    );
    setStage("feedback");
  };

  const renderSortStage = () => (
    <>
      <div className="chapter-two-archive-sort-board">
        <div className="chapter-two-archive-record-list" aria-label="待归档记录">
          {archiveFragments.map((fragment) => (
            <div key={fragment.id} className="chapter-two-archive-record-tile">
              <p>{fragment.text}</p>
              <div>
                {archiveCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setArchiveChoices((current) => ({ ...current, [fragment.id]: category }));
                      setStatusNote("归档仓读数已更新。");
                    }}
                    className={archiveChoices[fragment.id] === category ? "is-selected" : ""}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="chapter-two-archive-column-grid" aria-label="归档仓状态">
          {archiveCategories.map((category) => {
            const storedFragments = archiveFragments.filter((fragment) => archiveChoices[fragment.id] === category);
            return (
              <section key={category} className="chapter-two-archive-column">
                <strong>{category}</strong>
                {storedFragments.length > 0 ? (
                  storedFragments.map((fragment) => <span key={fragment.id}>{fragment.text}</span>)
                ) : (
                  <em>待接入</em>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <div className={allSorted && archiveScore < 5 ? "chapter-two-soft-warning" : "chapter-two-soft-success"}>
        {statusNote} 当前稳定归档：{archiveScore}/{archiveFragments.length}
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>{allSorted ? "运行归档扫描，确认分类能否支撑来源校验。" : "先把六条记录送入对应归档仓。"}</span>
        <button type="button" disabled={!allSorted} onClick={runArchiveScan}>
          运行归档扫描
        </button>
      </div>
    </>
  );

  const renderSourceStage = () => (
    <>
      <div className="chapter-two-source-console">
        <div className="chapter-two-source-sockets">
          <span>{sourceChoices[0] ? archiveSourceClues.find((clue) => clue.id === sourceChoices[0])?.text : "来源接口 A"}</span>
          <span>{sourceChoices[1] ? archiveSourceClues.find((clue) => clue.id === sourceChoices[1])?.text : "来源接口 B"}</span>
        </div>
        <CrewAbilityHint ability={crewAbility} active={recordAssistActive}>
          {recordAssistActive ? (
            <p className="mt-1">额外来源标记：{crewAbility?.sourceMarker ?? "第七档案塔底层观测条 07-B"} 对应塔壁原句，需要自行接入接口。</p>
          ) : null}
        </CrewAbilityHint>
        <div className="chapter-two-source-clue-grid">
          {archiveSourceClues.map((clue) => (
            <button
              key={clue.id}
              type="button"
              onClick={() => toggleSource(clue.id)}
              className={`chapter-two-source-clue ${sourceChoices.includes(clue.id) ? "is-selected" : ""}`}
            >
              {clue.text}
              {recordAssistActive && clue.id === assistedSourceId ? <em> · 来源标记</em> : null}
            </button>
          ))}
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>{sourceReady ? "两条来源线已接入，可以运行校验。" : "接入两条真正可复查的来源线。"}</span>
        <button type="button" disabled={!sourceReady} onClick={runSourceScan}>
          运行来源校验
        </button>
      </div>
    </>
  );

  const renderFeedbackStage = () => (
    <>
      <div className={`chapter-two-archive-feedback ${feedbackStable ? "chapter-two-archive-feedback--stable" : "chapter-two-archive-feedback--unstable"}`}>
        <div className="soft-label text-[10px] text-cyan-100/52">档案塔反馈</div>
        <strong>{feedbackStable ? "归档光柱恢复稳定" : "来源校验被污染挡回"}</strong>
        <p>{feedbackStable ? "事实、推测和未知已分仓保存，主舰可以接收可复查归档。" : "来源线里混入了无依据断言。AI 可以推测，但不能把推测写成事实。"}</p>
        <div className="chapter-two-archive-feedback__result">
          <span>{feedbackStable ? "污染清除" : "污染未降"}</span>
          <span>{feedbackStable ? "归档碎片解锁" : "碎片继续封锁"}</span>
          <span>{feedbackStable ? "数据尘 +2" : "回流中止"}</span>
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>{statusNote}</span>
        <button type="button" onClick={() => (feedbackStable ? setStage("recover") : setStage("source"))}>
          {feedbackStable ? "回收归档碎片" : "重接来源线"}
        </button>
      </div>
    </>
  );

  const renderRecoverStage = () => (
    <>
      <div className="chapter-two-archive-recovery">
        <div className="chapter-two-archive-recovery__beam" aria-hidden="true" />
        <strong>归档碎片脱离污染层。</strong>
        <p>主舰接收一份可复查记录：事实、推测、未知分开保存；AI 只帮助整理，不替主舰做最后判断。</p>
        <div className="chapter-two-archive-resource-strip">
          {archiveTowerRecoveredResources.map((resource) => (
            <span key={resource.label}>
              <i>{resource.label}</i>
              <strong>{resource.value}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>碎片与净化数据已准备回流主舰。</span>
        <button type="button" onClick={onComplete}>
          回流主舰
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-archive-loop chapter-two-archive-loop--${stage}`}>
      <div className="chapter-two-landmark-game__head">
        <span>{stage === "sort" ? "归档分类" : stage === "source" ? "来源校验" : stage === "feedback" ? "世界反馈" : "碎片回收"}</span>
        <strong>{location.fragmentName}</strong>
      </div>
      {stage === "sort" && renderSortStage()}
      {stage === "source" && renderSourceStage()}
      {stage === "feedback" && renderFeedbackStage()}
      {stage === "recover" && renderRecoverStage()}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
    </div>
  );
}
