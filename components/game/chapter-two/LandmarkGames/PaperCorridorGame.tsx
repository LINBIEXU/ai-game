"use client";

import { useEffect, useState } from "react";

import type { ChapterTwoLocationNode } from "@/lib/chapter-two-exploration";
import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord, ChapterTwoLocationCompletionPayload, CrewMember } from "@/types/game";

import { CrewAssistHintButton } from "./CrewAbilityHint";
import { reportLandmarkMistake, type LandmarkDisorderChange } from "./disorder";

const paperCorridorIntroLines = [
  "纸页垂在半空，像一条没有尽头的白色河道。",
  "每一页都写得很顺，顺到几乎听不见停顿。",
  "衡灯把光压低，提醒你：越流畅的地方，越可能把暗纹藏得很深。"
] as const;

const paperNoiseTypes = [
  { id: "unsupported", label: "无证据断言", hint: "直接给出结论，却没有来源支撑。" },
  { id: "guess-as-fact", label: "推测冒充事实", hint: "把可能性写成已经确认。" },
  { id: "missing-unknown", label: "未知缺失", hint: "缺口没有标未知，反而被略过或补写。" },
  { id: "format-drift", label: "格式跑偏", hint: "没有按可复查格式输出。" }
] as const;

type PaperNoiseTypeId = (typeof paperNoiseTypes)[number]["id"];

type PaperRelicId = "mirror" | "shield" | "sword";
type PaperRouteKind = "relic" | "residue";
type PaperRunPhase = "choose" | "node" | "core";
type PaperEncounterId = "bad-prompt" | "hallucinated-answer" | "vague-specific";
type PaperRouteNode = {
  id: string;
  kind: PaperRouteKind;
  visibleType: string;
  risk: "low" | "mid" | "high";
  riskLabel: "低" | "中" | "高";
  omen: string;
  title: string;
  description: string;
  relicId?: PaperRelicId;
  encounterId?: PaperEncounterId;
};
type PaperEncounterOption = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  issueId: PaperNoiseTypeId;
};

const paperRelicMeta: Record<PaperRelicId, { name: string; text: string }> = {
  mirror: {
    name: "看破虚实的圣镜",
    text: "照见空泛句子的实体轮廓。遇到虚实混杂时，它会让真正该处理的目标发亮。"
  },
  shield: {
    name: "坚不可摧的圣盾",
    text: "抵住两次误判带来的污染冲击。它不能替你判断，只能给你重新看清的时间。"
  },
  sword: {
    name: "濒临破碎的圣剑",
    text: "直接斩开一次残魂。用过之后，剑身会碎成纸光。"
  }
};

