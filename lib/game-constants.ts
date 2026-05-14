import type {
  BridgeModuleId,
  ChapterTwoRepairReadings,
  ChapterTwoSystemReadings,
  ChapterTwoState,
  CrewFormType,
  CrewRole,
  CrewTalent,
  CrewTemperament,
  MissingInfo,
  RecruitForm,
  ShipTask,
  SignalMissionState,
  SignalNature
} from "@/types/game";
import { createInitialMemoryVaultState } from "@/lib/memory-vault";
import { emptyHomePlanetHubState } from "@/lib/home-planet-hub";

export const STORAGE_KEY = "starship-prototype-save-v5";

export const emptyRecruitForm = (): RecruitForm => ({
  description: "",
  formType: null,
  role: null,
  temperament: null,
  talent: null,
  styleTags: [],
  specialFocus: "",
  customPrompt: "",
  notes: ""
});

export const emptySignalMission = (): SignalMissionState => ({
  ...createInitialMemoryVaultState()
});

export const emptyChapterTwoRepairReadings = (): ChapterTwoRepairReadings => ({
  goalClarity: 0,
  evidenceIntegrity: 0,
  unknownMarking: 0,
  boundaryAwareness: 0
});

export const emptyChapterTwoSystemReadings = (): ChapterTwoSystemReadings => ({
  languageStability: 32,
  evidenceChainIntegrity: 28,
  echoInterferenceResidue: 72,
  blackBoxSyncRate: 0
});

export const emptyChapterTwoState = (): ChapterTwoState => ({
  currentStep: "response",
  sceneState: "ship_bridge",
  focusedPlanetId: null,
  focusedLocationId: null,
  exploredLocationIds: [],
  disorderLevel: 2,
  mistakeCount: 0,
  pollutedRecords: [],
  baseEffectNotes: [],
  baseScanHints: [],
  locationRewardClaims: [],
  repairReadings: emptyChapterTwoRepairReadings(),
  repairReadingLogs: [],
  systemReadings: emptyChapterTwoSystemReadings(),
  settlementLogs: [],
  crewAssistRecords: [],
  blackBoxUnlocked: false,
  fakeCrewSignalResolved: false,
  echo: null,
  truth: null,
  attemptCount: 0,
  responsePrompt: "",
  responseAnalysis: null,
  leadCrewId: null,
  supportCrewId: null,
  leadDuty: null,
  supportDuty: null,
  assignmentPrompt: "",
  assignmentAnalysis: null,
  roundOneFocus: null,
  roundOnePrompt: "",
  roundOneAnalysis: null,
  roundOneResult: null,
  roundTwoRefinement: null,
  roundTwoPrompt: "",
  roundTwoSupportMode: null,
  roundTwoAnalysis: null,
  roundTwoResult: null,
  lastSetback: null,
  finalChoice: null,
  outcome: null
});

export const createInitialGameState = () => ({
  currentScene: "awakening" as const,
  recruitForm: emptyRecruitForm(),
  recruitAnalysis: null,
  crewVariant: 0,
  generatedCrew: null,
  crewRoster: [],
  activeCrewId: null,
  crewOnboard: false,
  systemsRestored: false,
  hubSignalSeen: false,
  firstStarLit: false,
  chapterComplete: false,
  chapterTwoUnlocked: false,
  chapterTwoRouteLocked: false,
  chapterTwoComplete: false,
  chapterThreeHintUnlocked: false,
  scannedRegionLabel: null,
  newRegionAlert: false,
  technologyPoints: 0,
  aiCapabilityLevel: 1,
  aiCapabilityUnlocks: ["基础理解"],
  planetCatalog: [],
  faultCaseRecords: [],
  signalMission: emptySignalMission(),
  taskDesk: {
    tasks: [],
    selectedTaskId: null,
    assignedCrewId: null,
    latestResult: null
  },
  chapterTwo: emptyChapterTwoState(),
  homePlanetHub: emptyHomePlanetHubState(),
  shipLogs: [],
  shipStatusNote: null,
  classroomArtifacts: []
});

export const chapterTwoFocusOptions = [
  "身份线索",
  "坐标结构",
  "异常语气"
] as const;

export const chapterTwoRefinementOptions = [
  "补发讯人细节",
  "切换主分析员",
  "强化区域描述"
] as const;

