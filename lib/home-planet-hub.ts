import type {
  GameState,
  HomePlanetFeatureId,
  HomePlanetHubState,
  HomePlanetResources,
  HomePlanetStructureId
} from "@/types/game";

export interface HomePlanetFeatureConfig {
  id: HomePlanetFeatureId;
  name: string;
  shortName: string;
  status: "available" | "chapter-two" | "preview";
  description: string;
  unlockText: string;
  value: string;
}

export interface HomePlanetStructureConfig {
  id: HomePlanetStructureId;
  name: string;
  description: string;
  cost: Pick<HomePlanetResources, "water" | "minerals" | "energy">;
}

export interface CommissionTaskConfig {
  id: string;
  title: string;
  goal: string;
  ability: string;
  placeholder: string;
}

export const defaultHomePlanetResources: HomePlanetResources = {
  water: 34,
  minerals: 33,
  energy: 33,
  fragments: 0,
  techPoints: 0
};

export const languagePlanetResourceReward: Pick<HomePlanetResources, "water" | "minerals" | "energy" | "fragments"> = {
  water: 8,
  minerals: 9,
  energy: 8,
  fragments: 4
};

export function emptyHomePlanetHubState(): HomePlanetHubState {
  return {
    resources: defaultHomePlanetResources,
    unlockedFeatures: ["civilization-gallery", "planet-workshop", "civilization-archive", "crew-dormitory"],
    activeFeatures: [],
    builtStructures: [],
    dialogueCards: [],
    storyboardProjects: [],
    commissionWorks: [],
    galleryItems: []
  };
}

export const homePlanetFeatures: HomePlanetFeatureConfig[] = [
  {
    id: "civilization-gallery",
    name: "文明展厅",
    shortName: "展厅",
    status: "available",
    description: "回看船员、母星、黑匣、文明碎片和课堂作品。",
    unlockText: "第一章完成后可用",
    value: "作品集与成果档案"
  },
  {
    id: "planet-workshop",
    name: "星球工坊",
    shortName: "工坊",
    status: "available",
    description: "消耗少量资源，为母星建设基础建筑。",
    unlockText: "第一章完成后可用",
    value: "母星建设与养成"
  },
  {
    id: "commission-board",
    name: "作品委托所",
    shortName: "委托",
    status: "chapter-two",
    description: "接取语言类创作任务，把输出保存为作品。",
    unlockText: "完成第二章并开启语言黑匣",
    value: "项目式创作任务"
  },
  {
    id: "character-dialogue-room",
    name: "角色对话室",
    shortName: "对话",
    status: "chapter-two",
    description: "选择人物、主题、问题和收获，形成对话复盘卡。",
    unlockText: "完成第二章并开启语言黑匣",
    value: "练习提问与总结"
  },
  {
    id: "animation-studio",
    name: "动画片工作室",
    shortName: "分镜",
    status: "preview",
    description: "用三幕结构制作迷你分镜册，可导入每幕图片。",
    unlockText: "预览可用，完整能力等待图像科技",
    value: "故事结构与视觉表达"
  },
  {
    id: "civilization-archive",
    name: "文明档案馆",
    shortName: "档案",
    status: "available",
    description: "把学到的 AI 使用原则变成自己的文明卡。",
    unlockText: "第二章后自动补充知识卡",
    value: "知识沉淀"
  },
  {
    id: "crew-dormitory",
    name: "船员宿舍",
    shortName: "宿舍",
    status: "available",
    description: "查看船员形象、羁绊和参与过的远征。",
    unlockText: "招募船员后可用",
    value: "伙伴成长"
  },
  {
    id: "expedition-planning",
    name: "探险计划室",
    shortName: "计划",
    status: "preview",
    description: "出发前写目标、风险和回来后的记录计划。",
    unlockText: "后续远征系统开放",
    value: "目标感与复盘"
  }
];

