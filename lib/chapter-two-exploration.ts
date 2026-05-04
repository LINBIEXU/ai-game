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
    summary: "一座像车站又像图书馆的庭院，负责把混杂的信息请求分流成任务、对象、格式和去向。",
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
      "分流庭不会替人决定真相，它只把请求拆成：对象、任务、限制、输出方式。",
      "如果请求太模糊，后面的档案塔和信件港都会收到错误方向。"
    ],
    loreCheck: {
      question: "这座庭院最重要的作用是什么？",
      options: [
        { id: "sort", label: "把模糊请求拆成清楚任务", explanation: "对。先拆清楚，后面的 AI 才知道该帮什么。" },
        { id: "invent", label: "自动创造所有答案", explanation: "这会把 AI 写成万能机器，不符合言衡星的规则。" },
        { id: "replace", label: "替你选择真相", explanation: "判断仍然属于你，星球只帮助整理。" }
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
    summary: "井壁会放出被污染的残记录，要求用探针扫出事实、推测和未知。",
    detail: "这里补足“为什么不能把未知写成事实”的前置理解。",
    discovery: "证据碎片回流主舰：没有证据的位置，应该留下空白或写上未知。",
    position: { x: 49, y: 49 },
    size: "sm",
    detailAssetKey: "archiveTower",
    symbol: "据",
    fragmentName: "证据碎片",
    challengeTitle: "净化证据回声井",
    challengePrompt: "扫描污染记录，给每段文字落下事实、推测或未知探针。",
    loreLines: [
      "井壁会先放出一段被污染的记录。",
      "每一次误触都会让失序强度升高，井壁文字也会更浑。",
      "只有把无证据的位置封为未知，证据碎片才会脱离污染层。"
    ],
    loreCheck: {
      question: "如果档案缺少收件人，最稳妥的写法是什么？",
      options: [
        { id: "unknown", label: "标注收件人未知", explanation: "对。缺口要被看见，不能被漂亮句子遮住。" },
        { id: "guess", label: "猜一个最像的人名", explanation: "猜测可以被标成推测，但不能直接写成事实。" },
        { id: "delete", label: "删掉这封信", explanation: "残缺记录仍有价值，关键是标明缺失。" }
      ],
      correctOptionId: "unknown",
      success: "回声井稳定下来：未知不是失败，是诚实的记录。",
      retry: "想想黑匣最怕什么：把缺口补得太顺。"
    }
  },
  {
    id: "boundary-beacon",
    name: "边界灯标",
    role: "lore",
    summary: "一组低空灯标标出 AI 能帮忙的范围：整理、改写、建议，但不能替你判断。",
    detail: "这里提前解释后续挑战里的“边界、不能编造、输出格式”为什么重要。",
    discovery: "你校准了边界灯标：让 AI 帮忙前，要先说明它不能越过哪里。",
    position: { x: 83, y: 57 },
    size: "sm",
    detailAssetKey: "engravedPaperCorridor",
    symbol: "界",
    fragmentName: "边界记录",
    challengeTitle: "校准边界灯标",
    challengePrompt: "确认哪些工作适合交给 AI 帮忙，哪些判断必须留给自己。",
    loreLines: [
      "边界灯标曾经保护言衡星的写作和归档系统：可以让 AI 整理、改写、提出选项。",
      "但涉及事实、证据、选择和责任时，灯标会把判断权交还给人。",
      "失序回声最常诱导后来者说：既然它说得流畅，就直接相信。"
    ],
    loreCheck: {
      question: "下面哪条指令最符合边界灯标？",
      options: [
        { id: "bounded", label: "只根据残片整理，未知请标出", explanation: "对。它说明了资料范围和缺口处理方式。" },
        { id: "perfect", label: "帮我写一个完全正确的答案", explanation: "这没有说明依据，也把正确性交给了 AI。" },
        { id: "replace-me", label: "替我决定最后结论", explanation: "AI 可以提供参考，但不能替你成为判断者。" }
      ],
      correctOptionId: "bounded",
      success: "灯标把边界写入导览图：帮助不是替代。",
      retry: "边界灯标看重的是资料范围、不能编造和人的最终判断。"
    }
  },
  {
    id: "archive-tower",
    name: "档案塔",
    role: "landmark",
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
    role: "landmark",
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
    role: "landmark",
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
    role: "landmark",
    summary: "半透明纸光突然写出一段很顺的结论，但其中有几处没有依据。",
    detail: "回廊会先放出漂亮却不可靠的表达，再等待你用扫描和调谐修复。",
    discovery: "你点亮了一段表达回廊：好表达不只顺口，还要说明依据、未知和边界。",
    position: { x: 58, y: 64 },
    size: "md",
    detailAssetKey: "paperCorridor",
    symbol: "言",
    fragmentName: "表达碎片",
    challengeTitle: "纸光异常生成",
    challengePrompt: "纸光先写出一段很顺的结论。先扫描它哪里缺依据，再进入调谐。"
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
