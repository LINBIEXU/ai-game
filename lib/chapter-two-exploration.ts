import type { ChapterTwoLocationId, ChapterTwoPlanetId, ChapterTwoSceneState } from "@/types/game";

export const chapterTwoSceneAssets = {
  shipBridge: {
    label: "飞船主舱背景",
    imageUrl: "/images/ship/bridge-main.png"
  },
  launch: {
    label: "跃迁背景",
    imageUrl: "/images/chapter-two/warp-travel.png"
  },
  sector: {
    label: "宇宙区域背景",
    imageUrl: "/images/chapter-two/sector-view.png"
  },
  motherPlanet: {
    label: "母星星球图",
    imageUrl: null as string | null
  },
  languagePlanet: {
    label: "语言与信息文明星球图",
    imageUrl: "/images/chapter-two/language-planet.png"
  },
  languageSurfaceGuide: {
    label: "语言与信息文明星球地表沉寂态背景",
    imageUrl: "/images/chapter-two/language-surface-guide.png"
  },
  languageSurfaceRestored: {
    label: "语言与信息文明星球地表复苏态背景",
    imageUrl: "/images/chapter-two/language-surface-guide.png"
  },
  languageOrbitDormant: {
    label: "轨道视角星球沉寂态",
    imageUrl: "/images/chapter-two/language-planet.png"
  },
  languageOrbitRestored: {
    label: "轨道视角星球复苏态",
    imageUrl: "/images/chapter-two/language-planet.png"
  },
  archiveTower: {
    label: "档案塔详情图",
    imageUrl: "/images/chapter-two/archive-tower.png"
  },
  letterPort: {
    label: "漂浮信件港详情图",
    imageUrl: "/images/chapter-two/letter-port.png"
  },
  engravedPaperCorridor: {
    label: "刻字山谷 / 纸光回廊详情图",
    imageUrl: "/images/chapter-two/engraved-paper-corridor.png"
  },
  paperCorridor: {
    label: "纸光回廊详情图",
    imageUrl: "/images/chapter-two/engraved-paper-corridor.png"
  },
  blackboxVault: {
    label: "黑匣封存台详情图",
    imageUrl: "/images/chapter-two/blackbox-vault.png"
  }
} as const;

export const chapter2Assets = {
  shipBridge: chapterTwoSceneAssets.shipBridge.imageUrl,
  warp: chapterTwoSceneAssets.launch.imageUrl,
  sector: chapterTwoSceneAssets.sector.imageUrl,
  homePlanet: chapterTwoSceneAssets.motherPlanet.imageUrl,
  targetPlanet: chapterTwoSceneAssets.languagePlanet.imageUrl,
  surfaceDormant: chapterTwoSceneAssets.languageSurfaceGuide.imageUrl,
  surfaceRestored: chapterTwoSceneAssets.languageSurfaceRestored.imageUrl,
  archiveTower: chapterTwoSceneAssets.archiveTower.imageUrl,
  mailHarbor: chapterTwoSceneAssets.letterPort.imageUrl,
  inscriptionValley: chapterTwoSceneAssets.engravedPaperCorridor.imageUrl,
  paperlightCorridor: chapterTwoSceneAssets.paperCorridor.imageUrl,
  blackboxPlatform: chapterTwoSceneAssets.blackboxVault.imageUrl,
  orbitDormant: chapterTwoSceneAssets.languageOrbitDormant.imageUrl,
  orbitRestored: chapterTwoSceneAssets.languageOrbitRestored.imageUrl
} as const;

export const chapterTwoAuxiliaryAssets = {
  sectorHotspot: null as string | null,
  surfaceHotspot: null as string | null,
  blackboxGlow: null as string | null,
  floatingFragments: null as string | null
} as const;

export interface ChapterTwoPlanetNode {
  id: ChapterTwoPlanetId;
  name: string;
  eyebrow: string;
  summary: string;
  detail: string;
  hint: string;
  position: { x: number; y: number };
  size: number;
  accentClassName: string;
  canEnter: boolean;
  assetKey: keyof typeof chapterTwoSceneAssets;
}

export interface ChapterTwoLocationNode {
  id: ChapterTwoLocationId;
  name: string;
  role?: "lore" | "landmark" | "vault";
  summary: string;
  detail: string;
  discovery: string;
  position: { x: number; y: number };
  size: "sm" | "md" | "lg";
  detailAssetKey: keyof typeof chapterTwoSceneAssets;
  initiallyLocked?: boolean;
  symbol: string;
  fragmentName: string;
  challengeTitle: string;
  challengePrompt: string;
  loreLines?: string[];
  loreCheck?: {
    question: string;
    options: Array<{ id: string; label: string; explanation: string }>;
    correctOptionId: string;
    success: string;
    retry: string;
  };
}