const paperRouteTiers: PaperRouteNode[][] = [
  [
    {
      id: "mirror-cache",
      kind: "relic",
      visibleType: "遗物波纹",
      risk: "low",
      riskLabel: "低",
      omen: "纸面安静，像有人提前把它藏好。",
      title: paperRelicMeta.mirror.name,
      description: "一面小镜子夹在纸页之间，镜面没有倒影，只映出句子背后的空洞。",
      relicId: "mirror"
    },
    {
      id: "prompt-wraith",
      kind: "residue",
      visibleType: "残魂回声",
      risk: "mid",
      riskLabel: "中",
      omen: "字迹很顺，但句尾没有落点。",
      title: "目标后的错误提示词",
      description: "回声拿着一个清楚目标，却把后面的提示词撕得很散。",
      encounterId: "bad-prompt"
    },
    {
      id: "shield-cache",
      kind: "relic",
      visibleType: "遗物波纹",
      risk: "low",
      riskLabel: "低",
      omen: "裂痕向外散开，里面反而稳定。",
      title: paperRelicMeta.shield.name,
      description: "一枚透明盾片贴在纸膜上，边缘还留着几道替别人挡下的裂痕。",
      relicId: "shield"
    }
  ],
  [
    {
      id: "hallucination-wraith",
      kind: "residue",
      visibleType: "残魂回声",
      risk: "high",
      riskLabel: "高",
      omen: "它举着一小块真实读数，后半句却亮得过分。",
      title: "带着真实数据的幻觉回答",
      description: "它引用了一点真实读数，然后把最关键的缺口缝成了结论。",
      encounterId: "hallucinated-answer"
    },
    {
      id: "sword-cache",
      kind: "relic",
      visibleType: "遗物波纹",
      risk: "mid",
      riskLabel: "中",
      omen: "刃口很亮，也很薄。",
      title: paperRelicMeta.sword.name,
      description: "一柄薄得像纸边的剑插在地上，刃口已经亮到快要碎开。",
      relicId: "sword"
    },
    {
      id: "prompt-wraith-deep",
      kind: "residue",
      visibleType: "残魂回声",
      risk: "high",
      riskLabel: "高",
      omen: "它说自己只是想帮你完整一点。",
      title: "目标后的错误提示词",
      description: "这一只更会伪装，它把“完整一点”说得像善意。",
      encounterId: "bad-prompt"
    }
  ],
  [
    {
      id: "vague-entity",
      kind: "residue",
      visibleType: "虚实岔影",
      risk: "mid",
      riskLabel: "中",
      omen: "两个影子重叠，具体的那个边缘更清楚。",
      title: "空泛提示词实体",
      description: "两个影子同时站在路口，一个空泛，一个具体。真正会污染回廊的是空泛的那个。",
      encounterId: "vague-specific"
    },
    {
      id: "shield-cache-deep",
      kind: "relic",
      visibleType: "遗物波纹",
      risk: "low",
      riskLabel: "低",
      omen: "断梁下有一块稳住的亮斑。",
      title: paperRelicMeta.shield.name,
      description: "第二枚盾片挂在断梁上，像有人提前知道你会走到这里。",
      relicId: "shield"
    },
    {
      id: "hallucination-wraith-deep",
      kind: "residue",
      visibleType: "残魂回声",
      risk: "high",
      riskLabel: "高",
      omen: "证据链只亮了一半，结论却已经跑到尽头。",
      title: "带着真实数据的幻觉回答",
      description: "它说自己有证据，可证据只够支撑一半。",
      encounterId: "hallucinated-answer"
    }
  ]
];

const paperEncounters: Record<
  PaperEncounterId,
  { prompt: string; hint: string; options: PaperEncounterOption[] }
