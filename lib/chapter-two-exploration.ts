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
    id: "archive-tower",
    name: "档案塔",
    summary: "断裂高塔仍保留着前文明如何调用文字模型的核心记录。",
    detail: "这里负责给出第一层“会续写，不等于真正理解”的线索。",
    discovery: "你带回了一段文明遗言：语言能延长记忆，但不能替事实作证。",
    position: { x: 43, y: 28 },
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
    summary: "低重力港湾里漂着无数未被送达的信件与信息碎片。",
    detail: "这里会强化“缺失信息必须标成未知，而不是补成事实”。",
    discovery: "你确认了：记录可以残缺，但不能让猜测冒充真实。",
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
    summary: "整片地表像被巨型刻刀刻过，命令、边界和残缺记录都嵌进了岩层。",
    detail: "这里更像训练“如何给出清楚任务”，而不只是让 AI 帮忙。",
    discovery: "你看到前文明把目标、语境、边界和输出方式都刻成了固定格式。",
    position: { x: 75, y: 34 },
    size: "md",
    detailAssetKey: "engravedPaperCorridor",
    symbol: "证",
    fragmentName: "求证碎片",
    challengeTitle: "辨认可靠记录",
    challengePrompt: "找出仍有依据的刻痕，让记录不再被猜测覆盖。"
  },
  {
    id: "paper-corridor",
    name: "纸光回廊",
    summary: "半透明的纸光桥廊在风里断续展开，像一段还没说清楚的话。",
    detail: "这里负责唤醒“表达要清楚，边界要明确”的第一层文明回路。",
    discovery: "你点亮了一段表达回廊：清楚表达，才会让系统更稳地回应。",
    position: { x: 58, y: 64 },
    size: "md",
    detailAssetKey: "paperCorridor",
    symbol: "言",
    fragmentName: "表达碎片",
    challengeTitle: "点亮表达回廊",
    challengePrompt: "让断续的纸光重新展开，补齐一段清楚、可传递的表达。"
  },
  {
    id: "blackbox-vault",
    name: "黑匣封存台",
    summary: "科技黑匣封存在中央高台，只有前置地点都被探索后才会亮起。",
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
