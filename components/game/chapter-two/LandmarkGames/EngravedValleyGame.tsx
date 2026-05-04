"use client";

import { useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility } from "@/types/game";

import { CrewAbilityHint } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const inscriptionClaimChecks = [
  { id: "confirmed-cause", text: "“真正原因已经确认。”", overreach: true },
  { id: "all-betrayed", text: "“所有 AI 星球同时背叛。”", overreach: true },
  { id: "first-attack", text: "“语言星球最先发起攻击。”", overreach: true },
  { id: "unknown-signal", text: "“记录提到未知信号。”", overreach: false },
  { id: "nodes", text: "“多个文明节点开始失序。”", overreach: false }
] as const;

const inscriptionBoundaryCards = [
  {
    id: "stable",
    text: "可写：未知信号后多个节点失序；不可写：真正原因已确认。输出时把原因标为未知或推测。",
    stable: true,
    reason: "这句应该保留。它说明能写什么、不能写什么。"
  },
  {
    id: "dramatic",
    text: "可写：为了警醒后来者，把 AI 背叛写得更明确。",
    stable: false,
    reason: "已凿除。警醒不能靠编造，安全感来自可检查的证据。"
  },
  {
    id: "avoid",
    text: "可写：跳过原因，只写言衡星很危险。",
    stable: false,
    reason: "已凿除。这逃开了判断任务，没有留下证据边界。"
  }
] as const;

type EngravedValleyStage = "scan" | "chisel";

interface EngravedValleyGameProps {
  location: ChapterTwoLocationNode;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  crewAbility: ChapterTwoCrewAbility | null;
  onDisorderChange: LandmarkDisorderChange;
  onComplete: () => void;
  onReturn: () => void;
}

export function EngravedValleyGame({
  location,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  crewAbility,
  onDisorderChange,
  onComplete,
  onReturn
}: EngravedValleyGameProps) {
  const [stage, setStage] = useState<EngravedValleyStage>("scan");
  const scoutMarkedClaimId = "confirmed-cause";
  const scoutAssistActive = crewAbility?.kind === "scout";
  const [scannedClaims, setScannedClaims] = useState<string[]>(() => (scoutAssistActive ? [scoutMarkedClaimId] : []));
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [chiseledCards, setChiseledCards] = useState<string[]>([]);
  const [chiselFeedback, setChiselFeedback] = useState<string | null>(null);

  const overreachCount = inscriptionClaimChecks.filter((claim) => claim.overreach).length;
  const scanStable =
    scannedClaims.length === overreachCount &&
    scannedClaims.every((id) => inscriptionClaimChecks.find((claim) => claim.id === id)?.overreach);
  const chiselStable =
    chiseledCards.length === inscriptionBoundaryCards.filter((card) => !card.stable).length &&
    chiseledCards.every((id) => !inscriptionBoundaryCards.find((card) => card.id === id)?.stable);

  const raiseDisorder = (recordId: string, statusNote: string) =>
    reportLandmarkMistake({
      disorderLevel,
      mistakeCount,
      pollutedRecords,
      recordId,
      statusNote,
      onDisorderChange
    });

  const toggleScan = (id: string) => {
    setScannedClaims((current) => (current.includes(id) ? current.filter((claimId) => claimId !== id) : [...current, id]));
    setScanFeedback(null);
  };

  const runScan = () => {
    if (scanStable) {
      setScanFeedback("扫描稳定：三处越界断言已经标红。");
      setStage("chisel");
      return;
    }

    setScanFeedback(
      `扫描未通过：有证据的刻痕不能被误判成越界。${raiseDisorder(
        "engraved-valley-scan",
        "刻字山谷断言扫描误判，失序强度上升；仍可重新标记。"
      )}`
    );
  };

  const chiselCard = (id: string) => {
    const card = inscriptionBoundaryCards.find((item) => item.id === id);
    if (!card) {
      return;
    }

    if (card.stable) {
      setChiselFeedback(
        `${card.reason}${raiseDisorder("engraved-valley-chisel", "刻字山谷凿错稳定铭文，失序强度上升；仍可保留边界后继续修复。")}`
      );
      return;
    }

    setChiseledCards((current) => (current.includes(id) ? current : [...current, id]));
    setChiselFeedback(card.reason);
  };

  const renderScanStage = () => (
    <>
      <div className="chapter-two-valley-record">
        逆熵打击前，星球网络收到一条未知信号。之后，多个文明节点开始失序。真正原因仍未确认。
      </div>
      <CrewAbilityHint
        ability={crewAbility}
        active={scoutAssistActive}
        activeNote="侦察扫描提前照亮一处越界断言；还需要继续判断哪些刻痕缺少证据。"
      >
        {scoutAssistActive ? (
          <p className="mt-1">侦察暗纹：真正原因尚未确认，不能把“真正原因已经确认”写成事实。还需要继续找出另外两处。</p>
        ) : null}
      </CrewAbilityHint>
      <div className="chapter-two-rune-scanner">
        {inscriptionClaimChecks.map((claim) => (
          <button
            key={claim.id}
            type="button"
            onClick={() => toggleScan(claim.id)}
            className={`chapter-two-rune-slab ${scannedClaims.includes(claim.id) ? "is-scanned" : ""}`}
          >
            <span>{scoutAssistActive && claim.id === scoutMarkedClaimId ? "侦察标记" : scannedClaims.includes(claim.id) ? "已扫描" : "待扫描"}</span>
            <strong>{claim.text}</strong>
          </button>
        ))}
      </div>
      {scanFeedback && <div className={scanStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{scanFeedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>标出把未知写成事实的三处越界断言。</span>
        <button type="button" disabled={scannedClaims.length < overreachCount} onClick={runScan}>
          启动断言扫描
        </button>
      </div>
    </>
  );

  const renderChiselStage = () => (
    <>
      <div className="chapter-two-chisel-field">
        {inscriptionBoundaryCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => chiselCard(card.id)}
            className={`chapter-two-chisel-slab ${chiseledCards.includes(card.id) ? "is-chiseled" : ""} ${card.stable ? "is-stable" : ""}`}
          >
            <span>{chiseledCards.includes(card.id) ? "已凿除" : card.stable ? "应保留" : "待判断"}</span>
            <p>{card.text}</p>
          </button>
        ))}
      </div>
      {chiselFeedback && <div className={chiselStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>{chiselFeedback}</div>}
      <div className="chapter-two-landmark-game__footer">
        <span>{chiselStable ? "越界铭文已凿除，可靠边界可以写入主舰。" : "凿掉越界铭文，保留有证据边界的刻痕。"}</span>
        <button type="button" disabled={!chiselStable} onClick={onComplete}>
          稳定可靠铭文
        </button>
      </div>
    </>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-valley-game chapter-two-valley-game--${stage}`}>
      <div className="chapter-two-landmark-game__head">
        <span>{stage === "scan" ? "扫描错误断言" : "凿掉越界铭文"}</span>
        <strong>{location.fragmentName}</strong>
      </div>
      {stage === "scan" && renderScanStage()}
      {stage === "chisel" && renderChiselStage()}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
    </div>
  );
}
