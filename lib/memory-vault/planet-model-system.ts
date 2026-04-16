import { hashString, shortenText } from "@/lib/game-utils";
import type {
  PlanetInputState,
  PlanetModel,
  PlanetModelAnalysis,
  PlanetMood,
  PlanetProductionProfile,
  PlanetResourceProfile,
  PlanetSignalSeed
} from "@/types/game";

const planetSeeds: PlanetSignalSeed[] = [
  {
    id: "glow-ring",
    title: "残缺天体轮廓 A-17",
    silhouette: "一颗被浅色环带包住的蓝灰色星球，边缘有断裂光痕。",
    teaser: "主舰只记得它曾经可航行，但名字和环境都丢失了。",
    promptLook: "它看起来最像什么？",
    promptEnvironment: "它最突出的环境特征是什么？",
    promptTone: "它更偏安静、危险、神秘，还是遗迹活跃？"
  },
  {
    id: "amber-rift",
    title: "残缺天体轮廓 M-04",
    silhouette: "一颗带着橙色裂纹的深色星球，表面像有旧城影子。",
    teaser: "导航盘只留下了一个模糊轮廓，其他调用参数都还没恢复。",
    promptLook: "你觉得它像怎样的星体？",
    promptEnvironment: "最容易被记住的环境线索是什么？",
    promptTone: "它给你的第一感觉更偏哪一种？"
  },
  {
    id: "mist-forest",
    title: "残缺天体轮廓 E-09",
    silhouette: "一颗被云雾和浅绿光斑包裹的星球，像在慢慢呼吸。",
    teaser: "这颗星球的生态参数掉失严重，主舰只剩下一点模糊亮度。",
    promptLook: "如果你先看外形，它最像什么？",
    promptEnvironment: "它的环境里最突出的部分是什么？",
    promptTone: "它更像安静、危险、神秘，还是遗迹活跃？"
  }
];

const moodWeightMap: Record<PlanetMood, Partial<PlanetResourceProfile>> = {
  安静: { water: 6, ecology: 10, energy: -4 },
  危险: { energy: 10, mineral: 8, ecology: -6 },
  神秘: { relicData: 10, energy: 6, water: -2 },
  遗迹活跃: { relicData: 14, mineral: 6, ecology: -4 }
};

