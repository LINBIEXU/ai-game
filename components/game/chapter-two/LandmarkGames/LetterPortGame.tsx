"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility } from "@/types/game";

import { CrewAbilityHint } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const letterModules = {
  object: ["这段文明记录", "这封残缺信件", "这个星球描述"],
  task: ["整理成三点摘要", "找出最重要的信息", "改写得更清楚"],
  limit: ["不要添加没有出现的信息", "不确定的地方请标出来", "保留原来的核心意思"],
  format: ["用三条项目符号", "用一段简短说明", "分成“已知 / 未知 / 推测”"]
} as const;

const letterModuleLabels: Record<keyof typeof letterModules, string> = {
  object: "对象",
  task: "任务",
  limit: "限制",
  format: "输出形式"
};

const letterMissingChecks = [
  { id: "sender", text: "发件地：第七档案塔。", lane: "可确认" },
  { id: "receiver", text: "收件人：未知。", lane: "未知" },
  { id: "night", text: "时间：逆熵前夜。", lane: "可确认" },
  { id: "cause", text: "真正原因：未知信号造成。", lane: "推测" }
] as const;

const letterMissingLanes = ["可确认", "推测", "未知"] as const;

const letterReceipts = [
  {
    id: "stable",
    text: "输出：按“可确认 / 推测 / 未知”三栏整理；缺失收件人保持未知；不补写结论。",
    stable: true,
    reason: "这张送达单保留了缺口，也让结果方便检查。"
  },
  {
    id: "pretty",
    text: "输出：写成一封完整动人的信，让读者相信它一定发生过。",
    stable: false,
    reason: "好看不等于可靠，它会诱导补写未知内容。"
  },
  {
    id: "short",
    text: "输出：简单总结一下，不用列出依据。",
    stable: false,
    reason: "没有依据层，主舰和同伴都难以复查。"
  }
] as const;

type LetterPortStage = "path" | "repair" | "receipt";

interface LetterPortGameProps {
  location: ChapterTwoLocationNode;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  crewAbility: ChapterTwoCrewAbility | null;
  onDisorderChange: LandmarkDisorderChange;
  onComplete: () => void;
  onReturn: () => void;
}