export const chapterTwoDutyOptions = [
  "前线解析",
  "后方稳定",
  "环境扫描",
  "记录还原"
] as const;

export const chapterTwoFinalChoiceOptions = [
  "深入追踪",
  "记录后返航",
  "激活隐藏模块"
] as const;

export const formTypeOptions: Array<{ value: CrewFormType; label: string; hint: string }> = [
  { value: "mechanical", label: "机械体", hint: "骨架清晰，反应精准" },
  { value: "biological", label: "生物体", hint: "感知敏锐，动作灵活" },
  { value: "energy", label: "能量体", hint: "光谱漂移，信号亲和" },
  { value: "hybrid", label: "未知混合", hint: "边界模糊，难以归类" }
];

export const roleOptions: Array<{ value: CrewRole; label: string; hint: string }> = [
  { value: "scout", label: "侦察", hint: "先看到异常，再靠近真相" },
  { value: "repair", label: "修复", hint: "适合处理损坏与断裂" },
  { value: "record", label: "记录", hint: "记住一切，不漏掉细节" },
  { value: "pilot", label: "领航", hint: "给飞船找到下一条路" }
];

export const temperamentOptions: Array<{ value: CrewTemperament; label: string; hint: string }> = [
  { value: "calm", label: "冷静", hint: "越混乱越稳定" },
  { value: "warm", label: "热情", hint: "总能先把气氛点亮" },
  { value: "cunning", label: "狡黠", hint: "习惯绕开直线答案" },
  { value: "steady", label: "稳重", hint: "动作不急，但很可靠" }
];

export const talentOptions: Array<{ value: CrewTalent; label: string; hint: string }> = [
  { value: "decode", label: "破译", hint: "拆开噪音里的秘密" },
  { value: "track", label: "追踪", hint: "顺着碎片找到方向" },
  { value: "mend", label: "修补", hint: "让失灵的东西重新运转" },
  { value: "invent", label: "想点子", hint: "总能给出不一样的办法" }
];

export const signalNatureOptions: Array<{ value: SignalNature; label: string; hint: string }> = [
  { value: "distress", label: "求救", hint: "像有人在请求回应" },
  { value: "warning", label: "警告", hint: "像在提醒危险正在靠近" },
  { value: "coordinates", label: "坐标留言", hint: "像在留下可追踪的地点" }
];

export const missingInfoOptions: Array<{ value: MissingInfo; label: string; hint: string }> = [
  { value: "location", label: "地点", hint: "先补回信号来自哪里" },
  { value: "sender", label: "发送者身份", hint: "先确认是谁发来的" },
  { value: "final-clue", label: "最后一句关键提示", hint: "先找回真正重要的最后一句" }
];

export const labelMap = {
  formType: {
    mechanical: "机械体",
    biological: "生物体",
    energy: "能量体",
    hybrid: "未知混合"
  },
  role: {
    scout: "侦察",
    repair: "修复",
    record: "记录",
    pilot: "领航"
  },
  temperament: {
    calm: "冷静",
    warm: "热情",
    cunning: "狡黠",
    steady: "稳重"
  },
  talent: {
    decode: "破译",
    track: "追踪",
    mend: "修补",
    invent: "想点子"
  },
  signalNature: {
    distress: "求救",
    warning: "警告",
    coordinates: "坐标留言"
  },
  missingInfo: {
    location: "地点",
    sender: "发送者身份",
    "final-clue": "最后一句关键提示"
  }
};

export const styleTagOptions = [
  "安静发光",
  "旧式舱感",
  "反应很快",
  "说话很轻",
  "喜欢记录细节",
  "像会突然想到办法"
];

export const specialFocusOptions = [
  "遇到危险也先观察",
  "擅长把碎片拼成线索",
  "会在黑暗里先找到灯",
  "总能给飞船带来新点子"
];