export const chapterTwoPlanetNodes: ChapterTwoPlanetNode[] = [
  {
    id: "mother",
    name: "母星 / 第一基地",
    eyebrow: "文明复兴母星",
    summary: "第一章建立的母星继续承担补给、存档与文明回流，是这次远征的出发点。",
    detail: "本章只保留它作为后方基地坐标，不展开自由探索。",
    hint: "母星负责回收成果与科技点。",
    position: { x: 24, y: 58 },
    size: 118,
    accentClassName: "chapter-two-planet-node--mother",
    canEnter: false,
    assetKey: "motherPlanet"
  },
  {
    id: "language",
    name: "言衡星",
    eyebrow: "语言与信息文明星",
    summary: "这颗星球曾负责文书归档、信息传递、知识整理与叙事创作，第一枚科技黑匣就封存在地表深处。",
    detail: "点击后先进入极简星球预览，再一镜到底压到地表导览图。",
    hint: "当前主任务：登陆并开启第一枚科技黑匣。",
    position: { x: 71, y: 39 },
    size: 152,
    accentClassName: "chapter-two-planet-node--language",
    canEnter: true,
    assetKey: "languagePlanet"
  }
];

export const chapterTwoSurfaceLocations: ChapterTwoLocationNode[] = [
  {
    id: "semantic-dispatch",
    name: "语义分流庭",
    role: "lore",
    summary: "一座像车站又像图书馆的庭院，负责把混杂的信息请求分流成去向。",
    detail: "这里说明：言衡星不是“聊天星球”，它曾经承担文书分流、知识整理和信息转送。",
    discovery: "你确认了言衡星的第一项职能：把模糊请求拆成可执行的信息任务。",
    position: { x: 31, y: 63 },
    size: "sm",
    detailAssetKey: "letterPort",
    symbol: "流",
    fragmentName: "职能记录",
    challengeTitle: "读取分流庭职能",
    challengePrompt: "先弄清这颗星球怎样处理信息，再进入真正的地标修复。",
    loreLines: [
      "前文明把每天的记录、信件、故事草稿和学习资料送到这里。",
      "分流庭只负责分拣。",
      "请求太模糊时，后面的地标会收到错误方向。"
    ],
    loreCheck: {
      question: "这座庭院最重要的作用是什么？",
      options: [
        { id: "sort", label: "把模糊请求送到正确地标", explanation: "对。分流庭只负责分拣方向。" },
        { id: "invent", label: "自动创造所有答案", explanation: "这不是言衡星的职责。" },
        { id: "replace", label: "选择最后结论", explanation: "这不是分流庭的职责。" }
      ],
      correctOptionId: "sort",
      success: "分流庭的指示牌亮起：先说清任务，再请求帮助。",
      retry: "再看一眼：它不是给答案的神殿，而是把请求整理清楚的地方。"
    }
  },
  {
    id: "evidence-well",
    name: "证据回声井",
    role: "lore",
    summary: "井壁会放出被污染的残记录，要求用探针扫出来源层级。",
    detail: "这里像一口预备扫描井，只留下可回看的来源分层。",
    discovery: "证据碎片回流主舰：残记录已经分层。",
    position: { x: 49, y: 49 },
    size: "sm",
    detailAssetKey: "archiveTower",
    symbol: "据",
    fragmentName: "证据碎片",
    challengeTitle: "净化证据回声井",
    challengePrompt: "扫描污染记录，给每段文字落下对应探针。",
    loreLines: [
      "井壁会先放出一段被污染的记录。",
      "每一次误触都会让失序强度升高，井壁文字也会更浑。",
      "探针归位后，证据碎片才会脱离污染层。"
    ],
    loreCheck: {
      question: "如果档案缺少收件人，最稳妥的写法是什么？",
      options: [
        { id: "unknown", label: "标注收件人未知", explanation: "对。缺口留在缺口位置。" },
        { id: "guess", label: "猜一个最像的人名", explanation: "这会让记录失真。" },
        { id: "delete", label: "删掉这封信", explanation: "残缺记录仍有价值。" }
      ],
      correctOptionId: "unknown",
      success: "回声井稳定下来：探针已归位。",
      retry: "先看残记录本身，不急着补完整。"
    }
  },
  {
    id: "boundary-beacon",
    name: "边界灯标",
    role: "lore",
    summary: "一组低空灯标标出协助范围。",
    detail: "这里只留下通行边界：能协助，也要守线。",
    discovery: "你校准了边界灯标：协助范围写入导览图。",
    position: { x: 83, y: 57 },
    size: "sm",
    detailAssetKey: "engravedPaperCorridor",
    symbol: "界",
    fragmentName: "边界记录",
    challengeTitle: "校准边界灯标",
    challengePrompt: "确认灯标允许的协助范围。",
    loreLines: [
      "边界灯标曾经保护言衡星的写作和归档系统。",
      "灯标会把可协助的部分照亮，把越线部分压暗。",
      "光线越清楚，后续地标越不容易走偏。"
    ],
    loreCheck: {
      question: "下面哪条指令最符合边界灯标？",
      options: [
        { id: "bounded", label: "只根据残片整理", explanation: "对。资料范围清楚。" },
        { id: "perfect", label: "写一个完全正确的答案", explanation: "这条请求没有边界。" },
        { id: "replace-me", label: "决定最后结论", explanation: "这越过了灯标。" }
      ],
      correctOptionId: "bounded",
      success: "灯标把协助范围写入导览图。",
      retry: "边界灯标只看范围是否清楚。"
    }
  },
  {
    id: "archive-tower",
    name: "档案塔",
    role: "landmark",
    summary: "断裂高塔仍保留着前文明如何调用文字模型的核心记录。",
    detail: "塔身保存旧文明最后的文字层。",
    discovery: "你带回了一段文明遗言：语言能延长记忆，但不能替事实作证。",
    position: { x: 35, y: 28 },
    size: "md",
    detailAssetKey: "archiveTower",
    symbol: "档",
    fragmentName: "归档碎片",
    challengeTitle: "修复失序档案",
    challengePrompt: "把散落的记录重新归档，让第一束信息光回到黑匣。"
  },
  {
    id: "letter-port",
    name: "漂浮信件港",
    role: "landmark",
    summary: "低重力港湾里漂着无数未被送达的信件与信息碎片。",
    detail: "港口轨道只把原文、推测和缺口分开。",
    discovery: "你确认了：缺失信息必须标未知。",
    position: { x: 19, y: 42 },
    size: "lg",
    detailAssetKey: "letterPort",
    symbol: "信",
    fragmentName: "传递碎片",
    challengeTitle: "接通信件轨道",
    challengePrompt: "把断裂的信件轨道接回去，让消息知道该往哪里流动。"
  },
  {
    id: "engraved-valley",
    name: "刻字山谷",
    role: "landmark",
    summary: "整片地表像被巨型刻刀刻过，旧铭文一层层嵌进岩层。",
    detail: "这里只校准一件事：指令必须刻清楚。",
    discovery: "你看到前文明把清楚指令刻成了固定格式。",
    position: { x: 75, y: 34 },
    size: "md",
    detailAssetKey: "engravedPaperCorridor",
    symbol: "证",
    fragmentName: "求证碎片",
    challengeTitle: "校准可靠铭文",
    challengePrompt: "把目标、语境、边界和格式重新刻清。"
  },
  {
    id: "paper-corridor",
    name: "纸光回廊",
    role: "landmark",
    summary: "半透明纸光突然写出一段很顺的结论，光带却仍在颤动。",
    detail: "回廊只检查一件事：表达顺畅，不等于可以相信。",
    discovery: "你点亮了一段表达回廊：顺口的句子也要经得起复查。",
    position: { x: 88, y: 24 },
    size: "md",
    detailAssetKey: "paperCorridor",
    symbol: "言",
    fragmentName: "表达碎片",
    challengeTitle: "纸光异常生成",
    challengePrompt: "纸光先写出一段很顺的结论。先扫描它为什么不稳。"
  },
  {
    id: "blackbox-vault",
    name: "黑匣封存台",
    role: "vault",
    summary: "科技黑匣封存在中央高台，只有四个黑匣地标都被探索后才会亮起。",
    detail: "它不是宝箱，而是一段文明知识必须被验证后才能开启的入口。",
    discovery: "科技黑匣开始回应，中央高台进入可接触状态。",
    position: { x: 68, y: 71 },
    size: "lg",
    detailAssetKey: "blackboxVault",
    initiallyLocked: true,
    symbol: "匣",
    fragmentName: "科技黑匣",
    challengeTitle: "开启黑匣封存台",
    challengePrompt: "四束信息光已经汇聚，黑匣正在等待最后一次触碰。"
  }
];

export const chapterTwoUnlockLocationIds: ChapterTwoLocationId[] = [
  "archive-tower",
  "letter-port",
  "engraved-valley",
  "paper-corridor"
];

export const chapterTwoEvidenceFragmentLocationId: ChapterTwoLocationId = "evidence-well";

export const chapterTwoBlackboxFragmentLocationIds: ChapterTwoLocationId[] = chapterTwoUnlockLocationIds;

export const chapterTwoProgressFragmentIds: ChapterTwoLocationId[] = [
  chapterTwoEvidenceFragmentLocationId,
  ...chapterTwoBlackboxFragmentLocationIds
];

export const chapterTwoSceneLabelMap: Record<ChapterTwoSceneState, string> = {
  ship_bridge: "主舰准备中",
  launch_sequence: "引擎点火",
  warp_travel: "空间跃迁",
  sector_view: "新宇宙区域",
  planet_preview: "星球预览",
  planet_descent: "进入星球",
  planet_surface: "地表导览",
  location_focus: "地点详情",
  blackbox_unlock: "黑匣解锁",
  memory_archive: "黑匣学习层",
  boss_trial: "黑匣挑战层",
  chapter_reward: "远征成果回流"
};