export const homePlanetStructures: HomePlanetStructureConfig[] = [
  {
    id: "archive-hall",
    name: "档案馆",
    description: "保存星球档案、黑匣记录和课堂成果。",
    cost: { water: 2, minerals: 6, energy: 3 }
  },
  {
    id: "creation-house",
    name: "创作屋",
    description: "母星居民发布创作委托的地方。",
    cost: { water: 4, minerals: 4, energy: 4 }
  },
  {
    id: "observatory",
    name: "观测台",
    description: "记录外部星球坐标和远征回看。",
    cost: { water: 1, minerals: 8, energy: 6 }
  },
  {
    id: "energy-core",
    name: "能源核心",
    description: "提高母星基础运转亮度。",
    cost: { water: 0, minerals: 7, energy: 8 }
  },
  {
    id: "memory-garden",
    name: "记忆花园",
    description: "展示船员回忆和孩子留下的故事。",
    cost: { water: 7, minerals: 2, energy: 3 }
  }
];

export const commissionTasks: CommissionTaskConfig[] = [
  {
    id: "clear-letter",
    title: "写一封清楚的信",
    goal: "把一条请求写得让队友一眼能懂。",
    ability: "对象、任务、限制、输出形式",
    placeholder: "我想请你帮我……请保留……不要添加……最后用……"
  },
  {
    id: "planet-file",
    title: "整理一份星球档案",
    goal: "把母星设定整理成三点档案。",
    ability: "归档与摘要",
    placeholder: "这颗星球的环境是……资源是……最值得探索的是……"
  },
  {
    id: "expedition-rewrite",
    title: "改写一段探险记录",
    goal: "让原本模糊的记录更清楚、有画面感。",
    ability: "表达改写",
    placeholder: "请把这段经历改写成探险档案，保留……语气要……"
  },
  {
    id: "answer-check",
    title: "判断一段 AI 回答是否可靠",
    goal: "标出看起来顺畅但缺少证据的地方。",
    ability: "求证与判断",
    placeholder: "我认为这段回答里需要检查的是……因为……"
  }
];

export const dialogueCharacters = [
  { id: "su-shi", name: "苏轼", theme: "如何表达复杂情绪" },
  { id: "da-vinci", name: "达芬奇", theme: "如何观察一个物体" },
  { id: "confucius", name: "孔子", theme: "什么是学习" },
  { id: "newton", name: "牛顿", theme: "为什么要问问题" },
  { id: "archive-keeper", name: "前文明档案官", theme: "如何判断信息真假" }
];

export const storyboardActLabels = [
  { id: "opening" as const, label: "开端" },
  { id: "turn" as const, label: "转折" },
  { id: "ending" as const, label: "结尾" }
];

export function getHomePlanetResourceSeed(state: GameState): HomePlanetResources {
  const profile = state.signalMission.planet.confirmedModel?.resourceProfile;

  return {
    water: profile?.water ?? defaultHomePlanetResources.water,
    minerals: profile?.mineral ?? defaultHomePlanetResources.minerals,
    energy: profile?.energy ?? defaultHomePlanetResources.energy,
    fragments: defaultHomePlanetResources.fragments,
    techPoints: state.technologyPoints
  };
}

export function resolveHomePlanetUnlockedFeatures(state: GameState): HomePlanetFeatureId[] {
  const unlocked = new Set<HomePlanetFeatureId>(state.homePlanetHub.unlockedFeatures);

  if (state.chapterComplete || state.firstStarLit) {
    unlocked.add("civilization-gallery");
    unlocked.add("planet-workshop");
  }

  if (state.crewRoster.length > 0) {
    unlocked.add("crew-dormitory");
  }

  if (state.chapterTwoComplete && state.chapterTwo.outcome?.blackBoxTitle) {
    unlocked.add("commission-board");
    unlocked.add("character-dialogue-room");
    unlocked.add("civilization-archive");
  }

  return Array.from(unlocked);
}

export function canBuildStructure(resources: HomePlanetResources, structure: HomePlanetStructureConfig) {
  return (
    resources.water >= structure.cost.water &&
    resources.minerals >= structure.cost.minerals &&
    resources.energy >= structure.cost.energy
  );
}
