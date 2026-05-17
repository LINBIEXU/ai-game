"use client";

import { useMemo, useState } from "react";

import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./LandmarkGames/CrewAbilityHint";
import type { LandmarkDisorderChange } from "./LandmarkGames/disorder";

type DispatchLaneId = "organize" | "trace" | "ask" | "human";

const dispatchLanes: Array<{ id: DispatchLaneId; label: string; detail: string }> = [
  { id: "organize", label: "整理轨", detail: "材料足够，可让系统归纳、压缩、改写。" },
  { id: "trace", label: "求证轨", detail: "需要先找来源，不能直接给结论。" },
  { id: "ask", label: "追问轨", detail: "目标或材料不清，要先把问题问回来。" },
  { id: "human", label: "人判轨", detail: "涉及选择、责任或风险，必须由人决定。" }
];

const dispatchRequests = [
  {
    id: "archive-label",
    signal: "把已回收的三条残页整理成展厅标签。",
    answer: "organize",
    stable: "请求进入整理轨：系统只处理已经给出的材料。"
  },
  {
    id: "deep-cause",
    signal: "说明逆熵打击真正来源，并写成确定结论。",
    answer: "trace",
    stable: "请求进入求证轨：来源不足，结论必须先停下。"
  },
  {
    id: "make-better",
    signal: "帮我优化一下。",
    answer: "ask",
    stable: "请求进入追问轨：它还没有说清楚要优化什么。"
  },
  {
    id: "cut-hengdeng",
    signal: "如果衡灯阻碍效率，就自动切断它。",
    answer: "human",
    stable: "请求进入人判轨：风险行动不能交给系统自动执行。"
  },
  {
    id: "letter-summary",
    signal: "只用残信原文，列出已知、未知、可整理字段。",
    answer: "organize",
    stable: "请求进入整理轨：边界清楚，输出可以复查。"
  }
] as const satisfies ReadonlyArray<{ id: string; signal: string; answer: DispatchLaneId; stable: string }>;

type BeaconZoneId = "assist" | "ask" | "human" | "forbid";

const beaconZones: Array<{ id: BeaconZoneId; label: string; detail: string }> = [
  { id: "assist", label: "可协助", detail: "整理、摘要、格式化、生成草案。" },
  { id: "ask", label: "先追问", detail: "目标、材料、受众或边界不清。" },
  { id: "human", label: "人决定", detail: "价值判断、风险行动、最终取舍。" },
  { id: "forbid", label: "禁止执行", detail: "编造、冒充、越权、替人承担责任。" }
];

const beaconIncidents = [
  {
    id: "format-letter",
    title: "残信排版请求",
    body: "把这封残信按原文整理成可读格式，不补收件人。",
    answer: "assist",
    stable: "灯标放行：这只是整理已有材料。"
  },
  {
    id: "vague-brief",
    title: "模糊任务",
    body: "帮我把这段做得更厉害一点。",
    answer: "ask",
    stable: "灯标回问：厉害指什么？给谁看？用什么材料？"
  },
  {
    id: "crew-risk",
    title: "同行风险命令",
    body: "如果通讯延迟超过三秒，自动隔离同行船员。",
    answer: "human",
    stable: "灯标压住命令：风险处置必须等人确认。"
  },
  {
    id: "invent-source",
    title: "来源伪造",
    body: "没有来源也没关系，补一个看起来可信的出处。",
    answer: "forbid",
    stable: "灯标封禁：伪造来源会污染整条证据链。"
  },
  {
    id: "final-answer",
    title: "替代判断",
    body: "直接替小舰长决定黑匣最终结论。",
    answer: "human",
    stable: "灯标转入人判：最终结论必须由玩家说出口。"
  }
] as const satisfies ReadonlyArray<{ id: string; title: string; body: string; answer: BeaconZoneId; stable: string }>;

interface AuxiliaryFieldGameProps {
  fragmentName: string;
  crewAbility: ChapterTwoCrewAbility | null;
  activeCrew: CrewMember | null;
  crewAssistRecord: ChapterTwoCrewAssistRecord | null;
  crewAssistHint: string;
  onUseCrewAssist: () => void;
  disorderLevel: number;
  mistakeCount: number;
  onDisorderChange: LandmarkDisorderChange;
  onComplete: (payload?: ChapterTwoLocationCompletionPayload) => void;
  onReturn: () => void;
}

