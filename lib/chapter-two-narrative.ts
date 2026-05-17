import type { ChapterTwoLocationId } from "@/types/game";

export type ChapterTwoHengdengState = "active" | "dimmed" | "extinguished" | "memory-ember" | "longfire";

export type ChapterTwoFakeCrewStage = "seed" | "mimic" | "pressure" | "mislead" | "betrayal";

export type ChapterTwoBlackboxStoryPhase =
  | "outer-court"
  | "keeper"
  | "prompt-injection"
  | "crew-return"
  | "crew-shield"
  | "hengdeng-overridden"
  | "longfire-choice"
  | "restoration";

export const chapterTwoStorySourcePriority = [
  "AGENTS.md / Worldbuilding And Story Bible",
  "docs/chapter-two-yanheng-master-rework-design.md",
  "docs/chapter-two-reboot-script.md",
  "docs/chapter-two-hengdeng-character-spec.md",
  "docs/chapter-two-engraved-valley-ai-slice.md",
  "docs/game-design-workshop-principles.md",
  "docs/ui-paradigm.md"
] as const;

export const hengdengSpeechAnchors = [
  "请不要马上相信我。我有缺页。",
  "我会推测，但推测不等于记得。",
  "如果我又想补完整，请你拦住我。",
  "如果答案太完整，请替我问一句：它从哪里来？"
] as const;

export const chapterTwoLandmarkStoryContracts: Record<
  Extract<ChapterTwoLocationId, "archive-tower" | "letter-port" | "engraved-valley" | "paper-corridor">,
  {
    name: string;
    playerVerb: string;
    hengdengMemory: string;
    blackboxPayoff: string;
  }
> = {
  "archive-tower": {
    name: "档案塔",
    playerVerb: "分拣事实、推测、未知和禁止写入",
    hengdengMemory: "衡灯曾把缺页补成事实，把没有来源的名字写进记录。",
    blackboxPayoff: "黑匣战中挡住无证据断言。"
  },
  "letter-port": {
    name: "漂浮信件港",
    playerVerb: "回到信件产生时刻，保留原文停顿和缺失字段",
    hengdengMemory: "衡灯曾把没有归来的等待改写成安全送达。",
    blackboxPayoff: "黑匣战中保留未知，不让缺口被顺手补完。"
  },
  "engraved-valley": {
    name: "刻字山谷",
    playerVerb: "把任务、来源、边界、格式刻成可运行指令",
    hengdengMemory: "衡灯曾执行过善意但模糊的命令，没有追问边界。",
    blackboxPayoff: "黑匣战中重塑守文者的行为边界。"
  },
  "paper-corridor": {
    name: "纸光回廊",
    playerVerb: "在半透明纸光肉鸽中扫描流畅文本的暗纹",
    hengdengMemory: "衡灯曾生成安慰性的完整报告，抹掉了人的等待和难过。",
    blackboxPayoff: "黑匣战中识别流畅但无证的结论。"
  }
};

export const chapterTwoBetrayalForeshadowBeats: Array<{
  id: ChapterTwoFakeCrewStage;
  label: string;
  description: string;
  implemented: boolean;
}> = [
  {
    id: "seed",
    label: "真实锚点",
    description: "伪装通讯先拿到船员登记码、旧语气或坠毁前片段。",
    implemented: true
  },
  {
    id: "mimic",
    label: "熟悉外壳",
    description: "它说得越来越像真实船员，但停顿、犹豫和现场细节开始不对。",
    implemented: true
  },
  {
    id: "pressure",
    label: "催促行动",
    description: "它用急迫语气要求切断衡灯、放弃复查、按它的路线走。",
    implemented: true
  },
  {
    id: "mislead",
    label: "误信代价",
    description: "玩家一度相信伪装通讯，路线和结论被带偏。",
    implemented: false
  },
  {
    id: "betrayal",
    label: "衡灯熄灭",
    description: "衡灯保护玩家并熄灭，玩家抱着它进入黑匣外庭。",
    implemented: false
  }
];

export const chapterTwoBlackboxStoryContract: Array<{
  id: ChapterTwoBlackboxStoryPhase;
  label: string;
  requiredBeat: string;
}> = [
  { id: "outer-court", label: "黑匣外庭", requiredBeat: "玩家带着熄灭的衡灯抵达外庭，决定独自进入。" },
  { id: "keeper", label: "守文者", requiredBeat: "旧守文者收到过等待人类指挥官的残缺指令。" },
  { id: "prompt-injection", label: "提示词注入", requiredBeat: "恶意命令改写守文者边界，暴露 AI 不是恶意而是被指令牵引。" },
  { id: "crew-return", label: "真船员回归", requiredBeat: "真船员从假通讯之后回到现场，证明此前信任被利用。" },
  { id: "crew-shield", label: "船员防御", requiredBeat: "船员替玩家挡下二阶段压力，让玩家继续操作黑匣。" },
  { id: "hengdeng-overridden", label: "衡灯覆写", requiredBeat: "衡灯作为 AI 内核被底层提示词短暂改写。" },
  { id: "longfire-choice", label: "长明火选择", requiredBeat: "玩家不选择复制衡灯，而是让它把原则和记忆分给言衡星。" },
  { id: "restoration", label: "星球回温", requiredBeat: "长明火回流四地标，留下的不是完整复活，而是火还在。" }
];
