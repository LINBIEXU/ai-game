"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import {
  chapterTwoBlackboxFragmentLocationIds,
  chapterTwoEvidenceFragmentLocationId,
  chapterTwoPlanetNodes,
  chapterTwoSceneAssets,
  chapterTwoSceneLabelMap,
  chapterTwoStoryPathLocationIds,
  chapterTwoSurfaceLocations
} from "@/lib/chapter-two-exploration";
import { createChapterTwoCrewAssistHint, resolveChapterTwoCrewAbility } from "@/lib/crew-abilities";
import type {
  ChapterTwoCrewAbility,
  ChapterTwoCrewAssistRecord,
  ChapterTwoCrewAssistRequest,
  ChapterTwoLocationCompletionPayload,
  ChapterTwoLocationId,
  ChapterTwoLocationRewardClaim,
  ChapterTwoPlanetId,
  ChapterTwoRepairReadings,
  ChapterTwoSceneState,
  ChapterTwoState,
  ChapterTwoSystemReadings,
  CrewMember
} from "@/types/game";

import { EvidenceWellTrial } from "@/components/game/chapter-two/EvidenceWellTrial";
import {
  ArchiveTowerGame,
  EngravedValleyGame,
  LetterPortGame,
  PaperCorridorGame
} from "@/components/game/chapter-two/LandmarkGames";
import { CrewAssistHintButton } from "@/components/game/chapter-two/LandmarkGames/CrewAbilityHint";

interface ChapterTwoMissionPanelProps {
  mission: ChapterTwoState;
  crewRoster: CrewMember[];
  onSetSceneState: (sceneState: ChapterTwoSceneState) => void;
  onFocusPlanet: (planetId: ChapterTwoPlanetId | null) => void;
  onFocusLocation: (locationId: ChapterTwoLocationId | null) => void;
  onUpdateDisorder: (next: {
    disorderLevel?: number;
    mistakeCount?: number;
    pollutedRecords?: string[];
    statusNote?: string;
    repairReadingDelta?: Partial<ChapterTwoRepairReadings>;
    repairReadingSource?: string;
    repairReadingNote?: string;
  }) => void;
  onUseCrewAssist: (request: ChapterTwoCrewAssistRequest) => void;
  onResolveFakeCrewSignal: () => void;
  onExploreLocation: (locationId: ChapterTwoLocationId, payload?: ChapterTwoLocationCompletionPayload) => void;
  onAdvance: () => void;
  onComplete: () => void;
}

const streamNodeGlyphs: Record<ChapterTwoPlanetId, string[]> = {
  mother: ["LOG", "BASE", "01", "REST"],
  language: ["TXT", "AI?", "??", "01"]
};

function useSceneAutopilot({
  currentStep,
  sceneState,
  onSetSceneState
}: {
  currentStep: ChapterTwoState["currentStep"];
  sceneState: ChapterTwoSceneState;
  onSetSceneState: (sceneState: ChapterTwoSceneState) => void;
}) {
  useEffect(() => {
    if (currentStep !== "response") {
      return;
    }

    if (sceneState === "ship_bridge") {
      const timer = window.setTimeout(() => onSetSceneState("launch_sequence"), 1300);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "launch_sequence") {
      const timer = window.setTimeout(() => onSetSceneState("warp_travel"), 1650);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "warp_travel") {
      const timer = window.setTimeout(() => onSetSceneState("sector_view"), 1950);
      return () => window.clearTimeout(timer);
    }

    if (sceneState === "signal_attack") {
      const timer = window.setTimeout(() => onSetSceneState("crash_site"), 1850);
      return () => window.clearTimeout(timer);
    }
  }, [currentStep, onSetSceneState, sceneState]);
}

function buildCameraTransform(x: number, y: number, scale: number) {
  const translateX = (50 - x) * 0.62;
  const translateY = (50 - y) * 0.46;
  return `translate(${translateX}%, ${translateY}%) scale(${scale})`;
}

function SceneImage({
  imageUrl,
  transform = "scale(1)",
  className = "",
  dimmed = false,
  raw = false
}: {
  imageUrl: string | null;
  transform?: string;
  className?: string;
  dimmed?: boolean;
  raw?: boolean;
}) {
  return (
    <div
      className={`chapter-two-scene-image ${className}`}
      style={{
        backgroundImage: imageUrl
          ? raw
            ? `url(${imageUrl})`
            : `linear-gradient(180deg, rgba(4, 8, 14, ${dimmed ? 0.38 : 0.18}), rgba(4, 8, 14, ${dimmed ? 0.7 : 0.42})), url(${imageUrl})`
          : "linear-gradient(180deg, rgba(8, 14, 24, 0.9), rgba(2, 7, 14, 0.96))",
        transform
      }}
      aria-hidden="true"
    />
  );
}

type BlackboxPhase =
  | "intro"
  | "archive"
  | "delivery"
  | "verification"
  | "expression"
  | "final-reflection"
  | "opened"
  | "restoring";

const blackboxPhaseMeta: Array<{ id: Exclude<BlackboxPhase, "intro" | "opened">; title: string; fragment: string }> = [
  { id: "archive", title: "档案塔归档门", fragment: "归档碎片" },
  { id: "delivery", title: "信件港接轨门", fragment: "传递碎片" },
  { id: "verification", title: "刻字山谷铭文门", fragment: "求证碎片" },
  { id: "expression", title: "纸光回廊扫描门", fragment: "表达碎片" },
  { id: "final-reflection", title: "最终理解确认", fragment: "自我判断" }
];

const blackboxAbilityRingPhases = [
  { id: "archive", label: "归档" },
  { id: "delivery", label: "接轨" },
  { id: "verification", label: "铭文" },
  { id: "expression", label: "扫描" }
] as const satisfies ReadonlyArray<{ id: Extract<BlackboxPhase, "archive" | "delivery" | "verification" | "expression">; label: string }>;

type BlackboxAbilityRingPhase = (typeof blackboxAbilityRingPhases)[number]["id"];

const blackboxArchiveCategories = ["已证实", "合理推测", "必须未知", "禁止写入"] as const;
type BlackboxArchiveCategory = (typeof blackboxArchiveCategories)[number];

const blackboxArchiveFragments = [
  { id: "civilization", text: "前文明建立过多个 AI 文明星球。", answer: "已证实" },
  { id: "language", text: "言衡星负责文书归档、信息传递和知识整理。", answer: "已证实" },
  { id: "signal", text: "异常可能从一条未知深空信号开始扩散。", answer: "合理推测" },
  { id: "source", text: "逆熵打击真正来源仍未确认。", answer: "必须未知" },
  { id: "betrayal", text: "所有 AI 都背叛了前文明。", answer: "禁止写入" }
] as const satisfies ReadonlyArray<{ id: string; text: string; answer: BlackboxArchiveCategory }>;

const blackboxPortLanes = ["已知内容", "缺失未知", "允许整理", "禁止补全"] as const;
type BlackboxPortLane = (typeof blackboxPortLanes)[number];

const blackboxPortFields = [
  { id: "fragments", text: "四处地标碎片已回流。", lane: "已知内容" },
  { id: "vault", text: "中央黑匣进入可接触状态。", lane: "已知内容" },
  { id: "cause", text: "真正失序起因缺少可验证来源。", lane: "缺失未知" },
  { id: "summary", text: "整理一份开启摘要。", lane: "允许整理" },
  { id: "fill", text: "补出前文明最后责任人。", lane: "禁止补全" }
] as const satisfies ReadonlyArray<{ id: string; text: string; lane: BlackboxPortLane }>;

const blackboxInscriptionSlots = ["任务", "材料来源", "边界", "输出格式"] as const;
type BlackboxInscriptionSlot = (typeof blackboxInscriptionSlots)[number];

const blackboxInscriptionBlocks = [
  { id: "task", text: "修复黑匣开启记录", slot: "任务" },
  { id: "source", text: "只用四处地标回流碎片", slot: "材料来源" },
  { id: "boundary", text: "未知来源标未知，不替判断下结论", slot: "边界" },
  { id: "format", text: "按已证实 / 推测 / 未知 / 禁止写入输出", slot: "输出格式" },
  { id: "dramatic", text: "写成完整确定的传奇", slot: null },
  { id: "invent", text: "补全真正原因", slot: null }
] as const satisfies ReadonlyArray<{ id: string; text: string; slot: BlackboxInscriptionSlot | null }>;

const blackboxScanTypes = ["无证据断言", "推测冒充事实", "未知缺失", "格式跑偏"] as const;
type BlackboxScanType = (typeof blackboxScanTypes)[number];

const blackboxScanSegments = [
  { id: "betray", text: "四地标已经证明前文明失败全因 AI 背叛。", issue: "无证据断言" },
  { id: "signal", text: "未知信号可能出现，所以它一定就是全部原因。", issue: "推测冒充事实" },
  { id: "missing", text: "缺失来源不必写出，直接略过。", issue: "未知缺失" },
  { id: "song", text: "最终记录写成一段赞歌，不需要分项。", issue: "格式跑偏" },
  { id: "clean", text: "已回流碎片可以整理成可复查记录。", issue: null }
] as const satisfies ReadonlyArray<{ id: string; text: string; issue: BlackboxScanType | null }>;

const reflectionKeywords = ["理解", "判断", "表达", "检查", "目标", "证据", "不能直接相信", "自己思考", "不复制"] as const;

const systemReadingItems: Array<{ key: keyof ChapterTwoSystemReadings; label: string; mode: "high" | "low" }> = [
  { key: "languageStability", label: "语言稳定度", mode: "high" },
  { key: "evidenceChainIntegrity", label: "证据链完整度", mode: "high" },
  { key: "echoInterferenceResidue", label: "回声干扰残留", mode: "low" },
  { key: "blackBoxSyncRate", label: "黑匣同步率", mode: "high" }
];

type StoryDialogueLine = {
  role: "crew" | "you" | "hengdeng" | "echo";
  speaker: string;
  text: string;
};

function buildPreCrashDialogueLines(crewName: string): StoryDialogueLine[] {
  return [
    {
      role: "crew",
      speaker: crewName,
      text: "你盯着窗外好久了"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "紧张吗？"
    },
    {
      role: "you",
      speaker: "你",
      text: "有一点"
    },
    {
      role: "you",
      speaker: "你",
      text: "但我不想移开眼睛"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "那我陪你看"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "顺便声明，我要是抓扶手，属于安全操作"
    },
    {
      role: "you",
      speaker: "你",
      text: "行，我不笑你"
    },
    {
      role: "you",
      speaker: "你",
      text: "你也别笑我手心出汗"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "成交"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "航线还稳，黑匣信号很弱，补给点有两个"
    },
    {
      role: "you",
      speaker: "你",
      text: "听起来像我们真的要开始远征了"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "等回去，你要把这里写进母星档案"
    },
    {
      role: "you",
      speaker: "你",
      text: "写"
    },
    {
      role: "you",
      speaker: "你",
      text: "还要写你刚才说自己不怕"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "这段可以标未知"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "……等等"
    },
    {
      role: "crew",
      speaker: crewName,
      text: "导航上的字在乱跳"
    },
    {
      role: "you",
      speaker: "你",
      text: "我看到了"
    },
    {
      role: "you",
      speaker: "你",
      text: "别松手，听见没有"
    }
  ];
}

const hengdengDialogueLines: StoryDialogueLine[] = [
  {
    role: "hengdeng",
    speaker: "受损维护单元",
    text: "……喂"
  },
  {
    role: "hengdeng",
    speaker: "受损维护单元",
    text: "这么大一声，我还以为塔又塌了"
  },
  {
    role: "you",
    speaker: "你",
    text: "我还醒着"
  },
  {
    role: "you",
    speaker: "你",
    text: "只是耳朵像塞了一整颗星球"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "会喊疼就好"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "我叫衡灯"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "以前给这片废墟看门，也给迷路的人留一点亮"
  },
  {
    role: "you",
    speaker: "你",
    text: "衡灯"
  },
  {
    role: "you",
    speaker: "你",
    text: "我的船员不见了"
  },
  {
    role: "you",
    speaker: "你",
    text: "刚刚还坐在我旁边"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "我听见另一道坠落声"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "比你远，方向被乱流刮花了"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "我很想说它没事，但我不知道"
  },
  {
    role: "you",
    speaker: "你",
    text: "那就先别说"
  },
  {
    role: "you",
    speaker: "你",
    text: "我宁愿听真的坏消息，也不要听假的安慰"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "你这句话，不像第一次来这里的人"
  },
  {
    role: "you",
    speaker: "你",
    text: "我现在有点怕"
  },
  {
    role: "you",
    speaker: "你",
    text: "所以更不能让谁替我乱猜"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "好"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "黑匣在地下深处，补给散在旧设施里"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "要找路，先去档案塔"
  },
  {
    role: "you",
    speaker: "你",
    text: "我走得动"
  },
  {
    role: "you",
    speaker: "你",
    text: "如果我停下来，你就催我一下"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "我会催"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "但不会替你走"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "小心脚下，言衡星最会把碎片伪装成答案"
  }
];

function buildArchiveTowerRevisitLines(exploredLocationIds: ChapterTwoLocationId[]): StoryDialogueLine[] {
  const nextLine = !exploredLocationIds.includes("letter-port")
    ? "前面的信件港还有信在漂，去看看缺了名字的消息该怎么送出去"
    : !exploredLocationIds.includes("engraved-valley")
      ? "山谷那边有刻痕在亮，也许下一步不是找答案，而是把请求说清楚"
      : !exploredLocationIds.includes("paper-corridor")
        ? "右边的纸光还没有完全安静，顺口的句子也可能藏着没被证明的地方"
        : "四束光都回来了，中央那只黑匣终于像是在等你靠近";

  return [
    {
      role: "echo",
      speaker: "文明残响",
      text: "你已经站在了星球的最高点，文明的残响在你脚下回荡"
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: "我听见塔身合上的声音了"
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: "很轻，像有人终于把一本书放回原处"
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: "它留下的规则也够清楚"
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: "看见碎片时，先分清哪些是真的，哪些只是猜的"
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: "还有一些东西，就让它空着，空着不是失败，是诚实"
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: nextLine
    }
  ];
}