export const crewRefinementOptions: Array<{
  id: string;
  label: string;
  hint: string;
  formType?: CrewFormType;
  role?: CrewRole;
  temperament?: CrewTemperament;
  talent?: CrewTalent;
  styleTag?: string;
  specialFocus?: string;
}> = [
  {
    id: "cooler",
    label: "更冷静一点",
    hint: "让回应更安静、更稳",
    temperament: "calm",
    styleTag: "安静发光"
  },
  {
    id: "bolder",
    label: "更大胆一点",
    hint: "更愿意先靠近未知",
    temperament: "warm",
    role: "pilot"
  },
  {
    id: "mechanical",
    label: "更像机械体",
    hint: "轮廓更偏旧式机械风",
    formType: "mechanical",
    styleTag: "旧式舱感"
  },
  {
    id: "repairer",
    label: "更会修东西",
    hint: "适合修补和稳定系统",
    role: "repair",
    talent: "mend",
    specialFocus: "擅长把碎片拼成线索"
  },
  {
    id: "tracker",
    label: "更会找线索",
    hint: "更适合侦察和追踪",
    role: "scout",
    talent: "track",
    specialFocus: "会在黑暗里先找到灯"
  },
  {
    id: "mysterious",
    label: "更神秘一点",
    hint: "让轮廓更难一眼看透",
    formType: "hybrid",
    temperament: "cunning",
    styleTag: "说话很轻"
  }
];

export const chapterStageLabels = [
  "苏醒",
  "船员招募",
  "主舱恢复",
  "信号任务",
  "世界变化",
  "第一章结算"
];

export const chapterOneMemoryZones = [
  { id: "navigation", label: "航行记忆", detail: "补回智脑对世界与航线的基础经验" },
  { id: "malfunction", label: "故障记忆", detail: "从残缺记录里推回主舰经历过什么" },
  { id: "crew", label: "船员记忆", detail: "确认这位伙伴是谁、为何能与你并肩工作" }
] as const;

export const brokenSignalLines = [
  "......第七航道回声减弱......",
  "若有人接收，请补上___坐标......",
  "不要让最后一颗蓝星失去回应......"
];

export const bridgeModuleCatalog: Array<{ id: BridgeModuleId; label: string; description: string }> = [
  { id: "command", label: "主舱核心", description: "维持飞船的基础亮度与主控回路" },
  { id: "recruitment", label: "船员招募台", description: "用你的关键信号拼出新的伙伴" },
  { id: "signal-lab", label: "信息库", description: "抢救智脑缺失的航行、故障与协作记忆" },
  { id: "task-board", label: "任务台", description: "分配船员执行轻任务，观察不同组合的结果" },
  { id: "star-map", label: "航星星图", description: "记录被重新点亮的坐标与航星" },
  { id: "archive", label: "航海日志舱", description: "存放任务记录、人物档案更新与主舰事件痕迹" },
  { id: "gate", label: "远航门", description: "记录文明远征与科技黑匣入口" }
];

export const shipBootOrder: BridgeModuleId[] = [
  "command",
  "recruitment",
  "signal-lab",
  "archive",
  "star-map",
  "task-board",
  "gate"
];

export const shipBootMessages = {
  command: "主舱核心回路上线",
  recruitment: "船员名册舱恢复同步",
  "signal-lab": "信息库舱等待抢救接入",
  archive: "航海日志舱归档回路在线",
  "star-map": "星图投射盘恢复照明",
  "task-board": "任务台权限已解封",
  gate: "远航门等待文明坐标"
} satisfies Record<BridgeModuleId, string>;

export const shipTaskCatalog: ShipTask[] = [
  {
    id: "trace-anomaly",
    title: "追踪异常信号",
    summary: "主舰边缘出现了一段短促回波，像在不断换位置。",
    recommended: "更适合侦察、追踪、破译型船员",
    risk: "可能只能带回部分线索，方向判断很重要。",
    recommendedRole: "scout",
    recommendedTalent: "track",
    unlocked: true,
    completionCount: 0
  },
  {
    id: "repair-array",
    title: "修复外环阵列",
    summary: "外环感应阵列忽明忽暗，主舰无法稳定读取远端回声。",
    recommended: "更适合修复、修补、稳重型船员",
    risk: "修得太慢会继续掉帧，修得太急可能漏掉细节。",
    recommendedRole: "repair",
    recommendedTalent: "mend",
    unlocked: true,
    completionCount: 0
  },
  {
    id: "decode-relic",
    title: "解读遗迹坐标",
    summary: "一串古老坐标被夹在旧日志里，像在等人补出真正的意思。",
    recommended: "更适合记录、破译、想点子型船员",
    risk: "可能得到故事线索，也可能解出新的支路。",
    recommendedRole: "record",
    recommendedTalent: "decode",
    unlocked: true,
    completionCount: 0
  }
];