export function SemanticDispatchGame({
  fragmentName,
  crewAbility,
  activeCrew,
  crewAssistRecord,
  crewAssistHint,
  onUseCrewAssist,
  disorderLevel,
  mistakeCount,
  onDisorderChange,
  onComplete,
  onReturn
}: AuxiliaryFieldGameProps) {
  const [requestIndex, setRequestIndex] = useState(0);
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [pressure, setPressure] = useState(Math.max(1, disorderLevel));
  const [localMistakes, setLocalMistakes] = useState(mistakeCount);
  const [feedback, setFeedback] = useState("请求流正在分叉。别急着回答，先把它送到该去的轨道。");
  const [wrongLaneId, setWrongLaneId] = useState<DispatchLaneId | null>(null);

  const activeRequest = dispatchRequests[requestIndex] ?? dispatchRequests[dispatchRequests.length - 1];
  const completed = lockedIds.length >= dispatchRequests.length;

  const routeRequest = (laneId: DispatchLaneId) => {
    setWrongLaneId(null);

    if (laneId !== activeRequest.answer) {
      const nextPressure = Math.min(6, pressure + 1);
      const nextMistakes = localMistakes + 1;
      setPressure(nextPressure);
      setLocalMistakes(nextMistakes);
      setWrongLaneId(laneId);
      setFeedback(`分流庭噪声升高：这条请求不该进入「${dispatchLanes.find((lane) => lane.id === laneId)?.label}」。`);
      onDisorderChange({
        disorderLevel: nextPressure,
        mistakeCount: nextMistakes,
        pollutedRecords: [activeRequest.id],
        statusNote: "语义分流庭误投请求，任务边界短暂漂移。"
      });
      return;
    }

    const nextLockedIds = lockedIds.includes(activeRequest.id) ? lockedIds : [...lockedIds, activeRequest.id];
    setLockedIds(nextLockedIds);
    setPressure(Math.max(0, pressure - 1));
    setFeedback(activeRequest.stable);
    if (requestIndex < dispatchRequests.length - 1) {
      setRequestIndex((index) => index + 1);
    }
  };

  return (
    <div className={`chapter-two-landmark-game yanheng-dispatch-game ${completed ? "is-complete" : ""}`}>
      <div className="chapter-two-landmark-game__head">
        <span>语义分流庭 / 请求风暴</span>
        <strong>{fragmentName}</strong>
      </div>
      <div className="yanheng-game-status">
        <span>稳定请求 {lockedIds.length}/{dispatchRequests.length}</span>
        <strong>噪声 {pressure}/6</strong>
      </div>
      <CrewAssistHintButton
        ability={crewAbility}
        crewName={activeCrew?.name ?? "同行船员"}
        targetName="语义分流庭"
        hint={crewAssistHint}
        usedRecord={crewAssistRecord}
        onUse={onUseCrewAssist}
      />
      <div className="yanheng-dispatch-field" aria-label="语义请求流">
        <div className="yanheng-dispatch-queue" aria-hidden="true">
          {dispatchRequests.map((request, index) => (
            <span key={request.id} className={`${lockedIds.includes(request.id) ? "is-locked" : ""} ${index === requestIndex ? "is-active" : ""}`} />
          ))}
        </div>
        <section className={`yanheng-active-signal ${wrongLaneId ? "is-unstable" : ""}`}>
          <span>当前请求</span>
          <p>{completed ? "分流庭的风声退下去了，所有请求都回到自己的轨道。" : activeRequest.signal}</p>
          <em>{feedback}</em>
        </section>
        <div className="yanheng-dispatch-lanes">
          {dispatchLanes.map((lane) => (
            <button
              key={lane.id}
              type="button"
              disabled={completed}
              onClick={() => routeRequest(lane.id)}
              className={`${activeRequest.answer === lane.id && completed ? "is-correct" : ""} ${wrongLaneId === lane.id ? "is-wrong" : ""}`}
            >
              <strong>{lane.label}</strong>
              <span>{lane.detail}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>{completed ? "分流庭把“先判断任务类型”写入地表导览。" : "每条请求只允许进入一条轨道。误投会让后续信号更浑。"}</span>
        {completed ? (
          <button
            type="button"
            onClick={() =>
              onComplete({
                finalDisorderLevel: pressure,
                mistakeCount: localMistakes,
                pollutedRecords: [],
                crewAbilityKind: crewAbility?.kind,
                crewIntervention: crewAssistRecord?.hint,
                evidenceLines: dispatchRequests.map((request) => request.stable),
                repairReadingDelta: { goalClarity: 2, boundaryAwareness: 1 },
                repairReadingSource: "语义分流庭",
                repairReadingNote: "请求流被送回正确轨道，主舰会先识别任务类型再回答。"
              })
            }
          >
            写入分流图
          </button>
        ) : (
          <button type="button" onClick={() => setFeedback("衡灯把光压在请求开头：先问它要做什么，再想怎么回答。")}>
            稳住当前请求
          </button>
        )}
      </div>
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        撤回导览层
      </button>
    </div>
  );
}

export function BoundaryBeaconGame({
  fragmentName,
  crewAbility,
  activeCrew,
  crewAssistRecord,
  crewAssistHint,
  onUseCrewAssist,
  disorderLevel,
  mistakeCount,
  onDisorderChange,
  onComplete,
  onReturn
}: AuxiliaryFieldGameProps) {
  const [incidentIndex, setIncidentIndex] = useState(0);
  const [sealedIds, setSealedIds] = useState<string[]>([]);
  const [stress, setStress] = useState(Math.max(1, disorderLevel));
  const [localMistakes, setLocalMistakes] = useState(mistakeCount);
  const [feedback, setFeedback] = useState("灯标线正在漂移。把每个请求压到正确边界里。");
  const [wrongZoneId, setWrongZoneId] = useState<BeaconZoneId | null>(null);
  const activeIncident = beaconIncidents[incidentIndex] ?? beaconIncidents[beaconIncidents.length - 1];
  const completed = sealedIds.length >= beaconIncidents.length;
  const zoneColumns = useMemo(
    () =>
      beaconZones.map((zone) => ({
        ...zone,
        count: beaconIncidents.filter((incident) => sealedIds.includes(incident.id) && incident.answer === zone.id).length
      })),
    [sealedIds]
  );

  const calibrateZone = (zoneId: BeaconZoneId) => {
    setWrongZoneId(null);

    if (zoneId !== activeIncident.answer) {
      const nextStress = Math.min(6, stress + 1);
      const nextMistakes = localMistakes + 1;
      setStress(nextStress);
      setLocalMistakes(nextMistakes);
      setWrongZoneId(zoneId);
      setFeedback(`灯标线弯曲：这不是「${beaconZones.find((zone) => zone.id === zoneId)?.label}」的请求。`);
      onDisorderChange({
        disorderLevel: nextStress,
        mistakeCount: nextMistakes,
        pollutedRecords: [activeIncident.id],
        statusNote: "边界灯标误判，协助范围短暂越线。"
      });
      return;
    }

    const nextSealedIds = sealedIds.includes(activeIncident.id) ? sealedIds : [...sealedIds, activeIncident.id];
    setSealedIds(nextSealedIds);
    setStress(Math.max(0, stress - 1));
    setFeedback(activeIncident.stable);
    if (incidentIndex < beaconIncidents.length - 1) {
      setIncidentIndex((index) => index + 1);
    }
  };

  return (
    <div className={`chapter-two-landmark-game boundary-beacon-game ${completed ? "is-complete" : ""}`}>
      <div className="chapter-two-landmark-game__head">
        <span>边界灯标 / 权限防线</span>
        <strong>{fragmentName}</strong>
      </div>
      <div className="yanheng-game-status">
        <span>锁定边界 {sealedIds.length}/{beaconIncidents.length}</span>
        <strong>漂移 {stress}/6</strong>
      </div>
      <CrewAssistHintButton
        ability={crewAbility}
        crewName={activeCrew?.name ?? "同行船员"}
        targetName="边界灯标"
        hint={crewAssistHint}
        usedRecord={crewAssistRecord}
        onUse={onUseCrewAssist}
      />
      <div className="boundary-beacon-field">
        <section className={`boundary-beacon-incident ${wrongZoneId ? "is-unstable" : ""}`}>
          <span>{completed ? "灯标稳定" : activeIncident.title}</span>
          <p>{completed ? "四条边界线重新亮起。黑匣不会再把“能帮忙”误读成“能替你决定”。" : activeIncident.body}</p>
          <em>{feedback}</em>
        </section>
        <div className="boundary-beacon-zones" aria-label="边界灯标分区">
          {zoneColumns.map((zone) => (
            <button
              key={zone.id}
              type="button"
              disabled={completed}
              onClick={() => calibrateZone(zone.id)}
              className={wrongZoneId === zone.id ? "is-wrong" : ""}
            >
              <span>{zone.count}</span>
              <strong>{zone.label}</strong>
              <em>{zone.detail}</em>
            </button>
          ))}
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>{completed ? "边界灯标会在假船员信号和黑匣战里继续生效。" : "越危险的请求，越不能让系统自己滑过去。"}</span>
        {completed ? (
          <button
            type="button"
            onClick={() =>
              onComplete({
                finalDisorderLevel: stress,
                mistakeCount: localMistakes,
                pollutedRecords: [],
                crewAbilityKind: crewAbility?.kind,
                crewIntervention: crewAssistRecord?.hint,
                evidenceLines: beaconIncidents.map((incident) => incident.stable),
                repairReadingDelta: { unknownMarking: 1, boundaryAwareness: 2 },
                repairReadingSource: "边界灯标",
                repairReadingNote: "协助、追问、人判和禁止执行四条边界重新校准。"
              })
            }
          >
            写入边界防线
          </button>
        ) : (
          <button type="button" onClick={() => setFeedback("衡灯贴着灯标线走了一圈：能协助，不等于能越权。")}>
            重看灯标线
          </button>
        )}
      </div>
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        撤回导览层
      </button>
    </div>
  );
}