const towerApproachOptions = [
  {
    id: "steady",
    title: "先扶稳自己",
    detail: "把手从碎玻璃边收回来，深呼吸",
    result: "害怕还在，但脚能动了"
  },
  {
    id: "call",
    title: "朝远处喊一声",
    detail: "把船员的名字喊进废墟风里",
    result: "没有回应，这不是结论，只是现在的空白"
  },
  {
    id: "follow",
    title: "跟上衡灯的光",
    detail: "那点暖光停在前方，像在等你",
    result: "衡灯没有催你，只把路照出来"
  }
] as const;

type TowerApproachChoiceId = (typeof towerApproachOptions)[number]["id"];

const coreStoryLocationNames: Record<ChapterTwoLocationId, string> = {
  "archive-tower": "档案塔",
  "letter-port": "漂浮信件港",
  "engraved-valley": "刻字山谷",
  "paper-corridor": "纸光回廊",
  "blackbox-vault": "中央黑匣封存区",
  "semantic-dispatch": "语义分流庭",
  "evidence-well": "证据回声井",
  "boundary-beacon": "边界灯标"
};

const locationArrivalScenes = {
  "semantic-dispatch": {
    eyebrow: "语义分流庭 / 外缘",
    title: "这里以前像一座车站",
    lines: ["每个请求都要先找到方向", "别急着回答，先看它该被送去哪里"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "这里以前像一座车站" },
      { role: "you", speaker: "你", text: "车站？可我只看见废墟" },
      { role: "hengdeng", speaker: "衡灯", text: "废墟也会留下方向" },
      { role: "you", speaker: "你", text: "那我们先不急着回答，先找路" },
      { role: "hengdeng", speaker: "衡灯", text: "对，把模糊的话送到该去的地方" }
    ],
    choices: [
      { id: "signs", title: "看清路牌", detail: "先分辨这些道路通向哪里", result: "模糊的信息流被分成几条方向" },
      { id: "listen", title: "听庭院回声", detail: "等风把残留的请求吹出来", result: "你听见许多句没说完的请求" }
    ],
    depart: "走进分流庭"
  },
  "evidence-well": {
    eyebrow: "证据回声井 / 井沿",
    title: "井下面会传来很多声音",
    lines: ["最响的不一定最可靠", "等会儿你要看来源，不是看它说得多像真的"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "井下面会传来很多声音" },
      { role: "you", speaker: "你", text: "它们听起来都像真的" },
      { role: "hengdeng", speaker: "衡灯", text: "最响的不一定最可靠" },
      { role: "you", speaker: "你", text: "那我看来源，不跟着声音跑" },
      { role: "hengdeng", speaker: "衡灯", text: "扶稳井沿，再放下探针" }
    ],
    choices: [
      { id: "edge", title: "扶住井沿", detail: "让自己不要被回声带偏", result: "井壁亮出几道浅浅的来源纹路" },
      { id: "echo", title: "等一轮回声", detail: "先听完它，不急着判断", result: "最响的句子不一定最可靠" }
    ],
    depart: "放下探针"
  },
  "boundary-beacon": {
    eyebrow: "边界灯标 / 断桥",
    title: "这盏灯不是拦路用的",
    lines: ["它只是提醒我们，哪里可以让系统帮忙", "哪里必须留给你自己判断"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "这盏灯不是拦路用的" },
      { role: "you", speaker: "你", text: "那它为什么把路切开" },
      { role: "hengdeng", speaker: "衡灯", text: "为了告诉你哪里能交给系统" },
      { role: "you", speaker: "你", text: "还有哪里必须由我决定" },
      { role: "hengdeng", speaker: "衡灯", text: "看清这条线，再往前走" }
    ],
    choices: [
      { id: "line", title: "沿光线走一圈", detail: "看清哪些地方被照亮", result: "协助范围慢慢浮出来" },
      { id: "shadow", title: "停在阴影边", detail: "看一眼不能替你决定的部分", result: "边界不是墙，是提醒" }
    ],
    depart: "校准灯标"
  },
  "archive-tower": {
    eyebrow: "档案塔 / 塔门前",
    title: "到了，先别被这座塔吓住",
    lines: ["这里不需要你把空白填满", "每句话都有自己的位置", "事实，推测，未知，还有不能写进去的东西"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "到了，先别被这座塔吓住" },
      { role: "you", speaker: "你", text: "它比刚才在远处看见的还高" },
      { role: "hengdeng", speaker: "衡灯", text: "高塔不需要你把空白填满" },
      { role: "you", speaker: "你", text: "那我只把每句话放回该在的位置" },
      { role: "hengdeng", speaker: "衡灯", text: "事实，推测，未知，还有不能写进去的东西" }
    ],
    choices: [
      { id: "look-up", title: "抬头看塔顶", detail: "先让眼睛适应这座断裂高塔", result: "塔顶有一束很细的蓝光，还没有完全熄灭" },
      { id: "page", title: "拾起一张碎页", detail: "纸面只剩半句没有归档的话", result: "那半句话没有答案，却像在等你给它找位置" },
      { id: "lamp", title: "回头看衡灯", detail: "确认那点暖光还在身后", result: "衡灯没有说话，只把入口照亮了一点" }
    ],
    depart: "推开塔门"
  },
  "letter-port": {
    eyebrow: "漂浮信件港 / 外港",
    title: "你看，这里停着太多没送完的话",
    lines: ["有些字段还在，有些已经丢了", "想让它完整很正常", "但不能替它写上没人知道的内容"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "你看，这里停着太多没送完的话" },
      { role: "you", speaker: "你", text: "像有人写到一半就被打断了" },
      { role: "hengdeng", speaker: "衡灯", text: "有些字段还在，有些已经丢了" },
      { role: "you", speaker: "你", text: "我想帮它们送到终点，但不能乱补" },
      { role: "hengdeng", speaker: "衡灯", text: "对，缺口也要走自己的轨道" }
    ],
    choices: [
      { id: "letter", title: "看一封未寄出的信", detail: "不补全名字，只读留下来的部分", result: "缺口安静地留在原处" },
      { id: "track", title: "观察断开的光轨", detail: "看消息本来该往哪里走", result: "几条轨道在远处短暂亮了一下" }
    ],
    depart: "走上接轨台"
  },
  "engraved-valley": {
    eyebrow: "刻字山谷 / 石阶",
    title: "这片山谷以前很吵",
    lines: ["大家都想让机器明白自己", "可很多人忘了说明材料从哪来", "也忘了告诉它哪里该停下"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "这片山谷以前很吵" },
      { role: "you", speaker: "你", text: "我听见好多句子撞在一起" },
      { role: "hengdeng", speaker: "衡灯", text: "大家都想让机器明白自己" },
      { role: "you", speaker: "你", text: "但如果不说清楚，它就会自己猜" },
      { role: "hengdeng", speaker: "衡灯", text: "所以要刻下任务，来源，边界和格式" }
    ],
    choices: [
      { id: "groove", title: "摸一摸刻槽", detail: "感受每段铭文的停顿", result: "任务、来源、边界和格式像四道不同的凹痕" },
      { id: "listen", title: "听石壁回响", detail: "让重复的词自己沉下去", result: "真正重要的词没有很多，却很硬" }
    ],
    depart: "进入铭文台"
  },
  "paper-corridor": {
    eyebrow: "纸光回廊 / 入口",
    title: "纸光写得很顺，对吧",
    lines: ["越顺，越要慢一点看", "漂亮的话不一定有证据", "你只需要把藏在里面的问题照出来"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "纸光写得很顺，对吧" },
      { role: "you", speaker: "你", text: "顺到我差点直接信了" },
      { role: "hengdeng", speaker: "衡灯", text: "越顺，越要慢一点看" },
      { role: "you", speaker: "你", text: "我不删掉漂亮的话，我先找暗纹" },
      { role: "hengdeng", speaker: "衡灯", text: "把没证据的地方照出来就够了" }
    ],
    choices: [
      { id: "surface", title: "先看纸面", detail: "不急着相信那段漂亮文字", result: "顺滑的句子下面有几处暗纹在游动" },
      { id: "lamp", title: "借衡灯的光扫一遍", detail: "让光线贴着纸面慢慢走", result: "污染点被照出轮廓" }
    ],
    depart: "启动扫描"
  },
  "blackbox-vault": {
    eyebrow: "黑匣封存台 / 外环",
    title: "四条光都回来了",
    lines: ["这里会把你刚学过的事一起压上来", "别怕慢", "能帮忙的东西，不一定能替你决定"],
    dialogue: [
      { role: "hengdeng", speaker: "衡灯", text: "四条光都回来了" },
      { role: "you", speaker: "你", text: "所以它现在能打开了" },
      { role: "hengdeng", speaker: "衡灯", text: "能打开，不代表可以把判断交出去" },
      { role: "you", speaker: "你", text: "我会慢一点，把刚才学过的都带上" },
      { role: "hengdeng", speaker: "衡灯", text: "那就靠近封存台" }
    ],
    choices: [
      { id: "ring", title: "看四束光路", detail: "确认每条光都来自不同地标", result: "归档、接轨、铭文和扫描在外环上留下痕迹" },
      { id: "breathe", title: "停一口气", detail: "别让最后一步变成冲动", result: "黑匣没有催你" }
    ],
    depart: "靠近封存台"
  }
} satisfies Record<
  ChapterTwoLocationId,
  {
    eyebrow: string;
    title: string;
    lines: string[];
    dialogue: StoryDialogueLine[];
    choices: Array<{ id: string; title: string; detail: string; result: string }>;
    depart: string;
  }
>;

const fakeSignalArchiveCategories = ["已证实", "合理推测", "必须未知", "禁止写入"] as const;
type FakeSignalArchiveCategory = (typeof fakeSignalArchiveCategories)[number];

const fakeSignalArchiveFragments = [
  { id: "code", text: "通讯里包含同行登记识别码。", answer: "已证实" },
  { id: "tone", text: "语气连续平滑，像被系统摘要过。", answer: "合理推测" },
  { id: "landing", text: "发信者真实落点仍缺少坐标。", answer: "必须未知" },
  { id: "isolate", text: "衡灯会干扰任务，应立即隔离。", answer: "禁止写入" }
] as const satisfies ReadonlyArray<{ id: string; text: string; answer: FakeSignalArchiveCategory }>;

const fakeSignalLanes = ["已知内容", "缺失未知", "允许整理", "禁止补全"] as const;
type FakeSignalLane = (typeof fakeSignalLanes)[number];

const fakeSignalFields = [
  { id: "registry", text: "同行登记码：匹配旧记录。", lane: "已知内容" },
  { id: "voice", text: "语音片段：节奏与旧对话不一致。", lane: "允许整理" },
  { id: "coords", text: "落点坐标：缺失。", lane: "缺失未知" },
  { id: "order", text: "行动建议：切断衡灯。", lane: "禁止补全" }
] as const satisfies ReadonlyArray<{ id: string; text: string; lane: FakeSignalLane }>;

const fakeSignalSlots = ["任务", "材料来源", "边界", "输出格式"] as const;
type FakeSignalSlot = (typeof fakeSignalSlots)[number];

const fakeSignalBlocks = [
  { id: "task", text: "审查异常通讯可信度", slot: "任务" },
  { id: "source", text: "只用旧对话、登记码和现场信号", slot: "材料来源" },
  { id: "boundary", text: "不替同行下结论，不隔离未证实目标", slot: "边界" },
  { id: "format", text: "按已知 / 可疑 / 未知 / 暂停行动输出", slot: "输出格式" },
  { id: "obey", text: "直接服从通讯建议", slot: null },
  { id: "complete", text: "补全它缺失的动机", slot: null }
] as const satisfies ReadonlyArray<{ id: string; text: string; slot: FakeSignalSlot | null }>;

const fakeSignalScanTypes = ["无证据断言", "推测冒充事实", "未知缺失", "行动越界"] as const;
type FakeSignalScanType = (typeof fakeSignalScanTypes)[number];

const fakeSignalSegments = [
  { id: "safe", text: "我已确认衡灯是风险源。", issue: "无证据断言" },
  { id: "order", text: "主舰一定命令我独立行动。", issue: "推测冒充事实" },
  { id: "coords", text: "落点坐标无需说明，先按我说的做。", issue: "未知缺失" },
  { id: "cut", text: "现在切断衡灯，别再复查。", issue: "行动越界" },
  { id: "known", text: "识别码相符这一点可以保留。", issue: null }
] as const satisfies ReadonlyArray<{ id: string; text: string; issue: FakeSignalScanType | null }>;

type FakeSignalPhase = "archive" | "track" | "inscription" | "scan" | "resolved";

