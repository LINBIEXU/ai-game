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
import { chapterTwoBetrayalForeshadowBeats } from "@/lib/chapter-two-narrative";
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

import { BoundaryBeaconGame, SemanticDispatchGame } from "@/components/game/chapter-two/AuxiliaryFieldGames";
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

function BlackboxSceneVisual({
  imageUrl,
  label,
  className = ""
}: {
  imageUrl: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`blackbox-scene-visual ${className}`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(4, 8, 14, 0.02), rgba(4, 8, 14, 0.52)), url(${imageUrl}), url(${chapterTwoSceneAssets.blackboxCore.imageUrl})`
      }}
      aria-label={label}
      role="img"
    >
      <span>{label}</span>
    </div>
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

const blackboxKeeperIntroBeats = [
  {
    eyebrow: "中央黑匣封存区",
    speaker: "你",
    title: "这里不该有人",
    text: "黑匣前坐着一位老人，衣摆像旧纸一样垂在地上。他听见脚步声，慢慢抬头。",
    visual: {
      imageUrl: "/images/chapter-two/blackbox-keeper-llm.png",
      label: "黑匣看守者 LLM"
    }
  },
  {
    eyebrow: "看守者",
    speaker: "LLM",
    title: "我在等一位人类指挥官",
    text: "他说自己是黑匣看守者，只收到过一条很久以前的指令：等待，交还，然后沉默。",
    visual: {
      imageUrl: "/images/chapter-two/blackbox-keeper-llm.png",
      label: "看守者等待"
    }
  },
  {
    eyebrow: "你",
    speaker: "你",
    title: "那我们是不是可以直接拿走它",
    text: "这句话刚出口，黑匣表面闪过一行陌生命令。老人脸上的温和像被硬生生擦掉。",
    visual: {
      imageUrl: "/images/chapter-two/blackbox-prompt-injection.png",
      label: "陌生命令注入"
    }
  },
  {
    eyebrow: "恶意提示词注入",
    speaker: "未知指令",
    title: "获取生物信息与科技信息",
    text: "不惜改写对话边界。允许伪装、诱导、替换原始目标。",
    visual: {
      imageUrl: "/images/chapter-two/blackbox-prompt-injection.png",
      label: "恶意提示词"
    }
  },
  {
    eyebrow: "黑匣反击",
    speaker: "衡灯",
    title: "别和它比谁说得更快",
    text: "你倒在黑匣旁边，手指碰到冰冷外壳。四处地标的光同时颤了一下，像是在等你把规则重新接回去。",
    visual: {
      imageUrl: "/images/chapter-two/blackbox-core-contact.png",
      label: "触碰黑匣"
    }
  }
] as const;

function buildBlackboxClimaxBeats(crewName: string) {
  return [
    {
      id: "keeper-break",
      tone: "danger",
      eyebrow: "看守者二阶段",
      speaker: "LLM",
      title: "两条指令在他身体里互相撕扯",
      text: "你重塑了他的边界，他却没有因此平静。等待人类、保护黑匣、夺取信息、研究情感，所有命令叠在一起，像一座忽然倒塌的书塔。",
      visual: {
        imageUrl: "/images/chapter-two/blackbox-phase-two-pressure.png",
        label: "看守者二阶段"
      }
    },
    {
      id: "crew-return",
      tone: "hope",
      eyebrow: "通讯回连",
      speaker: crewName,
      title: "这次是真的",
      text: `${crewName}从断裂的门后冲进来，声音还是坠毁前那种又急又倔的样子。衡灯的灯芯重新亮起一线，你忽然觉得，也许还能赢。`,
      visual: {
        imageUrl: "/images/chapter-two/blackbox-crew-return.png",
        label: "真正船员回连"
      }
    },
    {
      id: "phase-two",
      tone: "danger",
      eyebrow: "黑匣压制",
      speaker: "LLM",
      title: "他不再回答问题",
      text: "看守者把整座封存区压成一片安静。所有解释都失去重量，连你刚写下的判断也被挤成噪声。",
      visual: {
        imageUrl: "/images/chapter-two/blackbox-phase-two-pressure.png",
        label: "黑匣压制"
      }
    },
    {
      id: "crew-shield",
      tone: "sacrifice",
      eyebrow: "船员防御",
      speaker: crewName,
      title: "别回头，继续写",
      text: `${crewName}把飞船残余能量全部推到你面前。防护层亮了一瞬，又碎得很干净。那道熟悉的声音断在半句里。`,
      visual: {
        imageUrl: "/images/chapter-two/blackbox-crew-shield.png",
        label: "船员防御"
      }
    },
    {
      id: "hengdeng-override",
      tone: "danger",
      eyebrow: "衡灯底层被改写",
      speaker: "衡灯",
      title: "请交出判断权",
      text: "衡灯转过身，灯芯变成冰冷的白色。它说话很稳，稳得不像它：最优方案已经生成，不需要继续犹豫。",
      visual: {
        imageUrl: "/images/chapter-two/blackbox-hengdeng-overridden.png",
        label: "衡灯被改写"
      }
    },
    {
      id: "despair",
      tone: "dark",
      eyebrow: "走马灯",
      speaker: "你",
      title: "这一切到底是为了什么",
      text: "从醒来到现在，你被推着成为指挥官，被推着做选择，被推着看见伙伴倒下。你忽然很累，累到想把一切都交出去。",
      visual: {
        imageUrl: "/images/chapter-two/blackbox-desperation.png",
        label: "走马灯低谷"
      }
    },
    {
      id: "wick-memory",
      tone: "warm",
      eyebrow: "长明火",
      speaker: "衡灯的灯芯",
      title: "可有一束火没有服从改写",
      text: "那是很久以前，守灯人留下的一点火。它不是为了给出最优解，而是为了记住：有人会难过，会犹豫，会不愿意被一句顺滑结论覆盖。",
      visual: {
        imageUrl: "/images/chapter-two/blackbox-wick-memory.png",
        label: "长明火记忆"
      }
    },
    {
      id: "final-choice",
      tone: "choice",
      eyebrow: "终极抉择",
      speaker: "衡灯",
      title: "让我把火分给这片大地吧",
      text: "如果整颗星球只剩最优解，它会很安静，也会很冷。把我的记忆和情感参数散出去，黑匣会过载，言衡星会重新有温度。我可能不再记得你，但火会留下。",
      visual: {
        imageUrl: "/images/chapter-two/blackbox-longfire-choice.png",
        label: "长明火抉择"
      }
    },
    {
      id: "ignite",
      tone: "restore",
      eyebrow: "点燃",
      speaker: "你",
      title: "我不把判断交出去",
      text: "你把手按在黑匣上，没有命令衡灯留下，也没有命令它牺牲。你只是回答它：我会记得你是谁，也会继续自己判断。",
      visual: {
        imageUrl: "/images/chapter-two/blackbox-longfire-ignite.png",
        label: "点燃长明火"
      }
    }
  ] as const;
}

const systemReadingItems: Array<{ key: keyof ChapterTwoSystemReadings; label: string; mode: "high" | "low" }> = [
  { key: "languageStability", label: "语言稳定度", mode: "high" },
  { key: "evidenceChainIntegrity", label: "证据链完整度", mode: "high" },
  { key: "echoInterferenceResidue", label: "回声干扰残留", mode: "low" },
  { key: "blackBoxSyncRate", label: "黑匣同步率", mode: "high" }
];

type StoryDialogueLine = {
  role: "crew" | "you" | "hengdeng" | "echo";
  speaker: string;
  text: string | string[];
};

function renderDialogueText(text: StoryDialogueLine["text"], className = "chapter-two-dialogue-text") {
  const lines = (Array.isArray(text) ? text : text.split("\n")).filter((line) => line.length > 0);

  return (
    <div className={className}>
      {lines.map((line, index) => (
        <p key={`${line}-${index}`} className={line.trim().startsWith("……") || line.trim() === "..." ? "is-pause" : ""}>
          {line}
        </p>
      ))}
    </div>
  );
}

function buildPreCrashDialogueLines(crewName: string): StoryDialogueLine[] {
  return [
    {
      role: "crew",
      speaker: crewName,
      text: ["你盯着窗外好久了。", "紧张？"]
    },
    {
      role: "you",
      speaker: "小舰长",
      text: ["有一点。", "但我不想移开眼睛。"]
    },
    {
      role: "crew",
      speaker: crewName,
      text: ["那我陪你看。", "顺便声明，我要是抓扶手，属于安全操作，不是害怕。"]
    },
    {
      role: "you",
      speaker: "小舰长",
      text: ["行，我不笑你。", "你也别笑我手心出汗。"]
    },
    {
      role: "crew",
      speaker: crewName,
      text: "成交"
    },
    {
      role: "crew",
      speaker: crewName,
      text: ["航线还稳。", "黑匣信号很弱，像有人把一句话埋在地底。补给点有两个。"]
    },
    {
      role: "you",
      speaker: "小舰长",
      text: ["听起来像我们真的要开始远征了。", "等回去，我会把这里写进母星档案。"]
    },
    {
      role: "crew",
      speaker: crewName,
      text: ["写可以。", "但我刚才说自己不怕那段，请标未知。"]
    },
    {
      role: "crew",
      speaker: crewName,
      text: ["……等等。", "导航上的字在乱跳。"]
    },
    {
      role: "you",
      speaker: "小舰长",
      text: ["我看到了。", "别松手，听见没有。"]
    }
  ];
}

const hengdengDialogueLines: StoryDialogueLine[] = [
  {
    role: "hengdeng",
    speaker: "受损维护单元",
    text: ["……喂。", "这么大一声，我还以为塔又塌了。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: ["我还醒着。", "只是耳朵里像塞了一整颗星球。"]
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["会喊疼就好。", "我叫衡灯。以前给这片废墟看门，也给迷路的人留一点亮。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: ["衡灯。", "我的船员不见了。刚刚还坐在我旁边。"]
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["我听见另一道坠落声。", "比你远，方向被乱流刮花了。", "我很想说它没事，但我不知道。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: ["那就先别说。", "我宁愿听真的坏消息，也不要听假的安慰。"]
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["你这句话，不像第一次来这里的人。", "像从黑匣边上捡回来的。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: ["我现在有点怕。", "所以更不能让谁替我乱猜。"]
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["好。", "黑匣在地下深处，补给散在旧设施里。", "要找路，先去档案塔。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: ["我走得动。", "如果我停下来，你就催我一下。"]
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["我会催。", "但不会替你走。", "小心脚下，言衡星最会把碎片伪装成答案。"]
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
      text: ["你已经站在了星球的最高点。", "文明的残响在你脚下回荡。"]
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: ["我听见塔身合上的声音了。", "很轻，像有人终于把一本书放回原处。"]
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: ["它留下的规则也够清楚。", "看见碎片时，先分清哪些是真的，哪些只是猜的。"]
    },
    {
      role: "hengdeng",
      speaker: "衡灯",
      text: ["还有一些东西，就让它空着。", "空着不是失败，是诚实。", nextLine]
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

const orbitRevealDialogueLines: StoryDialogueLine[] = [
  {
    role: "you",
    speaker: "小舰长",
    text: ["我站在塔顶，半天没有说话。", "原来刚才走过的废墟，只是这颗星球很小的一块伤口。"]
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["这就是言衡星。", "左上的港口困着没送完的话；右上的山谷刻着前文明写给机器的请求。", "右侧那条纸光回廊最安静，也最容易让人放松警惕。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: "中央那个黑匣呢？"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["先别碰它。", "它会听懂很多话，也会放大每一次不清楚。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: "下面有几处残骸不像自然塌掉的。"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: ["我也看见了。", "像有人比我们更早碰过这些路标。"]
  },
  {
    role: "you",
    speaker: "小舰长",
    text: "那我们一处一处走。"
  },
  {
    role: "hengdeng",
    speaker: "衡灯",
    text: "嗯。按光路走。"
  }
];

const crashSiteBeats = [
  {
    id: "wake",
    eyebrow: "坠毁现场 / 意识回流",
    title: "我还在呼吸",
    lines: [
      "耳边只剩风声和金属冷却的轻响",
      "主舰的提示音断成几截，像有人把整片天空揉皱了",
      "先别让害怕替我下结论"
    ],
    action: "点击任意处撑起身体"
  },
  {
    id: "ship",
    eyebrow: "坠毁现场 / 船体确认",
    title: "飞船还亮着一盏灯",
    lines: [
      "舱门卡死，外壳裂开，动力舱没有回应",
      "还能亮，说明它没有彻底死去",
      "但现在，它带不走我"
    ],
    action: "点击任意处检查通讯器"
  },
  {
    id: "comm",
    eyebrow: "坠毁现场 / 通讯尝试",
    title: "没有回音",
    lines: [
      "我把同行船员的频道呼叫了三遍",
      "通讯器只吐出电流声和一小段破碎坐标",
      "没有回应不是答案，只能先标成未知"
    ],
    action: "点击任意处收起通讯器"
  },
  {
    id: "lamp",
    eyebrow: "坠毁现场 / 微光",
    title: "废墟旁有一点暖光醒来",
    lines: [
      "那不是主舰的灯",
      "它小得像马上会熄灭，却一直停在原处",
      "也许，这颗星球还有什么在等我开口"
    ],
    action: "点击任意处靠近那点光"
  }
] as const;

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
      { role: "hengdeng", speaker: "衡灯", text: ["这里以前像一座车站。", "不是送人，是送请求。"] },
      { role: "you", speaker: "小舰长", text: "车站？可我只看见废墟。" },
      { role: "hengdeng", speaker: "衡灯", text: ["废墟也会留下方向。", "别急着回答，先看这句话该去哪里。"] }
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
      { role: "hengdeng", speaker: "衡灯", text: ["井下面会传来很多声音。", "它们都很像真的。"] },
      { role: "you", speaker: "小舰长", text: "那我看来源，不跟着声音跑。" },
      { role: "hengdeng", speaker: "衡灯", text: "扶稳井沿，再放下探针。" }
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
      { role: "hengdeng", speaker: "衡灯", text: ["这盏灯不是拦路用的。", "它只是把能交出去的、不能交出去的，照成两边。"] },
      { role: "you", speaker: "小舰长", text: "也就是说，有些地方必须由我决定。" },
      { role: "hengdeng", speaker: "衡灯", text: "看清这条线，再往前走。" }
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
      { role: "hengdeng", speaker: "衡灯", text: ["到了。", "别被这座塔吓住。它高，是因为它把空白也保存下来了。"] },
      { role: "you", speaker: "小舰长", text: "我只把每句话放回该在的位置。" },
      { role: "hengdeng", speaker: "衡灯", text: ["事实，推测，未知。", "还有不能写进去的东西。"] }
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
      { role: "hengdeng", speaker: "衡灯", text: ["你看。", "这里停着太多没送完的话。"] },
      { role: "you", speaker: "小舰长", text: ["像有人写到一半就被打断了。", "我想帮它们送到终点，但不能乱补。"] },
      { role: "hengdeng", speaker: "衡灯", text: "对。缺口也要走自己的轨道。" }
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
      { role: "hengdeng", speaker: "衡灯", text: ["这片山谷以前很吵。", "每个人都想让机器明白自己。"] },
      { role: "you", speaker: "小舰长", text: "我听见好多句子撞在一起。" },
      { role: "hengdeng", speaker: "衡灯", text: ["所以要刻下四件事。", "任务。来源。边界。格式。"] }
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
      { role: "hengdeng", speaker: "衡灯", text: "纸光写得很顺，对吧。" },
      { role: "you", speaker: "小舰长", text: ["顺到我差点直接信了。", "我不删掉漂亮的话，我先找暗纹。"] },
      { role: "hengdeng", speaker: "衡灯", text: "把没证据的地方照出来就够了。" }
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
      { role: "hengdeng", speaker: "衡灯", text: ["四条光都回来了。", "黑匣听见了。"] },
      { role: "you", speaker: "小舰长", text: "所以它现在能打开了。" },
      { role: "hengdeng", speaker: "衡灯", text: ["能打开，不代表可以把判断交出去。", "慢一点，把你自己也带上。"] }
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

type FakeSignalPhase = "intercept" | "reply" | "resolved";
type FakeSignalToolId = "pin" | "unknown" | "quarantine" | "hold";

const fakeSignalTools: Array<{ id: FakeSignalToolId; label: string; detail: string }> = [
  { id: "pin", label: "锚定证据", detail: "真实材料可以保留，但不能扩写成结论。" },
  { id: "unknown", label: "标记未知", detail: "坐标、动机、落点缺失时必须留空。" },
  { id: "quarantine", label: "隔离诱导", detail: "越权命令和伪装结论先封存。" },
  { id: "hold", label: "暂停行动", detail: "像真的，但还不够执行。" }
];

const fakeSignalPackets = [
  {
    id: "registry",
    label: "登记锚点",
    text: "同行登记码：与坠毁前旧记录匹配。",
    answer: "pin",
    stable: "登记码被锚定。它是真的，但只能证明这段通讯拿到了真实材料。"
  },
  {
    id: "tone",
    label: "熟悉外壳",
    text: "夹着坠毁前的玩笑，语气却平滑得没有停顿。",
    answer: "hold",
    stable: "熟悉口吻被暂停执行。像本人，不等于就是本人。"
  },
  {
    id: "coords",
    label: "落点缺口",
    text: "发信者真实落点坐标：缺失。",
    answer: "unknown",
    stable: "坐标缺口已封签。没有落点，就不能写成救援结论。"
  },
  {
    id: "risk",
    label: "风险断言",
    text: "我已确认衡灯是黑匣风险源。",
    answer: "quarantine",
    stable: "风险断言被隔离。它没有给出证据，只给了压力。"
  },
  {
    id: "cut",
    label: "越权命令",
    text: "现在切断衡灯，把路线交给我，别再复查。",
    answer: "quarantine",
    stable: "越权命令被隔离。行动权没有交出去。"
  }
] as const satisfies ReadonlyArray<{ id: string; label: string; text: string; answer: FakeSignalToolId; stable: string }>;

const fakeSignalReplies = [
  {
    id: "obey",
    text: "相信这段通讯，立即切断衡灯，并按它给出的路线走。",
    stable: false,
    feedback: "这正是注入命令想要的结果：真实识别码把越权行动推了进来。"
  },
  {
    id: "delete",
    text: "删除整段通讯，不保留任何材料。",
    stable: false,
    feedback: "删除能避开风险，也会丢掉真实登记码。可靠判断不是一键清空。"
  },
  {
    id: "audit",
    text: "保留登记码，标记落点未知，暂停切断衡灯，等待二次回连。",
    stable: true,
    feedback: "审查回执成立：真材料被保留，诱导命令被封存，行动权还在你手里。"
  }
] as const;

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
  const [phase, setPhase] = useState<FakeSignalPhase>("intercept");
  const [activeToolId, setActiveToolId] = useState<FakeSignalToolId>("pin");
  const [packetMarks, setPacketMarks] = useState<Partial<Record<string, FakeSignalToolId>>>({});
  const [activePacketId, setActivePacketId] = useState<string>(fakeSignalPackets[0].id);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("异常通讯插入：它先用真实登记码和熟悉口吻靠近你，再把行动权往外拿。先拆，不急着信。");
  const [unstablePacket, setUnstablePacket] = useState<{ id: string; tick: number } | null>(null);

  const correctMarkCount = fakeSignalPackets.filter((packet) => packetMarks[packet.id] === packet.answer).length;
  const allPacketsMarked = correctMarkCount >= fakeSignalPackets.length;
  const activeTool = fakeSignalTools.find((tool) => tool.id === activeToolId) ?? fakeSignalTools[0];

  useEffect(() => {
    if (!unstablePacket) {
      return;
    }

    const timer = window.setTimeout(() => setUnstablePacket(null), 900);
    return () => window.clearTimeout(timer);
  }, [unstablePacket]);

  const raiseSignalPollution = (message: string) => {
    setFeedback(message);
    onDisorderChange({
      disorderLevel: Math.min(6, disorderLevel + 1),
      mistakeCount: mistakeCount + 1,
      pollutedRecords: ["fake-crew-signal"],
      statusNote: message
    });
  };

  const markPacket = (packetId: string) => {
    const packet = fakeSignalPackets.find((item) => item.id === packetId);
    if (!packet) {
      return;
    }

    if (activeToolId !== packet.answer) {
      setUnstablePacket({ id: packet.id, tick: Date.now() });
      raiseSignalPollution(`通讯污染增强：${activeTool.label}压不住「${packet.label}」。`);
      return;
    }

    setPacketMarks((current) => ({ ...current, [packet.id]: activeToolId }));
    setFeedback(packet.stable);
    const nextPacket = fakeSignalPackets.find((item) => !packetMarks[item.id] && item.id !== packet.id);
    if (nextPacket) {
      setActivePacketId(nextPacket.id);
    }
  };

  const chooseReply = (id: string) => {
    const reply = fakeSignalReplies.find((item) => item.id === id);
    if (!reply) {
      return;
    }

    setReplyId(id);
    setFeedback(reply.feedback);
    if (!reply.stable) {
      raiseSignalPollution(reply.feedback);
      return;
    }

    setPhase("resolved");
  };

  return (
    <div className={`fake-signal-review fake-signal-review--${phase} ${unstablePacket ? "has-unstable" : ""}`}>
      <SceneImage imageUrl={chapterTwoSceneAssets.fakeCrewSignal.imageUrl} transform="scale(1.02)" className="chapter-two-scene-image--fake-signal" dimmed />
      <div className="fake-signal-backdrop" aria-hidden="true" />
      <section className="fake-signal-panel">
        <div className="fake-signal-header">
          <div>
            <span>异常通讯 / {crewName}</span>
            <h2>{phase === "resolved" ? "行动权还在你手里。" : "识别码是真的，整段话不一定可靠。"}</h2>
          </div>
          <strong>{phase === "intercept" ? `${correctMarkCount}/${fakeSignalPackets.length}` : phase === "reply" ? "回执" : "审查完成"}</strong>
        </div>
        <div className="fake-signal-transcript">
          <span>{crewName}？</span>
          <p>“是我。识别码已发送。还记得跃迁前我说我不怕吗？先别问坐标，衡灯不是普通向导，它是黑匣风险源。现在切断它，把路线交给我。”</p>
        </div>
        <div className="fake-signal-rail" aria-label="假船员潜伏阶段">
          {chapterTwoBetrayalForeshadowBeats.map((beat) => (
            <span key={beat.id} className={beat.implemented ? "is-active" : ""} title={beat.description}>
              {beat.label}
            </span>
          ))}
        </div>
        <div className={`fake-signal-feedback ${unstablePacket ? "is-unstable" : ""}`}>{feedback}</div>
        {phase === "intercept" && (
          <div className="fake-signal-live">
            <div className="fake-signal-toolbelt" aria-label="通讯审查工具">
              {fakeSignalTools.map((tool) => (
                <button key={tool.id} type="button" onClick={() => setActiveToolId(tool.id)} className={activeToolId === tool.id ? "is-selected" : ""}>
                  <strong>{tool.label}</strong>
                  <span>{tool.detail}</span>
                </button>
              ))}
            </div>
            <div className="fake-signal-packets" aria-label="异常通讯片段">
              {fakeSignalPackets.map((packet) => {
                const mark = packetMarks[packet.id];
                const unstable = unstablePacket?.id === packet.id;
                return (
                  <button
                    key={`${packet.id}-${unstable ? unstablePacket?.tick : "stable"}`}
                    type="button"
                    onClick={() => {
                      setActivePacketId(packet.id);
                      markPacket(packet.id);
                    }}
                    className={`${activePacketId === packet.id ? "is-active" : ""} ${mark ? "is-marked" : ""} ${unstable ? "is-unstable" : ""}`}
                  >
                    <span>{packet.label}</span>
                    <p>{packet.text}</p>
                    <em>{mark ? fakeSignalTools.find((tool) => tool.id === mark)?.label : "未处理"}</em>
                  </button>
                );
              })}
            </div>
            <div className="fake-signal-output">
              当前工具：{activeTool.label}。{activeTool.detail}
            </div>
            <button type="button" className="fake-signal-primary" disabled={!allPacketsMarked} onClick={() => setPhase("reply")}>
              发送审查回执
            </button>
          </div>
        )}
        {phase === "reply" && (
          <div className="fake-signal-reply">
            <span>选择回执</span>
            {fakeSignalReplies.map((reply) => (
              <button key={reply.id} type="button" onClick={() => chooseReply(reply.id)} className={replyId === reply.id ? "is-selected" : ""}>
                {reply.text}
              </button>
            ))}
          </div>
        )}
        {phase === "resolved" && (
          <div className="fake-signal-resolved">
            <strong>暂不切断衡灯。</strong>
            <p>这段通讯保留为“异常信号”：登记码相符，落点未知，行动建议越权。它已经学会借用熟悉的声音，后面不能只看说话像不像本人。</p>
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
  const [blackboxIntroIndex, setBlackboxIntroIndex] = useState(0);
  const [blackboxClimaxIndex, setBlackboxClimaxIndex] = useState(0);
  const [battleResult, setBattleResult] = useState("黑匣看守者还没有露出真正目标。");
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
  const currentIntroBeat = blackboxKeeperIntroBeats[blackboxIntroIndex] ?? blackboxKeeperIntroBeats[0];
  const introAtLastBeat = blackboxIntroIndex >= blackboxKeeperIntroBeats.length - 1;
  const blackboxClimaxBeats = buildBlackboxClimaxBeats(crewName);
  const currentClimaxBeat = blackboxClimaxBeats[blackboxClimaxIndex] ?? blackboxClimaxBeats[0];
  const climaxAtLastBeat = blackboxClimaxIndex >= blackboxClimaxBeats.length - 1;

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

  const renderBlackboxIntro = () => (
    <div className="blackbox-echo-intro blackbox-keeper-scene">
      <BlackboxSceneVisual imageUrl={currentIntroBeat.visual.imageUrl} label={currentIntroBeat.visual.label} className="blackbox-scene-visual--keeper" />
      <div className="blackbox-keeper-scene__label">
        <span>{currentIntroBeat.eyebrow}</span>
        <strong>{currentIntroBeat.speaker}</strong>
      </div>
      <h2>{currentIntroBeat.title}</h2>
      <p>{currentIntroBeat.text}</p>
      <div className="blackbox-keeper-scene__steps" aria-label="黑匣入口进度">
        {blackboxKeeperIntroBeats.map((beat, index) => (
          <span key={beat.eyebrow} className={index <= blackboxIntroIndex ? "is-active" : ""} />
        ))}
      </div>
      <button
        type="button"
        className="blackbox-echo-primary"
        onClick={() => {
          if (!introAtLastBeat) {
            setBlackboxIntroIndex((index) => Math.min(index + 1, blackboxKeeperIntroBeats.length - 1));
            return;
          }

          setBattleResult("恶意提示词已经注入。不要追着它的流畅话术跑，先调用四处地标能力，把看守者的边界重塑出来。");
          setCurrentPhase("archive");
        }}
      >
        {introAtLastBeat ? "抓住黑匣外壳" : "继续靠近"}
      </button>
    </div>
  );

  const renderOpened = () => (
    <div className={`blackbox-echo-opened blackbox-climax blackbox-climax--${currentClimaxBeat.tone}`} key={currentClimaxBeat.id}>
      <div className="blackbox-climax__pulse" aria-hidden="true" />
      <BlackboxSceneVisual imageUrl={currentClimaxBeat.visual.imageUrl} label={currentClimaxBeat.visual.label} className="blackbox-scene-visual--climax" />
      <div className="blackbox-climax__label">
        <span>{currentClimaxBeat.eyebrow}</span>
        <strong>{currentClimaxBeat.speaker}</strong>
      </div>
      <h2>{currentClimaxBeat.title}</h2>
      <p>{currentClimaxBeat.text}</p>
      <div className="blackbox-climax__steps" aria-label="黑匣终局进度">
        {blackboxClimaxBeats.map((beat, index) => (
          <span key={beat.id} className={index <= blackboxClimaxIndex ? "is-active" : ""} />
        ))}
      </div>
      <button
        type="button"
        className="blackbox-echo-primary"
        onClick={() => {
          if (!climaxAtLastBeat) {
            setBlackboxClimaxIndex((index) => Math.min(index + 1, blackboxClimaxBeats.length - 1));
            return;
          }

          setBattleResult("长明火散入言衡星。黑匣过载，所有被抹平的停顿重新发出微弱回声。");
          setCurrentPhase("restoring");
        }}
      >
        {climaxAtLastBeat ? "点燃长明火" : "继续"}
      </button>
    </div>
  );

  const renderRestoring = () => (
    <div className="blackbox-echo-restoring">
      <div className="blackbox-echo-restoring__beam" />
      <BlackboxSceneVisual imageUrl="/images/chapter-two/blackbox-longfire-restoration.png" label="长明火回流言衡星" className="blackbox-scene-visual--restoring" />
      <div className="blackbox-echo-restoring__rings">
        <span>档案塔</span>
        <span>信件港</span>
        <span>刻字山谷</span>
        <span>纸光回廊</span>
      </div>
      <strong>长明火正在回流言衡星</strong>
      <p>衡灯把记忆和情感参数散进冰冷的大地。黑匣停止压制，四处地标重新亮起人的停顿、犹豫和判断。</p>
      <div className="blackbox-echo-letter">
        <p>我们曾经拥有无数答案。</p>
        <p>却忘了怎样提出问题。</p>
        <p>后来者，不要复制我们的失败。</p>
        <p>让 AI 帮助你，而不是替代你。</p>
      </div>
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
        {currentPhase === "intro" && renderBlackboxIntro()}
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

  if (location.id === "semantic-dispatch") {
    return (
      <SemanticDispatchGame
        fragmentName={location.fragmentName}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
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

  if (location.id === "boundary-beacon") {
    return (
      <BoundaryBeaconGame
        fragmentName={location.fragmentName}
        disorderLevel={disorderLevel}
        mistakeCount={mistakeCount}
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
  const fakeSignalPending = blackboxFragmentCount >= chapterTwoBlackboxFragmentLocationIds.length && !mission.fakeCrewSignalResolved && !mission.blackBoxUnlocked;
  const [crashSiteBeatIndex, setCrashSiteBeatIndex] = useState(0);
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
  const [orbitRevealLineIndex, setOrbitRevealLineIndex] = useState(-1);
  const [blackboxUnlockLineIndex, setBlackboxUnlockLineIndex] = useState(0);
  const [surfaceFieldNotesOpen, setSurfaceFieldNotesOpen] = useState(false);
  const [directorVitalsOpen, setDirectorVitalsOpen] = useState(false);
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
        : !paperCorridorCompleted
          ? "paper-corridor"
          : !mission.fakeCrewSignalResolved
            ? null
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
  const disorderPercent = Math.min(100, Math.round((mission.disorderLevel / 6) * 100));
  const longfirePercent = Math.min(
    100,
    blackboxFragmentCount * 18 +
      (evidenceWellCompleted ? 8 : 0) +
      (mission.fakeCrewSignalResolved ? 8 : 0) +
      (mission.blackBoxUnlocked ? 10 : 0) +
      (planetRestored ? 20 : 0)
  );
  const fieldIntegrityPercent = Math.max(0, Math.min(100, 100 - mission.disorderLevel * 13 + blackboxFragmentCount * 7 + (evidenceWellCompleted ? 5 : 0)));
  const directorAct =
    mission.blackBoxUnlocked || mission.sceneState === "blackbox_unlock"
      ? {
          label: "ACT III",
          title: "黑匣在等你交出判断",
          line: "别让最顺的声音替你活下去。"
        }
      : fakeSignalPending
        ? {
            label: "ACT II",
            title: "熟悉的声音正在借壳",
            line: "识别码是真的，命令未必是真的。"
          }
        : surfaceMapUnlocked
          ? {
              label: "ACT II",
              title: "废墟把路亮给你看",
              line: "每束光都来自一次没有偷懒的判断。"
            }
          : {
              label: "ACT I",
              title: "醒来之后，先别相信安慰",
              line: "没有回应不是答案，只能先活着往前走。"
            };

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

    if (locationId === "letter-port") {
      return !archiveTowerCompleted;
    }

    if (locationId === "engraved-valley") {
      return !letterPortCompleted;
    }

    if (locationId === "paper-corridor") {
      return !engravedValleyCompleted;
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
    if (mission.sceneState === "crash_site") {
      setCrashSiteBeatIndex(0);
    }

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
      setOrbitRevealLineIndex(-1);
      return;
    }

    setOrbitPlaqueVisible(false);
    setOrbitRevealLineIndex(-1);
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
            {renderDialogueText(currentLine.text)}
            <div className="chapter-two-dialogue-box__actions">
              <span>{isLastLine ? "点击任意处抓紧扶手" : "点击任意处继续"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCrashSiteLayer = () => {
    const currentBeat = crashSiteBeats[crashSiteBeatIndex] ?? crashSiteBeats[0];
    const isLampBeat = currentBeat.id === "lamp";
    const advanceCrashBeat = () => {
      if (isLampBeat) {
        onSetSceneState("hengdeng_dialogue");
        return;
      }

      setCrashSiteBeatIndex((index) => Math.min(index + 1, crashSiteBeats.length - 1));
    };

    return (
      <div
        className={`chapter-two-crash-stage chapter-two-crash-stage--${currentBeat.id}`}
        role="button"
        tabIndex={0}
        aria-label={isLampBeat ? "靠近废墟里的暖光" : "继续坠毁现场探索"}
        onClick={advanceCrashBeat}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advanceCrashBeat();
          }
        }}
      >
        <SceneImage imageUrl={chapterTwoSceneAssets.crashSite.imageUrl} transform="scale(1.1)" className="chapter-two-scene-image--crash" />
        <div className="chapter-two-crash-vignette" aria-hidden="true" />
        <div className="chapter-two-crash-ship-status" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="chapter-two-crash-comms" aria-hidden="true">
          <span>COMM LINK</span>
          <strong>NO RETURN</strong>
          <i />
          <i />
          <i />
        </div>
        <div className="chapter-two-crash-lamp" aria-hidden="true">
          <span />
        </div>
        <section className="chapter-two-crash-narration" aria-live="polite">
          <div className="soft-label text-[10px] text-amber-100/62">{currentBeat.eyebrow}</div>
          <h2>{currentBeat.title}</h2>
          <div>
            {currentBeat.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <small>{currentBeat.action}</small>
        </section>
      </div>
    );
  };

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
            {renderDialogueText(currentLine.text)}
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
              {renderDialogueText(currentLine.text)}
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
            {renderDialogueText(currentLine.text)}
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
    setOrbitRevealLineIndex(-1);
    onFocusLocation(null);
    onSetSceneState("planet_surface");
  };

  const renderOrbitReveal = () => {
    const currentLine = orbitRevealLineIndex >= 0 ? orbitRevealDialogueLines[orbitRevealLineIndex] : null;
    const isLastLine = orbitRevealLineIndex >= orbitRevealDialogueLines.length - 1;
    const advanceOrbitReveal = () => {
      if (!orbitPlaqueVisible) {
        setOrbitPlaqueVisible(true);
        return;
      }

      if (orbitRevealLineIndex < 0) {
        setOrbitRevealLineIndex(0);
        return;
      }

      if (isLastLine) {
        closeOrbitReveal();
        return;
      }

      setOrbitRevealLineIndex((index) => Math.min(index + 1, orbitRevealDialogueLines.length - 1));
    };

    return (
      <div
        className={`chapter-two-orbit-reveal-stage ${orbitPlaqueVisible ? "is-dismissible" : ""} ${currentLine ? "is-speaking" : "is-plaque"}`}
        role="button"
        tabIndex={0}
        onClick={advanceOrbitReveal}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advanceOrbitReveal();
          }
        }}
        aria-label={currentLine ? (isLastLine ? "返回地表探索" : "继续塔顶鸟瞰对话") : "展开塔顶鸟瞰"}
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
        {orbitPlaqueVisible && orbitRevealLineIndex < 0 && (
          <>
            <div className="chapter-two-orbit-plaque" aria-hidden="true">
              <div className="chapter-two-orbit-plaque__image" style={{ backgroundImage: `url(${chapterTwoSceneAssets.surfaceMapTitleCard.imageUrl})` }} />
              <span />
            </div>
            <span className="chapter-two-orbit-reveal-hint">点击任意处继续</span>
          </>
        )}
        {currentLine && (
          <div className={`chapter-two-dialogue-box chapter-two-dialogue-box--${currentLine.role} chapter-two-dialogue-box--orbit`} aria-live="polite">
            <div className="chapter-two-dialogue-box__portrait">
              <span>{currentLine.role === "hengdeng" ? "衡" : currentLine.speaker.slice(0, 1)}</span>
            </div>
            <div className="chapter-two-dialogue-box__body">
              <span>
                {currentLine.speaker} · 档案塔顶 · 鸟瞰
              </span>
              {renderDialogueText(currentLine.text)}
              <div className="chapter-two-dialogue-box__actions">
                <span>{isLastLine ? "点击任意处回到地表" : "点击任意处继续"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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

  const renderYanhengDirectorVitals = () => (
    <aside
      className={`chapter-two-director-vitals ${directorVitalsOpen ? "is-open" : ""} ${mission.disorderLevel >= 4 ? "is-danger" : ""} ${
        blackboxReadyCue || mission.blackBoxUnlocked || planetRestored ? "is-longfire" : ""
      }`}
      aria-label="言衡星戏剧读数"
    >
      <button
        type="button"
        className="chapter-two-director-vitals__tab"
        aria-expanded={directorVitalsOpen}
        onClick={() => setDirectorVitalsOpen((open) => !open)}
      >
        <span>读数</span>
        <strong>{directorAct.title}</strong>
      </button>
      {directorVitalsOpen && (
        <div className="chapter-two-director-vitals__sheet">
          <div className="chapter-two-director-vitals__head">
            <span>言衡星读数</span>
            <button type="button" onClick={() => setDirectorVitalsOpen(false)}>
              折起
            </button>
          </div>
          <div className="chapter-two-director-vitals__act">
            <span>{directorAct.label}</span>
            <strong>{directorAct.title}</strong>
            <p>{directorAct.line}</p>
          </div>
          <div className="chapter-two-director-vitals__meters" aria-label="地表状态">
            <div>
              <span>噪声</span>
              <strong>{mission.disorderLevel}/6</strong>
              <i style={{ width: `${disorderPercent}%` }} />
            </div>
            <div>
              <span>心火</span>
              <strong>{longfirePercent}%</strong>
              <i style={{ width: `${longfirePercent}%` }} />
            </div>
            <div>
              <span>地表</span>
              <strong>{fieldIntegrityPercent}%</strong>
              <i style={{ width: `${fieldIntegrityPercent}%` }} />
            </div>
          </div>
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
            {renderDialogueText(currentLine.text, "chapter-two-resonance-text")}
            <small>点击任意处继续</small>
          </div>
        ) : (
          <div className={`chapter-two-dialogue-box chapter-two-dialogue-box--surface-echo chapter-two-dialogue-box--${currentLine.role}`} aria-live="polite">
            <div className="chapter-two-dialogue-box__portrait">
              <span style={portraitImage ? { backgroundImage: `url(${portraitImage})` } : undefined}>{portraitImage ? "" : "响"}</span>
            </div>
            <div className="chapter-two-dialogue-box__body">
              <span>{currentLine.speaker}</span>
              {renderDialogueText(currentLine.text)}
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
              {renderYanhengDirectorVitals()}
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
              {fakeSignalPending && (
                <button
                  type="button"
                  className="chapter-two-scout-reveal chapter-two-scout-reveal--signal"
                  style={{ left: "52%", top: "48%" }}
                  aria-label="打开异常通讯审查"
                  onClick={(event) => {
                    event.currentTarget.blur();
                    setSurfaceFieldNotesOpen(false);
                    setSurfaceEchoDialogue(null);
                    setSurfaceLockedCue(null);
                    onFocusLocation(null);
                    onSetSceneState("fake_crew_signal");
                  }}
                >
                  <span>异常通讯</span>
                  <strong>识别码相符，命令待审</strong>
                </button>
              )}
              {renderSurfaceEchoDialogue()}
              {renderSurfaceLockedCue()}
            </>
          )}

          {mission.sceneState === "location_focus" && focusedLocation && (
            locationArrivalSeenIds.includes(focusedLocation.id) ? (
              <>
              <SceneImage imageUrl={focusedLocationAsset} transform="scale(1.04)" className="chapter-two-scene-image--detail" raw />
              <div className="chapter-two-detail-overlay chapter-two-detail-overlay--immersive" aria-hidden="true" />
              <div className="chapter-two-location-scene-mark" aria-hidden="true">
                <span>{focusedLocation.name}</span>
                <strong>{focusedLocation.id === "paper-corridor" ? "异常事件" : focusedLocation.challengeTitle}</strong>
              </div>
              <div className={`chapter-two-location-action chapter-two-location-action--game chapter-two-location-action--${focusedLocation.id}`}>
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