const keywordRules: Array<{
  keywords: string[];
  tag: string;
  weights: Partial<PlanetResourceProfile>;
  danger?: number;
  trait: string;
}> = [
  {
    keywords: ["海", "潮", "湖", "河", "冰", "雨", "潮汐", "水"],
    tag: "高含水层",
    weights: { water: 18, ecology: 6, mineral: -4 },
    trait: "潮汐水系"
  },
  {
    keywords: ["山", "岩", "晶", "矿", "沙", "峡谷", "火山"],
    tag: "矿脉丰富",
    weights: { mineral: 18, energy: 4, water: -6 },
    danger: 1,
    trait: "岩壳断层"
  },
  {
    keywords: ["雷", "电", "能", "光", "磁", "风暴", "闪电"],
    tag: "能量脉冲",
    weights: { energy: 18, mineral: 4, ecology: -6 },
    danger: 2,
    trait: "高能天气"
  },
  {
    keywords: ["森林", "苔", "树", "花", "生物", "羽", "菌", "草"],
    tag: "生态丰度高",
    weights: { ecology: 20, water: 6, energy: -4 },
    trait: "生命带"
  },
  {
    keywords: ["遗迹", "废墟", "塔", "碑", "古城", "神殿", "文明"],
    tag: "遗迹活跃区",
    weights: { relicData: 20, mineral: 4, ecology: -4 },
    danger: 1,
    trait: "古代遗迹群"
  },
  {
    keywords: ["雾", "影", "镜", "空洞", "回声"],
    tag: "异常观测层",
    weights: { relicData: 8, energy: 8, water: 4 },
    danger: 1,
    trait: "回声雾层"
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHundred(profile: PlanetResourceProfile): PlanetResourceProfile {
  const keys = Object.keys(profile) as Array<keyof PlanetResourceProfile>;
  const rawTotal = keys.reduce((total, key) => total + profile[key], 0);
  const normalized = keys.reduce(
    (accumulator, key) => ({
      ...accumulator,
      [key]: Math.max(8, Math.round((profile[key] / rawTotal) * 100))
    }),
    {} as PlanetResourceProfile
  );
  const total = keys.reduce((sum, key) => sum + normalized[key], 0);
  let diff = 100 - total;
  const sortedKeys = [...keys].sort((left, right) => normalized[right] - normalized[left]);

  let index = 0;
  while (diff !== 0) {
    const key = sortedKeys[index % sortedKeys.length];
    if (diff > 0) {
      normalized[key] += 1;
      diff -= 1;
    } else if (normalized[key] > 8) {
      normalized[key] -= 1;
      diff += 1;
    }
    index += 1;
  }

  return normalized;
}

function extractKeywords(text: string) {
  const fragments = text
    .split(/[，。！？、；\n\r\s]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 8);

  return Array.from(new Set(fragments)).slice(0, 6);
}

function buildSuggestedName(analysisSeed: number, mood: PlanetMood | null, trait: string) {
  const prefixes = ["澄", "雾", "岚", "曜", "镜", "潮", "烁", "灰"];
  const suffixes = ["湾", "穹", "阶", "环", "星", "境", "丘", "域"];
  const prefix = prefixes[analysisSeed % prefixes.length];
  const suffix = suffixes[(analysisSeed + 3) % suffixes.length];
  const moodPart = mood === "危险" ? "裂" : mood === "神秘" ? "幽" : mood === "遗迹活跃" ? "遗" : "澜";
  const traitPart = trait.replace(/层|带|群/g, "").slice(0, 2) || "星";

  return `${moodPart}${prefix}${traitPart}${suffix}`;
}

export function createEmptyPlanetInput(): PlanetInputState {
  return {
    name: "",
    appearance: "",
    environment: "",
    mood: null,
    notes: ""
  };
}

export function createPlanetSignalSeed(seedHint = 0): PlanetSignalSeed {
  return planetSeeds[Math.abs(seedHint) % planetSeeds.length];
}

export function analyzePlanetInput(input: PlanetInputState, signalSeed: PlanetSignalSeed): PlanetModelAnalysis {
  const sourceText = [input.name, input.appearance, input.environment, input.notes, input.mood ?? ""].filter(Boolean).join("｜");
  const lowered = sourceText.toLowerCase();
  const resourceBase: PlanetResourceProfile = {
    water: 20,
    mineral: 20,
    energy: 20,
    ecology: 20,
    relicData: 20
  };
  const extractedKeywords = extractKeywords(sourceText);
  const tags = new Set<string>();
  const traitCandidates: string[] = [];
  let dangerLevel = input.mood === "危险" ? 4 : input.mood === "神秘" ? 3 : 2;

  keywordRules.forEach((rule) => {
    if (rule.keywords.some((keyword) => lowered.includes(keyword))) {
      tags.add(rule.tag);
      traitCandidates.push(rule.trait);
      dangerLevel += rule.danger ?? 0;
      (Object.keys(rule.weights) as Array<keyof PlanetResourceProfile>).forEach((key) => {
        resourceBase[key] += rule.weights[key] ?? 0;
      });
    }
  });

  if (input.mood) {
    const mood = input.mood;
    const moodWeights = moodWeightMap[mood];
    tags.add(`${mood}气质`);
    (Object.keys(moodWeights) as Array<keyof PlanetResourceProfile>).forEach((key) => {
      resourceBase[key] += moodWeights[key] ?? 0;
    });
  }

  const resourceProfile = normalizeHundred(resourceBase);
  const environmentTrait = traitCandidates[0] ?? "多层混合地貌";
  const suggestedName = input.name.trim() || buildSuggestedName(hashString(sourceText || signalSeed.id), input.mood, environmentTrait);
  const danger = clamp(dangerLevel, 1, 5);
  const dangerLabel = ["低风险", "可控", "起伏明显", "高风险", "极不稳定"][danger - 1];

  return {
    sourceText,
    extractedKeywords,
    suggestedName,
    environmentTrait,
    tags: Array.from(tags).slice(0, 5),
    resourceProfile,
    dangerLevel: danger,
    dangerLabel,
    summary: `${suggestedName} 的世界模型已经有了轮廓：${environmentTrait} + ${input.mood ?? "未知气质"}，可以开始写入导航盘。`
  };
}

function buildProductionProfile(resources: PlanetResourceProfile): PlanetProductionProfile {
  return {
    water: Math.max(1, Math.round(resources.water / 12)),
    mineral: Math.max(1, Math.round(resources.mineral / 12)),
    energy: Math.max(1, Math.round(resources.energy / 12)),
    ecology: Math.max(1, Math.round(resources.ecology / 12)),
    relicData: Math.max(1, Math.round(resources.relicData / 15))
  };
}

export function buildPlanetModel(input: {
  signalSeed: PlanetSignalSeed;
  planetInput: PlanetInputState;
  analysis: PlanetModelAnalysis;
}): PlanetModel {
  const mood = input.planetInput.mood ?? "神秘";
  const summaryCore = shortenText(
    `${input.analysis.suggestedName} 是一颗以 ${input.analysis.environmentTrait} 为主轴的 ${mood} 星球，最值得记录的是 ${input.analysis.tags.slice(0, 2).join("、")}。`,
    72
  );
  const coordinateSeed = hashString(`${input.analysis.suggestedName}-${input.signalSeed.id}`);
  const coordinateLabel = `NAV-${(coordinateSeed % 900 + 100).toString()} · ${input.analysis.suggestedName}`;

  return {
    id: `planet-${coordinateSeed}`,
    name: input.analysis.suggestedName,
    coordinateLabel,
    summary: summaryCore,
    environmentTrait: input.analysis.environmentTrait,
    mood,
    tags: input.analysis.tags,
    dangerLevel: input.analysis.dangerLevel,
    dangerLabel: input.analysis.dangerLabel,
    resourceProfile: input.analysis.resourceProfile,
    production: buildProductionProfile(input.analysis.resourceProfile),
    explorationHooks: [
      `${input.analysis.environmentTrait} 会影响后续探索风险与事件类型。`,
      `${input.analysis.tags[0] ?? "复合星区"} 将决定最先刷新的支线入口。`,
      `遗迹数据 ${input.analysis.resourceProfile.relicData} / 100，后续更容易解锁故事线索。`
    ],
    recordNote: `${input.analysis.suggestedName} 已被主舰收录为第一颗可调用星球模型。`
  };
}