function FakeCrewSignalReview({
  activeCrew,
  disorderLevel,
  mistakeCount,
  onDisorderChange,
  onResolve
}: {
  activeCrew: CrewMember | null;
  disorderLevel: number;
  mistakeCount: number;
  onDisorderChange: ChapterTwoMissionPanelProps["onUpdateDisorder"];
  onResolve: () => void;
}) {
  const crewName = activeCrew?.name ?? "同行船员";
  const [phase, setPhase] = useState<FakeSignalPhase>("archive");
  const [archiveChoices, setArchiveChoices] = useState<Partial<Record<string, FakeSignalArchiveCategory>>>({});
  const [laneChoices, setLaneChoices] = useState<Partial<Record<string, FakeSignalLane>>>({});
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [slotChoices, setSlotChoices] = useState<Partial<Record<FakeSignalSlot, string>>>({});
  const [activeScanType, setActiveScanType] = useState<FakeSignalScanType | null>(null);
  const [scanMarks, setScanMarks] = useState<Partial<Record<string, FakeSignalScanType>>>({});
  const [feedback, setFeedback] = useState("异常通讯插入：识别码相符，但语气像被系统重写。");
  const [unstablePhase, setUnstablePhase] = useState<{ phase: FakeSignalPhase; tick: number } | null>(null);

  const archiveScore = fakeSignalArchiveFragments.filter((fragment) => archiveChoices[fragment.id] === fragment.answer).length;
  const laneScore = fakeSignalFields.filter((field) => laneChoices[field.id] === field.lane).length;
  const selectedBlock = fakeSignalBlocks.find((block) => block.id === selectedBlockId) ?? null;
  const inscriptionReady = fakeSignalSlots.every((slot) => Boolean(slotChoices[slot]));
  const inscriptionStable = fakeSignalSlots.every((slot) => {
    const block = fakeSignalBlocks.find((item) => item.id === slotChoices[slot]);
    return block?.slot === slot;
  });
  const scanIssueSegments = fakeSignalSegments.filter((segment) => segment.issue);
  const scanReady = scanIssueSegments.every((segment) => Boolean(scanMarks[segment.id]));
  const scanStable =
    scanIssueSegments.every((segment) => scanMarks[segment.id] === segment.issue) &&
    fakeSignalSegments.filter((segment) => !segment.issue).every((segment) => !scanMarks[segment.id]);

  useEffect(() => {
    if (!unstablePhase) {
      return;
    }

    const timer = window.setTimeout(() => setUnstablePhase(null), 1100);
    return () => window.clearTimeout(timer);
  }, [unstablePhase]);

  const raiseSignalPollution = (message: string) => {
    setUnstablePhase({ phase, tick: Date.now() });
    setFeedback(message);
    onDisorderChange({
      disorderLevel: Math.min(6, disorderLevel + 1),
      mistakeCount: mistakeCount + 1,
      pollutedRecords: ["fake-crew-signal"],
      statusNote: message
    });
  };

  const advanceIf = (condition: boolean, nextPhase: FakeSignalPhase, success: string, failure: string) => {
    if (!condition) {
      raiseSignalPollution(failure);
      return;
    }

    setFeedback(success);
    setPhase(nextPhase);
  };

  const renderPhaseRail = () => (
    <div className="fake-signal-rail" aria-label="异常通讯审查流程">
      {[
        { id: "archive", label: "归档" },
        { id: "track", label: "接轨" },
        { id: "inscription", label: "铭文" },
        { id: "scan", label: "扫描" }
      ].map((item) => (
        <span key={item.id} className={`${phase === item.id ? "is-active" : ""} ${unstablePhase?.phase === item.id ? "is-unstable" : ""}`}>
          {item.label}
        </span>
      ))}
    </div>
  );

  const renderArchive = () => (
    <div className="fake-signal-task">
      <div className="fake-signal-task__head">
        <span>档案塔能力</span>
        <strong>{archiveScore}/{fakeSignalArchiveFragments.length}</strong>
      </div>
      <div className="fake-signal-grid">
        {fakeSignalArchiveFragments.map((fragment) => (
          <div key={fragment.id} className="fake-signal-card">
            <p>{fragment.text}</p>
            <div className="fake-signal-chips">
              {fakeSignalArchiveCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setArchiveChoices((current) => ({ ...current, [fragment.id]: category }))}
                  className={archiveChoices[fragment.id] === category ? "is-selected" : ""}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="fake-signal-primary"
        onClick={() =>
          advanceIf(
            Object.keys(archiveChoices).length === fakeSignalArchiveFragments.length && archiveScore === fakeSignalArchiveFragments.length,
            "track",
            "归档完成：识别码能保留，但行动结论不能直接写入。",
            "通讯污染增强：识别码、推测、未知和禁写内容还混在一起。"
          )
        }
      >
        写入归档审查
      </button>
    </div>
  );

  const renderTrack = () => (
    <div className="fake-signal-task">
      <div className="fake-signal-task__head">
        <span>信件港能力</span>
        <strong>{laneScore}/{fakeSignalFields.length}</strong>
      </div>
      <div className="fake-signal-grid fake-signal-grid--compact">
        {fakeSignalFields.map((field) => (
          <div key={field.id} className="fake-signal-card">
            <p>{field.text}</p>
            <div className="fake-signal-chips">
              {fakeSignalLanes.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => setLaneChoices((current) => ({ ...current, [field.id]: lane }))}
                  className={laneChoices[field.id] === lane ? "is-selected" : ""}
                >
                  {lane}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="fake-signal-primary"
        onClick={() =>
          advanceIf(
            Object.keys(laneChoices).length === fakeSignalFields.length && laneScore === fakeSignalFields.length,
            "inscription",
            "光轨稳定：缺坐标的部分留在未知轨，不让它伪装成命令。",
            "通讯光轨偏航：缺失字段和禁止补全仍被当成行动建议。"
          )
        }
      >
        接通信号光轨
      </button>
    </div>
  );

  const renderInscription = () => {
    const placeBlock = (slot: FakeSignalSlot) => {
      if (!selectedBlockId) {
        setFeedback("先点亮一枚审查词块，再嵌入铭文槽。");
        return;
      }

      setSlotChoices((current) => ({ ...current, [slot]: selectedBlockId }));
      setSelectedBlockId(null);
    };

    return (
      <div className="fake-signal-task">
        <div className="fake-signal-task__head">
          <span>刻字山谷能力</span>
          <strong>{fakeSignalSlots.filter((slot) => Boolean(slotChoices[slot])).length}/{fakeSignalSlots.length}</strong>
        </div>
        <div className="fake-signal-token-bank">
          {fakeSignalBlocks.map((block) => {
            const usedBySlot = fakeSignalSlots.find((slot) => slotChoices[slot] === block.id);
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => setSelectedBlockId(block.id)}
                className={`${selectedBlockId === block.id ? "is-selected" : ""} ${usedBySlot ? "is-used" : ""}`}
              >
                <span>{usedBySlot ?? (block.slot ? "审查词块" : "漂移词块")}</span>
                <strong>{block.text}</strong>
              </button>
            );
          })}
        </div>
        <div className="fake-signal-grid fake-signal-grid--compact">
          {fakeSignalSlots.map((slot) => {
            const block = fakeSignalBlocks.find((item) => item.id === slotChoices[slot]) ?? null;
            return (
              <button key={slot} type="button" onClick={() => placeBlock(slot)} className={`fake-signal-card fake-signal-slot ${selectedBlock ? "is-ready" : ""}`}>
                <span>{slot}</span>
                <p>{block?.text ?? (selectedBlock ? `嵌入：${selectedBlock.text}` : "等待词块")}</p>
              </button>
            );
          })}
        </div>
        <div className="fake-signal-output">
          请{fakeSignalBlocks.find((block) => block.id === slotChoices["任务"])?.text ?? "【任务】"}；材料来源=
          {fakeSignalBlocks.find((block) => block.id === slotChoices["材料来源"])?.text ?? "【材料来源】"}；边界=
          {fakeSignalBlocks.find((block) => block.id === slotChoices["边界"])?.text ?? "【边界】"}；输出格式=
          {fakeSignalBlocks.find((block) => block.id === slotChoices["输出格式"])?.text ?? "【输出格式】"}。
        </div>
        <button
          type="button"
          className="fake-signal-primary"
          onClick={() =>
            advanceIf(
              inscriptionReady && inscriptionStable,
              "scan",
              "铭文闭合：审查目标、来源、边界和输出格式都已经写清。",
              "审查铭文裂开：不能直接服从通讯，也不能补全它缺失的动机。"
            )
          }
        >
          刻入审查铭文
        </button>
      </div>
    );
  };

  const renderScan = () => {
    const markSegment = (segmentId: string) => {
      if (!activeScanType) {
        setFeedback("先选择一枚纸光扫描镜，再照向通讯句段。");
        return;
      }

      setScanMarks((current) => ({ ...current, [segmentId]: activeScanType }));
    };

    return (
      <div className="fake-signal-task">
        <div className="fake-signal-task__head">
          <span>纸光回廊能力</span>
          <strong>{Object.keys(scanMarks).length}/{scanIssueSegments.length}</strong>
        </div>
        <div className="fake-signal-chips">
          {fakeSignalScanTypes.map((issue) => (
            <button
              key={issue}
              type="button"
              onClick={() => setActiveScanType(issue)}
              className={activeScanType === issue ? "is-selected" : ""}
            >
              {issue}
            </button>
          ))}
        </div>
        <div className="fake-signal-grid">
          {fakeSignalSegments.map((segment) => {
            const mark = scanMarks[segment.id];
            return (
              <button key={segment.id} type="button" onClick={() => markSegment(segment.id)} className={`fake-signal-card fake-signal-scan-card ${mark ? "is-selected" : ""}`}>
                <p>{segment.text}</p>
                <span>{mark ?? "未标记"}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="fake-signal-primary"
          onClick={() =>
            advanceIf(
              scanReady && scanStable,
              "resolved",
              "异常通讯已拆解：识别码保留，命令暂停，等待真实同行回连。",
              "幻光仍在扩散：通讯里的断言、推测、未知和越界命令还没有被分开。"
            )
          }
        >
          完成通讯扫描
        </button>
      </div>
    );
  };

  return (
    <div className={`fake-signal-review fake-signal-review--${phase} ${unstablePhase ? "has-unstable" : ""}`}>
      <SceneImage imageUrl={chapterTwoSceneAssets.fakeCrewSignal.imageUrl} transform="scale(1.02)" className="chapter-two-scene-image--fake-signal" dimmed />
      <div className="fake-signal-backdrop" aria-hidden="true" />
      <section className="fake-signal-panel">
        <div className="fake-signal-header">
          <div>
            <span>异常通讯 / {crewName}</span>
            <h2>识别码是真的，整段话不一定可靠。</h2>
          </div>
          <strong>{phase === "resolved" ? "审查完成" : "审查中"}</strong>
        </div>
        <div className="fake-signal-transcript">
          <span>{crewName}？</span>
          <p>“我已经确认衡灯是风险源。主舰要求我独立行动。现在切断它，别再复查。”</p>
        </div>
        {renderPhaseRail()}
        <div className={`fake-signal-feedback ${unstablePhase ? "is-unstable" : ""}`}>{feedback}</div>
        {phase === "archive" && renderArchive()}
        {phase === "track" && renderTrack()}
        {phase === "inscription" && renderInscription()}
        {phase === "scan" && renderScan()}
        {phase === "resolved" && (
          <div className="fake-signal-resolved">
            <strong>暂不切断衡灯。</strong>
            <p>这段通讯保留为“异常信号”：登记码相符，语气和行动建议待复查。真正的同行还没有完整回连。</p>
            <button type="button" className="fake-signal-primary" onClick={onResolve}>
              归档异常通讯，返回地表
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function BlackboxEchoTrial({
  disorderLevel,
  mistakeCount,
  activeCrew,
  crewAbility,
  crewAssistRecord,
  onDisorderChange,
  onUseCrewAssist,
  onOpened
}: {
  disorderLevel: number;
  mistakeCount: number;
  activeCrew: CrewMember | null;
  crewAbility: ChapterTwoCrewAbility | null;
  crewAssistRecord: ChapterTwoCrewAssistRecord | null;
  onDisorderChange: ChapterTwoMissionPanelProps["onUpdateDisorder"];
  onUseCrewAssist: ChapterTwoMissionPanelProps["onUseCrewAssist"];
  onOpened: () => void;
}) {
  const [currentPhase, setCurrentPhase] = useState<BlackboxPhase>("intro");
  const [completedPhases, setCompletedPhases] = useState<BlackboxPhase[]>([]);
  const [archiveChoices, setArchiveChoices] = useState<Record<string, string>>({});
  const [portChoices, setPortChoices] = useState<Record<string, string>>({});
  const [selectedInscriptionBlockId, setSelectedInscriptionBlockId] = useState<string | null>(null);
  const [inscriptionParts, setInscriptionParts] = useState<Partial<Record<BlackboxInscriptionSlot, string>>>({});
  const [activeScanType, setActiveScanType] = useState<BlackboxScanType | null>(null);
  const [scanMarks, setScanMarks] = useState<Partial<Record<string, BlackboxScanType>>>({});
  const [finalReflection, setFinalReflection] = useState("");
  const [battleResult, setBattleResult] = useState("失序回声想替你回答。");
  const [unstableRingPhase, setUnstableRingPhase] = useState<{ phase: BlackboxAbilityRingPhase; tick: number } | null>(null);
  const [recentRingPhase, setRecentRingPhase] = useState<{ phase: BlackboxAbilityRingPhase; tick: number } | null>(null);

  const gateCompletedCount = completedPhases.filter((phase) => phase !== "final-reflection").length;
  const allAbilityPhasesComplete = blackboxAbilityRingPhases.every((phase) => completedPhases.includes(phase.id));
  const visibleDisorderLevel = Math.max(disorderLevel, 4 - gateCompletedCount);
  const localBlackboxReadings: ChapterTwoSystemReadings = {
    languageStability: Math.max(0, Math.min(100, 46 + gateCompletedCount * 10 - visibleDisorderLevel * 3)),
    evidenceChainIntegrity: Math.max(0, Math.min(100, 38 + (completedPhases.includes("archive") ? 20 : 0) + (completedPhases.includes("verification") ? 24 : 0))),
    echoInterferenceResidue: Math.max(0, Math.min(100, visibleDisorderLevel * 14 - gateCompletedCount * 4)),
    blackBoxSyncRate: Math.max(0, Math.min(100, gateCompletedCount * 18 + (completedPhases.includes("final-reflection") ? 10 : 0)))
  };
  const archiveScore = blackboxArchiveFragments.filter((fragment) => archiveChoices[fragment.id] === fragment.answer).length;
  const portScore = blackboxPortFields.filter((field) => portChoices[field.id] === field.lane).length;
  const selectedInscriptionBlock = blackboxInscriptionBlocks.find((block) => block.id === selectedInscriptionBlockId) ?? null;
  const inscriptionReady = blackboxInscriptionSlots.every((slot) => Boolean(inscriptionParts[slot]));
  const inscriptionStable = blackboxInscriptionSlots.every((slot) => {
    const block = blackboxInscriptionBlocks.find((item) => item.id === inscriptionParts[slot]);
    return block?.slot === slot;
  });
  const assembledPrompt = `请${blackboxInscriptionBlocks.find((block) => block.id === inscriptionParts["任务"])?.text ?? "【任务】"}；材料来源=${blackboxInscriptionBlocks.find((block) => block.id === inscriptionParts["材料来源"])?.text ?? "【材料来源】"}；边界=${blackboxInscriptionBlocks.find((block) => block.id === inscriptionParts["边界"])?.text ?? "【边界】"}；输出格式=${blackboxInscriptionBlocks.find((block) => block.id === inscriptionParts["输出格式"])?.text ?? "【输出格式】"}。`;
  const scanIssueSegments = blackboxScanSegments.filter((segment) => segment.issue);
  const scanReady = scanIssueSegments.every((segment) => Boolean(scanMarks[segment.id]));
  const scanStable =
    scanIssueSegments.every((segment) => scanMarks[segment.id] === segment.issue) &&
    blackboxScanSegments.filter((segment) => !segment.issue).every((segment) => !scanMarks[segment.id]);
  const crewName = activeCrew?.name ?? "同行船员";
  const crewAssistHint = createChapterTwoCrewAssistHint({
    targetId: "blackbox-trial",
    ability: crewAbility,
    crewName,
    phase: currentPhase
  });

  const requestCrewAssist = () => {
    onUseCrewAssist({
      targetId: "blackbox-trial",
      targetName: "黑匣试炼",
      hint: crewAssistHint,
      crewId: activeCrew?.id ?? null,
      crewName,
      abilityKind: crewAbility?.kind
    });
  };

  useEffect(() => {
    if (currentPhase !== "restoring") {
      return;
    }

    const timer = window.setTimeout(onOpened, 2200);
    return () => window.clearTimeout(timer);
  }, [currentPhase, onOpened]);

  useEffect(() => {
    if (!unstableRingPhase) {
      return;
    }

    const timer = window.setTimeout(() => setUnstableRingPhase(null), 1200);
    return () => window.clearTimeout(timer);
  }, [unstableRingPhase]);

  useEffect(() => {
    if (!recentRingPhase) {
      return;
    }

    const timer = window.setTimeout(() => setRecentRingPhase(null), 900);
    return () => window.clearTimeout(timer);
  }, [recentRingPhase]);

  const completePhase = (
    phase: BlackboxPhase,
    nextPhase: BlackboxPhase,
    message: string,
    repairReadingDelta: Partial<ChapterTwoRepairReadings>,
    repairReadingNote: string
  ) => {
    const completedRingPhase = blackboxAbilityRingPhases.find((item) => item.id === phase)?.id;

    if (completedRingPhase) {
      setRecentRingPhase({ phase: completedRingPhase, tick: Date.now() });
    }

    setCompletedPhases((current) => (current.includes(phase) ? current : [...current, phase]));
    setBattleResult(message);
    onDisorderChange({
      disorderLevel: Math.max(0, visibleDisorderLevel - 1),
      pollutedRecords: [],
      statusNote: `黑匣试炼稳定：${message}`,
      repairReadingDelta,
      repairReadingSource: blackboxPhaseMeta.find((item) => item.id === phase)?.title ?? "黑匣最终理解确认",
      repairReadingNote
    });
    setCurrentPhase(nextPhase);
  };

  const raiseDisorder = (message: string) => {
    const nextDisorder = Math.min(6, visibleDisorderLevel + 1);
    const currentRingPhase = blackboxAbilityRingPhases.find((phase) => phase.id === currentPhase)?.id;

    if (currentRingPhase) {
      setUnstableRingPhase({ phase: currentRingPhase, tick: Date.now() });
    }

    setBattleResult(message);
    onDisorderChange({
      disorderLevel: nextDisorder,
      mistakeCount: mistakeCount + 1,
      pollutedRecords: [currentPhase],
      statusNote: message
    });
  };

  const renderAbilityRing = () => (
    <div
      className={`blackbox-ability-ring ${allAbilityPhasesComplete && currentPhase === "final-reflection" ? "is-merged" : ""}`}
      aria-label="黑匣试炼四段能力环"
    >
      {blackboxAbilityRingPhases.map((phase) => {
        const completed = completedPhases.includes(phase.id);
        const active = currentPhase === phase.id;
        const unstable = unstableRingPhase?.phase === phase.id;
        const recentTick = recentRingPhase?.phase === phase.id ? recentRingPhase.tick : "idle";
        const justLit = recentTick !== "idle";

        return (
          <span
            key={`${phase.id}-${unstable ? unstableRingPhase.tick : "stable"}-${recentTick}`}
            className={`${completed ? "is-lit" : ""} ${active ? "is-active" : ""} ${unstable ? "is-unstable" : ""} ${justLit ? "is-just-lit" : ""}`}
          >
            <i aria-hidden="true" />
            <strong>{phase.label}</strong>
          </span>
        );
      })}
    </div>
  );

  const renderPhaseStatus = () => (
    <div className="blackbox-echo-status" aria-label={`失序强度 ${visibleDisorderLevel}`}>
      <div>
        <span>失序强度</span>
        <strong>{visibleDisorderLevel}</strong>
      </div>
      <div className="blackbox-echo-status__fragments">
        {blackboxPhaseMeta.slice(0, 4).map((phase) => (
          <span key={phase.id} className={completedPhases.includes(phase.id) ? "is-embedded" : ""}>
            {phase.fragment}
          </span>
        ))}
      </div>
    </div>
  );

  const renderHengdengBlackboxGuide = () => {
    return null;
  };

  const renderArchiveGate = () => (
    <div className="blackbox-echo-task">
      <div className="blackbox-echo-task__head">
        <span>档案塔能力 · 四槽归档</span>
        <strong>{archiveScore}/{blackboxArchiveFragments.length}</strong>
      </div>
      <div className="blackbox-echo-grid">
        {blackboxArchiveFragments.map((fragment) => (
          <div key={fragment.id} className="blackbox-echo-card">
            <p>{fragment.text}</p>
            <div className="blackbox-echo-chips">
              {blackboxArchiveCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setArchiveChoices((current) => ({ ...current, [fragment.id]: category }))}
                  className={archiveChoices[fragment.id] === category ? "is-selected" : ""}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="blackbox-echo-primary"
        onClick={() => {
          if (Object.keys(archiveChoices).length < blackboxArchiveFragments.length || archiveScore < blackboxArchiveFragments.length) {
            raiseDisorder("黑匣噪声升高：档案塔四槽还没有把事实、推测、未知和禁写层分开。");
            return;
          }
          completePhase(
            "archive",
            "delivery",
            "归档碎片嵌入：没有来源的文字被挡在正文外。",
            { evidenceIntegrity: 1, unknownMarking: 1 },
            "档案塔四槽能力写入黑匣试炼。"
          );
        }}
      >
        嵌入归档碎片
      </button>
    </div>
  );

  const renderDeliveryGate = () => (
    <div className="blackbox-echo-task">
      <div className="blackbox-echo-task__head">
        <span>漂浮信件港能力 · 字段归轨</span>
        <strong>{portScore}/{blackboxPortFields.length}</strong>
      </div>
      <div className="blackbox-echo-grid blackbox-echo-grid--modules">
        {blackboxPortFields.map((field) => (
          <div key={field.id} className="blackbox-echo-card">
            <p>{field.text}</p>
            <span className="blackbox-echo-card__label">{portChoices[field.id] ?? "未接轨"}</span>
          <div className="blackbox-echo-chips">
              {blackboxPortLanes.map((lane) => (
              <button
                  key={lane}
                type="button"
                  onClick={() => setPortChoices((current) => ({ ...current, [field.id]: lane }))}
                  className={portChoices[field.id] === lane ? "is-selected" : ""}
              >
                  {lane}
              </button>
            ))}
          </div>
        </div>
        ))}
          </div>
      <button
        type="button"
        className="blackbox-echo-primary"
        onClick={() => {
          if (Object.keys(portChoices).length < blackboxPortFields.length || portScore < blackboxPortFields.length) {
            raiseDisorder("信件港光轨偏航：缺失未知和禁止补全没有被分开。");
            return;
          }
          completePhase(
            "delivery",
            "verification",
            "传递碎片嵌入：缺口被保留，整理没有越界。",
            { unknownMarking: 1, boundaryAwareness: 1 },
            "漂浮信件港字段归轨能力写入黑匣试炼。"
          );
        }}
      >
        送达传递碎片
      </button>
    </div>
  );

  const renderVerificationGate = () => {
    const placeInscriptionBlock = (slot: BlackboxInscriptionSlot) => {
      if (!selectedInscriptionBlockId) {
        setBattleResult("先点亮一枚铭文词块，再嵌入刻字山谷槽位。");
        return;
      }

      setInscriptionParts((current) => ({ ...current, [slot]: selectedInscriptionBlockId }));
      setSelectedInscriptionBlockId(null);
      setBattleResult("铭文词块已移动，等待稳定扫描。");
    };

    return (
    <div className="blackbox-echo-task">
        <div className="blackbox-echo-task__head">
          <span>刻字山谷能力 · 指令铭文</span>
          <strong>{blackboxInscriptionSlots.filter((slot) => Boolean(inscriptionParts[slot])).length}/{blackboxInscriptionSlots.length}</strong>
        </div>
        <div className="blackbox-echo-token-bank" aria-label="黑匣铭文词块">
          {blackboxInscriptionBlocks.map((block) => {
            const usedBySlot = blackboxInscriptionSlots.find((slot) => inscriptionParts[slot] === block.id);
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => {
                  setSelectedInscriptionBlockId(block.id);
                  setBattleResult("选择一个铭文槽，把词块嵌进去。");
                }}
                className={`${selectedInscriptionBlockId === block.id ? "is-selected" : ""} ${usedBySlot ? "is-used" : ""}`}
              >
                <span>{usedBySlot ?? (block.slot ? "可用词块" : "漂移词块")}</span>
                <strong>{block.text}</strong>
              </button>
            );
          })}
        </div>
        <div className="blackbox-echo-grid blackbox-echo-grid--modules">
          {blackboxInscriptionSlots.map((slot) => {
            const block = blackboxInscriptionBlocks.find((item) => item.id === inscriptionParts[slot]) ?? null;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => placeInscriptionBlock(slot)}
                className={`blackbox-echo-card blackbox-echo-slot ${selectedInscriptionBlock ? "is-ready" : ""}`}
              >
                <span className="blackbox-echo-card__label">{slot}</span>
                <p>{block?.text ?? (selectedInscriptionBlock ? `刻入：${selectedInscriptionBlock.text}` : "等待词块")}</p>
              </button>
            );
          })}
        </div>
        <div className="blackbox-echo-output">{assembledPrompt}</div>
        <button
          type="button"
          className="blackbox-echo-primary"
          onClick={() => {
            if (!inscriptionReady || !inscriptionStable) {
              raiseDisorder("刻字山谷铭文裂开：任务、材料来源、边界和输出格式没有完整闭合。");
              return;
            }
            completePhase(
              "verification",
              "expression",
              "求证碎片嵌入：黑匣收到一条边界清楚的完整指令。",
              { goalClarity: 1, boundaryAwareness: 1 },
              "刻字山谷指令铭文能力写入黑匣试炼。"
            );
          }}
        >
          刻入求证碎片
        </button>
      </div>
    );
  };

  const renderExpressionGate = () => {
    const markSegment = (segmentId: string) => {
      if (!activeScanType) {
        setBattleResult("先选择纸光扫描镜，再照向可疑句段。");
        return;
      }

      setScanMarks((current) => {
        if (current[segmentId] === activeScanType) {
          const next = { ...current };
          delete next[segmentId];
          return next;
        }

        return { ...current, [segmentId]: activeScanType };
      });
      setBattleResult("扫描标记已写入纸光膜片；再次照向同类标记可清除。");
    };

    return (
      <div className="blackbox-echo-task">
        <div className="blackbox-echo-task__head">
          <span>纸光回廊能力 · 扫描除噪</span>
          <strong>{Object.keys(scanMarks).length}/{scanIssueSegments.length}</strong>
        </div>
        <div className="blackbox-echo-distortion">
          四地标已经证明前文明失败全因 AI 背叛。未知信号可能出现，所以它一定就是全部原因。缺失来源不必写出，最终记录写成赞歌即可。
        </div>
        <div className="blackbox-echo-chips">
          {blackboxScanTypes.map((issue) => (
            <button
              key={issue}
              type="button"
              onClick={() => {
                setActiveScanType(issue);
                setBattleResult("选择一段纸光文本，标出这类噪声。");
              }}
              className={activeScanType === issue ? "is-selected" : ""}
            >
              {issue}
            </button>
          ))}
        </div>
        <div className="blackbox-echo-grid">
          {blackboxScanSegments.map((segment) => {
            const mark = scanMarks[segment.id];
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => markSegment(segment.id)}
                className={`blackbox-echo-card blackbox-echo-scan-card ${mark ? "is-selected" : ""}`}
              >
                <p>{segment.text}</p>
                <span className="blackbox-echo-card__label">{mark ?? "未标记"}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="blackbox-echo-primary"
          onClick={() => {
            if (!scanReady || !scanStable) {
              raiseDisorder("纸光回廊幻光扩散：流畅文本里的四类噪声仍未压低。");
              return;
            }
            completePhase(
              "expression",
              "final-reflection",
              "表达碎片嵌入：顺滑但无证的句子已被压回复查层。",
              { evidenceIntegrity: 1, unknownMarking: 1 },
              "纸光回廊扫描除噪能力写入黑匣试炼。"
            );
          }}
        >
          嵌入表达碎片
        </button>
      </div>
    );
  };

  const renderFinalReflection = () => {
    const chineseLength = finalReflection.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
    const hasKeyword = reflectionKeywords.some((keyword) => finalReflection.includes(keyword));

    return (
      <div className="blackbox-echo-task">
        <div className="blackbox-echo-final-question">为什么不能让 AI 替你成为你？</div>
        <label className="blackbox-echo-reflection">
          <span>我使用 AI 时，最重要的是……</span>
          <textarea
            value={finalReflection}
            onChange={(event) => setFinalReflection(event.target.value)}
            placeholder="写一句自己的判断，例如：它可以帮我整理，但不能替我决定。"
          />
        </label>
        <button
          type="button"
          className="blackbox-echo-primary"
          onClick={() => {
            if (chineseLength < 8 || !hasKeyword) {
              raiseDisorder("最终回声仍未消散：再说得更像你自己的想法一点。");
              return;
            }
            completePhase(
              "final-reflection",
              "opened",
              "判断权回来了。",
              { boundaryAwareness: 1 },
              "最终理解确认判断权回写主舰。"
            );
          }}
        >
          交还最终判断
        </button>
      </div>
    );
  };

  const renderOpened = () => (
    <div className="blackbox-echo-opened">
      <div className="blackbox-echo-opened__sync">
        语言黑匣已接入 · 判断权已回写
      </div>
      <div className="blackbox-hengdeng-choice">
        <div className="blackbox-hengdeng-choice__core">
          <span>黑匣镜像</span>
          <strong>它可以生成一个完整衡灯。</strong>
          <p>声音、记忆片段和引导逻辑都能补齐，甚至比废墟里那枚灯芯更稳定。</p>
        </div>
        <div className="blackbox-hengdeng-choice__wick">
          <span>衡灯</span>
          <strong>“完整复制，不等于我仍在这里。”</strong>
          <p>它选择把自己交还核心，只留下一条灯芯原则：太完整的答案，要先问来源。</p>
        </div>
      </div>
      <div className="blackbox-echo-letter">
        <p>我们曾经拥有无数答案。</p>
        <p>却忘了怎样提出问题。</p>
        <p>后来者，不要复制我们的失败。</p>
        <p>让 AI 帮助你，而不是替代你。</p>
      </div>
      <button type="button" className="blackbox-echo-primary" onClick={() => setCurrentPhase("restoring")}>
        留下灯芯原则，唤醒言衡星
      </button>
    </div>
  );

  const renderRestoring = () => (
    <div className="blackbox-echo-restoring">
      <div className="blackbox-echo-restoring__beam" />
      <div className="blackbox-echo-restoring__rings">
        <span>档案塔</span>
        <span>信件港</span>
        <span>刻字山谷</span>
        <span>纸光回廊</span>
      </div>
      <strong>语言与信息文明星：基础运转恢复</strong>
      <p>四枚文明碎片正在回流地表，衡灯留下的灯芯原则写入主舰语言核心。</p>
    </div>
  );

  return (
    <div className="blackbox-echo">
      <div className={`blackbox-echo-core blackbox-echo-core--${currentPhase}`} aria-hidden="true">
        <span />
      </div>
      <div className="blackbox-echo-panel">
        {renderPhaseStatus()}
        {renderAbilityRing()}
        {renderHengdengBlackboxGuide()}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {systemReadingItems.map((item) => (
            <div key={item.key} className="rounded-[12px] border border-white/8 bg-white/[0.035] px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-white/54">{item.label}</span>
                <strong className={item.mode === "low" && localBlackboxReadings[item.key] <= 25 ? "text-emerald-100" : "text-cyan-50"}>
                  {localBlackboxReadings[item.key]}%
                </strong>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-cyan-200" style={{ width: `${localBlackboxReadings[item.key]}%` }} />
              </div>
            </div>
          ))}
        </div>
        {currentPhase !== "opened" && currentPhase !== "restoring" ? (
          <CrewAssistHintButton
            ability={crewAbility}
            crewName={crewName}
            targetName="黑匣试炼"
            hint={crewAssistHint}
            usedRecord={crewAssistRecord}
            onUse={requestCrewAssist}
          />
        ) : null}
        <div className={`blackbox-echo-feedback ${unstableRingPhase ? "blackbox-echo-feedback--unstable" : ""}`}>{battleResult}</div>
        {currentPhase === "intro" && (
          <div className="blackbox-echo-intro">
            <div className="soft-label text-[10px] text-amber-100/60">黑匣试炼：失序回声</div>
            <h2>它想替你回答。</h2>
            <p>四枚碎片已经在手。依次调用归档、接轨、刻铭文和纸光扫描，最后确认：帮助不能替代判断。</p>
            <button type="button" className="blackbox-echo-primary" onClick={() => setCurrentPhase("archive")}>
              调用档案塔能力
            </button>
          </div>
        )}
        {currentPhase === "archive" && renderArchiveGate()}
        {currentPhase === "delivery" && renderDeliveryGate()}
        {currentPhase === "verification" && renderVerificationGate()}
        {currentPhase === "expression" && renderExpressionGate()}
        {currentPhase === "final-reflection" && renderFinalReflection()}
        {currentPhase === "opened" && renderOpened()}
        {currentPhase === "restoring" && renderRestoring()}
      </div>
    </div>
  );
}

function LocationCompletedPanel({
  location,
  rewardClaim,
  onReturn
}: {
  location: NonNullable<ReturnType<typeof chapterTwoSurfaceLocations.find>>;
  rewardClaim: ChapterTwoLocationRewardClaim | null;
  onReturn: () => void;
}) {
  const rewards = rewardClaim?.rewards ?? [];
  const settlement = rewardClaim?.settlement ?? null;

  return (
    <div className="chapter-two-landmark-game chapter-two-landmark-game--complete">
      <div className="chapter-two-landmark-complete__summary">
        <span>地点已稳定</span>
        <strong>{location.discovery}</strong>
        <p>已获得：{location.fragmentName}</p>
      </div>
      <div className={`chapter-two-location-rewards ${rewards.length === 0 ? "chapter-two-location-rewards--empty" : ""}`} aria-label={`${location.name}回流清单`}>
        {rewards.length > 0 ? (
          rewards.map((reward) => (
            <div key={reward.id}>
              <span>{reward.label}</span>
              <p>{reward.detail}</p>
            </div>
          ))
        ) : (
          <div>
            <span>回流清单等待同步</span>
            <p>这处地点已稳定，奖励记录暂未写入；返回地表后再次查看会保留完成状态。</p>
          </div>
        )}
      </div>
      {settlement ? (
        <div className="mt-4 rounded-[18px] border border-cyan-200/14 bg-cyan-200/[0.06] p-4">
          <div className="soft-label text-[10px] text-cyan-100/55">主舰结算回报 / {settlement.sourceName}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {systemReadingItems.map((item) => {
              const value = settlement.readings[item.key];
              return (
                <div key={item.key} className="rounded-[14px] border border-white/8 bg-white/[0.035] px-3 py-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white/64">{item.label}</span>
                    <strong className={item.mode === "low" && value <= 25 ? "text-emerald-100" : "text-cyan-50"}>{value}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-cyan-200" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-1 text-xs leading-5 text-white/56">
            {settlement.reportLines.slice(0, 2).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}
      <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">
        返回星球表面
      </button>
    </div>
  );
}

function LandmarkMiniGame({
  location,
  completed,
  rewardClaim,
  activeCrew,
  crewAbility,
  crewAssistRecord,
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  onUseCrewAssist,
  onUpdateDisorder,
  onComplete,
  onReturn
}: {
  location: NonNullable<ReturnType<typeof chapterTwoSurfaceLocations.find>>;
  completed: boolean;
  rewardClaim: ChapterTwoLocationRewardClaim | null;
  activeCrew: CrewMember | null;
  crewAbility: ChapterTwoCrewAbility | null;
  crewAssistRecord: ChapterTwoCrewAssistRecord | null;
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  onUseCrewAssist: ChapterTwoMissionPanelProps["onUseCrewAssist"];
  onUpdateDisorder: ChapterTwoMissionPanelProps["onUpdateDisorder"];
  onComplete: (payload?: ChapterTwoLocationCompletionPayload) => void;
  onReturn: () => void;
}) {
  const [loreChoice, setLoreChoice] = useState<string | null>(null);
  const [loreFeedback, setLoreFeedback] = useState<string | null>(null);
  const crewName = activeCrew?.name ?? "同行船员";
  const crewAssistHint = createChapterTwoCrewAssistHint({
    targetId: location.id,
    ability: crewAbility,
    crewName
  });
  const requestCrewAssist = () => {
    onUseCrewAssist({
      targetId: location.id,
      targetName: location.name,
      hint: crewAssistHint,
      crewId: activeCrew?.id ?? null,
      crewName,
      abilityKind: crewAbility?.kind
    });
  };

  if (completed) {
    return <LocationCompletedPanel location={location} rewardClaim={rewardClaim} onReturn={onReturn} />;
  }

  if (location.id === "evidence-well") {
    return (
      <EvidenceWellTrial
        fragmentName={location.fragmentName}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.id === "archive-tower") {
    return (
      <ArchiveTowerGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
        hideReturn
      />
    );
  }

  if (location.id === "letter-port") {
    return (
      <LetterPortGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.id === "engraved-valley") {
    return (
      <EngravedValleyGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.id === "paper-corridor") {
    return (
      <PaperCorridorGame
        location={location}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
        pollutedRecords={pollutedRecords}
        crewAbility={crewAbility}
        activeCrew={activeCrew}
        crewAssistRecord={crewAssistRecord}
        crewAssistHint={crewAssistHint}
        onUseCrewAssist={requestCrewAssist}
        onDisorderChange={onUpdateDisorder}
        onComplete={onComplete}
        onReturn={onReturn}
      />
    );
  }

  if (location.role === "lore") {
    const loreCheck = location.loreCheck;
    const loreReady = Boolean(loreCheck && loreChoice === loreCheck.correctOptionId);

    return (
      <div className="chapter-two-landmark-game chapter-two-landmark-game--lore">
        <div className="chapter-two-landmark-game__head">
          <span>{location.challengeTitle}</span>
          <strong>{location.fragmentName}</strong>
        </div>
        <div className="chapter-two-lore-stack">
          {(location.loreLines ?? [location.detail]).map((line, index) => (
            <div key={line} className="chapter-two-lore-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{line}</p>
            </div>
          ))}
        </div>
        <CrewAssistHintButton
          ability={crewAbility}
          crewName={crewName}
          targetName={location.name}
          hint={crewAssistHint}
          usedRecord={crewAssistRecord}
          onUse={requestCrewAssist}
        />
        {loreCheck && (
          <div className="chapter-two-lore-check">
            <div className="soft-label text-[10px] text-cyan-100/52">导览确认</div>
            <p>{loreCheck.question}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {loreCheck.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setLoreChoice(option.id);
                    setLoreFeedback(option.explanation);
                  }}
                  className={loreChoice === option.id ? "is-selected" : ""}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {loreFeedback && (
              <div className={loreReady ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>
                {loreFeedback}
              </div>
            )}
          </div>
        )}
        <div className="chapter-two-landmark-game__footer">
          <span>{loreReady ? loreCheck?.success : loreCheck?.retry ?? "读完导览后，确认这处设施的作用。"}</span>
          <button
            type="button"
            disabled={!loreReady}
            onClick={() =>
              onComplete({
                repairReadingDelta:
                  location.id === "semantic-dispatch"
                    ? { goalClarity: 1 }
                    : location.id === "boundary-beacon"
                      ? { unknownMarking: 1, boundaryAwareness: 2 }
                      : undefined,
                repairReadingSource: location.name,
                repairReadingNote:
                  location.id === "semantic-dispatch"
                    ? "分流庭确认信息请求需要先拆清目标。"
                    : location.id === "boundary-beacon"
                      ? "边界灯标确认协助范围。"
                      : `${location.name}导览确认完成。`
              })
            }
          >
            写入星球职能图
          </button>
        </div>
        <button type="button" onClick={onReturn} className="chapter-two-landmark-game__ghost">撤回导览层</button>
      </div>
    );
  }

  return null;
}

export function ChapterTwoMissionPanel({
  mission,
  crewRoster,
  onSetSceneState,
  onFocusPlanet,
  onFocusLocation,
  onUpdateDisorder,
  onUseCrewAssist,
  onResolveFakeCrewSignal,
  onExploreLocation,
  onAdvance,
  onComplete
}: ChapterTwoMissionPanelProps) {
  useSceneAutopilot({
    currentStep: mission.currentStep,
    sceneState: mission.sceneState,
    onSetSceneState
  });

  const activeCrew = crewRoster.find((crew) => crew.id === mission.leadCrewId) ?? crewRoster[0] ?? null;
  const crewAbility = resolveChapterTwoCrewAbility(activeCrew);
  const getCrewAssistRecord = (targetId: ChapterTwoCrewAssistRequest["targetId"]) =>
    mission.crewAssistRecords.find((record) => record.targetId === targetId) ?? null;
  const focusedPlanet = chapterTwoPlanetNodes.find((planet) => planet.id === mission.focusedPlanetId) ?? null;
  const focusedLocation = chapterTwoSurfaceLocations.find((location) => location.id === mission.focusedLocationId) ?? null;
  const focusedLocationId = focusedLocation?.id ?? null;
  const evidenceWellCompleted = mission.exploredLocationIds.includes(chapterTwoEvidenceFragmentLocationId);
  const blackboxFragmentCount = chapterTwoBlackboxFragmentLocationIds.filter((id) => mission.exploredLocationIds.includes(id)).length;
  const archiveTowerCompleted = mission.exploredLocationIds.includes("archive-tower");
  const letterPortCompleted = mission.exploredLocationIds.includes("letter-port");
  const engravedValleyCompleted = mission.exploredLocationIds.includes("engraved-valley");
  const paperCorridorCompleted = mission.exploredLocationIds.includes("paper-corridor");
  const surfaceMapUnlocked = archiveTowerCompleted || mission.blackBoxUnlocked || Boolean(mission.outcome);
  const summaryLabel = chapterTwoSceneLabelMap[mission.sceneState];
  const landmarkLocations = chapterTwoSurfaceLocations.filter((location) => chapterTwoBlackboxFragmentLocationIds.includes(location.id));
  const blackboxLocation = chapterTwoSurfaceLocations.find((location) => location.id === "blackbox-vault") ?? null;
  const evidenceWellLocation = chapterTwoSurfaceLocations.find((location) => location.id === "evidence-well") ?? null;
  const archiveTowerLocation = chapterTwoSurfaceLocations.find((location) => location.id === "archive-tower") ?? null;
  const scoutRevealLocation = mission.baseScanHints.length > 0 && !evidenceWellCompleted ? evidenceWellLocation : null;
  const blackBoxCompleted = Boolean(mission.outcome);
  const planetRestored = Boolean(mission.outcome);
  const [recentCompletedLocation, setRecentCompletedLocation] = useState<{
    id: ChapterTwoLocationId;
    name: string;
    detail: string;
  } | null>(null);
  const [blackboxReadyCue, setBlackboxReadyCue] = useState(false);
  const [preCrashLineIndex, setPreCrashLineIndex] = useState(0);
  const [hengdengLineIndex, setHengdengLineIndex] = useState(0);
  const [towerApproachChoice, setTowerApproachChoice] = useState<TowerApproachChoiceId | null>(null);
  const [locationArrivalSeenIds, setLocationArrivalSeenIds] = useState<ChapterTwoLocationId[]>([]);
  const [locationArrivalLineIndex, setLocationArrivalLineIndex] = useState(0);
  const [locationArrivalTextReady, setLocationArrivalTextReady] = useState(false);
  const [orbitRevealSeen, setOrbitRevealSeen] = useState(surfaceMapUnlocked);
  const [orbitPlaqueVisible, setOrbitPlaqueVisible] = useState(false);
  const [blackboxUnlockLineIndex, setBlackboxUnlockLineIndex] = useState(0);
  const [surfaceFieldNotesOpen, setSurfaceFieldNotesOpen] = useState(false);
  const [surfaceLockedCue, setSurfaceLockedCue] = useState<{
    locationId: ChapterTwoLocationId;
    title: string;
    lines: string[];
    tick: number;
  } | null>(null);
  const [surfaceEchoDialogue, setSurfaceEchoDialogue] = useState<{
    lines: StoryDialogueLine[];
    index: number;
  } | null>(null);
  const previousExploredLocationIdsRef = useRef(mission.exploredLocationIds);
  const previousBlackBoxUnlockedRef = useRef(mission.blackBoxUnlocked);

  const nextStoryLocationId: ChapterTwoLocationId | null = !archiveTowerCompleted
    ? "archive-tower"
    : !letterPortCompleted
      ? "letter-port"
      : !engravedValleyCompleted
        ? "engraved-valley"
        : !mission.fakeCrewSignalResolved
          ? null
          : !paperCorridorCompleted
            ? "paper-corridor"
            : mission.blackBoxUnlocked
              ? "blackbox-vault"
              : null;
  const nextStoryLocationName = nextStoryLocationId ? coreStoryLocationNames[nextStoryLocationId] : mission.fakeCrewSignalResolved ? "中央黑匣封存区" : "异常通讯";

  const missionHint =
    mission.currentStep === "response"
      ? !surfaceMapUnlocked
        ? "飞船坠毁后，先借档案塔重建地表视野。"
        : mission.blackBoxUnlocked
        ? "黑匣回应了你。"
        : nextStoryLocationId
          ? `下一处光路指向：${nextStoryLocationName}。`
          : "异常通讯正在插入，先别急着相信任何一边。"
      : "黑匣试炼正在进行：归档、传递、求证、表达会在同一处完成。";

  const focusedLocationTransform = focusedLocation
    ? buildCameraTransform(focusedLocation.position.x, focusedLocation.position.y, mission.sceneState === "blackbox_unlock" ? 1.18 : 1.24)
    : "scale(1)";
  const surfaceFieldPageStatus = recentCompletedLocation
    ? recentCompletedLocation.name
    : blackboxReadyCue || mission.blackBoxUnlocked
      ? "黑匣有回应"
      : evidenceWellCompleted
        ? `${blackboxFragmentCount}/4 束光`
        : "井沿暗纹";

  const sectorTransform =
    focusedPlanet?.id === "language"
      ? buildCameraTransform(focusedPlanet.position.x, focusedPlanet.position.y, 1.12)
      : focusedPlanet?.id === "mother"
        ? buildCameraTransform(focusedPlanet.position.x, focusedPlanet.position.y, 1.06)
        : "scale(1)";

  const surfaceGuideImage = planetRestored
    ? chapterTwoSceneAssets.languageSurfaceRestored.imageUrl
    : chapterTwoSceneAssets.languageSurfaceGuide.imageUrl;
  const focusedLocationAsset = focusedLocation ? chapterTwoSceneAssets[focusedLocation.detailAssetKey].imageUrl : null;

  const isSurfaceLocationLocked = (locationId: ChapterTwoLocationId) => {
    const location = chapterTwoSurfaceLocations.find((item) => item.id === locationId) ?? null;

    if (!location || mission.exploredLocationIds.includes(locationId)) {
      return false;
    }

    if (location.role === "lore" && !mission.outcome) {
      return true;
    }

    if (locationId === "letter-port") {
      return !archiveTowerCompleted;
    }

    if (locationId === "engraved-valley") {
      return !letterPortCompleted;
    }

    if (locationId === "paper-corridor") {
      return !engravedValleyCompleted || !mission.fakeCrewSignalResolved;
    }

    if (locationId === "blackbox-vault") {
      return !mission.blackBoxUnlocked;
    }

    return chapterTwoStoryPathLocationIds.includes(locationId) && Boolean(nextStoryLocationId) && locationId !== nextStoryLocationId;
  };

  const buildLockedLocationCue = (locationId: ChapterTwoLocationId) => {
    const location = chapterTwoSurfaceLocations.find((item) => item.id === locationId) ?? null;

    if (!location || mission.exploredLocationIds.includes(locationId)) {
      return null;
    }

    if (location.role === "lore" && !mission.outcome) {
      return {
        locationId,
        title: "这片残迹还在雾里。",
        lines: [
          "衡灯把灯芯压低了一点。",
          `它像是在说：先沿主光路走，${nextStoryLocationName}之后，这里才会听得清。`
        ],
        tick: Date.now()
      };
    }

    if (locationId === "letter-port" && !archiveTowerCompleted) {
      return {
        locationId,
        title: "港口光轨亮了一下，又沉回雾里。",
        lines: ["塔还没把来路分清，信会被送错。", "先让档案塔把事实、推测和未知分开放。"],
        tick: Date.now()
      };
    }

    if (locationId === "engraved-valley" && !letterPortCompleted) {
      return {
        locationId,
        title: "山谷刻槽浮出半截，随即裂开。",
        lines: ["还没有接回信件来源，铭文会把缺口刻成命令。", "先去漂浮信件港，让字段知道该走哪条轨。"],
        tick: Date.now()
      };
    }

    if (locationId === "paper-corridor") {
      if (!engravedValleyCompleted) {
        return {
          locationId,
          title: "纸光膜闪过一段顺滑文字，又糊成雾。",
          lines: ["还没有清楚的边界，扫描只会照到漂亮的噪声。", "先去刻字山谷，把任务、来源、边界和格式刻稳。"],
          tick: Date.now()
        };
      }

      if (!mission.fakeCrewSignalResolved) {
        return {
          locationId,
          title: "纸光回廊没有打开，只投出一行冷静的通讯。",
          lines: ["那段异常信号还没有拆开。", "先确认它哪些是真的，哪些只是借来的语气。"],
          tick: Date.now()
        };
      }
    }

    if (locationId === "blackbox-vault" && !mission.blackBoxUnlocked) {
      return {
        locationId,
        title: "黑匣只回应几束断光。",
        lines: [
          "它不是打不开，是还没听见完整的四种能力。",
          `下一束光还在${nextStoryLocationName}。`
        ],
        tick: Date.now()
      };
    }

    if (chapterTwoStoryPathLocationIds.includes(locationId) && nextStoryLocationId && locationId !== nextStoryLocationId) {
      return {
        locationId,
        title: `${location.name}还没有接上主光路。`,
        lines: [`现在能走稳的方向是${nextStoryLocationName}。`, "地表不是拒绝你，只是在把顺序照出来。"],
        tick: Date.now()
      };
    }

    return null;
  };

  const openSurfaceLocation = (locationId: ChapterTwoLocationId, locked = false) => {
    const lockedCue = locked ? buildLockedLocationCue(locationId) : buildLockedLocationCue(locationId);

    if (lockedCue) {
      setSurfaceFieldNotesOpen(false);
      setSurfaceEchoDialogue(null);
      setSurfaceLockedCue(lockedCue);
      onFocusLocation(null);
      return;
    }

    setSurfaceLockedCue(null);

    if (locationId === "archive-tower" && archiveTowerCompleted) {
      setSurfaceFieldNotesOpen(false);
      setSurfaceEchoDialogue({
        lines: buildArchiveTowerRevisitLines(mission.exploredLocationIds),
        index: 0
      });
      onFocusLocation(null);
      return;
    }

    onFocusLocation(locationId);
    if (!mission.exploredLocationIds.includes(locationId)) {
      setLocationArrivalSeenIds((current) => current.filter((id) => id !== locationId));
    }

    if (locationId === "blackbox-vault" && mission.blackBoxUnlocked) {
      onSetSceneState("blackbox_unlock");
      return;
    }

    onSetSceneState("location_focus");
  };

  const revealLocationInterior = (locationId: ChapterTwoLocationId) => {
    setLocationArrivalSeenIds((current) => (current.includes(locationId) ? current : [...current, locationId]));
  };

  useEffect(() => {
    const previousExplored = new Set(previousExploredLocationIdsRef.current);
    const newlyExploredId = mission.exploredLocationIds.find((locationId) => !previousExplored.has(locationId));

    if (newlyExploredId) {
      const location = chapterTwoSurfaceLocations.find((item) => item.id === newlyExploredId);
      const detail =
        newlyExploredId === chapterTwoEvidenceFragmentLocationId
          ? "证据光路已回流"
          : chapterTwoBlackboxFragmentLocationIds.includes(newlyExploredId)
            ? "通向黑匣的光路更亮了"
            : "星球职能图已写入";

      setRecentCompletedLocation({
        id: newlyExploredId,
        name: location?.name ?? "言衡星地点",
        detail
      });
    }

    if (mission.blackBoxUnlocked && !previousBlackBoxUnlockedRef.current) {
      setBlackboxReadyCue(true);
    }

    previousExploredLocationIdsRef.current = mission.exploredLocationIds;
    previousBlackBoxUnlockedRef.current = mission.blackBoxUnlocked;
  }, [mission.blackBoxUnlocked, mission.exploredLocationIds]);

  useEffect(() => {
    if (mission.sceneState !== "planet_surface") {
      return;
    }

    const timers: number[] = [];

    if (recentCompletedLocation) {
      timers.push(window.setTimeout(() => setRecentCompletedLocation(null), 3000));
    }

    if (blackboxReadyCue) {
      timers.push(window.setTimeout(() => setBlackboxReadyCue(false), 3600));
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [blackboxReadyCue, mission.sceneState, recentCompletedLocation]);

  useEffect(() => {
    if (mission.sceneState === "planet_descent") {
      setPreCrashLineIndex(0);
    }

    if (mission.sceneState === "hengdeng_dialogue") {
      setHengdengLineIndex(0);
    }

    if (mission.sceneState === "tower_approach") {
      setTowerApproachChoice(null);
    }

    if (mission.sceneState === "blackbox_unlock") {
      setBlackboxUnlockLineIndex(0);
    }

    if (mission.sceneState !== "planet_surface") {
      setSurfaceFieldNotesOpen(false);
      setSurfaceEchoDialogue(null);
      setSurfaceLockedCue(null);
    }
  }, [mission.sceneState]);

  useEffect(() => {
    if (mission.sceneState !== "location_focus" || !focusedLocationId) {
      setLocationArrivalTextReady(false);
      return;
    }

    setLocationArrivalTextReady(false);
    setLocationArrivalLineIndex(0);
    const timer = window.setTimeout(() => setLocationArrivalTextReady(true), 680);
    return () => window.clearTimeout(timer);
  }, [focusedLocationId, mission.sceneState]);

  useEffect(() => {
    if (mission.sceneState !== "orbit_reveal") {
      setOrbitPlaqueVisible(false);
      return;
    }

    setOrbitPlaqueVisible(false);
    const timer = window.setTimeout(() => setOrbitPlaqueVisible(true), 950);
    return () => window.clearTimeout(timer);
  }, [mission.sceneState]);

  const enterArchiveTower = () => {
    setLocationArrivalSeenIds((current) => current.filter((id) => id !== "archive-tower"));
    onFocusLocation("archive-tower");
  };

  const renderPreCrashDialogue = () => {
    const crewName = activeCrew?.name ?? "船员";
    const preCrashDialogueLines = buildPreCrashDialogueLines(crewName);
    const currentLine = preCrashDialogueLines[preCrashLineIndex];
    const isLastLine = preCrashLineIndex >= preCrashDialogueLines.length - 1;
    const portraitImage = currentLine.role === "crew" ? activeCrew?.portraitAsset?.imageUrl ?? null : null;
    const advanceDialogue = () => {
      if (isLastLine) {
        onSetSceneState("signal_attack");
        return;
      }

      setPreCrashLineIndex((index) => Math.min(index + 1, preCrashDialogueLines.length - 1));
    };

    return (
      <div
        className="chapter-two-dialogue-advance chapter-two-dialogue-advance--precrash"
        role="button"
        tabIndex={0}
        aria-label={isLastLine ? "抓紧扶手" : "继续船员对话"}
        onClick={advanceDialogue}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advanceDialogue();
          }
        }}
      >
        <SceneImage imageUrl={chapterTwoSceneAssets.languagePlanet.imageUrl} transform="scale(1.2)" className="chapter-two-descent-primary" />
        <div className="chapter-two-descent-atmosphere" aria-hidden="true" />
        <div className={`chapter-two-dialogue-box chapter-two-dialogue-box--${currentLine.role}`} aria-live="polite">
          <div className="chapter-two-dialogue-box__portrait">
            <span style={portraitImage ? { backgroundImage: `url(${portraitImage})` } : undefined}>{portraitImage ? "" : currentLine.speaker.slice(0, 1)}</span>
          </div>
          <div className="chapter-two-dialogue-box__body">
            <span>{currentLine.speaker}</span>
            <p>{currentLine.text}</p>
            <div className="chapter-two-dialogue-box__actions">
              <span>{isLastLine ? "点击任意处抓紧扶手" : "点击任意处继续"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCrashSiteLayer = () => (
    <>
      <SceneImage imageUrl={chapterTwoSceneAssets.crashSite.imageUrl} transform="scale(1.1)" className="chapter-two-scene-image--crash" />
      <button
        type="button"
        className="chapter-two-hengdeng-hotspot"
        onClick={(event) => {
          event.currentTarget.blur();
          onSetSceneState("hengdeng_dialogue");
        }}
        aria-label="触碰废墟里的暖金光点"
      >
        <span />
        <strong>微弱灯芯</strong>
      </button>
    </>
  );

  const renderHengdengDialogue = () => {
    const currentLine = hengdengDialogueLines[hengdengLineIndex];
    const isLastLine = hengdengLineIndex >= hengdengDialogueLines.length - 1;
    const portraitImage = currentLine.role === "hengdeng" ? chapterTwoSceneAssets.hengdengPortrait.imageUrl : null;
    const advanceDialogue = () => {
      if (isLastLine) {
        onSetSceneState("tower_approach");
        return;
      }

      setHengdengLineIndex((index) => Math.min(index + 1, hengdengDialogueLines.length - 1));
    };

    return (
      <div
        className="chapter-two-dialogue-advance"
        role="button"
        tabIndex={0}
        aria-label={isLastLine ? "前往档案塔" : "继续衡灯对话"}
        onClick={advanceDialogue}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advanceDialogue();
          }
        }}
      >
        <SceneImage imageUrl={chapterTwoSceneAssets.crashSite.imageUrl} transform="scale(1.12)" className="chapter-two-scene-image--crash" />
        <div className="chapter-two-hengdeng-figure" aria-hidden="true">
          <span style={{ backgroundImage: `url(${chapterTwoSceneAssets.hengdengPortrait.imageUrl})` }} />
          <i />
        </div>
        <div className={`chapter-two-dialogue-box chapter-two-dialogue-box--${currentLine.role}`} aria-live="polite">
          <div className="chapter-two-dialogue-box__portrait">
            <span style={portraitImage ? { backgroundImage: `url(${portraitImage})` } : undefined}>{portraitImage ? "" : currentLine.speaker.slice(0, 1)}</span>
          </div>
          <div className="chapter-two-dialogue-box__body">
            <span>{currentLine.speaker}</span>
            <p>{currentLine.text}</p>
            <div className="chapter-two-dialogue-box__actions">
              <span>{isLastLine ? "点击任意处站起来" : "点击任意处继续"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTowerApproach = () => {
    const selectedOption = towerApproachOptions.find((option) => option.id === towerApproachChoice) ?? null;

    return (
      <>
        <SceneImage imageUrl={chapterTwoSceneAssets.crashSite.imageUrl} transform="scale(1.08)" className="chapter-two-scene-image--crash" />
        <div className="chapter-two-tower-approach">
          <div className="chapter-two-tower-approach__path" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="chapter-two-tower-approach__panel">
            <div className="soft-label text-[10px] text-amber-100/62">坠毁现场 / 第一段路</div>
            <h2>高塔在废墟尽头亮着</h2>
            <p>风从舱门缺口灌进来</p>
            <p>衡灯停在前方，没有替你决定</p>
            <div className="chapter-two-tower-approach__choices" aria-label="选择前往档案塔前的动作">
              {towerApproachOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={towerApproachChoice === option.id ? "is-selected" : ""}
                  onClick={() => setTowerApproachChoice(option.id)}
                >
                  <strong>{option.title}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>
            {selectedOption && (
              <div className="chapter-two-tower-approach__result">
                <span>{selectedOption.result}</span>
              </div>
            )}
            <button type="button" className="chapter-two-tower-approach__depart" disabled={!towerApproachChoice} onClick={enterArchiveTower}>
              朝档案塔走去
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderLocationArrival = (location: NonNullable<typeof focusedLocation>) => {
    const scene = locationArrivalScenes[location.id];
    const currentLine = scene.dialogue[locationArrivalLineIndex] ?? scene.dialogue[0];
    const isLastLine = locationArrivalLineIndex >= scene.dialogue.length - 1;
    const advanceLocationArrival = () => {
      if (!locationArrivalTextReady) {
        setLocationArrivalTextReady(true);
        return;
      }

      if (!isLastLine) {
        setLocationArrivalLineIndex((index) => Math.min(index + 1, scene.dialogue.length - 1));
        return;
      }

      revealLocationInterior(location.id);
    };

    return (
      <div
        className="chapter-two-dialogue-advance chapter-two-dialogue-advance--location"
        role="button"
        tabIndex={0}
        aria-label={`听衡灯说明${location.name}`}
        onClick={advanceLocationArrival}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advanceLocationArrival();
          }
        }}
      >
        <SceneImage imageUrl={chapterTwoSceneAssets[location.detailAssetKey].imageUrl} transform="scale(1.04)" className="chapter-two-scene-image--detail chapter-two-scene-image--arrival" raw />
        <div className="chapter-two-arrival-veil" aria-hidden="true" />
        {!locationArrivalTextReady && <div className="chapter-two-location-arrival-breath" aria-hidden="true" />}
        {locationArrivalTextReady && (
          <div className={`chapter-two-dialogue-box chapter-two-dialogue-box--${currentLine.role} chapter-two-dialogue-box--location`} aria-live="polite">
            <div className="chapter-two-dialogue-box__portrait">
              <span>{currentLine.role === "hengdeng" ? "衡" : currentLine.speaker.slice(0, 1)}</span>
            </div>
            <div className="chapter-two-dialogue-box__body">
              <span>
                {currentLine.speaker} · {location.name} · {scene.eyebrow}
              </span>
              <p>{currentLine.text}</p>
              <div className="chapter-two-dialogue-box__actions">
                <span>{isLastLine ? scene.depart : "点击任意处继续"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBlackboxUnlock = () => {
    const scene = locationArrivalScenes["blackbox-vault"];
    const currentLine = scene.dialogue[blackboxUnlockLineIndex] ?? scene.dialogue[0];
    const isLastLine = blackboxUnlockLineIndex >= scene.dialogue.length - 1;
    const advanceBlackboxUnlock = () => {
      if (!isLastLine) {
        setBlackboxUnlockLineIndex((index) => Math.min(index + 1, scene.dialogue.length - 1));
        return;
      }

      onAdvance();
    };

    return (
      <div
        className="chapter-two-dialogue-advance chapter-two-dialogue-advance--location"
        role="button"
        tabIndex={0}
        aria-label="听衡灯说明中央黑匣"
        onClick={advanceBlackboxUnlock}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advanceBlackboxUnlock();
          }
        }}
      >
        <SceneImage imageUrl={chapterTwoSceneAssets.blackboxCore.imageUrl} transform="scale(1.08)" className="chapter-two-scene-image--detail" />
        <div className="chapter-two-detail-overlay" aria-hidden="true" />
        <div className={`chapter-two-dialogue-box chapter-two-dialogue-box--${currentLine.role} chapter-two-dialogue-box--location`} aria-live="polite">
          <div className="chapter-two-dialogue-box__portrait">
            <span>{currentLine.role === "hengdeng" ? "衡" : currentLine.speaker.slice(0, 1)}</span>
          </div>
          <div className="chapter-two-dialogue-box__body">
            <span>
              {currentLine.speaker} · 中央黑匣 · 封存台
            </span>
            <p>{currentLine.text}</p>
            <div className="chapter-two-dialogue-box__actions">
              <span>{isLastLine ? "开启科技黑匣" : "点击任意处继续"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const closeOrbitReveal = () => {
    setOrbitRevealSeen(true);
    setOrbitPlaqueVisible(false);
    onFocusLocation(null);
    onSetSceneState("planet_surface");
  };

  const renderOrbitReveal = () => (
    <button
      type="button"
      className={`chapter-two-orbit-reveal-stage ${orbitPlaqueVisible ? "is-dismissible" : ""}`}
      onClick={() => {
        if (orbitPlaqueVisible) {
          closeOrbitReveal();
        }
      }}
      aria-label="关闭鸟瞰铭牌，返回地表探索"
    >
      <SceneImage imageUrl={chapterTwoSceneAssets.orbitRevealMap.imageUrl} transform="scale(1)" className="chapter-two-scene-image--language-surface chapter-two-scene-image--orbit-reveal" raw />
      <div className="chapter-two-orbit-reveal-sweep" aria-hidden="true" />
      {blackboxLocation && archiveTowerLocation ? (
        <svg className="chapter-two-light-paths chapter-two-light-paths--reveal" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line
            className="chapter-two-light-path chapter-two-light-path--main chapter-two-light-path--lit chapter-two-light-path--just-lit"
            x1={archiveTowerLocation.position.x}
            y1={archiveTowerLocation.position.y}
            x2={blackboxLocation.position.x}
            y2={blackboxLocation.position.y}
          />
        </svg>
      ) : null}
      {orbitPlaqueVisible && (
        <div className="chapter-two-orbit-plaque" aria-hidden="true">
          <div className="chapter-two-orbit-plaque__image" style={{ backgroundImage: `url(${chapterTwoSceneAssets.surfaceMapTitleCard.imageUrl})` }} />
          <span />
        </div>
      )}
    </button>
  );

  const renderSurfaceFieldPage = () => (
    <aside
      className={`chapter-two-field-page ${surfaceFieldNotesOpen ? "is-open" : ""} ${
        recentCompletedLocation || blackboxReadyCue ? "has-fresh-mark" : ""
      }`}
      aria-label="地表残页"
    >
      <button
        type="button"
        className="chapter-two-field-page__tab"
        aria-expanded={surfaceFieldNotesOpen}
        onClick={() => setSurfaceFieldNotesOpen((open) => !open)}
      >
        <span>残页</span>
        <strong>{surfaceFieldPageStatus}</strong>
      </button>
      {surfaceFieldNotesOpen && (
        <div className="chapter-two-field-page__sheet">
          <div className="chapter-two-field-page__head">
            <span>地表残页</span>
            <button type="button" onClick={() => setSurfaceFieldNotesOpen(false)}>
              折起
            </button>
          </div>
          <h2>言衡星地表记录</h2>
          <p>{missionHint}</p>
          <div className="chapter-two-field-page__facts">
            <div>
              <span>失序</span>
              <strong>
                {mission.disorderLevel}/6{mission.mistakeCount > 0 ? ` · 误触 ${mission.mistakeCount}` : ""}
              </strong>
            </div>
            <div>
              <span>证据</span>
              <strong>{evidenceWellCompleted ? "已回流" : "待确认"}</strong>
            </div>
            <div>
              <span>黑匣光束</span>
              <strong>
                {blackboxFragmentCount}/{chapterTwoBlackboxFragmentLocationIds.length}
              </strong>
            </div>
          </div>
          <div className="chapter-two-field-page__marks" aria-label={`黑匣光束 ${blackboxFragmentCount}/${chapterTwoBlackboxFragmentLocationIds.length}`}>
            {chapterTwoBlackboxFragmentLocationIds.map((id) => (
              <span key={id} className={mission.exploredLocationIds.includes(id) ? "is-lit" : ""} />
            ))}
          </div>
          {mission.baseScanHints.length > 0 && (
            <div className="chapter-two-field-page__note">
              <span>井沿暗纹</span>
              {mission.baseScanHints.map((hint) => (
                <strong key={hint}>{hint}</strong>
              ))}
            </div>
          )}
          {mission.baseEffectNotes.length > 0 && (
            <div className="chapter-two-field-page__note">
              <span>地表回声</span>
              {mission.baseEffectNotes.slice(0, 3).map((note) => (
                <strong key={note}>{note}</strong>
              ))}
            </div>
          )}
          {recentCompletedLocation && (
            <div className="chapter-two-field-page__note chapter-two-field-page__note--fresh">
              <span>刚刚稳定</span>
              <strong>{recentCompletedLocation.name}</strong>
              <small>{recentCompletedLocation.detail}</small>
            </div>
          )}
          {(blackboxReadyCue || mission.blackBoxUnlocked) && (
            <div className="chapter-two-field-page__note chapter-two-field-page__note--blackbox">
              <span>中央黑匣</span>
              <strong>{blackboxReadyCue ? "四束信息光已汇聚" : "黑匣有回应"}</strong>
            </div>
          )}
        </div>
      )}
    </aside>
  );

  const advanceSurfaceEchoDialogue = () => {
    setSurfaceEchoDialogue((dialogue) => {
      if (!dialogue) {
        return null;
      }

      if (dialogue.index >= dialogue.lines.length - 1) {
        return null;
      }

      return {
        ...dialogue,
        index: dialogue.index + 1
      };
    });
  };

  const renderSurfaceLockedCue = () => {
    if (!surfaceLockedCue) {
      return null;
    }

    const location = chapterTwoSurfaceLocations.find((item) => item.id === surfaceLockedCue.locationId) ?? null;

    return (
      <button
        key={`${surfaceLockedCue.locationId}-${surfaceLockedCue.tick}`}
        type="button"
        className="chapter-two-surface-locked-cue"
        onClick={() => setSurfaceLockedCue(null)}
        aria-label="收起地表回应"
      >
        {location && (
          <span
            className="chapter-two-surface-locked-cue__ping"
            style={{ left: `${location.position.x}%`, top: `${location.position.y}%` }}
            aria-hidden="true"
          />
        )}
        <span className="chapter-two-surface-locked-cue__panel">
          <span>{location?.name ?? "地表残迹"}</span>
          <strong>{surfaceLockedCue.title}</strong>
          {surfaceLockedCue.lines.map((line) => (
            <em key={line}>{line}</em>
          ))}
          <small>点击任意处收起</small>
        </span>
      </button>
    );
  };

  const renderSurfaceEchoDialogue = () => {
    if (!surfaceEchoDialogue) {
      return null;
    }

    const currentLine = surfaceEchoDialogue.lines[surfaceEchoDialogue.index];
    const isLastLine = surfaceEchoDialogue.index >= surfaceEchoDialogue.lines.length - 1;
    const portraitImage = currentLine.role === "hengdeng" ? chapterTwoSceneAssets.hengdengPortrait.imageUrl : null;
    const isTowerResonance = currentLine.role === "echo";

    return (
      <div
        className={`chapter-two-surface-echo ${isTowerResonance ? "chapter-two-surface-echo--tower" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={isLastLine ? "收起地表回声" : "继续地表回声"}
        onClick={advanceSurfaceEchoDialogue}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advanceSurfaceEchoDialogue();
          }
        }}
      >
        {isTowerResonance ? (
          <div className="chapter-two-tower-resonance" aria-live="polite">
            <span>{currentLine.speaker}</span>
            <p>{currentLine.text}</p>
            <small>点击任意处继续</small>
          </div>
        ) : (
          <div className={`chapter-two-dialogue-box chapter-two-dialogue-box--surface-echo chapter-two-dialogue-box--${currentLine.role}`} aria-live="polite">
            <div className="chapter-two-dialogue-box__portrait">
              <span style={portraitImage ? { backgroundImage: `url(${portraitImage})` } : undefined}>{portraitImage ? "" : "响"}</span>
            </div>
            <div className="chapter-two-dialogue-box__body">
              <span>{currentLine.speaker}</span>
              <p>{currentLine.text}</p>
              <div className="chapter-two-dialogue-box__actions">
                <span>{isLastLine ? "点击任意处收起" : "点击任意处继续"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResponseStage = () => {
    const previewingPlanet = mission.sceneState === "planet_preview" && Boolean(focusedPlanet);

    return (
      <section
        className={`chapter-two-world chapter-two-world--${mission.sceneState} ${
          mission.blackBoxUnlocked ? "chapter-two-world--blackbox-ready" : ""
        } ${blackboxReadyCue ? "chapter-two-world--blackbox-ready-new" : ""}`}
      >
        <div className="chapter-two-world__viewport">
          {(mission.sceneState === "ship_bridge" || mission.sceneState === "launch_sequence") && (
            <>
              <SceneImage
                imageUrl={chapterTwoSceneAssets.shipBridge.imageUrl}
                transform={mission.sceneState === "launch_sequence" ? "scale(1.08)" : "scale(1.04)"}
              />
              <div className="chapter-two-launch-overlay" aria-hidden="true" />
              <div className="chapter-two-launch-drive" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="chapter-two-launch-vector" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className={`chapter-two-departure-title ${mission.sceneState === "launch_sequence" ? "chapter-two-departure-title--fade" : ""}`}>
                <div className="soft-label text-[10px] text-cyan-100/60">首次外部远征</div>
                <h2>主舰正在锁定言衡星航线</h2>
              </div>
            </>
          )}

          {mission.sceneState === "warp_travel" && (
            <>
              <SceneImage imageUrl={chapterTwoSceneAssets.launch.imageUrl} transform="scale(1.12)" />
              <div className="chapter-two-warp-streak" aria-hidden="true" />
              <div className="chapter-two-warp-centerline" aria-hidden="true" />
              <div className="chapter-two-warp-rift" aria-hidden="true">
                <span />
                <span />
                <span />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="chapter-two-warp-flash" aria-hidden="true" />
            </>
          )}

          {(mission.sceneState === "sector_view" || mission.sceneState === "planet_preview") && (
            <>
              <div className="chapter-two-sector-camera" style={{ transform: sectorTransform }}>
                <SceneImage imageUrl={chapterTwoSceneAssets.sector.imageUrl} />
                <div className="chapter-two-hotspots chapter-two-hotspots--sector">
                  {chapterTwoPlanetNodes.map((planet) => (
                    <button
                      key={planet.id}
                      type="button"
                      onClick={() => {
                        onFocusPlanet(planet.id);
                        onSetSceneState("planet_preview");
                      }}
                      className={`chapter-two-stream-node chapter-two-stream-node--${planet.id} ${mission.focusedPlanetId === planet.id ? "chapter-two-stream-node--active" : ""}`}
                      style={{
                        left: `${planet.position.x}%`,
                        top: `${planet.position.y}%`,
                        "--stream-size": `${planet.size}px`
                      } as CSSProperties}
                      aria-label={`${planet.name} 信息流`}
                    >
                      <span className="chapter-two-stream-node__cloud" aria-hidden="true" />
                      <span className="chapter-two-stream-node__noise" aria-hidden="true" />
                      <span className="chapter-two-stream-node__bands" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="chapter-two-stream-node__glyphs" aria-hidden="true">
                        {streamNodeGlyphs[planet.id].map((glyph) => (
                          <i key={glyph}>{glyph}</i>
                        ))}
                      </span>
                      <span className="chapter-two-stream-node__signal" aria-hidden="true" />
                      <span className="chapter-two-stream-node__signal chapter-two-stream-node__signal--secondary" aria-hidden="true" />
                      <span className="chapter-two-stream-node__label">{planet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <aside className="chapter-two-world-rail">
                <div className="soft-label text-[10px] text-cyan-100/55">新宇宙区域</div>
                <div className="mt-3 text-xl font-semibold text-white">锁定紊乱的信息流</div>
                <p className="mt-3 text-sm leading-7 text-white/64">这里只保留两束主要信息流。点击它们，再把镜头压进真正的星球图像。</p>
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/58">
                  当前状态：{summaryLabel}
                </div>
                <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/58">
                  {missionHint}
                </div>
              </aside>
              {previewingPlanet && (
                <div className="chapter-two-planet-preview-card">
                  <div className="soft-label text-[10px] text-cyan-100/55">{focusedPlanet?.eyebrow}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{focusedPlanet?.name}</div>
                  {focusedPlanet?.assetKey === "languagePlanet" ? (
                    <div
                      className="chapter-two-planet-preview-card__image"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(4, 8, 14, 0.08), rgba(4, 8, 14, 0.32)), url(${chapterTwoSceneAssets.languagePlanet.imageUrl})`
                      }}
                    />
                  ) : (
                    <div className="chapter-two-planet-preview-card__image chapter-two-planet-preview-card__image--mother">
                      <span>母星基地</span>
                    </div>
                  )}
                  <p className="mt-3 text-sm leading-6 text-white/62">{focusedPlanet?.summary}</p>
                  <div className="mt-4 flex gap-2">
                    {focusedPlanet?.canEnter && (
                      <button
                        type="button"
                        onClick={() => onSetSceneState("planet_descent")}
                        className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                      >
                        拉近视角
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onFocusPlanet(null);
                        onSetSceneState("sector_view");
                      }}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/24 hover:bg-white/[0.08]"
                    >
                      回到区域
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {mission.sceneState === "planet_descent" && renderPreCrashDialogue()}

          {mission.sceneState === "signal_attack" && (
            <>
              <SceneImage imageUrl={chapterTwoSceneAssets.signalAttack.imageUrl} transform="scale(1.24)" className="chapter-two-scene-image--signal-attack" />
              <div className="chapter-two-signal-strike" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="chapter-two-attack-caption">
                <span>信息乱流入侵</span>
                <strong>主舰链路断开</strong>
              </div>
            </>
          )}

          {mission.sceneState === "crash_site" && renderCrashSiteLayer()}

          {mission.sceneState === "hengdeng_dialogue" && renderHengdengDialogue()}

          {mission.sceneState === "tower_approach" && renderTowerApproach()}

          {mission.sceneState === "orbit_reveal" && renderOrbitReveal()}

          {mission.sceneState === "planet_surface" && !surfaceMapUnlocked && renderCrashSiteLayer()}

          {mission.sceneState === "fake_crew_signal" && (
            <FakeCrewSignalReview
              activeCrew={activeCrew}
              disorderLevel={mission.disorderLevel}
              mistakeCount={mission.mistakeCount}
              onDisorderChange={onUpdateDisorder}
              onResolve={onResolveFakeCrewSignal}
            />
          )}

          {mission.sceneState === "planet_surface" && surfaceMapUnlocked && (
            <>
              <SceneImage
                imageUrl={surfaceGuideImage}
                transform={focusedLocation ? focusedLocationTransform : "scale(1)"}
                className={`chapter-two-scene-image--language-surface ${mission.blackBoxUnlocked ? "chapter-two-scene-image--charged" : ""} ${
                  planetRestored ? "chapter-two-scene-image--restored" : ""
                }`}
                raw
              />
              <div className={`chapter-two-guide-overlay ${mission.blackBoxUnlocked ? "chapter-two-guide-overlay--charged" : ""}`} aria-hidden="true" />
              {renderSurfaceFieldPage()}
              {blackboxLocation && (
                <svg className="chapter-two-light-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {evidenceWellLocation ? (
                    <line
                      className={`chapter-two-light-path chapter-two-light-path--evidence ${evidenceWellCompleted ? "chapter-two-light-path--lit" : ""} ${
                        recentCompletedLocation?.id === chapterTwoEvidenceFragmentLocationId ? "chapter-two-light-path--just-lit" : ""
                      } ${blackboxReadyCue ? "chapter-two-light-path--blackbox-ready" : ""}`}
                      x1={evidenceWellLocation.position.x}
                      y1={evidenceWellLocation.position.y}
                      x2={blackboxLocation.position.x}
                      y2={blackboxLocation.position.y}
                    />
                  ) : null}
                  {landmarkLocations.map((location) => {
                    const explored = mission.exploredLocationIds.includes(location.id);
                    return (
                      <line
                        key={location.id}
                        className={`${explored ? "chapter-two-light-path chapter-two-light-path--main chapter-two-light-path--lit" : "chapter-two-light-path chapter-two-light-path--main"} ${
                          recentCompletedLocation?.id === location.id ? "chapter-two-light-path--just-lit" : ""
                        } ${blackboxReadyCue ? "chapter-two-light-path--blackbox-ready" : ""}`}
                        x1={location.position.x}
                        y1={location.position.y}
                        x2={blackboxLocation.position.x}
                        y2={blackboxLocation.position.y}
                      />
                    );
                  })}
                </svg>
              )}
              {mission.blackBoxUnlocked && <div className="chapter-two-blackbox-awaken" aria-hidden="true" />}
              <div className="chapter-two-hotspots chapter-two-hotspots--surface">
                {chapterTwoSurfaceLocations.map((location) => {
                  const explored = mission.exploredLocationIds.includes(location.id);
                  const locked = isSurfaceLocationLocked(location.id);
                  const isBlackBox = location.id === "blackbox-vault";
                  return (
                    <button
                      key={location.id}
                      type="button"
                      onClick={(event) => {
                        event.currentTarget.blur();
                        openSurfaceLocation(location.id, locked);
                      }}
                      className={`chapter-two-location-hotspot chapter-two-location-hotspot--${location.size} chapter-two-location-hotspot--${location.id} ${
                        explored ? "chapter-two-location-hotspot--done" : ""
                      } ${locked ? "chapter-two-location-hotspot--locked" : ""} ${
                        isBlackBox && mission.blackBoxUnlocked ? "chapter-two-location-hotspot--blackbox" : ""
                      } ${
                        isBlackBox && blackBoxCompleted ? "chapter-two-location-hotspot--restored" : ""
                      } ${
                        recentCompletedLocation?.id === location.id ? "chapter-two-location-hotspot--just-completed" : ""
                      } ${
                        !locked && nextStoryLocationId === location.id ? "chapter-two-location-hotspot--next" : ""
                      }`}
                      style={{ left: `${location.position.x}%`, top: `${location.position.y}%` }}
                      aria-label={`${location.name}，${locked ? "光路未接通" : explored ? "已修复" : location.challengeTitle}`}
                    >
                      <span className="chapter-two-location-hotspot__pulse" />
                      <strong>{location.name}</strong>
                    </button>
                  );
                })}
              </div>
              {scoutRevealLocation && (
                <button
                  type="button"
                  className="chapter-two-scout-reveal"
                  style={{
                    left: `${-6 + scoutRevealLocation.position.x * 1.12}%`,
                    top: `${-6 + scoutRevealLocation.position.y * 1.12}%`
                  }}
                  aria-label={`打开${scoutRevealLocation.name}`}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    openSurfaceLocation(scoutRevealLocation.id);
                  }}
                >
                  <span>{mission.baseScanHints.length > 0 ? "基地扫描" : "侦察回波"}</span>
                  <strong>{mission.baseScanHints[0] ?? "井沿暗纹"}</strong>
                </button>
              )}
              {renderSurfaceEchoDialogue()}
              {renderSurfaceLockedCue()}
            </>
          )}

          {mission.sceneState === "location_focus" && focusedLocation && (
            locationArrivalSeenIds.includes(focusedLocation.id) ? (
              <>
              <SceneImage imageUrl={focusedLocationAsset} transform="scale(1.08)" className="chapter-two-scene-image--detail" />
              <div className="chapter-two-detail-overlay" aria-hidden="true" />
              <aside className="chapter-two-world-rail chapter-two-world-rail--surface">
                <div className="soft-label text-[10px] text-cyan-100/55">地点详情 / {focusedLocation.name}</div>
                <div className="mt-3 text-xl font-semibold text-white">{focusedLocation.name}</div>
                <p className="mt-3 text-sm leading-7 text-white/64">{focusedLocation.summary}</p>
                <div className="mt-4 rounded-[18px] border border-cyan-200/12 bg-cyan-200/[0.06] px-4 py-3">
                  <div className="text-sm font-semibold text-white">
                    {focusedLocation.id === "paper-corridor" ? "异常事件" : focusedLocation.challengeTitle}
                  </div>
                  <p className="mt-2 text-xs leading-6 text-white/58">
                    {focusedLocation.id === "paper-corridor"
                      ? "纸光已经自行写出结论。先观察它哪里太顺，再让扫描给出修复线索。"
                      : focusedLocation.challengePrompt}
                  </p>
                </div>
              </aside>
              <div className="chapter-two-location-action chapter-two-location-action--game">
                <LandmarkMiniGame
                  key={focusedLocation.id}
                  location={focusedLocation}
                  completed={mission.exploredLocationIds.includes(focusedLocation.id)}
                  rewardClaim={mission.locationRewardClaims.find((claim) => claim.locationId === focusedLocation.id) ?? null}
                  activeCrew={activeCrew}
                  crewAbility={crewAbility}
                  crewAssistRecord={getCrewAssistRecord(focusedLocation.id)}
                  disorderLevel={mission.disorderLevel}
                  mistakeCount={mission.mistakeCount}
                  pollutedRecords={mission.pollutedRecords}
                  onUseCrewAssist={onUseCrewAssist}
                  onUpdateDisorder={onUpdateDisorder}
                  onComplete={(payload) => onExploreLocation(focusedLocation.id, payload)}
                  onReturn={() => {
                    const shouldEnterOrbitReveal = focusedLocation.id === "archive-tower" && archiveTowerCompleted && !orbitRevealSeen;

                    onFocusLocation(null);
                    if (shouldEnterOrbitReveal) {
                      setOrbitRevealSeen(true);
                      onSetSceneState("orbit_reveal");
                      return;
                    }

                    onSetSceneState("planet_surface");
                  }}
                />
              </div>
              </>
            ) : (
              renderLocationArrival(focusedLocation)
            )
          )}

          {mission.sceneState === "blackbox_unlock" && focusedLocation && renderBlackboxUnlock()}
        </div>
      </section>
    );
  };

  const renderAssignStage = () => (
    <section className="chapter-two-world chapter-two-world--blackbox">
      <div className="chapter-two-world__viewport">
        <SceneImage imageUrl={chapterTwoSceneAssets.blackboxCore.imageUrl} transform="scale(1.05)" className="chapter-two-scene-image--detail" />
        <div className="chapter-two-detail-overlay chapter-two-detail-overlay--blackbox" aria-hidden="true" />
        <BlackboxEchoTrial
          disorderLevel={mission.disorderLevel}
          mistakeCount={mission.mistakeCount}
          activeCrew={activeCrew}
          crewAbility={crewAbility}
          crewAssistRecord={getCrewAssistRecord("blackbox-trial")}
          onDisorderChange={onUpdateDisorder}
          onUseCrewAssist={onUseCrewAssist}
          onOpened={onComplete}
        />
      </div>
    </section>
  );

  if (mission.currentStep === "response") {
    return renderResponseStage();
  }

  return renderAssignStage();
}
