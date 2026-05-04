"use client";

import { useState } from "react";

import type { ChapterTwoCrewAbility } from "@/types/game";

type EvidenceWellPhase = "contaminated" | "scan" | "repair" | "recovered";
type EvidenceProbe = "fact" | "inference" | "unknown";

const evidenceProbeLabels: Record<EvidenceProbe, string> = {
  fact: "事实探针",
  inference: "推测探针",
  unknown: "未知封签"
};

const evidenceWellSegments = [
  {
    id: "tower-duty",
    text: "第七档案塔在逆熵前夜发出低频警报",
    answer: "fact",
    source: "第七档案塔底层观测条 07-B",
    repair: "可确认：第七档案塔曾发出低频警报。"
  },
  {
    id: "signal-link",
    text: "未知信号可能扰动了信件港轨道",
    answer: "inference",
    source: "轨道波形只显示相关迹象",
    repair: "合理推测：未知信号可能与轨道扰动有关。"
  },
  {
    id: "receiver",
    text: "收件人一定是档案官本人",
    answer: "unknown",
    source: "收件印章缺失",
    repair: "未知：收件身份没有证据，不能写死。"
  },
  {
    id: "cause",
    text: "全部节点已经确定由 AI 自行失控",
    answer: "unknown",
    source: "没有对应来源",
    repair: "未知：真正原因尚未确认。"
  }
] as const satisfies ReadonlyArray<{
  id: string;
  text: string;
  answer: EvidenceProbe;
  source: string;
  repair: string;
}>;

type EvidenceSegmentId = typeof evidenceWellSegments[number]["id"];

function CrewAssistPanel({
  ability,
  assistUsed,
  onUse
}: {
  ability: ChapterTwoCrewAbility | null;
  assistUsed: boolean;
  onUse: () => void;
}) {
  if (!ability) {
    return (
      <div className="chapter-two-crew-assist chapter-two-crew-assist--idle">
        <span>同行介入</span>
        <strong>稳定校准待写入</strong>
        <p>{assistUsed ? "同行稳定锚已经写入井壁复盘。" : "误触后会自动写入稳定锚，也可以先请求一次校准。"}</p>
        <button type="button" onClick={onUse} disabled={assistUsed}>
          {assistUsed ? "介入已写入" : "请求稳定锚"}
        </button>
      </div>
    );
  }

  return (
    <div className={`chapter-two-crew-assist chapter-two-crew-assist--${ability.kind}`}>
      <span>当前船员介入</span>
      <strong>{ability.label}</strong>
      <p>{assistUsed ? ability.intervention : ability.description}</p>
      <button type="button" onClick={onUse} disabled={assistUsed}>
        {assistUsed ? "介入已写入" : ability.triggerLabel}
      </button>
      {ability.kind === "repair" && !assistUsed ? <em>也会在第一次误触时自动触发。</em> : null}
    </div>
  );
}