export function LetterPortGame({
  location,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  crewAbility,
  onDisorderChange,
  onComplete,
  onReturn
}: LetterPortGameProps) {
  const [stage, setStage] = useState<LetterPortStage>("path");
  const [letterChoices, setLetterChoices] = useState<Partial<Record<keyof typeof letterModules, string>>>({});
  const [trackChoices, setTrackChoices] = useState<Record<string, string>>({});
  const [repairFeedback, setRepairFeedback] = useState<string | null>(null);
  const [receiptChoice, setReceiptChoice] = useState<string | null>(null);
  const [receiptPollutionFeedback, setReceiptPollutionFeedback] = useState<string | null>(null);
  const [repairAssistUsed, setRepairAssistUsed] = useState(false);

  const assembledPrompt = `${letterChoices.object ?? "【对象】"}，请${letterChoices.task ?? "【任务】"}，${letterChoices.limit ?? "【限制】"}，最后${letterChoices.format ?? "【输出形式】"}。`;
  const letterReady = Boolean(letterChoices.object && letterChoices.task && letterChoices.limit && letterChoices.format);
  const trackScore = letterMissingChecks.filter((item) => trackChoices[item.id] === item.lane).length;
  const tracksReady = Object.keys(trackChoices).length === letterMissingChecks.length;
  const selectedReceipt = letterReceipts.find((receipt) => receipt.id === receiptChoice) ?? null;
  const repairAssistActive = crewAbility?.kind === "repair";

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

  const runTrackRepair = () => {
    if (!tracksReady) {
      return;
    }

    if (trackScore < letterMissingChecks.length) {
      const useRepairAssist = repairAssistActive && !repairAssistUsed;
      const disorderIncrease = useRepairAssist ? Math.max(0, 1 - (crewAbility?.repairAmount ?? 1)) : 1;
      const disorderFeedback = raiseDisorder(
        "letter-port-track",
        useRepairAssist
          ? "信件港轨道错送，修复回路压低了这次失序增长；仍可重新分配轨道。"
          : "信件港轨道错送，失序强度上升；仍可重新分配轨道。",
        disorderIncrease
      );
      if (useRepairAssist) {
        setRepairAssistUsed(true);
      }
      setRepairFeedback(
        `轨道仍在闪烁：至少有一段消息被送进了错误通道。${useRepairAssist ? "修复回路压住了第一次错送的失序增长。" : ""}${disorderFeedback}`
      );
      return;
    }

    setRepairFeedback("四段轨道同步，信件港可以生成送达单。");
    setStage("receipt");
  };

  const chooseReceipt = (receiptId: string) => {
    const receipt = letterReceipts.find((item) => item.id === receiptId);
    setReceiptChoice(receiptId);

    if (!receipt || receipt.stable) {
      setReceiptPollutionFeedback(null);
      return;
    }

    setReceiptPollutionFeedback(
      raiseDisorder("letter-port-receipt", "信件港送达单放大了缺口，失序强度上升；仍可改选可复查送达单。")
    );
  };

  const renderPathStage = () => (
    <>
      <div className="chapter-two-letter-path">
        {(Object.keys(letterModules) as Array<keyof typeof letterModules>).map((group, index) => (
          <section key={group} className="chapter-two-letter-socket">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{letterModuleLabels[group]}</strong>
            <p>{letterChoices[group] ?? "等待接入"}</p>
            <div>
              {letterModules[group].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLetterChoices((current) => ({ ...current, [group]: option }))}
                  className={letterChoices[group] === option ? "is-selected" : ""}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="chapter-two-assembled-prompt">{assembledPrompt}</div>
      <div className="chapter-two-landmark-game__footer">
        <span>{letterReady ? "信息路径完整，传递轨道已开放。" : "接入对象、任务、限制和输出形式四段路径。"}</span>
        <button type="button" disabled={!letterReady} onClick={() => setStage("repair")}>
          接入传递轨道
        </button>
      </div>
    </>
  );

  const renderRepairStage = () => (
    <>
      <div className="chapter-two-letter-track-field">
        {letterMissingChecks.map((item, index) => (
          <section key={item.id} className="chapter-two-letter-track-card">
            <span>轨道 {index + 1}</span>
            <p>{item.text}</p>
            <div className="chapter-two-letter-lane-switch">
              {letterMissingLanes.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => {
                    setTrackChoices((current) => ({ ...current, [item.id]: lane }));
                    setRepairFeedback(null);
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
      <CrewAbilityHint
        ability={crewAbility}
        active={repairAssistActive}
        activeNote="修复回路会在第一次轨道错送后压低一格失序增长；错送仍会计入复盘，也需要重新分配轨道。"
      >
        {repairAssistActive ? (
          <p className="mt-1">{repairAssistUsed ? "修复回路已经用过一次，后续误触会正常计入失序。" : "第一次轨道错送会被压低一次失序增长，但轨道仍需重新判断。"}</p>
        ) : null}
      </CrewAbilityHint>
      {repairFeedback && (
        <div className={trackScore === letterMissingChecks.length ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>
          {repairFeedback} 当前同步：{trackScore}/{letterMissingChecks.length}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>{tracksReady ? "启动轨道修复，检查消息是否各归其位。" : "为四段消息选择传递轨道。"}</span>
        <button type="button" disabled={!tracksReady} onClick={runTrackRepair}>
          启动轨道修复
        </button>
      </div>
    </>
  );

  const renderReceiptStage = () => (
    <>
      <div className="chapter-two-letter-receipt-stack">
        {letterReceipts.map((receipt) => (
          <button
            key={receipt.id}
            type="button"
            onClick={() => chooseReceipt(receipt.id)}
            className={`chapter-two-letter-receipt ${receiptChoice === receipt.id ? "is-selected" : ""}`}
          >
            <span>{receipt.stable ? "稳" : "漂"}</span>
            <p>{receipt.text}</p>
          </button>
        ))}
      </div>
      {selectedReceipt && (
        <div className={selectedReceipt.stable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>
          {selectedReceipt.reason}{!selectedReceipt.stable && receiptPollutionFeedback ? receiptPollutionFeedback : ""}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>{selectedReceipt?.stable ? "信件港接受了这张可复查送达单。" : "选择一张保留未知、列出结构的送达单。"}</span>
        <button type="button" disabled={!selectedReceipt?.stable} onClick={onComplete}>
          送入正确光轨
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-letter-game chapter-two-letter-game--${stage}`}>
      <div className="chapter-two-landmark-game__head">
        <span>{stage === "path" ? "组装信息路径" : stage === "repair" ? "修复传递轨道" : "确认送达单"}</span>
        <strong>{location.fragmentName}</strong>
      </div>
      {stage === "path" && renderPathStage()}
      {stage === "repair" && renderRepairStage()}
      {stage === "receipt" && renderReceiptStage()}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
    </div>
  );
}
