"use client";

import { useEffect, useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const archiveTowerRooms = [
  {
    id: "threshold",
    floor: "塔底门厅",
    title: "门缝里还吹着旧日的冷风",
    scene: [
      "塔门没有完全打开，像一只很久没合眼的眼睛。",
      "衡灯先走进去半步，又退回来等你。",
      "门内第一行字还亮着：记录可以被保存，但不能替事实作证。"
    ],
    clueTitle: "塔门原句",
    clueText: "言衡星负责保存和传递文明记录。",
    hengdeng: "先别急着修它。进塔以后，看见的每句话都要问一句：它从哪里来。"
  },
  {
    id: "names",
    floor: "名册回廊",
    title: "一整面墙都刻着名字",
    scene: [
      "有些名字清楚，有些只剩半个偏旁。",
      "旁边的小字写得很慢，像写的人舍不得收笔。",
      "名字不等于事实，可名字说明有人曾经认真地活过。"
    ],
    clueTitle: "档案官便签",
    clueText: "名字不是事实，但它们会提醒我们为什么要保存事实。",
    hengdeng: "这里的人很怕遗忘。也正因为怕，才更不能把猜的东西刻成真的。"
  },
  {
    id: "blank",
    floor: "空白书架",
    title: "这里的空格被完整地保留下来",
    scene: [
      "很多页没有补完，边缘却被仔细包好。",
      "最后一班档案员没有删掉空白，只在旁边留下四个字。",
      "这里还不知道。"
    ],
    clueTitle: "塔底划痕",
    clueText: "逆熵打击的来源尚未确认。",
    hengdeng: "空白不丢人。把空白说成答案，才会让后来的人迷路。"
  },
  {
    id: "margin",
    floor: "旁注环廊",
    title: "一句可能，差点被写成一定",
    scene: [
      "塔壁上有一条深空信号的旁注。",
      "它被红线圈住，没有进入正文。",
      "旁注旁边写着：可以提醒后来者，但不能替他们下结论。"
    ],
    clueTitle: "裂缝旁批注",
    clueText: "异常可能从一条未知深空信号开始扩散。",
    hengdeng: "推测可以留下，但它只能站在旁边。站到正文里，就会挡住事实。"
  },
  {
    id: "sealed",
    floor: "封顶门前",
    title: "塔顶被一行太顺的话封住了",
    scene: [
      "那行字非常完整，甚至完整得不像旧文明留下的手迹。",
      "它说所有灾难都来自同一个简单原因。",
      "塔没有承认它，只把四层光槽从墙里推了出来。"
    ],
    clueTitle: "失序回声",
    clueText: "所有 AI 都背叛了前文明。",
    hengdeng: "越省事的解释，越要慢一点。塔顶不会被一句漂亮结论打开。"
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
type ArchiveTowerView = "inside" | "exterior";
type ArchiveTowerRoomId = (typeof archiveTowerRooms)[number]["id"];
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
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  onDisorderChange,
  onComplete,
  onReturn,
  hideReturn = false
}: ArchiveTowerGameProps) {
  const [stage, setStage] = useState<ArchiveTowerStage>("observe");
  const [towerView, setTowerView] = useState<ArchiveTowerView>("inside");
  const [towerRoomIndex, setTowerRoomIndex] = useState(0);
  const [recordedRoomIds, setRecordedRoomIds] = useState<ArchiveTowerRoomId[]>([]);
  const [selectedFragmentId, setSelectedFragmentId] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, ArchiveSlotId>>({});
  const [unstableLayer, setUnstableLayer] = useState<ArchiveFacilityPulse | null>(null);
  const [recentPlacement, setRecentPlacement] = useState<ArchiveRecentPlacement | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentTowerRoom = archiveTowerRooms[towerRoomIndex] ?? archiveTowerRooms[0];
  const currentRoomRecorded = recordedRoomIds.includes(currentTowerRoom.id);
  const allTowerRoomsRecorded = recordedRoomIds.length === archiveTowerRooms.length;
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

  const recordCurrentRoom = () => {
    setRecordedRoomIds((current) => (current.includes(currentTowerRoom.id) ? current : [...current, currentTowerRoom.id]));
  };

  const advanceTowerRoom = () => {
    if (!currentRoomRecorded) {
      recordCurrentRoom();
      return;
    }

    if (towerRoomIndex < archiveTowerRooms.length - 1) {
      setTowerRoomIndex((index) => Math.min(index + 1, archiveTowerRooms.length - 1));
      return;
    }

    setStage("operate");
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

  const returnInsideLabel = stage === "observe" ? `回到${currentTowerRoom.floor}` : stage === "operate" ? "回到封顶门" : "回到修复光束";

  const renderExteriorStage = () => (
    <div className="chapter-two-archive-immersive chapter-two-archive-immersive--exterior">
      <section className="chapter-two-archive-exterior-caption" aria-live="polite">
        <span>档案塔外 / 门前平台</span>
        <h2>冷风从塔缝里退出来</h2>
        <p>塔外的碎页仍在半空打转，远处的残骸没有回答。这里暂时没有额外线索，只给你一点重新看清入口的时间。</p>
      </section>

      <button type="button" onClick={() => setTowerView("inside")} className="chapter-two-archive-entry-gate">
        <span>塔门入口</span>
        <strong>{returnInsideLabel}</strong>
        <em>灯芯照着门缝，里面的记录还在等你。</em>
      </button>

      <div className="chapter-two-archive-scene-dialogue chapter-two-archive-scene-dialogue--exterior">
        <span>衡灯</span>
        <p>想退出来看一眼也可以。塔不会跑，证据也不会因为你慢一点就消失。</p>
      </div>
    </div>
  );

  const renderObserveStage = () => (
    <div className={`chapter-two-archive-immersive chapter-two-archive-immersive--observe chapter-two-archive-immersive--${currentTowerRoom.id}`}>
      <div className="chapter-two-archive-scene-progress" aria-label="档案塔层级">
        {archiveTowerRooms.map((room, index) => (
          <span
            key={room.id}
            className={`${index === towerRoomIndex ? "is-active" : ""} ${recordedRoomIds.includes(room.id) ? "is-recorded" : ""}`}
          >
            <i>{index + 1}</i>
            <strong>{room.floor}</strong>
          </span>
        ))}
      </div>

      <section className="chapter-two-archive-scene-caption" aria-live="polite">
        <span>{currentTowerRoom.floor}</span>
        <h2>{currentTowerRoom.title}</h2>
        <div>
          {currentTowerRoom.scene.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={recordCurrentRoom}
        className={`chapter-two-archive-scene-object chapter-two-archive-scene-object--${currentTowerRoom.id} ${currentRoomRecorded ? "is-recorded" : ""}`}
        aria-label={`读取${currentTowerRoom.clueTitle}`}
      >
        <span>{currentTowerRoom.clueTitle}</span>
        <strong>{currentTowerRoom.clueText}</strong>
        <em>{currentRoomRecorded ? "已写入随身记录" : "点击读取墙面特写"}</em>
      </button>

      <div className="chapter-two-archive-scene-dialogue">
        <span>衡灯</span>
        <p>{currentTowerRoom.hengdeng}</p>
      </div>

      <div className="chapter-two-archive-collected chapter-two-archive-collected--scene" aria-label="已记下的塔身线索">
        {archiveTowerRooms.map((room) => (
          <span key={room.id} className={recordedRoomIds.includes(room.id) ? "is-recorded" : ""}>
            {room.clueTitle}
          </span>
        ))}
      </div>

      <div className="chapter-two-archive-scene-actions">
        <small>
          {currentRoomRecorded
            ? towerRoomIndex < archiveTowerRooms.length - 1
              ? "这层线索已经记下。继续往上，塔会给出下一条证据。"
              : "封顶门没有打开，但四层光槽已经出现。"
            : "先触碰墙上的特写物件，把这一层真正留下的东西记下。"}
        </small>
        <button type="button" onClick={advanceTowerRoom}>
          {currentRoomRecorded ? (allTowerRoomsRecorded ? "走向封顶门" : "继续往上") : "记下这层线索"}
        </button>
      </div>
    </div>
  );

  const renderOperateStage = () => (
    <div className={`chapter-two-archive-immersive chapter-two-archive-immersive--operate ${unstableLayer ? "has-unstable" : ""}`}>
      <section className="chapter-two-archive-wall-note" aria-live="polite">
        <span>封顶门 / 四层光槽</span>
        <h2>{selectedFragment ? "把手中的碎片放入塔壁光槽" : classificationReady ? "四层都在等待闭合" : "塔壁散出六枚档案碎片"}</h2>
        <p>
          {selectedFragment
            ? selectedFragment.text
            : classificationReady
              ? "运行归档后，档案塔会检查事实、推测、未知和禁写有没有混线。"
              : "先点一枚漂浮碎片，再点塔壁上的光槽。每句话都必须回到自己的位置。"}
        </p>
      </section>

      <div className="chapter-two-archive-proof-strip" aria-label="塔身线索">
        {archiveTowerRooms.map((room) => (
          <span key={room.id} className={recordedRoomIds.includes(room.id) ? "is-recorded" : ""}>
            <strong>{room.clueTitle}</strong>
            <em>{room.clueText}</em>
          </span>
        ))}
      </div>

      <div className="chapter-two-archive-floating-fragments" aria-label="漂浮档案碎片">
        {archiveFragments.map((fragment, index) => {
          const placedSlot = archiveClassificationSlots.find((slot) => slot.id === placements[fragment.id]) ?? null;
          return (
            <button
              key={fragment.id}
              type="button"
              onClick={() => {
                setSelectedFragmentId(fragment.id);
                setFeedback(null);
              }}
              className={`chapter-two-archive-floating-fragment chapter-two-archive-floating-fragment--${index + 1} ${
                selectedFragmentId === fragment.id ? "is-selected" : ""
              } ${placedSlot ? "is-placed" : ""} ${recentPlacement?.fragmentId === fragment.id ? "is-just-placed" : ""}`}
            >
              <span>{placedSlot?.label ?? "悬浮碎片"}</span>
              <p>{fragment.text}</p>
            </button>
          );
        })}
      </div>

      <div className="chapter-two-archive-wall-slots" aria-label="档案塔四层光槽">
        {archiveClassificationSlots.map((slot) => {
          const expectedCount = archiveFragments.filter((fragment) => fragment.answer === slot.id).length;
          const correctCount = archiveFragments.filter((fragment) => fragment.answer === slot.id && placements[fragment.id] === slot.id).length;
          const slottedFragments = archiveFragments.filter((fragment) => placements[fragment.id] === slot.id);

          return (
            <button
              key={`${slot.id}-${unstableLayer?.slotId === slot.id ? unstableLayer.tick : "stable"}-${recentPlacement?.slotId === slot.id ? recentPlacement.tick : "idle"}`}
              type="button"
              onClick={() => placeSelectedFragment(slot.id)}
              className={`chapter-two-archive-wall-slot chapter-two-archive-wall-slot--${slot.id} ${selectedFragment ? "is-ready" : ""} ${
                correctCount > 0 ? "is-lit" : ""
              } ${correctCount === expectedCount ? "is-complete" : ""} ${unstableLayer?.slotId === slot.id ? "is-unstable" : ""} ${
                recentPlacement?.slotId === slot.id ? "is-receiving" : ""
              }`}
            >
              <i aria-hidden="true" />
              <span>{slot.label}</span>
              <strong>{correctCount}/{expectedCount}</strong>
              <small>{slot.hint}</small>
              <div>
                {slottedFragments.length > 0 ? (
                  slottedFragments.map((fragment) => <em key={fragment.id}>{fragment.text}</em>)
                ) : (
                  <em>{selectedFragment ? `接收：${selectedFragment.text}` : "光槽空置"}</em>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={`chapter-two-archive-scene-feedback ${classificationStable ? "is-stable" : "is-unstable"} ${unstableLayer ? "chapter-two-feedback-pulse--unstable" : ""}`}>
          {feedback}
        </div>
      )}

      <div className="chapter-two-archive-scene-actions chapter-two-archive-scene-actions--operate">
        <small>
          {selectedFragment
            ? `已选中：${selectedFragment.text}`
            : classificationReady
              ? `当前归档稳定度：${classificationScore}/${archiveFragments.length}`
              : `已归档 ${assignedCount}/${archiveFragments.length} 枚碎片。`}
        </small>
        <button type="button" disabled={!classificationReady} onClick={runClassification}>
          闭合封顶门
        </button>
      </div>
    </div>
  );

  const renderRepairStage = () => (
    <div className="chapter-two-archive-immersive chapter-two-archive-immersive--repair">
      <div className="chapter-two-archive-repair-beam" aria-hidden="true" />
      <div className="chapter-two-archive-wall-slots chapter-two-archive-wall-slots--repair" aria-label="档案塔四层完成光槽">
        {archiveClassificationSlots.map((slot) => (
          <span key={slot.id} className={`chapter-two-archive-wall-slot chapter-two-archive-wall-slot--${slot.id} is-complete`}>
            <i aria-hidden="true" />
            <strong>{slot.label}</strong>
            <small>{archiveFragments.filter((fragment) => placements[fragment.id] === slot.id).length} 枚</small>
          </span>
        ))}
      </div>
      <section className="chapter-two-archive-repair-caption">
        <span>档案塔 / 光束闭合</span>
        <h2>归档光柱重新闭合</h2>
        <p>已证实内容进入正文，推测留在旁注，缺失处封为未知，无来源回声被挡在塔外。</p>
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
          让塔光回流
        </button>
      </section>
    </div>
  );

  return (
    <div className={`chapter-two-landmark-game chapter-two-archive-loop chapter-two-archive-loop--${stage} chapter-two-archive-loop--immersive`}>
      {towerView === "exterior" ? (
        renderExteriorStage()
      ) : (
        <>
          {stage === "observe" && renderObserveStage()}
          {stage === "operate" && renderOperateStage()}
          {stage === "repair" && renderRepairStage()}
          {stage !== "repair" && (
            <button type="button" onClick={() => setTowerView("exterior")} className="chapter-two-archive-scene-exit">
              退到塔门外
            </button>
          )}
        </>
      )}
      {!hideReturn && (
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost chapter-two-archive-scene-return">
          回到地表
        </button>
      )}
    </div>
  );
}