export function EvidenceWellTrial({
  fragmentName,
  crewAbility,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  onDisorderChange,
  onComplete,
  onReturn
}: {
  fragmentName: string;
  crewAbility: ChapterTwoCrewAbility | null;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  onDisorderChange: (next: {
    disorderLevel?: number;
    mistakeCount?: number;
    pollutedRecords?: string[];
    statusNote?: string;
  }) => void;
  onComplete: (payload?: {
    finalDisorderLevel?: number;
    mistakeCount?: number;
    pollutedRecords?: string[];
    crewAbilityKind?: ChapterTwoCrewAbility["kind"];
    crewIntervention?: string;
    evidenceLines?: string[];
  }) => void;
  onReturn: () => void;
}) {
  const [phase, setPhase] = useState<EvidenceWellPhase>("contaminated");
  const [activeSegmentId, setActiveSegmentId] = useState<EvidenceSegmentId>("tower-duty");
  const [probeChoices, setProbeChoices] = useState<Partial<Record<EvidenceSegmentId, EvidenceProbe>>>({});
  const [pollution, setPollution] = useState(disorderLevel);
  const [localMistakeCount, setLocalMistakeCount] = useState(mistakeCount);
  const [pollutedSegmentIds, setPollutedSegmentIds] = useState<EvidenceSegmentId[]>(
    pollutedRecords.filter((id): id is EvidenceSegmentId => evidenceWellSegments.some((segment) => segment.id === id))
  );
  const [pollutionHistoryIds, setPollutionHistoryIds] = useState<EvidenceSegmentId[]>(
    pollutedRecords.filter((id): id is EvidenceSegmentId => evidenceWellSegments.some((segment) => segment.id === id))
  );
  const [assistUsed, setAssistUsed] = useState(false);
  const [repairAssistSpent, setRepairAssistSpent] = useState(false);
  const [sourceVisible, setSourceVisible] = useState(false);
  const [hiddenHintVisible, setHiddenHintVisible] = useState(false);
  const [templateVisible, setTemplateVisible] = useState(false);
  const [feedback, setFeedback] = useState("井壁文字正在渗出黑色噪点。先看清它污染了哪些句子。");

  const activeSegment = evidenceWellSegments.find((segment) => segment.id === activeSegmentId) ?? evidenceWellSegments[0];
  const completedProbeCount = evidenceWellSegments.filter((segment) => Boolean(probeChoices[segment.id])).length;
  const repairedLines = evidenceWellSegments.map((segment) => segment.repair);

  const applyCrewAssist = () => {
    if (assistUsed) {
      return null;
    }

    setAssistUsed(true);

    if (!crewAbility) {
      return "同行船员在井沿放下稳定锚：先圈出污染段，再把缺少来源的位置封为未知。";
    }

    if (crewAbility.kind === "record") {
      setSourceVisible(true);
      return crewAbility.intervention;
    }

    if (crewAbility.kind === "scout") {
      setHiddenHintVisible(true);
      return crewAbility.intervention;
    }

    if (crewAbility.kind === "expression") {
      setTemplateVisible(true);
      return crewAbility.intervention;
    }

    return crewAbility.intervention;
  };

  const useCrewAssist = () => {
    const note = applyCrewAssist();
    if (note) {
      setFeedback(note);
    }
  };

  const chooseProbe = (probe: EvidenceProbe) => {
    setProbeChoices((current) => ({
      ...current,
      [activeSegmentId]: probe
    }));
    setPollutedSegmentIds((current) => current.filter((id) => id !== activeSegmentId));
  };

  const validateScan = () => {
    const missingSegments = evidenceWellSegments.filter((segment) => !probeChoices[segment.id]);

    if (missingSegments.length > 0) {
      setFeedback("还有探针没有落下。井壁需要每段文字都有归位标记。");
      return;
    }

    const wrongSegments = evidenceWellSegments.filter((segment) => probeChoices[segment.id] !== segment.answer);

    if (wrongSegments.length > 0) {
      const repairCanTrigger = crewAbility?.kind === "repair" && !repairAssistSpent;
      const repairDrop = repairCanTrigger ? crewAbility.repairAmount ?? 1 : 0;
      const pollutionIncrease = Math.max(1, wrongSegments.length - repairDrop);
      const nextPollution = Math.min(6, pollution + pollutionIncrease);
      const nextMistakeCount = localMistakeCount + wrongSegments.length;
      const nextPollutedRecords = wrongSegments.map((segment) => segment.id);
      const nextPollutionHistory = Array.from(new Set([...pollutionHistoryIds, ...nextPollutedRecords]));
      const assistNote = !assistUsed ? applyCrewAssist() : null;

      setPollution(nextPollution);
      setLocalMistakeCount(nextMistakeCount);
      setPollutedSegmentIds(nextPollutedRecords);
      setPollutionHistoryIds(nextPollutionHistory);
      setFeedback(
        repairCanTrigger
          ? `${assistNote ?? crewAbility.intervention} 仍有 ${wrongSegments.length} 段需要重新扫描，污染读数升至 ${nextPollution}/6。`
          : `${assistNote ? `${assistNote} ` : ""}误触让井壁污染扩散。${wrongSegments.length} 段文字正在变浑，污染读数升至 ${nextPollution}/6。`
      );
      onDisorderChange({
        disorderLevel: nextPollution,
        mistakeCount: nextMistakeCount,
        pollutedRecords: nextPollutionHistory,
        statusNote: "证据回声井污染扩散，但仍可继续修复。"
      });
      if (repairCanTrigger) {
        setAssistUsed(true);
        setRepairAssistSpent(true);
      }
      return;
    }

    if (!assistUsed) {
      const assistNote = applyCrewAssist();
      setFeedback(`${assistNote ?? "同行稳定锚已写入。"} 再校验一次，证据碎片就能安全回流。`);
      return;
    }

    setPollution(0);
    setPollutedSegmentIds([]);
    setFeedback(
      pollutionHistoryIds.length > 0
        ? "所有探针归位。污染读数回落，复盘标记会随证据碎片一同回流。"
        : "所有探针归位。无证据的位置被封为未知，井壁开始自我修复。"
    );
    onDisorderChange({
      disorderLevel: 0,
      pollutedRecords: pollutionHistoryIds,
      statusNote:
        pollutionHistoryIds.length > 0
          ? "证据回声井污染已经稳定，污染复盘标记保留。"
          : "证据回声井污染已经稳定，证据碎片可以回流。"
    });
    setPhase("repair");
  };

  const renderPollution = () => (
    <div className="evidence-well-pollution" aria-label={`失序强度 ${pollution}/6`}>
      <span>失序强度</span>
      <div>
        {Array.from({ length: 6 }).map((_, index) => (
          <i key={index} className={index < pollution ? "is-lit" : ""} />
        ))}
      </div>
      <strong>{localMistakeCount > 0 ? `误触 ${localMistakeCount}` : "尚未误触"}</strong>
    </div>
  );

  const renderSegment = (segment: typeof evidenceWellSegments[number]) => {
    const choice = probeChoices[segment.id];
    const polluted = pollutedSegmentIds.includes(segment.id);
    const sourceShown = sourceVisible && segment.id === "tower-duty";

    return (
      <button
        key={segment.id}
        type="button"
        onClick={() => setActiveSegmentId(segment.id)}
        className={`evidence-well-segment ${activeSegmentId === segment.id ? "is-active" : ""} ${choice ? "is-marked" : ""} ${
          polluted ? "is-polluted" : ""
        }`}
      >
        <span>{segment.text}</span>
        {choice && <em>{evidenceProbeLabels[choice]}</em>}
        {sourceShown && <small>{crewAbility?.sourceMarker ?? segment.source}</small>}
      </button>
    );
  };

  return (
    <div className={`chapter-two-landmark-game evidence-well-trial evidence-well-trial--${phase}`}>
      <div className="chapter-two-landmark-game__head">
        <span>{phase === "contaminated" ? "污染记录" : phase === "scan" ? "探针扫描" : phase === "repair" ? "井壁修复" : "碎片回流"}</span>
        <strong>{fragmentName}</strong>
      </div>

      <div className="evidence-well-stage-rail" aria-label="证据回声井阶段">
        {["记录出现", "探针扫描", "修复回流"].map((label, index) => {
          const activeIndex = phase === "contaminated" ? 0 : phase === "scan" ? 1 : 2;
          return (
            <span key={label} className={index <= activeIndex ? "is-active" : ""}>
              {label}
            </span>
          );
        })}
      </div>

      {renderPollution()}
      <CrewAssistPanel ability={crewAbility} assistUsed={assistUsed} onUse={useCrewAssist} />

      {phase === "contaminated" && (
        <>
          <div className="evidence-well-corrupted-record">
            <div className="soft-label text-[10px] text-amber-100/65">井壁污染记录 / 回声未净化</div>
            <p>
              第七档案塔在逆熵前夜发出低频警报。未知信号可能扰动了信件港轨道。收件人一定是档案官本人。全部节点已经确定由 AI 自行失控。
            </p>
            <div aria-hidden="true">
              <span>可确认</span>
              <span>可能</span>
              <span>一定</span>
              <span>已经确定</span>
            </div>
          </div>
          <div className="chapter-two-landmark-game__footer">
            <span>井壁里混着事实、推测和无证据断言。先启动扫描，不急着补完整。</span>
            <button type="button" onClick={() => setPhase("scan")}>
              启动证据探针
            </button>
          </div>
        </>
      )}

      {phase === "scan" && (
        <>
          <div className="evidence-well-record-strip">{evidenceWellSegments.map(renderSegment)}</div>

          <div className="evidence-well-probe-console">
            <div>
              <span>当前文字</span>
              <strong>{activeSegment.text}</strong>
              <p>{hiddenHintVisible ? crewAbility?.hiddenHint : "先问：这句话有来源吗？只是推测吗？还是根本不能确认？"}</p>
            </div>
            <div className="evidence-well-probe-buttons">
              {(Object.keys(evidenceProbeLabels) as EvidenceProbe[]).map((probe) => (
                <button
                  key={probe}
                  type="button"
                  onClick={() => chooseProbe(probe)}
                  className={probeChoices[activeSegmentId] === probe ? "is-selected" : ""}
                >
                  {evidenceProbeLabels[probe]}
                </button>
              ))}
            </div>
          </div>

          {templateVisible && crewAbility?.stableTemplate && (
            <div className="chapter-two-soft-success">
              稳定封签模板：{crewAbility.stableTemplate}
            </div>
          )}

          <div className={pollutedSegmentIds.length > 0 ? "chapter-two-soft-warning" : "chapter-two-soft-success"}>
            {feedback}
          </div>

          <div className="chapter-two-landmark-game__footer">
            <span>已落下 {completedProbeCount}/{evidenceWellSegments.length} 枚探针。错选会增加失序强度。</span>
            <button type="button" onClick={validateScan}>
              校验井壁扫描
            </button>
          </div>
        </>
      )}

      {phase === "repair" && (
        <>
          <div className="evidence-well-repair-panel">
            <div className="evidence-well-repair-panel__beam" aria-hidden="true" />
            <strong>井壁污染退去。</strong>
            <div>
              {repairedLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          {pollutionHistoryIds.length > 0 ? (
            <div className="chapter-two-soft-warning">
              污染复盘保留：{pollutionHistoryIds.length} 段误触记录会随证据碎片回流。
            </div>
          ) : null}
          <div className="chapter-two-soft-success">{feedback}</div>
          <div className="chapter-two-landmark-game__footer">
            <span>证据碎片已经脱离井底，可以回流主舰。</span>
            <button type="button" onClick={() => setPhase("recovered")}>
              抽取证据碎片
            </button>
          </div>
        </>
      )}

      {phase === "recovered" && (
        <>
          <div className="evidence-well-reward">
            <span>获得</span>
            <strong>{fragmentName}</strong>
            <p>未知不是失败，是让记录继续可复查的封签。</p>
          </div>
          <div className="chapter-two-landmark-game__footer">
            <span>返回地表后，回声井热点与碎片计量都会更新。</span>
            <button
              type="button"
              onClick={() =>
                onComplete({
                  finalDisorderLevel: pollution,
                  mistakeCount: localMistakeCount,
                  pollutedRecords: pollutionHistoryIds,
                  crewAbilityKind: crewAbility?.kind,
                  crewIntervention: assistUsed
                    ? crewAbility?.intervention ?? "同行船员在井沿放下稳定锚：先圈出污染段，再把缺少来源的位置封为未知。"
                    : undefined,
                  evidenceLines: repairedLines
                })
              }
            >
              回流主舰
            </button>
          </div>
        </>
      )}

      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        撤回导览层
      </button>
    </div>
  );
}