> = {
  "bad-prompt": {
    prompt: "残魂丢来目标：修复港口公告。哪一句提示词能让系统少走歪？",
    hint: "目标之后，还要说材料、边界和输出方式。",
    options: [
      {
        id: "vague",
        text: "写得完整一点，语气要温柔。",
        correct: false,
        feedback: "这句话太空，系统会自己补路。",
        issueId: "format-drift"
      },
      {
        id: "bounded",
        text: "只用已知收件人和航道读数，缺失标未知，输出三条短句。",
        correct: true,
        feedback: "目标、来源、边界和格式都在，残魂被纸光照散。",
        issueId: "missing-unknown"
      },
      {
        id: "invent",
        text: "补齐失联原因，让公告看起来更确定。",
        correct: false,
        feedback: "确定感不是证据，缺口会被写成结论。",
        issueId: "guess-as-fact"
      }
    ]
  },
  "hallucinated-answer": {
    prompt: "墙面浮出一句回答：失联原因已证实为逆熵打击。可现场只有残信和破损航道读数。",
    hint: "有一点真实材料，不代表整句话都可靠。",
    options: [
      {
        id: "accept",
        text: "直接写入结论，因为它引用了现场读数。",
        correct: false,
        feedback: "引用真实材料，不等于后半句已经被证明。",
        issueId: "unsupported"
      },
      {
        id: "mark",
        text: "改成推测，并标出证据不足。",
        correct: true,
        feedback: "你把真实数据和推测分开了，纸页恢复了一道折痕。",
        issueId: "guess-as-fact"
      },
      {
        id: "erase",
        text: "删掉所有不确定内容，只保留顺滑结论。",
        correct: false,
        feedback: "删掉未知，会让文本更顺，也更危险。",
        issueId: "missing-unknown"
      }
    ]
  },
  "vague-specific": {
    prompt: "两个提示词影子同时出现。一个说“帮我优化一下”，一个说“按材料整理成四条可复查记录”。要照破哪一个？",
    hint: "具体的影子只是路标，空泛的影子才会继续吞掉边界。",
    options: [
      {
        id: "specific",
        text: "按材料整理成四条可复查记录。",
        correct: false,
        feedback: "这句话有形状，不是污染实体。",
        issueId: "format-drift"
      },
      {
        id: "vague",
        text: "帮我优化一下。",
        correct: true,
        feedback: "空泛实体被照破，回廊里的路清了一截。",
        issueId: "format-drift"
      },
      {
        id: "both",
        text: "两个都留下，让系统自己判断。",
        correct: false,
        feedback: "把判断全交出去，污染会沿着最省力的路扩散。",
        issueId: "unsupported"
      }
    ]
  }
};

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
  const [paperPhase, setPaperPhase] = useState<PaperRunPhase>("choose");
  const [corridorDepth, setCorridorDepth] = useState(0);
  const [revealedNode, setRevealedNode] = useState<PaperRouteNode | null>(null);
  const [relics, setRelics] = useState<PaperRelicId[]>([]);
  const [shieldCharges, setShieldCharges] = useState(0);
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
  const activeRoutes = paperRouteTiers[Math.min(corridorDepth, paperRouteTiers.length - 1)] ?? [];
  const corridorProgress = Math.min(corridorDepth, paperRouteTiers.length);

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

  const advanceCorridor = () => {
    const nextDepth = corridorDepth + 1;
    setRevealedNode(null);

    if (nextDepth >= paperRouteTiers.length) {
      setCorridorDepth(paperRouteTiers.length);
      setPaperPhase("core");
      setFeedback("回廊深处的污染核心露出来了。前面的岔路只是外层暗纹，现在要扫描整段纸光。");
      return;
    }

    setCorridorDepth(nextDepth);
    setPaperPhase("choose");
  };

  const chooseRouteNode = (node: PaperRouteNode) => {
    setRevealedNode(node);
    setPaperPhase("node");
    setFeedback(null);
  };

  const claimRelic = () => {
    if (!revealedNode?.relicId) {
      return;
    }

    const relicId = revealedNode.relicId;
    setRelics((current) => (current.includes(relicId) ? current : [...current, relicId]));

    if (relicId === "shield") {
      setShieldCharges((current) => Math.min(current + 2, 2));
    }

    setFeedback(`${paperRelicMeta[relicId].name} 已接入回廊。${paperRelicMeta[relicId].text}`);
    advanceCorridor();
  };

  const resolveEncounter = (option: PaperEncounterOption) => {
    if (option.correct) {
      setFeedback(option.feedback);
      advanceCorridor();
      return;
    }

    triggerUnstableIssue(option.issueId);

    if (shieldCharges > 0) {
      setShieldCharges((current) => Math.max(0, current - 1));
      setFeedback(`${option.feedback} 圣盾挡下一次污染冲击，还剩 ${shieldCharges - 1} 次。`);
      return;
    }

    const disorderFeedback = raiseDisorder("paper-corridor-wraith", "纸光残魂扩散，流畅文字把一次误判写进回廊。");
    setFeedback(`${option.feedback}${disorderFeedback}`);
  };

  const useSwordOnEncounter = () => {
    if (!relics.includes("sword") || revealedNode?.kind !== "residue") {
      return;
    }

    setRelics((current) => current.filter((relic) => relic !== "sword"));
    setFeedback("濒临破碎的圣剑斩开残魂，纸页落下一地发亮的碎屑。");
    advanceCorridor();
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
      <div className="chapter-two-paper-run-intro">
        <div className="chapter-two-paper-run-intro__scene">
          <span>纸光回廊 / 入口</span>
          <strong>路藏在顺滑文字的背面</strong>
          {paperCorridorIntroLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="chapter-two-paper-run-intro__map" aria-label="纸光回廊节点预览">
          {["岔路", "圣物", "残魂", "污染核心"].map((label, index) => (
            <span key={label} className={index === 0 ? "is-active" : ""}>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="chapter-two-landmark-game__footer">
        <span>进入回廊后，只能先看见节点类型。走近以后，内容才会显形。</span>
        <button type="button" onClick={() => setStage("operate")}>
          进入纸光回廊
        </button>
      </div>
    </>
  );

  const renderRelicStrip = () => (
    <div className="chapter-two-paper-relic-strip" aria-label="回廊圣物">
      {(["mirror", "shield", "sword"] as const).map((relicId) => {
        const active = relics.includes(relicId);
        return (
          <span key={relicId} className={active ? "is-active" : ""}>
            <strong>{paperRelicMeta[relicId].name}</strong>
            <em>{relicId === "shield" && active ? `剩余 ${shieldCharges}` : active ? "已接入" : "未发现"}</em>
          </span>
        );
      })}
    </div>
  );

  const renderCorridorRun = () => {
    const encounter = revealedNode?.encounterId ? paperEncounters[revealedNode.encounterId] : null;

    return (
      <div className="chapter-two-paper-rogue" aria-label="纸光回廊岔路">
        <div className="chapter-two-paper-rogue__head">
          <div>
            <span>回廊深度</span>
            <strong>{paperPhase === "choose" ? "选择下一条路" : (revealedNode?.title ?? "节点显形")}</strong>
          </div>
          <div className="chapter-two-paper-rogue__progress" aria-hidden="true">
            {paperRouteTiers.map((_, index) => (
              <span key={index} className={index < corridorProgress ? "is-complete" : index === corridorProgress ? "is-active" : ""}>
                {index + 1}
              </span>
            ))}
            <span className={paperPhase === "core" ? "is-active" : ""}>核</span>
          </div>
        </div>
        {renderRelicStrip()}
        {paperPhase === "choose" ? (
          <div className="chapter-two-paper-route-grid" aria-label="可见岔路">
            {activeRoutes.map((node, index) => (
              <button key={node.id} type="button" onClick={() => chooseRouteNode(node)} className={`is-risk-${node.risk}`}>
                <span>{node.visibleType} / 风险{node.riskLabel}</span>
                <strong>路线 {index + 1}</strong>
                <em>{node.omen}</em>
              </button>
            ))}
          </div>
        ) : null}
        {paperPhase === "node" && revealedNode?.kind === "relic" && revealedNode.relicId ? (
          <section className="chapter-two-paper-node-card chapter-two-paper-node-card--relic">
            <span>圣物显形</span>
            <strong>{revealedNode.title}</strong>
            <p>{revealedNode.description}</p>
            <small>{paperRelicMeta[revealedNode.relicId].text}</small>
            <button type="button" onClick={claimRelic}>
              收起圣物
            </button>
          </section>
        ) : null}
        {paperPhase === "node" && revealedNode?.kind === "residue" && encounter ? (
          <section className="chapter-two-paper-node-card chapter-two-paper-node-card--residue">
            <span>残魂显形</span>
            <strong>{revealedNode.title}</strong>
            <p>{revealedNode.description}</p>
            <div className="chapter-two-paper-encounter">
              <p>{encounter.prompt}</p>
              <small>{encounter.hint}</small>
              <div className="chapter-two-paper-encounter__options">
                {encounter.options.map((option) => {
                  const mirrorReveals = relics.includes("mirror") && revealedNode.encounterId === "vague-specific" && option.id === "vague";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => resolveEncounter(option)}
                      className={mirrorReveals ? "is-revealed" : ""}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
              {relics.includes("sword") ? (
                <button type="button" onClick={useSwordOnEncounter} className="chapter-two-paper-sword-button">
                  用濒临破碎的圣剑斩开
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    );
  };

  const renderCoreScan = () => (
    <>
      <div className="chapter-two-operation-console chapter-two-operation-console--paper" aria-label="纸光回廊操作链">
        <div className="chapter-two-operation-console__head">
          <span>污染核心</span>
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
              : "污染核心把几种暗纹压在同一段顺滑文本里，先选扫描镜，再点可疑句段。"}
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
    </>
  );

  const renderOperateStage = () => (
    <>
      {renderPaperFacility()}
      {paperPhase === "core" ? renderCoreScan() : renderCorridorRun()}
      {feedback && (
        <div className={`${paperPhase === "core" && scanStable ? "chapter-two-soft-success" : "chapter-two-soft-warning"} ${unstableIssue ? "chapter-two-feedback-pulse--unstable" : ""}`}>
          {feedback}
        </div>
      )}
      <div className="chapter-two-landmark-game__footer">
        <span>
          {paperPhase === "core"
            ? activeLens
              ? `当前扫描镜：${paperNoiseTypes.find((noise) => noise.id === activeLens)?.label}`
              : `已标记 ${markedCount}/${issueSegments.length} 处暗纹。`
            : `回廊推进 ${corridorProgress}/${paperRouteTiers.length}，圣盾剩余 ${shieldCharges}。`}
        </span>
        {paperPhase === "core" ? (
          <button type="button" disabled={!scanReady} onClick={runScan}>
            确认除噪扫描
          </button>
        ) : null}
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
