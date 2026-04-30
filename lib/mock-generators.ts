import { labelMap } from "@/lib/game-constants";
import { hashString, pickBySeed, shortenText } from "@/lib/game-utils";
import type {
  ChapterTwoAssignmentAnalysis,
  ChapterTwoDuty,
  ChapterTwoEcho,
  ChapterTwoFinalChoice,
  ChapterTwoFocus,
  ChapterTwoOutcome,
  ChapterTwoSetback,
  ChapterTwoRefinement,
  ChapterTwoRoundOneResult,
  ChapterTwoRoundTwoResult,
  ChapterTwoSignalAnalysis,
  ChapterTwoTruth,
  CrewBackstory,
  CrewBackstoryRevealKey,
  CrewChatMessage,
  CrewMember,
  CrewMemoryRestore,
  MalfunctionMemoryAnalysis,
  MalfunctionMemoryRestore,
  MalfunctionSuspicion,
  MissingInfo,
  NavigationMemoryAnalysis,
  NavigationMemoryRestore,
  RepairedSignal,
  RecruitForm,
  RecruitSignalAnalysis,
  ShipTask,
  TaskResult,
  SignalNature,
  SignalMissionTruth,
  SignalSource
} from "@/types/game";

const namePrefixes = ["岚", "曜", "零", "弧", "塔", "澄", "星", "雾", "霁", "洛"];
const nameSuffixes = ["伊", "诺", "隼", "弦", "芽", "赫", "澜", "迦", "未", "拾"];

const formTitleMap = {
  mechanical: ["齿轮来客", "冷焰构体", "回声机体"],
  biological: ["星穹旅伴", "雾港生灵", "脉冲同伴"],
  energy: ["流光行者", "辉域访客", "频谱旅人"],
  hybrid: ["未定边界者", "混频旅伴", "双相来客"]
};

const roleTitleMap = {
  scout: ["前哨侦察员", "回声搜寻员", "微光探路者"],
  repair: ["舱段修复员", "裂隙缝补师", "回路重接员"],
  record: ["星图记录员", "碎讯整理员", "档案守望者"],
  pilot: ["航迹领航员", "雾带引路者", "航星对准员"]
};

const temperamentPhrases = {
  calm: "我会先让杂音安静下来",
  warm: "我已经准备好和你并肩动手",
  cunning: "直线太慢，我更喜欢找到近路",
  steady: "一步一步来，主舱会重新亮起来"
};

const talentAbilityMap = {
  decode: ["碎讯破译", "回声拆解", "暗码照明"],
  track: ["微痕追踪", "尾迹锁定", "回波寻路"],
  mend: ["裂隙修补", "回路缝合", "舱壁复位"],
  invent: ["奇想拼接", "临场构想", "灵感联动"]
};

const signalTitleMap: Record<SignalNature, string> = {
  distress: "失落求救信号",
  warning: "失序警告信号",
  coordinates: "遗留坐标信号"
};

const sectorPool = ["镜湾侧环", "北舷余辉层", "雾带外沿", "七号静波点", "回声井外廊", "低频环桥"];
const sourceNamePool = ["回声井", "静波测站", "旧观测塔", "漂流浮标", "断层回路", "雾帆记录舱"];
const sourceSummaryPool = [
  "像有人故意把一句完整的话切碎后丢进黑暗里。",
  "信号强度很低，但每隔一段时间会自己短暂回亮。",
  "碎片之间有重复节奏，像在提醒接收者先看重点。",
  "回声尾部带着星图坐标的痕迹，不像自然噪音。 "
];
const senderPool = ["巡航员阿缇", "旧站看守者", "漂流测绘组", "独航记录官", "回声塔值守者"];
const cluePool = [
  "跟随最晚亮起的蓝星",
  "避开沉默的红色航道",
  "等舱灯第二次闪烁再靠近",
  "在回声最轻的时刻回传",
  "先标记，再呼叫主舱回应"
];
const fragmentOpeners = ["第七航道", "蓝星外沿", "静默走廊", "回声带北侧", "镜湾航标"];
const stabilityPool = ["微弱但连续", "飘移不稳", "短促闪回", "低频回亮"];
const chapterTwoRegions = ["雾带深井", "静默环阶", "镜湾回折层", "回声井下层"];
const chapterTwoNames = ["A-17", "MIR-4", "雾阶零号", "沉默编目 6"];
const chapterTwoQuestions = [
  "为什么这段回应会先认出船员，再认出主舰？",
  "这不是普通坐标，它像在挑选接收者。",
  "回应中的编号像是船员档案缺失的一页。",
  "如果它在主动回应，那它也可能在主动筛选。"
];
const chapterTwoHooks = [
  "更深处还有一段未完全打开的回声门。",
  "主舰刚刚捕捉到第二层回应，它不像给所有人看的。",
  "这片区域并不只是被发现，它更像在回头确认你们是谁。",
  "远航门边缘又出现了一条更暗的旁支航线。"
];
const chapterTwoFocusRules = {
  身份线索: ["谁", "名字", "编号", "来历", "身份", "认识", "船员", "发讯人"],
  坐标结构: ["坐标", "门", "入口", "航线", "结构", "位置", "方向", "真假"],
  异常语气: ["语气", "陷阱", "求救", "试探", "警告", "隐藏", "不对劲", "回应"]
} as const;
const chapterTwoDutyRules = {
  前线解析: ["先拆", "主分析", "看懂", "解读", "前线", "判断"],
  后方稳定: ["稳住", "固定", "修好", "别散", "稳定", "保住"],
  环境扫描: ["扫描", "外层", "环境", "找线索", "看周围", "找异常"],
  记录还原: ["排序", "记录", "拼回", "整理", "还原", "记下"]
} as const;

const backstoryOriginMap = {
  scout: ["来自雾带边缘的一座旧观测台", "曾在静默航标之间独自巡过很久", "从一条失联很久的微光航路里被重新找到"],
  repair: ["原本守着一段总会坏掉的旧舱壁回路", "来自一座半停机的维修坞", "曾在断掉的回声桥下独自接过很多次断路"],
  record: ["曾在回声档案舱里抄写过失落编号", "来自一座只剩记录机还醒着的旧站", "原本替一艘已经沉默的船保存最后的日志"],
  pilot: ["曾经给一条没人敢走的旧航线引过路", "来自镜湾外沿的偏航区", "在很久以前替别人记过回家的方向"]
} as const;

const backstoryReasonMap = {
  decode: "因为你发出的信号里有一段只有 Ta 愿意继续拆开的碎码。",
  track: "因为这艘船的航线还没走完，而 Ta 一眼就看见了下一段路的尾迹。",
  mend: "因为主舰还有太多没完全接好的地方，而 Ta 不想看着它继续暗下去。",
  invent: "因为主舰周围的异常不像旧问题，Ta 想看看能不能给出新的解法。"
} as const;

const hiddenQuestionMap = {
  calm: "Ta 似乎一直在等某个旧编号重新被喊出来。",
  warm: "Ta 像早就认识这艘船的某一段气味，却一直没有主动说破。",
  cunning: "Ta 知道的东西可能比说出来的多，只是习惯先看你会不会继续问。",
  steady: "Ta 提到过去时总会停半拍，像有一段经历还没准备好完整交给别人。"
} as const;

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

const recruitKeywordRules = {
  formType: {
    mechanical: ["机械", "机体", "金属", "齿轮", "旧机器", "机器人", "装甲"],
    biological: [
      "生物",
      "毛茸茸",
      "柔软",
      "像动物",
      "植物",
      "有翅膀",
      "呼吸",
      "人类",
      "真人",
      "少女",
      "少年",
      "女孩",
      "男孩",
      "女性",
      "男性",
      "战士",
      "法师",
      "巫师",
      "骑士",
      "公主",
      "王子",
      "精灵",
      "魔法少女",
      "美少女战士"
    ],
    energy: ["发光", "能量", "光", "电", "闪烁", "频率", "波纹"],
    hybrid: ["混合", "不像一种", "看不清", "双相"]
  },
  role: {
    scout: ["找路", "追踪", "侦察", "找线索", "扫描", "潜行", "探索"],
    repair: ["修理", "修补", "修复", "补好", "修东西", "稳定", "接回去"],
    record: ["记录", "记住", "整理", "写下来", "讲述", "档案", "故事"],
    pilot: ["带路", "领航", "飞", "掌舵", "方向", "航线", "出发"]
  },
  temperament: {
    calm: ["安静", "冷静", "不慌", "轻声", "先观察", "平稳", "静静"],
    warm: ["热情", "开朗", "大胆", "活泼", "温暖", "爱笑", "冲在前面"],
    cunning: ["神秘", "狡黠", "机灵", "调皮", "绕路", "怪点子", "不像表面"],
    steady: ["稳重", "可靠", "耐心", "踏实", "慢一点", "稳稳", "扛得住"]
  },
  talent: {
    decode: ["破译", "解读", "密码", "翻译", "看懂", "读懂", "拆开"],
    track: ["追踪", "找路", "找线索", "锁定", "跟着", "寻路", "扫描"],
    mend: ["修理", "修补", "补回", "修东西", "缝好", "接好", "恢复"],
    invent: ["想点子", "发明", "改造", "新办法", "灵感", "设计", "组合"]
  }
} as const;

const focusHints = {
  scout: ["异常追踪", "前方探路"],
  repair: ["舱内修补", "系统稳定"],
  record: ["碎讯整理", "故事还原"],
  pilot: ["航线判断", "坐标带路"]
} as const;

const visualSpeciesRules = [
  {
    subject: "猫型非人伙伴",
    keywords: ["猫", "猫咪", "猫猫", "小猫", "黑猫", "橘猫", "狸花", "白猫", "奶牛猫"],
    guardrails: ["主体必须保持猫或明显猫型生物", "默认保持非人角色，不要自动替换成人类脸或人类身体", "允许未来装备，但不能改变猫的物种特征"]
  },
  {
    subject: "犬型非人伙伴",
    keywords: ["狗", "小狗", "小犬", "狗狗", "犬", "柴犬", "柯基", "边牧", "拉布拉多", "金毛", "狼", "猎犬"],
    guardrails: [
      "主体必须保持犬类或明显犬型生物",
      "默认保持非人角色，不要自动生成人类脸、人类身体或人类站姿",
      "不要生成狮身人面像、兽人、半人半兽神像或任何神庙雕像感主体",
      "允许服饰与装备变化，但不能丢失犬类轮廓、耳部、口鼻与身体比例"
    ]
  },
  {
    subject: "狐型非人伙伴",
    keywords: ["狐狸", "狐", "白狐", "赤狐"],
    guardrails: ["主体必须保持狐狸或明确狐型生物", "不要自动替换成人类形象", "保留狐耳、尾部或清晰狐型轮廓"]
  },
  {
    subject: "鸟型非人伙伴",
    keywords: ["鸟", "小鸟", "鹰", "隼", "羽毛", "翅膀", "飞鸟"],
    guardrails: ["主体必须保持鸟类或明显鸟型生物", "不要自动变成人类角色", "保留羽翼或喙等清晰鸟型特征"]
  },
  {
    subject: "兔型非人伙伴",
    keywords: ["兔", "兔子", "小兔"],
    guardrails: ["主体必须保持兔类或明显兔型生物", "不要自动替换成人类脸", "保留长耳或清晰兔型轮廓"]
  },
  {
    subject: "龙型非人伙伴",
    keywords: ["龙", "小龙", "幼龙", "飞龙", "东方龙"],
    guardrails: ["主体必须保持龙类或明显龙型生物", "不要自动替换成人类脸或人类身体", "保留龙角、鳞片、长尾或清晰龙型轮廓"]
  },
  {
    subject: "水生非人伙伴",
    keywords: ["鱼", "鲸", "海豚", "水母", "鲨鱼", "章鱼"],
    guardrails: ["主体必须保持水生生物或明显水生伙伴", "不要自动替换成人类角色", "保留鳍、流线身体或水生轮廓"]
  },
  {
    subject: "大型兽类非人伙伴",
    keywords: ["熊", "鹿", "马", "狼", "狮子", "老虎", "豹"],
    guardrails: ["主体必须保持对应兽类轮廓", "不要自动替换成人类角色", "可以有装备但不能丢失动物身体结构"]
  },
  {
    subject: "机械船员",
    keywords: ["机械", "机器人", "机体", "装甲", "金属", "齿轮"],
    guardrails: ["主体必须保持机械体或明确人工构体", "不要默认生成为纯人类肉身角色", "允许拟人站姿，但机械结构必须清晰可见"]
  },
  {
    subject: "能量体船员",
    keywords: ["能量", "发光", "光团", "电弧", "光谱", "频率"],
    guardrails: ["主体必须保持能量体或明显光谱实体", "不要自动变成普通人类角色", "保留发光、漂浮或频率感特征"]
  }
] as const;

function scoreByRules<T extends string>(text: string, rules: Record<T, readonly string[]>) {
  const entries = (Object.entries(rules) as Array<[T, readonly string[]]>).map(([key, words]) => {
    const score = words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
    return [key, score] as const;
  });
  const best = entries.sort((left, right) => right[1] - left[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}

function extractKeywords(text: string) {
  const matched = unique(
    Object.values(recruitKeywordRules)
      .flatMap((group) => Object.values(group).flat())
      .filter((word) => text.includes(word))
  );

  if (matched.length >= 3) {
    return matched.slice(0, 5);
  }

  const fragments = unique(
    text
      .split(/[，。！？、；\n\r\s]/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && part.length <= 10)
  );

  return unique([...matched, ...fragments]).slice(0, 5);
}

function containsChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text);
}

function normalizeChineseKeywords(input: string[], inferred: {
  formType: RecruitForm["formType"] | null;
  role: keyof typeof labelMap.role;
  temperament: keyof typeof labelMap.temperament;
  talent: keyof typeof labelMap.talent;
}) {
  const chinese = input.filter((item) => containsChinese(item));
  if (chinese.length > 0) {
    return chinese.slice(0, 5);
  }

  return unique([
    labelMap.role[inferred.role],
    labelMap.talent[inferred.talent],
    labelMap.temperament[inferred.temperament],
    inferred.formType ? labelMap.formType[inferred.formType] : "未知混合"
  ]).slice(0, 5);
}

function includesAny(text: string, words: readonly string[]) {
  return words.some((word) => text.includes(word));
}

function wantsHumanoid(text: string) {
  return includesAny(text, ["人形", "拟人", "像人", "humanoid", "类人"]);
}

function inferHumanVisualSubject(text: string) {
  if (includesAny(text, ["精灵", "elf"])) {
    return "幻想精灵角色";
  }

  if (includesAny(text, ["美少女战士", "sailor moon", "魔法少女", "变身少女"])) {
    return "人类魔法少女战士";
  }

  if (includesAny(text, ["少女战士", "女战士", "战斗少女"])) {
    return "人类少女战士";
  }

  if (includesAny(text, ["法师", "巫师", "女巫", "骑士", "战士", "刺客", "忍者", "海盗", "船长", "公主", "王子"])) {
    return "人类或幻想人形角色";
  }

  if (includesAny(text, ["少女", "女生", "女孩", "美少女"])) {
    return "人类少女角色";
  }

  if (includesAny(text, ["御姐", "成熟女性", "女性", "女人"])) {
    return "人类女性角色";
  }

  if (includesAny(text, ["少年", "男孩", "男生"])) {
    return "人类少年角色";
  }

  if (includesAny(text, ["青年男性", "男性", "男人"])) {
    return "人类男性角色";
  }

  if (includesAny(text, ["人类", "真人", "human"])) {
    return "人类角色";
  }

  return null;
}

function inferDefaultVisualSubject(formType: RecruitForm["formType"]) {
  if (formType === "mechanical") {
    return "机械船员";
  }

  if (formType === "energy") {
    return "能量体船员";
  }

  if (formType === "biological") {
    return "生物伙伴";
  }

  return "玩家原创伙伴";
}

function inferFormTypeFromSubjectText(text: string): RecruitForm["formType"] | null {
  if (inferHumanVisualSubject(text)) {
    return "biological";
  }

  if (visualSpeciesRules.some((rule) => rule.subject.includes("非人") && includesAny(text, rule.keywords))) {
    return "biological";
  }

  return null;
}

function extractOriginalVisualSubject(description: string) {
  const normalized = description
    .replace(/\s+/g, " ")
    .split(/[。！？\n\r]/)[0]
    ?.trim();

  if (!normalized || normalized.length < 2) {
    return null;
  }

  return `玩家描述的原创伙伴：${shortenText(normalized, 24)}`;
}

export function inferCrewVisualProfile(input: {
  description: string;
  formType: RecruitForm["formType"];
  keywords?: string[];
  styleTags?: string[];
}) {
  const text = [input.description, ...(input.keywords ?? []), ...(input.styleTags ?? [])].join(" ").toLowerCase();
  const matchedRule = visualSpeciesRules.find((rule) => includesAny(text, rule.keywords));
  const humanoidRequested = wantsHumanoid(text);
  const humanSubject = inferHumanVisualSubject(text);
  const originalSubject = extractOriginalVisualSubject(input.description);

  if (!matchedRule && humanSubject) {
    return {
      visualSubject: humanSubject,
      visualGuardrails: [
        `主体必须保持${humanSubject}，不要改成动物、人外或混种主体`,
        "若玩家未明确提出，不要自动添加猫耳、狐耳、兽尾、角、翅膀、鳞片或非人器官",
        "若玩家未明确提出，不要默认加入机械装甲、外骨骼、宇航服或重科技制服",
        "服装和背景可以变化，但要优先服从玩家对身份、气质和服装的描述"
      ]
    };
  }

  if (matchedRule) {
    const guardrails = [...matchedRule.guardrails] as string[];

    if (humanoidRequested) {
      guardrails.push("允许轻度拟人站姿，但物种必须仍然一眼可辨");
    } else {
      guardrails.push("若玩家未明确要求拟人化，则保持非人主体，不要添加人类脸或人类四肢比例");
    }

    return {
      visualSubject: matchedRule.subject,
      visualGuardrails: guardrails
    };
  }

  const visualSubject = originalSubject ?? inferDefaultVisualSubject(input.formType);
  const visualGuardrails = [
    `主体必须严格贴合${visualSubject}，不要改成通用人形船员`,
    "名字、职责、能力和角色气质必须维持一致",
    "服饰与背景可以自由变化，但不要偏离玩家原始招募描述",
    "除非玩家明确要求拟人化，否则不要自动加入人类脸或人类比例",
    "除非玩家明确提到宇航服、机甲或装甲，否则不要自动套科幻制服或机械外壳"
  ];

  return {
    visualSubject,
    visualGuardrails
  };
}

function scoreChapterFocus(text: string) {
  return scoreByRules(text, chapterTwoFocusRules);
}

function extractChapterKeywords(text: string) {
  const matched = unique(
    Object.values(chapterTwoFocusRules)
      .flatMap((group) => group)
      .filter((word) => text.includes(word))
  );

  if (matched.length > 0) {
    return matched.slice(0, 4);
  }

  return unique(
    text
      .split(/[，。！？、；\n\r\s]/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && part.length <= 8)
  ).slice(0, 4);
}

function strongestDutyForCrew(crew: CrewMember): ChapterTwoDuty {
  if (crew.talent === "decode" || crew.role === "record") return "记录还原";
  if (crew.talent === "mend" || crew.role === "repair") return "后方稳定";
  if (crew.talent === "track" || crew.role === "scout") return "环境扫描";
  return "前线解析";
}

function inferDutyFromPrompt(text: string, crew: CrewMember, fallback: ChapterTwoDuty): ChapterTwoDuty {
  const direct = scoreByRules(text, chapterTwoDutyRules);
  if (direct) {
    return direct;
  }

  return fallback ?? strongestDutyForCrew(crew);
}

function pickCrewForFocus(focus: ChapterTwoFocus, crewRoster: CrewMember[]) {
  if (crewRoster.length === 0) {
    return null;
  }

  const scored = [...crewRoster].sort((left, right) => {
    const leftScore =
      (focus === "身份线索" && (left.role === "record" || left.talent === "decode") ? 2 : 0) +
      (focus === "坐标结构" && (left.role === "pilot" || left.talent === "track") ? 2 : 0) +
      (focus === "异常语气" && (left.temperament === "calm" || left.temperament === "cunning") ? 1 : 0);
    const rightScore =
      (focus === "身份线索" && (right.role === "record" || right.talent === "decode") ? 2 : 0) +
      (focus === "坐标结构" && (right.role === "pilot" || right.talent === "track") ? 2 : 0) +
      (focus === "异常语气" && (right.temperament === "calm" || right.temperament === "cunning") ? 1 : 0);
    return rightScore - leftScore;
  });

  return scored[0] ?? null;
}

export function analyzeChapterTwoResponseInput(input: {
  echo: ChapterTwoEcho;
  prompt: string;
  crewRoster: CrewMember[];
}): ChapterTwoSignalAnalysis {
  const text = input.prompt.trim() || input.echo.linkedClue;
  const inferredFocus = scoreChapterFocus(text) ?? "身份线索";
  const bestCrew = pickCrewForFocus(inferredFocus, input.crewRoster);
  const extractedKeywords = extractChapterKeywords(text);
  const leaning =
    inferredFocus === "身份线索"
      ? "你在主动追“谁在回应”这一层。"
      : inferredFocus === "坐标结构"
        ? "你更想先拆开门和坐标的真假。"
        : "你先把它当成一种会误导人的语气异常。";

  return {
    sourceText: input.prompt.trim(),
    extractedKeywords,
    inferredFocus,
    pathSummary: `${leaning} 系统因此把第一轮入口压到“${inferredFocus}”路径，而不是把整段回应一次性当答案。`,
    crewFit: bestCrew ? `${bestCrew.name} 更适合先帮你碰这条线，因为 Ta 擅长 ${bestCrew.abilityTag}。` : "主舰仍在等待合适的船员介入。",
    riskHint:
      inferredFocus === "坐标结构"
        ? "如果太早相信坐标，你们可能会被它带到假的入口。"
        : inferredFocus === "异常语气"
          ? "如果只盯着语气，可能会错过真正能推进区域的结构线索。"
          : "如果只追身份，坐标本体可能继续藏在旁边。"
  };
}

export function analyzeChapterTwoAssignmentInput(input: {
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  prompt: string;
}): ChapterTwoAssignmentAnalysis {
  const text = input.prompt.trim() || `${input.leadCrew.name} 先拆回应，${input.supportCrew.name} 在后方稳住信号`;
  const inferredFocus = scoreChapterFocus(text) ?? "身份线索";
  const extractedKeywords = extractChapterKeywords(text);
  const inferredLeadDuty = inferDutyFromPrompt(text, input.leadCrew, strongestDutyForCrew(input.leadCrew));
  const inferredSupportDuty = inferDutyFromPrompt(text, input.supportCrew, strongestDutyForCrew(input.supportCrew));

  return {
    sourceText: input.prompt.trim(),
    extractedKeywords,
    inferredFocus,
    inferredLeadDuty,
    inferredSupportDuty,
    collaborationSummary: `${input.leadCrew.name} 更像主导${inferredLeadDuty}，${input.supportCrew.name} 更适合补在${inferredSupportDuty}位。`,
    pathSummary: `系统把你的协作描述拆成了“谁先碰异常、谁负责稳住结果”两层，所以后面不会只是固定剧本往前推。`,
    crewFit: `${input.leadCrew.name} 会先按你的说法碰第一层异常，${input.supportCrew.name} 负责把偏掉的碎片拉回来。`,
    riskHint: inferredLeadDuty === inferredSupportDuty ? "两位船员如果做同一件事，另一边的视角可能会变薄。" : "这套分工已经能形成前后接力，但仍要留一只眼看回应是否在误导你们。"
  };
}

export function analyzeChapterTwoRoundInput(input: {
  prompt: string;
  fallbackFocus: ChapterTwoFocus;
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  round: "one" | "two";
  supportMode?: "维持原分工" | "让支援船员介入" | null;
}): ChapterTwoSignalAnalysis {
  const text = input.prompt.trim() || `${input.leadCrew.name} 继续主导，${input.supportCrew.name} 从旁补足细节`;
  const inferredFocus = scoreChapterFocus(text) ?? input.fallbackFocus;
  const extractedKeywords = extractChapterKeywords(text);
  const activeSupportLine =
    input.round === "two" && input.supportMode === "让支援船员介入"
      ? `${input.supportCrew.name} 会在这一轮更早插手，帮助系统换一条更稳的拼法。`
      : `${input.leadCrew.name} 仍是主要入口，${input.supportCrew.name} 负责把旁边的碎片托住。`;

  return {
    sourceText: input.prompt.trim(),
    extractedKeywords,
    inferredFocus,
    pathSummary:
      input.round === "one"
        ? `系统先按“${inferredFocus}”做第一次不完全恢复，只保留你特别强调的那一层。`
        : `系统会沿着“${inferredFocus}”继续修正，优先保留你这次追加强调的部分。`,
    crewFit: activeSupportLine,
    riskHint:
      input.round === "one"
        ? "第一轮只会给你方向，不会直接把真相全部交出来。"
        : "第二轮更准，但如果修正过猛，也可能把回应里故意留白的部分盖住。"
  };
}

function scorePromptAgainstTruth(text: string, truth: ChapterTwoTruth) {
  const normalized = text.replace(/\s+/g, "");
  let score = 0;

  const matchers: Record<ChapterTwoFocus, string[]> = {
    身份线索: ["身份", "谁", "名字", "发讯人", "来历", "认出", "某个人"],
    坐标结构: ["坐标", "入口", "门", "航路", "真假", "结构", "偏移"],
    异常语气: ["试探", "诱饵", "假", "陷阱", "语气", "误导", "引开"]
  };

  matchers[truth.trueFocus].forEach((item) => {
    if (normalized.includes(item)) score += 1;
  });

  matchers[truth.decoyFocus].forEach((item) => {
    if (normalized.includes(item)) score -= 1;
  });

  if (truth.signalKind === "诱饵试探" && ["诱饵", "试探", "假门", "引开"].some((item) => normalized.includes(item))) score += 2;
  if (truth.signalKind === "坐标回声" && ["门锁", "偏移", "坐标", "入口"].some((item) => normalized.includes(item))) score += 2;
  if (truth.signalKind === "记忆残片" && ["过去", "认出", "身份", "谁在说话"].some((item) => normalized.includes(item))) score += 2;

  return score;
}

function describePromptAlignment(text: string, truth: ChapterTwoTruth) {
  const score = scorePromptAgainstTruth(text, truth);
  if (score >= 3) return "你的描述已经压中真正的门边。";
  if (score >= 1) return "你的描述碰到了一部分真相，但还夹着外层雾。";
  return "你的描述更像碰到了外层假门，系统需要你再收紧方向。";
}

export function analyzeRecruitSignal(form: RecruitForm): RecruitSignalAnalysis {
  const sourceText = [form.description.trim(), form.notes.trim()].filter(Boolean).join(" ");
  const text = sourceText || form.customPrompt.trim() || "想招募一位可靠的新伙伴";
  const inferredFormType = form.formType ?? scoreByRules(text, recruitKeywordRules.formType) ?? inferFormTypeFromSubjectText(text) ?? "biological";
  const inferredRole = form.role ?? scoreByRules(text, recruitKeywordRules.role) ?? "scout";
  const inferredTemperament = form.temperament ?? scoreByRules(text, recruitKeywordRules.temperament) ?? "calm";
  const inferredTalent = form.talent ?? scoreByRules(text, recruitKeywordRules.talent) ?? "decode";
  const extractedKeywords = normalizeChineseKeywords(extractKeywords(text), {
    formType: inferredFormType,
    role: inferredRole,
    temperament: inferredTemperament,
    talent: inferredTalent
  });
  const suggestedFocuses = unique([
    ...focusHints[inferredRole],
    form.specialFocus,
    ...(form.styleTags.length > 0 ? [form.styleTags[0]] : [])
  ]).filter(Boolean) as string[];

  return {
    sourceText: [form.description.trim(), form.notes.trim()].filter(Boolean).join("｜"),
    extractedKeywords,
    inferredFormType,
    inferredRole,
    inferredTemperament,
    inferredTalent,
    suggestedFocuses: suggestedFocuses.slice(0, 3),
    roleSummary: `${labelMap.role[inferredRole]} + ${labelMap.talent[inferredTalent]}`,
    styleSummary: `${labelMap.temperament[inferredTemperament]} · ${labelMap.formType[inferredFormType]}`,
    summary: `系统先从你的描述里抓到了${extractedKeywords.slice(0, 3).join("、") || "新的伙伴轮廓"}，所以更倾向把 Ta 收拢成${labelMap.role[inferredRole]}方向。`
  };
}

export function generateCrewBackstory(crew: Pick<CrewMember, "id" | "name" | "role" | "talent" | "temperament">): CrewBackstory {
  const seed = hashString(`${crew.id}:${crew.name}`);
  return {
    origin: pickBySeed([...backstoryOriginMap[crew.role]], seed, 1),
    reasonToJoin: backstoryReasonMap[crew.talent],
    hiddenQuestion: hiddenQuestionMap[crew.temperament],
    speakingStyle: {
      calm: "短句，先判断再开口。",
      warm: "语气温和，但不会说太多。",
      cunning: "会留一点没说透的边角。",
      steady: "先把重点说清，再慢慢补细节。"
    }[crew.temperament]
  };
}

export function generateCrew(form: RecruitForm, variant = 0, analysisInput?: RecruitSignalAnalysis): CrewMember {
  const analysis = analysisInput ?? analyzeRecruitSignal(form);
  const seed = hashString(JSON.stringify(form) + analysis.sourceText + `:${variant}`);
  const name = `${pickBySeed(namePrefixes, seed)}${pickBySeed(nameSuffixes, seed, 3)}`;
  const formType = form.formType ?? analysis.inferredFormType;
  const role = form.role ?? analysis.inferredRole;
  const temperament = form.temperament ?? analysis.inferredTemperament;
  const talent = form.talent ?? analysis.inferredTalent;
  const noteSnippet = shortenText(form.notes.replace(/\s+/g, " ").trim(), 18);
  const recruitSignal = form.description.trim() || form.customPrompt.trim() || form.notes.trim();
  const signalSnippet = shortenText(recruitSignal.replace(/\s+/g, " ").trim(), 28);
  const specialFocus = form.specialFocus || analysis.suggestedFocuses[0] || "";
  const specialSnippet = shortenText(specialFocus.replace(/\s+/g, " ").trim(), 18);
  const styleTags = unique([...form.styleTags, ...analysis.extractedKeywords.slice(0, 2)]).slice(0, 3);
  const visualProfile = inferCrewVisualProfile({
    description: recruitSignal || analysis.sourceText,
    formType,
    keywords: analysis.extractedKeywords,
    styleTags
  });

  const title = `${pickBySeed(formTitleMap[formType], seed)} · ${pickBySeed(roleTitleMap[role], seed, 1)}`;
  const abilityTag = pickBySeed(talentAbilityMap[talent], seed, 2);
  const backstory = generateCrewBackstory({
    id: `crew-${seed}`,
    name,
    role,
    talent,
    temperament
  });
  const intro = [
    `${name}报道。`,
    `${temperamentPhrases[temperament]}。`,
    signalSnippet ? `我接收到的招募信号是“${signalSnippet}”。` : "",
    analysis.extractedKeywords.length > 0 ? `系统先从里面提取了${analysis.extractedKeywords.slice(0, 2).join("、")}。` : "",
    styleTags.length > 0 ? `我带着${styleTags.slice(0, 2).join("、")}的轮廓靠近了主舰。` : "",
    specialSnippet ? `你还特别强调了“${specialSnippet}”。` : "",
    noteSnippet
      ? `你留下的补充“${noteSnippet}”已经录进我的初始判断。`
      : `我的第一任务是陪你把这艘船重新点亮。`
  ]
    .filter(Boolean)
    .join("");

  return {
    id: `crew-${seed}`,
    name,
    title,
    intro,
    abilityTag,
    formType,
    role,
    temperament,
    talent,
    styleTags,
    specialFocus,
    customPrompt: recruitSignal,
    imagePromptHint: "",
    notes: form.notes,
    recruitSignal,
    signalKeywords: analysis.extractedKeywords,
    signalSummary: analysis.summary,
    suggestedFocuses: analysis.suggestedFocuses,
    visualSubject: visualProfile.visualSubject,
    visualGuardrails: visualProfile.visualGuardrails,
    portraitSeed: seed,
    bondStatus: "等待第一次共同行动",
    trustLevel: 1,
    trustLabel: "刚刚登船",
    portraitAsset: null,
    portraitEchoes: [],
    backstory,
    revealedBackstoryKeys: [],
    conversationLog: [],
    dossierEntries: [
      {
        id: `dossier-${seed}-arrival`,
        title: "初次登记",
        body: `${name} 已进入主舰船员名册。初始能力为 ${abilityTag}，等待第一次正式协作。`,
        tag: "登船"
      }
    ]
  };
}

const navigationRegionPool = ["雾带航环", "镜海边阶", "低光林带", "静波群岛", "灰蓝碎星坡"];
const navigationTonePool = ["先绕开噪音，再找亮点", "沿着稀薄航迹慢慢展开", "先看奇景，再决定靠近哪里"];
const malfunctionTruthPool: MalfunctionSuspicion[] = ["偏航冲击", "诱饵信号", "记忆过载"];

export function createChapterOneTruth(crew: CrewMember): SignalMissionTruth {
  const seed = hashString(crew.id);
  return {
    malfunctionCause: pickBySeed(malfunctionTruthPool, seed, 2),
    bestNavigationTone: pickBySeed(navigationTonePool, seed, 4)
  };
}

export function analyzeNavigationMemory(input: { crew: CrewMember; prompt: string }): NavigationMemoryAnalysis {
  const keywords = normalizeChineseKeywords(extractKeywords(input.prompt), {
    formType: input.crew.formType,
    role: input.crew.role,
    temperament: input.crew.temperament,
    talent: input.crew.talent
  });
  const seed = hashString(`${input.crew.id}:${input.prompt}`);
  const sectorGuess = keywords[0] ? `${keywords[0]}星区` : pickBySeed(navigationRegionPool, seed, 1);
  const routeTone = keywords[1] ?? pickBySeed(navigationTonePool, seed, 2);
  return {
    sourceText: input.prompt,
    extractedKeywords: keywords,
    sectorGuess,
    routeTone,
    riskHint: "如果世界经验太少，智脑会把相似的航路误看成同一条。",
    summary: `智脑开始把这片未知区域理解成一处偏向“${routeTone}”的星区。`
  };
}

export function restoreNavigationMemory(input: { crew: CrewMember; analysis: NavigationMemoryAnalysis }): NavigationMemoryRestore {
  return {
    summary: `你补上的想象开始变成航行经验。智脑现在能把 ${input.analysis.sectorGuess} 当作一条可推测的航线起点。`,
    unlockedFeature: "导航盘恢复基础推测",
    coordinateLabel: `恢复航图 · ${input.analysis.sectorGuess}`,
    restoredChart: `星图边缘亮起一段新的航线：${input.analysis.routeTone}。`
  };
}

export function analyzeMalfunctionMemory(input: {
  crew: CrewMember;
  suspicion: MalfunctionSuspicion;
  prompt: string;
  truth: SignalMissionTruth;
}): MalfunctionMemoryAnalysis {
  const keywords = normalizeChineseKeywords(extractKeywords(input.prompt), {
    formType: input.crew.formType,
    role: input.crew.role,
    temperament: input.crew.temperament,
    talent: input.crew.talent
  });
  const closeToTruth =
    input.suspicion === input.truth.malfunctionCause ||
    (input.truth.malfunctionCause === "诱饵信号" && /假|诱饵|试探|引开/.test(input.prompt)) ||
    (input.truth.malfunctionCause === "偏航冲击" && /撞|偏航|震动|失衡/.test(input.prompt)) ||
    (input.truth.malfunctionCause === "记忆过载" && /记忆|挤满|过载|调用失败/.test(input.prompt));

  return {
    sourceText: input.prompt,
    extractedKeywords: keywords,
    inferredCause: closeToTruth ? input.truth.malfunctionCause : input.suspicion,
    clueSummary: closeToTruth
      ? "这段旧记录开始指向主舰曾在一次异常里把记忆索引挤乱了。"
      : "这条推测看起来成立，但它还解释不了为什么智脑会缺少整块基础经验。",
    crewAngle:
      input.crew.role === "repair"
        ? `${input.crew.name} 先从故障链路看出断点。`
        : input.crew.role === "record"
          ? `${input.crew.name} 更快发现旧记录里的顺序异常。`
          : `${input.crew.name} 在噪音里先抓到了最不对劲的那一层。`,
    riskHint: closeToTruth ? "这次判断更接近主因，但还需要一次确认。" : "这条线可以暂时成立，但仍可能只是外层误导。"
  };
}

export function restoreMalfunctionMemory(input: {
  crew: CrewMember;
  analysis: MalfunctionMemoryAnalysis;
  truth: SignalMissionTruth;
  attempts: number;
}): MalfunctionMemoryRestore {
  const stable = input.analysis.inferredCause === input.truth.malfunctionCause || input.attempts > 0;
  return {
    status: stable ? "stable" : "partial",
    summary: stable
      ? "故障案例库恢复了一段关键记录。智脑终于能分辨什么是主因，什么只是表面噪音。"
      : "这段记录被修回来了，但还不够稳定。它像真相的一部分，不是全部。",
    restoredLog: stable
      ? [
          "旧警报记录：主舰在异常航线中遭遇索引紊乱，基础记忆被迫折叠。",
          "故障处理台恢复：之后遇到类似情况时，智脑至少能给出更接近的推测。"
        ]
      : [
          "旧警报记录恢复了一半：主舰确实经历过一次严重异常。",
          "但这还不足以解释为什么整块基础记忆同时缺失。"
        ],
    unlockedFeature: stable ? "故障处理台上线" : "故障样本恢复一部分",
    setbackHint: stable ? null : "诺瓦：这段记录有用，但它还不是主因。换个判断再试一次。"
  };
}

export function restoreCrewMemory(input: { crew: CrewMember; reply: string; touchedBackstory: boolean }): CrewMemoryRestore {
  return {
    reply: input.reply,
    summary: input.touchedBackstory
      ? `${input.crew.name} 的协作记忆锚点已经被主舰记住。现在这艘船知道 Ta 为什么会留在这里。`
      : `${input.crew.name} 的基本协作记录已经写回信息库。主舰开始知道 Ta 适合怎样与你并肩工作。`,
    unlockedFeature: "船员名册完整写入",
    anchorTitle: input.touchedBackstory ? "深层记忆锚点已确认" : "协作锚点已确认"
  };
}

export function finalizeChapterOneRescue(input: {
  crew: CrewMember;
  navigation: NavigationMemoryRestore;
  malfunction: MalfunctionMemoryRestore;
  crewRestore: CrewMemoryRestore;
}): RepairedSignal {
  return {
    title: "基础记忆恢复完成",
    summary: "主舰智脑已经重新获得根据过去经验进行推测和导航的能力。",
    crewComment: `${input.crew.name}：现在这艘船终于不只是亮起来了。它开始记得该怎么继续往前走。`,
    coordinateLabel: input.navigation.coordinateLabel,
    sourceLabel: "主舰信息库",
    unlockedSector: "基础导航权限",
    nextLead: "更远处出现了一条新坐标。第二章的入口正在等你靠近。",
    repairSummary: "航行记忆、故障记忆和船员协作记忆都已恢复。智脑重新可以推测，但仍不会把推测当成真相本身。",
    aiLine: "基础记忆恢复完成。我可以重新推测航路，但请记住，我只能从记录中寻找最接近的答案。",
    restoredFeatures: [input.navigation.unlockedFeature, input.malfunction.unlockedFeature, input.crewRestore.unlockedFeature]
  };
}

export function generateSignalSources(crew: CrewMember): SignalSource[] {
  const seed = hashString(crew.id);

  return Array.from({ length: 3 }).map((_, index) => {
    const sourceSeed = seed + index * 17;
    const sector = pickBySeed(sectorPool, sourceSeed, 1);
    const sourceName = pickBySeed(sourceNamePool, sourceSeed, 2);
    const summary = pickBySeed(sourceSummaryPool, sourceSeed, 3).replace(/\s+/g, " ").trim();
    const fragments = [
      `残片 A：${pickBySeed(fragmentOpeners, sourceSeed)}的回声忽然中断，只留下半段坐标格式。`,
      `残片 B：接收尾部反复出现“${pickBySeed(cluePool, sourceSeed, 4)}”的词序轮廓。`,
      `残片 C：背景噪音里混着${pickBySeed(senderPool, sourceSeed, 5)}留下的短促身份签名。`
    ];

    return {
      id: `source-${index}-${sourceSeed}`,
      label: `${sector} · ${sourceName}`,
      sector,
      stability: pickBySeed(stabilityPool, sourceSeed, 6),
      summary,
      fragments
    };
  });
}

function isIdentityQuestion(text: string) {
  return [
    "你是谁",
    "你叫什么",
    "你的名字",
    "名字是什么",
    "怎么称呼",
    "是谁",
    "叫什么"
  ].some((item) => text.includes(item));
}

function isBackstoryQuestion(text: string) {
  if (isIdentityQuestion(text)) {
    return false;
  }

  return ["以前", "过去", "来历", "为什么来到", "为什么来", "从哪来", "原来", "身世", "之前", "为什么会上船"].some((item) =>
    text.includes(item)
  );
}

function isRephraseRequest(text: string) {
  return ["换种说法", "别这么说", "你怎么又这样说", "你能说点别的吗", "重说", "别这样讲"].some((item) => text.includes(item));
}

function detectDialogueType(text: string) {
  if (isRephraseRequest(text)) return "ask_to_rephrase";
  if (["你好", "在吗", "嗨", "早", "晚上好"].some((item) => text.includes(item))) return "greeting";
  if (["你会什么", "擅长什么", "能做什么", "会做什么"].some((item) => text.includes(item))) return "capability_question";
  if (isBackstoryQuestion(text)) return "background_inquiry";
  if (["难过", "害怕", "紧张", "担心", "怕", "慌"].some((item) => text.includes(item))) return "emotional_support";
  if (["怎么做", "下一步", "先做什么", "怎么办", "信号", "坐标", "航路", "任务", "判断"].some((item) => text.includes(item))) return "task_discussion";
  return "casual_chat";
}

function nextRevealKey(crew: CrewMember): CrewBackstoryRevealKey | null {
  const order: CrewBackstoryRevealKey[] = ["origin", "reason", "question"];
  return order.find((key) => !crew.revealedBackstoryKeys.includes(key)) ?? null;
}

function revealFactForKey(crew: CrewMember, key: CrewBackstoryRevealKey) {
  if (key === "origin") return crew.backstory.origin;
  if (key === "reason") return crew.backstory.reasonToJoin;
  return crew.backstory.hiddenQuestion;
}

function idleReply(crew: CrewMember, message: string) {
  const trimmed = message.trim();
  const roleTone = {
    scout: "我先替你看路。",
    repair: "我先看哪里最容易出问题。",
    record: "我会把重要的东西记住。",
    pilot: "我会先确认方向。"
  }[crew.role];
  const temperamentTone = {
    calm: "别急，我在听。",
    warm: "我收到你这句了。",
    cunning: "这句话后面应该还有一点没说完。",
    steady: "好，我们一步一步来。"
  }[crew.temperament];

  if (trimmed.includes("你好") || trimmed.includes("在吗")) {
    return `${temperamentTone}${roleTone}`;
  }

  if (trimmed.includes("谢谢")) {
    return "记下了。下次你还可以直接叫我。";
  }

  if (trimmed.includes("怕") || trimmed.includes("紧张")) {
    return `会有一点，但我更在意接下来该怎么做。${roleTone}`;
  }

  if (trimmed.includes("多大") || trimmed.includes("年龄") || trimmed.includes("几岁")) {
    return "我没有把自己按岁数记下来。主舰更关心我还能不能判断、还能不能一起做事。";
  }

  if (isIdentityQuestion(trimmed)) {
    return `我是 ${crew.name}。${crew.title}。先记住这一层，后面的事我们可以慢慢对。`;
  }

  if (trimmed.includes("你") && trimmed.includes("怎么样")) {
    return `我是 ${crew.name}。现在状态还稳。${roleTone}`;
  }

  if (trimmed.includes("觉得") || trimmed.includes("像")) {
    return `${temperamentTone}你这句里已经有方向了。${roleTone}`;
  }

  if (trimmed.includes("骗") || trimmed.includes("陷阱") || trimmed.includes("假的") || trimmed.includes("不对劲")) {
    return {
      scout: "有这种可能。我不怕它是假的，我只怕我们太早把它当真。",
      repair: "如果它在骗我们，最先露馅的会是那些接不上去的细节。",
      record: "我会先记住它哪里说得太顺。太顺的东西，往往藏着空白。",
      pilot: "我会先把它当成未确认航路，不会立刻把整艘船压上去。"
    }[crew.role];
  }

  if (trimmed.includes("相信") || trimmed.includes("该不该") || trimmed.includes("要不要")) {
    return {
      calm: "先别急着站队。再多看一层，我们会更稳。",
      warm: "可以先靠近一点，但别把退路关掉。",
      cunning: "半信半疑最好。真正的门，通常不怕你多看一眼。",
      steady: "我建议先留一手，再决定要不要往前。"
    }[crew.temperament];
  }

  if (trimmed.includes("为什么停") || trimmed.includes("为什么不说") || trimmed.includes("沉默")) {
    return "我不是不说，只是在把最先该说的那一层挑出来。太快的答案通常不稳。";
  }

  const echo = trimmed
    .replace(/[？?！!。,.，]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join("、");

  if (trimmed.includes("吗") || trimmed.includes("?") || trimmed.includes("？")) {
    return {
      scout: `${temperamentTone}我会先把它当成一条还没看清的路，再往前试一步。`,
      repair: `${temperamentTone}先别求快。我更想看它哪里会先露出断点。`,
      record: `${temperamentTone}我会先把你问的这一层记住，再看它和前面的线索合不合。`,
      pilot: `${temperamentTone}我的做法是先确认方向，再决定要不要把整条航路押上去。`
    }[crew.role];
  }

  return echo ? `${temperamentTone}你刚才提到“${echo}”，这句不空。我先把它压进记录里。` : `${temperamentTone}${roleTone}`;
}

function taskReply(crew: CrewMember, message: string) {
  const trimmed = message.trim();

  if (trimmed.includes("怎么做") || trimmed.includes("下一步") || trimmed.includes("先做什么")) {
    return {
      scout: "我建议先看最不对劲的那一层，再决定要不要靠近。",
      repair: "先稳住最容易散掉的那部分，再往里拆。",
      record: "先把顺序理出来，不然线索会互相盖住。",
      pilot: "先确认方向，再决定要不要继续往前。"
    }[crew.role];
  }

  if (trimmed.includes("你觉得") || trimmed.includes("你怎么看")) {
    return {
      decode: "我更在意它把哪一层故意藏起来了。",
      track: "我会先看它真正想把我们引到哪边。",
      mend: "我先看哪里最容易断，再判断值不值得碰。",
      invent: "我怀疑它表面那条路太顺了，顺得有点像故意的。"
    }[crew.talent];
  }

  if (trimmed.includes("为什么") || trimmed.includes("原因")) {
    return {
      scout: "先别盯着表面回应。我更想知道它为什么把我们往那个方向推。",
      repair: "原因通常藏在最先断开的地方。我建议先找断点。",
      record: "如果想看原因，就得先把前后顺序拼起来。",
      pilot: "方向为什么会偏，往往比它偏去了哪里更重要。"
    }[crew.role];
  }

  if (trimmed.includes("信号") || trimmed.includes("坐标") || trimmed.includes("航路")) {
    return {
      decode: "这类东西我会先拆关键词，看它故意把哪一段藏起来了。",
      track: "我会顺着尾迹追过去，先确认它到底从哪边出现。",
      mend: "我先看它哪里不稳定，稳住之后再判断值不值得信。",
      invent: "我会先试两种解释，看哪一种更像故意留下的门。"
    }[crew.talent];
  }

  if (trimmed.includes("擅长") || trimmed.includes("会做什么")) {
    return `我更擅长${crew.abilityTag}。真要上手时，我会先按自己的那一套靠近问题。`;
  }

  if (trimmed.includes("累") || trimmed.includes("还好吗")) {
    return {
      calm: "还稳得住。只要主舰没乱，我就还能继续。",
      warm: "还好。和你一起做事的时候，没那么难熬。",
      cunning: "没坏到要停下来，只是得更聪明一点。",
      steady: "还行。问题没解决前，我不会先松手。"
    }[crew.temperament];
  }

  return null;
}

function casualReply(crew: CrewMember, message: string) {
  const trimmed = message.trim();

  if (trimmed.includes("多大") || trimmed.includes("年龄") || trimmed.includes("几岁")) {
    return "我没有把自己按岁数记下来。主舰更关心我还能不能判断、还能不能一起做事。";
  }

  return {
    calm: "我听见了。你这句不像随口问的，我先记住。",
    warm: "听到了。你如果愿意往下说，我会继续接着听。",
    cunning: "这句不像空话。你已经在往真正的问题边上碰了。",
    steady: "我收到了。先别急，我们把它一层层说清。"
  }[crew.temperament];
}

function rephraseReply(crew: CrewMember) {
  return {
    scout: "行，那我换直白一点的说法：这件事还不能全信，但也没到该立刻后退的时候。",
    repair: "好，我不绕。先看最容易出问题的地方，别被表面那层带走。",
    record: "那我说得更短一点：现在的信息还不够，先别急着下结论。",
    pilot: "我换个讲法：方向还没错，只是不能太早把整条路押上去。"
  }[crew.role];
}

function capabilityReply(crew: CrewMember) {
  return {
    scout: `我更适合先看异常从哪里露头。${crew.abilityTag}这件事，我能比一般人快半步。`,
    repair: `我擅长把快散掉的东西先稳住。${crew.abilityTag}算是我最顺手的一块。`,
    record: `我会先把零碎线索排出顺序。${crew.abilityTag}对我来说不是标签，是工作方式。`,
    pilot: `我更会判断往哪边走还算安全。${crew.abilityTag}让我在混乱里也能先定方向。`
  }[crew.role];
}

function emotionalReply(crew: CrewMember) {
  return {
    calm: "会乱是正常的。先把最靠前的一步踩稳，后面才不会一起塌。",
    warm: "我知道那种感觉。别急着把所有事一口气扛完，我们先处理眼前这一层。",
    cunning: "慌的时候最容易被假门带走。先慢一点，反而更安全。",
    steady: "先站稳，再往前。只要你还在判断，我们就没有彻底偏掉。"
  }[crew.temperament];
}

function recentCrewReplies(crew: CrewMember) {
  return crew.conversationLog.filter((message) => message.role === "crew").slice(-3).map((message) => message.body);
}

function normalizeReplyText(text: string) {
  return text.replace(/[：:，,。.!！？?、“”"'（）()\s]/g, "").trim();
}

function isTooSimilarToRecent(candidate: string, recentReplies: string[]) {
  const normalized = normalizeReplyText(candidate);
  if (!normalized) return false;

  return recentReplies.some((reply) => {
    const other = normalizeReplyText(reply);
    if (!other) return false;
    return normalized === other || candidate.slice(0, 8) === reply.slice(0, 8);
  });
}

function diversifyReply(crew: CrewMember, message: string, type: string, baseReply: string) {
  if (!isTooSimilarToRecent(baseReply, recentCrewReplies(crew))) {
    return baseReply;
  }

  if (type === "task_discussion") {
    return {
      scout: "先别把它当成答案。我建议再往前试一小步，看它会不会自己露出破绽。",
      repair: "这一步先别求快。稳住断点以后，很多真假会自己分开。",
      record: "我换个讲法：先把顺序排出来，再谈信不信。",
      pilot: "我们先确认方向有没有偏，再决定值不值得继续押上去。"
    }[crew.role];
  }

  if (type === "casual_chat") {
    return {
      calm: "我在听，而且我知道你不是在随口问。继续说。",
      warm: "我听见了。你如果还有下一层，我可以接着往下听。",
      cunning: "这句后面通常还有别的意思。你可以直接说出来。",
      steady: "收到。别急，我们可以把这件事往前推一步。"
    }[crew.temperament];
  }

  if (type === "ask_to_rephrase") {
    return "好，那我不绕了。你现在最需要的是一个更直接的判断，不是同一句话再说一遍。";
  }

  return baseReply;
}

export function respondCrewConversation(input: {
  crew: CrewMember;
  playerMessage: string;
  interpretedIntent?: { kind: string; rephraseRequested?: boolean };
}) {
  const { crew, playerMessage } = input;
  const message = playerMessage.trim();
  const rawType = input.interpretedIntent?.kind ?? detectDialogueType(message);
  const type =
    rawType === "capability" ? "capability_question" :
    rawType === "task" ? "task_discussion" :
    rawType === "background" ? "background_inquiry" :
    rawType === "emotion" ? "emotional_support" :
    rawType === "rephrase" ? "ask_to_rephrase" :
    rawType === "casual" ? "casual_chat" :
    rawType;
  const revealKey = isBackstoryQuestion(message) ? nextRevealKey(crew) : null;
  const touchedBackstory = Boolean(revealKey);
  const revealedFact = revealKey ? revealFactForKey(crew, revealKey) : null;
  const practicalReply = taskReply(crew, message);
  const baseReply = touchedBackstory
    ? `${revealedFact}。这件事我平时不常提，但你既然问到了，我可以先让你知道这一层。`
    : (input.interpretedIntent?.rephraseRequested || type === "ask_to_rephrase")
      ? rephraseReply(crew)
      : type === "capability_question"
        ? capabilityReply(crew)
        : type === "emotional_support"
          ? emotionalReply(crew)
          : type === "casual_chat"
            ? casualReply(crew, message)
            : practicalReply ?? idleReply(crew, message);
  const reply = `${crew.name}：${diversifyReply(crew, message, type, baseReply)}`;

  const trustGain = touchedBackstory ? 1 : 0;
  const bondNote = touchedBackstory ? `${crew.name} 愿意把更深一层的过去交给你了。` : null;
  const dossierEntry = touchedBackstory
    ? {
        id: `dossier-chat-${crew.id}-${revealKey}`,
        title: "私人频道记录",
        body: `${crew.name} 在这次对话里提到了：${revealedFact}。`,
        tag: "了解更深"
      }
    : null;
  const shipLog = touchedBackstory
    ? {
        id: `log-chat-${crew.id}-${revealKey}-${Date.now()}`,
        title: `${crew.name} 的私人回声变清晰了`,
        body: `主舰记录到一次更深层的船员回应。${crew.name} 主动提到了自己的过去片段，频道默契略有上升。`,
        tag: "关系推进"
      }
    : null;

  const messages: CrewChatMessage[] = [
    {
      id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "player",
      body: message,
      kind: "message"
    },
    {
      id: `crew-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "crew",
      body: reply,
      kind: touchedBackstory ? "reveal" : "message"
    },
    ...(bondNote
      ? [
          {
            id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: "system" as const,
            body: bondNote,
            kind: "bond" as const
          }
        ]
      : [])
  ];

  return {
    reply,
    touchedBackstory,
    revealedKey: revealKey,
    revealedFact,
    trustGain,
    bondNote,
    dossierEntry,
    shipLog,
    messages
  };
}

export function analyzeSignalSource(crew: CrewMember, source: SignalSource): string[] {
  const seed = hashString(`${crew.id}:${source.id}`);

  const roleLine = {
    scout: `侦察判断：${source.label}的回波不是乱飘，它一直在指向同一片扇区。`,
    repair: `修复判断：这段信号像是被切断过，不像自然衰减，更适合先补回断点。`,
    record: `记录判断：碎片之间重复了同一组顺序，说明信息结构还没完全散掉。`,
    pilot: `领航判断：如果这是一条可追踪路线，终点多半不在主航道正中央。`
  }[crew.role];

  const talentLine = {
    decode: `特长反馈：我能先把关键词拆出来，优先锁定真正重要的那一类信息。`,
    track: `特长反馈：我可以顺着尾迹看它更像求救、警告还是坐标留言。`,
    mend: `特长反馈：先找断裂点，再让系统补全，结果会比直接拼更稳。`,
    invent: `特长反馈：我能先试几种拼法，但最好由你先给我一个重点。`
  }[crew.talent];

  const instinctLine = {
    calm: "别急，先把重点定下来，系统才不容易被噪音带偏。",
    warm: "你先选方向，我来帮你把散开的碎片拉到一起。",
    cunning: "真正有用的东西往往藏在不显眼的位置，我们先缩小范围。",
    steady: "一步一步来。先判断，再生成，这样回路最稳。"
  }[crew.temperament];

  return [roleLine, talentLine, instinctLine, `信号稳定度：${source.stability}。我建议别直接乱修。`];
}

function resolveSignalLine(
  source: SignalSource,
  nature: SignalNature,
  missingInfo: MissingInfo,
  seed: number
) {
  const location = `${source.sector} · ${pickBySeed(fragmentOpeners, seed, 1)}`;
  const sender = pickBySeed(senderPool, seed, 2);
  const clue = pickBySeed(cluePool, seed, 3);

  const firstLine = {
    distress: `这里是${sender}。${source.label}的外层回声正在塌缩，我们只剩下一次清晰传回的机会。`,
    warning: `来自${sender}的警告已重组。${source.label}附近出现持续偏折，靠近前请重新校准。`,
    coordinates: `${sender}留下了一段坐标留言。${source.label}并非终点，而是通往下一颗航星的入口。`
  }[nature];

  const secondLineByMissing: Record<MissingInfo, string> = {
    location: `缺失地点已补回：真正的信号源位于${location}。`,
    sender: `缺失身份已补回：发送者是${sender}。`,
    "final-clue": `缺失提示已恢复：${clue}。`
  };

  const closingLine = {
    distress: `如果主舱仍有人值守，请先标记这里。只有这样，我们的回声才不会完全熄灭。`,
    warning: `请先记录这处偏折，再决定是否继续靠近，否则整段航路会持续失真。`,
    coordinates: `当第一颗航星被重新点亮时，下一段异常会在星图边缘露出轮廓。`
  }[nature];

  return {
    location,
    sender,
    clue,
    lines: [firstLine, secondLineByMissing[missingInfo], closingLine]
  };
}

export function repairSignal(
  crew: CrewMember,
  input: { source: SignalSource; nature: SignalNature; missingInfo: MissingInfo }
): RepairedSignal {
  const seed = hashString(`${crew.id}:${input.source.id}:${input.nature}:${input.missingInfo}`);
  const resolved = resolveSignalLine(input.source, input.nature, input.missingInfo, seed);
  const coordinateLabel = `已记录坐标 · ${resolved.location}`;

  const talentComment = {
    decode: "你先给了我清楚的判断，所以碎片很快自己对上了。",
    track: "方向先被你定住了，我只需要顺着尾迹把剩下的路接起来。",
    mend: "好修多了。先定重点，再补断点，系统不会乱偏。",
    invent: "你先缩小了范围，我才敢把最顺的拼法直接拉出来。"
  }[crew.talent];

  const repairSummary = `你先把它判断为${labelMap.signalNature[input.nature]}，又锁定缺失的${labelMap.missingInfo[input.missingInfo]}，系统才把结果收拢到${resolved.location}。`;

  return {
    title: signalTitleMap[input.nature],
    summary: resolved.lines.join(" "),
    crewComment: `${crew.name}：${talentComment}决定权还是在你手里。`,
    coordinateLabel,
    sourceLabel: input.source.label,
    unlockedSector: input.source.sector,
    nextLead: `下一段异常已在${pickBySeed(sectorPool, seed, 4)}边缘闪烁。`,
    repairSummary,
    aiLine: "我已经补回最接近的记录，但最终相信哪条路，仍然由你来定。",
    restoredFeatures: ["星图记录已更新", "异常摘要已归档", "船员评论已写入"]
  };
}

export function getCrewSummary(crew: CrewMember) {
  return `${labelMap.formType[crew.formType]} · ${labelMap.role[crew.role]} · ${labelMap.talent[crew.talent]}`;
}

export function getCrewDirectiveSummary(crew: CrewMember) {
  return [
    ...(crew.recruitSignal ? [`招募信号：${shortenText(crew.recruitSignal, 18)}`] : []),
    ...crew.signalKeywords.slice(0, 2).map((tag) => `关键词：${tag}`),
    `主体锁定：${crew.visualSubject}`,
    `系统判断：${labelMap.role[crew.role]} + ${labelMap.talent[crew.talent]}`,
    `风格：${labelMap.temperament[crew.temperament]} · ${labelMap.formType[crew.formType]}`,
    ...(crew.suggestedFocuses.slice(0, 1).map((item) => `偏向：${item}`))
  ];
}

export function runShipTask(task: ShipTask, crew: CrewMember): TaskResult {
  const strongRole = crew.role === task.recommendedRole;
  const strongTalent = crew.talent === task.recommendedTalent;
  const resultTone: TaskResult["resultTone"] = strongRole && strongTalent ? "matched" : strongRole || strongTalent ? "creative" : "risky";
  const seed = hashString(`${task.id}:${crew.id}:${task.completionCount}`);

  const outcomeTitleMap: Record<TaskResult["resultTone"], string> = {
    matched: "这次分工非常对路",
    creative: "这次分工带来了意外解法",
    risky: "这次分工偏冒险，但也有收获"
  };

  const outcomeSummaryMap: Record<typeof task.id, Record<TaskResult["resultTone"], string>> = {
    "trace-anomaly": {
      matched: `${crew.name}顺着异常尾迹一路锁到了更深的回波源，还额外带回了一条隐藏坐标。`,
      creative: `${crew.name}没有走标准追踪路线，而是从旁边的碎讯里拼出了一条可疑偏航线。`,
      risky: `${crew.name}差点被漂移信号带偏，但还是从回波碎片里抢回了一点方向信息。`
    },
    "repair-array": {
      matched: `${crew.name}把外环阵列重新稳住了，主舰现在能更清楚地接收到远端回声。`,
      creative: `${crew.name}没有只修旧回路，而是顺手改出了一种更灵活的临时接法。`,
      risky: `${crew.name}修得有些吃力，但至少让阵列暂时恢复了工作，并暴露出新的薄弱点。`
    },
    "decode-relic": {
      matched: `${crew.name}很快抓住了遗迹坐标的结构，成功补出了真正的入口信息。`,
      creative: `${crew.name}从不完整坐标里读出了另一层意思，像是在故事里翻出了隐藏页。`,
      risky: `${crew.name}没有完全解透，但仍把一段重要提示从噪音里捞了出来。`
    }
  };

  const discoveredHintMap: Record<typeof task.id, Record<TaskResult["resultTone"], string>> = {
    "trace-anomaly": {
      matched: "你们发现了额外的侧向坐标，星图边缘又亮起一个微点。",
      creative: "你们没有直接找到终点，却找到了另一条更怪的偏航痕迹。",
      risky: "你们只拿回一半线索，但已经足够让主舰生成新的待观察标记。"
    },
    "repair-array": {
      matched: "阵列亮度恢复，主舰远端扫描精度上升了一截。",
      creative: "阵列虽然不是标准复位，但多出了一个临时增幅窗。",
      risky: "阵列恢复了部分功能，也暴露出外环仍有未修断点。"
    },
    "decode-relic": {
      matched: "旧日志里多出了一段可继续追踪的入口提示。",
      creative: "坐标里藏着一条旁支故事线，像是有人故意留给下一次尝试的。",
      risky: "虽然只补回一部分，但主舰已经能把它记成新的待分析条目。"
    }
  };

  const shipChangeMap: Record<typeof task.id, string> = {
    "trace-anomaly": "任务台新增了一条异常追踪记录",
    "repair-array": "主舰扫描阵列状态提升",
    "decode-relic": "档案舱新增一条遗迹线索"
  };

  const trustGainMap: Record<TaskResult["resultTone"], number> = {
    matched: 2,
    creative: 2,
    risky: 1
  };

  const trustNoteMap: Record<TaskResult["resultTone"], string> = {
    matched: `${crew.name} 这次被派到了真正适合的位置上，和你的默契明显更稳了一点。`,
    creative: `${crew.name} 记住了这次临场配合。虽然不是标准分工，但你们开始学会彼此接住新办法。`,
    risky: `${crew.name} 经历了一次不太轻松的出动。即使过程摇晃，信任还是因为一起扛过去而增长。`
  };

  const dossierTitleMap: Record<typeof task.id, string> = {
    "trace-anomaly": "异常追踪记录",
    "repair-array": "外环修复记录",
    "decode-relic": "遗迹解读记录"
  };

  return {
    taskId: task.id,
    title: task.title,
    assignedCrewId: crew.id,
    assignedCrewName: crew.name,
    outcomeTitle: outcomeTitleMap[resultTone],
    outcomeSummary: outcomeSummaryMap[task.id][resultTone],
    logLine: `${crew.name}执行了「${task.title}」，结果：${outcomeTitleMap[resultTone]}`,
    shipChange: shipChangeMap[task.id],
    discoveredHint: discoveredHintMap[task.id][resultTone],
    resultTone,
    trustGain: trustGainMap[resultTone],
    trustNote: trustNoteMap[resultTone],
    dossierEntry: {
      id: `dossier-${task.id}-${seed}`,
      title: dossierTitleMap[task.id],
      body: `${crew.name} 执行「${task.title}」后留下了新的主舰记录：${outcomeSummaryMap[task.id][resultTone]}`,
      tag: resultTone === "matched" ? "表现稳定" : resultTone === "creative" ? "新解法" : "冒险完成"
    }
  };
}

function dutyHint(crew: CrewMember, duty: ChapterTwoDuty | null) {
  if (!duty) return "待命";
  if (duty === "前线解析") {
    return crew.talent === "decode" || crew.role === "record" ? "擅长拆开异常词序" : "会从自己的方式靠近异常回应";
  }
  if (duty === "后方稳定") {
    return crew.talent === "mend" || crew.role === "repair" ? "能把漂移信号先稳住" : "会尽力让回路别散掉";
  }
  if (duty === "环境扫描") {
    return crew.talent === "track" || crew.role === "scout" ? "更容易先找到外层变化" : "会补足外层空间感";
  }
  return crew.role === "record" || crew.talent === "decode" ? "适合把零碎线索记成结构" : "能从旁边补出新的理解";
}

function focusScoreForCrew(crew: CrewMember, focus: ChapterTwoFocus) {
  if (focus === "身份线索") {
    return (crew.role === "record" ? 2 : 0) + (crew.talent === "decode" ? 2 : 0) + (crew.temperament === "calm" ? 1 : 0);
  }

  if (focus === "坐标结构") {
    return (crew.role === "pilot" ? 2 : 0) + (crew.talent === "track" ? 2 : 0) + (crew.temperament === "steady" ? 1 : 0);
  }

  return (crew.role === "scout" ? 2 : 0) + (crew.talent === "invent" ? 1 : 0) + (crew.temperament === "cunning" ? 2 : 0);
}

function preferredDutyForFocus(crew: CrewMember, focus: ChapterTwoFocus): ChapterTwoDuty {
  if (focus === "身份线索") {
    if (crew.role === "record" || crew.talent === "decode") return "记录还原";
    if (crew.role === "repair" || crew.talent === "mend") return "后方稳定";
    return "前线解析";
  }

  if (focus === "坐标结构") {
    if (crew.role === "pilot" || crew.talent === "track") return "环境扫描";
    if (crew.role === "repair") return "后方稳定";
    return "前线解析";
  }

  if (crew.role === "scout" || crew.temperament === "cunning") return "前线解析";
  if (crew.role === "repair") return "后方稳定";
  return "环境扫描";
}

function mismatchFocus(trueFocus: ChapterTwoFocus): ChapterTwoFocus {
  return trueFocus === "身份线索" ? "坐标结构" : trueFocus === "坐标结构" ? "异常语气" : "身份线索";
}

export function generateChapterTwoTruth(input: {
  crewRoster: CrewMember[];
  activeCrew: CrewMember | null;
  echo: ChapterTwoEcho;
}): ChapterTwoTruth {
  const seed = hashString(`${input.echo.title}:${input.activeCrew?.id ?? "none"}:${input.crewRoster.map((crew) => crew.id).join("|")}`);
  const focusPool: ChapterTwoFocus[] = ["身份线索", "坐标结构", "异常语气"];
  const trueFocus =
    input.activeCrew?.role === "record" || input.activeCrew?.talent === "decode"
      ? "身份线索"
      : input.activeCrew?.role === "pilot" || input.activeCrew?.talent === "track"
        ? "坐标结构"
        : pickBySeed(focusPool, seed, 1);

  const sortedByFocus = [...input.crewRoster].sort((left, right) => focusScoreForCrew(right, trueFocus) - focusScoreForCrew(left, trueFocus));
  const recommendedLead = sortedByFocus[0] ?? input.activeCrew ?? input.crewRoster[0] ?? null;
  const recommendedSupport = sortedByFocus.find((crew) => crew.id !== recommendedLead?.id) ?? input.crewRoster.find((crew) => crew.id !== recommendedLead?.id) ?? recommendedLead;

  const signalKindMap: Record<ChapterTwoFocus, ChapterTwoTruth["signalKind"]> = {
    身份线索: "记忆残片",
    坐标结构: "坐标回声",
    异常语气: "诱饵试探"
  };

  const finalChoiceMap: Record<ChapterTwoFocus, ChapterTwoFinalChoice> = {
    身份线索: "记录后返航",
    坐标结构: "深入追踪",
    异常语气: "激活隐藏模块"
  };

  const refinementMap: Record<ChapterTwoFocus, ChapterTwoRefinement> = {
    身份线索: "补发讯人细节",
    坐标结构: "强化区域描述",
    异常语气: "切换主分析员"
  };

  return {
    trueFocus,
    decoyFocus: mismatchFocus(trueFocus),
    signalKind: signalKindMap[trueFocus],
    recommendedLeadCrewId: recommendedLead?.id ?? null,
    recommendedSupportCrewId: recommendedSupport?.id ?? null,
    recommendedLeadDuty: preferredDutyForFocus(recommendedLead ?? input.activeCrew ?? input.crewRoster[0], trueFocus),
    recommendedSupportDuty: preferredDutyForFocus(recommendedSupport ?? recommendedLead ?? input.crewRoster[0], trueFocus) === "前线解析"
      ? "后方稳定"
      : preferredDutyForFocus(recommendedSupport ?? recommendedLead ?? input.crewRoster[0], trueFocus),
    preferredRefinement: refinementMap[trueFocus],
    preferredSupportMode: trueFocus === "异常语气" ? "让支援船员介入" : "维持原分工",
    recommendedFinalChoice: finalChoiceMap[trueFocus],
    truthSummary:
      trueFocus === "身份线索"
        ? "这段回应的关键不在地点，而在它为什么先认出你们队伍里的某个人。"
        : trueFocus === "坐标结构"
          ? "真正的推进点是一种会偏移的门锁坐标，不是表面上的广播文本。"
          : "这段回应本身就在试探接收者，太快相信它就会被带偏。"
  };
}

function describeTrueFocus(focus: ChapterTwoFocus) {
  if (focus === "身份线索") return "它真正想藏的是和船员来历有关的身份层。";
  if (focus === "坐标结构") return "它真正想藏的是一段会自行偏移的门锁坐标。";
  return "它真正危险的地方在于语气本身像在试探接收者。";
}

function buildChapterTwoSetback(input: {
  truth: ChapterTwoTruth;
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  focus: ChapterTwoFocus;
  refinement: ChapterTwoRefinement;
  supportMode: "维持原分工" | "让支援船员介入";
}): ChapterTwoSetback {
  const focusMiss = input.focus !== input.truth.trueFocus;
  const wrongLead = input.leadCrew.id !== input.truth.recommendedLeadCrewId;
  const wrongSupport = input.supportCrew.id !== input.truth.recommendedSupportCrewId;

  return {
    title: "回响短暂断裂",
    summary: focusMiss
      ? `你们先沿着“${input.focus}”追了出去，但这条线更像是沉默坐标故意放在外层的假门。`
      : "你们碰到了真正的门边，却没把最合适的协作方式带过去，结果让回响提前散开。",
    learnedClue: describeTrueFocus(input.truth.trueFocus),
    reasonHint: focusMiss
      ? `这次偏差主要出在关注方向。当前异常更接近“${input.truth.trueFocus}”，而不是“${input.focus}”。`
      : `这次偏差更像协作排布问题。${wrongLead ? "前线位没有站到最适合拆门的一侧。" : ""}${wrongSupport ? "支援位没能把碎片稳住。" : ""}`.trim(),
    crewHint: input.truth.recommendedLeadCrewId && input.truth.recommendedSupportCrewId
      ? "诺瓦记录：换一组更贴近这段异常的船员组合，回响稳定度会更高。"
      : "诺瓦记录：这次更需要把擅长拆线索和稳回路的伙伴放到前面。",
    strategyHint: `如果保留当前船员，下一次更适合从“${input.truth.trueFocus}”切入，并尝试 ${input.truth.preferredRefinement}。`,
    statusNote: `主舰记录了一次误判尝试。沉默坐标没有关闭，只是暂时把门重新藏进了雾层。`
  };
}

export function generateChapterTwoEcho(crewRoster: CrewMember[], activeCrew: CrewMember | null): ChapterTwoEcho {
  const linkedCrew = activeCrew ?? crewRoster[0] ?? null;
  const seed = hashString(`${linkedCrew?.id ?? "echo"}:${crewRoster.length}`);
  const region = pickBySeed(chapterTwoRegions, seed, 1);
  const code = pickBySeed(chapterTwoNames, seed, 2);
  const linkedClue = linkedCrew
    ? `${linkedCrew.name} 的频谱签名被回应提前点亮`
    : "回应先亮起了一段陌生的船员频谱";

  return {
    title: `${region} · 沉默回应`,
    linkedCrewId: linkedCrew?.id ?? null,
    linkedClue,
    lines: [
      `......${code} 接收端重新上线......`,
      `识别到陪同频谱：${linkedCrew ? linkedCrew.name.slice(0, 1) : "?"} _ _ ......`,
      `若你们仍记得回路，就别把门外的光留在静默里......`
    ]
  };
}

export function runChapterTwoRoundOne(input: {
  echo: ChapterTwoEcho;
  truth: ChapterTwoTruth;
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  leadDuty: ChapterTwoDuty | null;
  supportDuty: ChapterTwoDuty | null;
  focus: ChapterTwoFocus;
  prompt: string;
  analysis: ChapterTwoSignalAnalysis;
}): ChapterTwoRoundOneResult {
  const seed = hashString(JSON.stringify(input));
  const promptAlignment = scorePromptAgainstTruth(input.prompt, input.truth);
  let score = 0;
  if (input.focus === input.truth.trueFocus) score += 3;
  else if (input.focus === input.truth.decoyFocus) score += 1;
  if (input.analysis.inferredFocus === input.truth.trueFocus) score += 1;
  score += promptAlignment;
  if (input.leadCrew.id === input.truth.recommendedLeadCrewId) score += 1;
  if (input.supportCrew.id === input.truth.recommendedSupportCrewId) score += 1;
  if (input.leadDuty === input.truth.recommendedLeadDuty) score += 1;
  if (input.supportDuty === input.truth.recommendedSupportDuty) score += 1;

  const progress: ChapterTwoRoundOneResult["progress"] = score >= 6 ? "strong" : score >= 3 ? "shaky" : "misread";
  const focusLead = {
    身份线索: "回应在反复确认谁在靠近，而不是单纯广播地点。",
    坐标结构: "坐标不是固定点，更像一段会偏移的门锁结构。",
    异常语气: "它不像求救，也不像警告，更像在试探接收者。"
  }[input.focus];
  const promptEcho = shortenText(input.prompt.replace(/\s+/g, " ").trim(), 20);
  const unlockedClue =
    progress === "strong"
      ? describeTrueFocus(input.truth.trueFocus)
      : progress === "shaky"
        ? `你们还没完全进门，但已经看见它真正靠近“${input.truth.trueFocus}”这一层。`
        : "这次恢复更像摸到了外层假门，不过主舰至少记住了它最容易误导人的那一面。";

  return {
    progress,
    summary:
      progress === "strong"
        ? `${input.leadCrew.name} 和 ${input.supportCrew.name} 把第一层回响拆得很稳。${input.analysis.pathSummary}`
        : progress === "shaky"
          ? `${input.leadCrew.name} 和 ${input.supportCrew.name} 抓到了一点方向，但回响还在边缘打滑。`
          : `${input.leadCrew.name} 和 ${input.supportCrew.name} 先碰到了外层误导回路，这一轮更多是在确认哪里不对。`,
    partialResponse: [
      `初步恢复：${focusLead}`,
      `船员分工回声：${input.leadCrew.name} ${dutyHint(input.leadCrew, input.leadDuty)}；${input.supportCrew.name} ${dutyHint(input.supportCrew, input.supportDuty)}。`,
      `系统理解：${input.analysis.crewFit}`,
      describePromptAlignment(input.prompt, input.truth),
      promptEcho ? `你补充的“${promptEcho}”让系统优先保留了更贴近这个方向的词序。` : "系统仍在等待更具体的补充，以继续缩小判断范围。",
      unlockedClue
    ],
    newQuestion: pickBySeed(chapterTwoQuestions, seed, 3),
    unlockedClue,
    keySignals: [
      `第一关注：${input.focus}`,
      `主分析员：${input.leadCrew.name}`,
      `支援位：${input.supportCrew.name}`,
      ...(promptEcho ? [`补充描述：${promptEcho}`] : [])
    ]
  };
}

export function runChapterTwoRoundTwo(input: {
  echo: ChapterTwoEcho;
  truth: ChapterTwoTruth;
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  focus: ChapterTwoFocus;
  roundOne: ChapterTwoRoundOneResult;
  refinement: ChapterTwoRefinement;
  supportMode: "维持原分工" | "让支援船员介入";
  prompt: string;
  analysis: ChapterTwoSignalAnalysis;
}): ChapterTwoRoundTwoResult {
  const seed = hashString(JSON.stringify(input));
  const promptEcho = shortenText(input.prompt.replace(/\s+/g, " ").trim(), 24);
  const interveningCrew = input.supportMode === "让支援船员介入" ? input.supportCrew : input.leadCrew;
  const promptAlignment = scorePromptAgainstTruth(input.prompt, input.truth);
  let score = input.roundOne.progress === "strong" ? 3 : input.roundOne.progress === "shaky" ? 1 : 0;
  if (input.focus === input.truth.trueFocus) score += 2;
  if (input.analysis.inferredFocus === input.truth.trueFocus) score += 1;
  score += promptAlignment;
  if (input.refinement === input.truth.preferredRefinement) score += 1;
  if (input.supportMode === input.truth.preferredSupportMode) score += 1;
  if (input.leadCrew.id === input.truth.recommendedLeadCrewId) score += 1;
  if (input.supportCrew.id === input.truth.recommendedSupportCrewId) score += 1;
  const outcomeType: ChapterTwoRoundTwoResult["outcomeType"] = score >= 7 ? "breakthrough" : score >= 4 ? "partial" : "soft-fail";

  const revealedLink = input.echo.linkedCrewId === input.leadCrew.id || input.echo.linkedCrewId === input.supportCrew.id
    ? `${interveningCrew.name} 的频谱被这段沉默坐标提前认出，说明这不是随机回应。`
    : `${interveningCrew.name} 介入后，回应仍坚持把线索指向一份缺失的旧编号。`;

  const resolvedResponse = [
    `第二轮恢复：发讯端来自 ${pickBySeed(chapterTwoRegions, seed, 1)} 下层的偏移门。`,
    `${revealedLink}`,
    input.refinement === "补发讯人细节"
      ? "补完后的讯息显示，对方像在寻找一组曾经离开这片区域的协作频谱。"
      : input.refinement === "切换主分析员"
        ? "分工调整后，系统抓到了原本被忽略的第二层词序，回应里藏着一扇可激活的门。"
        : "强化区域描述后，坐标不再像冷冰冰的数字，而更像一条会自行展开的航路。"
  ];

  const setback =
    outcomeType === "soft-fail"
      ? buildChapterTwoSetback({
          truth: input.truth,
          leadCrew: input.leadCrew,
          supportCrew: input.supportCrew,
          focus: input.focus,
          refinement: input.refinement,
          supportMode: input.supportMode
        })
      : null;

  return {
    outcomeType,
    summary:
      outcomeType === "breakthrough"
        ? `${interveningCrew.name} 的介入让第二轮判断真正对上了门锁。${input.analysis.pathSummary}`
        : outcomeType === "partial"
          ? `${interveningCrew.name} 的介入把结果推近了一截，但回应还留着一层雾。`
          : setback!.summary,
    resolvedResponse:
      outcomeType === "soft-fail"
        ? [
            "第二轮恢复在外层假门处突然断开。",
            describePromptAlignment(input.prompt, input.truth),
            "回应像是故意把你们引向了更好看的那条路，但真正的门没有被完全碰到。",
            setback!.learnedClue
          ]
        : resolvedResponse,
    revealedLink,
    recommendation:
      outcomeType === "soft-fail"
        ? setback!.strategyHint
        : input.truth.recommendedFinalChoice === "深入追踪"
          ? "继续追踪更可能直接碰到第二层入口，但也会更快暴露你们的位置。"
          : input.truth.recommendedFinalChoice === "记录后返航"
            ? "先记录再返航会更稳，因为这条线索已经开始碰到船员来历。"
            : "激活隐藏模块也许能换来一次主动回应，但你们得接受它会反过来观察主舰。",
    keySignals: [
      ...input.roundOne.keySignals.slice(0, 3),
      `第二轮修正：${input.refinement}`,
      `支援状态：${input.supportMode}`,
      ...(promptEcho ? [`追加描述：${promptEcho}`] : [])
    ],
    setback
  };
}

export function finalizeChapterTwo(input: {
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  finalChoice: ChapterTwoFinalChoice;
  roundTwo: ChapterTwoRoundTwoResult;
  responseAnalysis: ChapterTwoSignalAnalysis | null;
  assignmentAnalysis: ChapterTwoAssignmentAnalysis | null;
  roundOneAnalysis: ChapterTwoSignalAnalysis | null;
  roundTwoAnalysis: ChapterTwoSignalAnalysis | null;
}): ChapterTwoOutcome {
  const seed = hashString(JSON.stringify(input));
  const scannedZone = `${pickBySeed(chapterTwoRegions, seed, 2)} · 第一层雾井`;
  const partial = input.roundTwo.outcomeType === "partial";

  const titleMap: Record<ChapterTwoFinalChoice, string> = {
    深入追踪: "你们追进了沉默坐标的第一层回声门",
    记录后返航: "你们把未知区域安全写进了主舰",
    激活隐藏模块: "你们让沉默坐标主动亮了一次"
  };

  const summaryMap: Record<ChapterTwoFinalChoice, string> = {
    深入追踪: partial
      ? `${input.leadCrew.name} 和 ${input.supportCrew.name} 沿着第二轮恢复出的门锁结构推进，虽然没有完全看透，但还是扫描出了新区域的第一层轮廓。`
      : `${input.leadCrew.name} 和 ${input.supportCrew.name} 沿着第二轮恢复出的门锁结构推进，成功扫描出新区域的第一层轮廓。`,
    记录后返航: partial
      ? `${input.leadCrew.name} 和 ${input.supportCrew.name} 选择及时返航，把最关键的半段坐标和回应方式安全带回主舰。`
      : `${input.leadCrew.name} 和 ${input.supportCrew.name} 没有冒进，而是把最关键的坐标和回应方式完整带回主舰。`,
    激活隐藏模块: partial
      ? `${input.leadCrew.name} 与 ${input.supportCrew.name} 冒险触发了隐藏模块，虽然只点亮了一部分，但已经足够让区域主动回应。`
      : `${input.leadCrew.name} 与 ${input.supportCrew.name} 决定冒一次险，主动触发了回应里藏着的模块，让新区域短暂完全点亮。`
  };

  const worldChangeMap: Record<ChapterTwoFinalChoice, string> = {
    深入追踪: "雾带深井的第一层扫描图已写入星图，远航门深度提升。",
    记录后返航: "主舰档案舱新增沉默坐标协议，远航门获得稳定返航锚点。",
    激活隐藏模块: "新区域的隐藏模块被唤醒，主舰检测到第三段更深回应。"
  };

  return {
    title: titleMap[input.finalChoice],
    summary: summaryMap[input.finalChoice],
    worldChange: worldChangeMap[input.finalChoice],
    scannedZone,
    chapterThreeHook: pickBySeed(chapterTwoHooks, seed, 4),
    logSummary: [
      input.responseAnalysis?.sourceText ? `你先把它看作“${shortenText(input.responseAnalysis.sourceText, 18)}”` : "",
      input.assignmentAnalysis ? `${input.leadCrew.name} 与 ${input.supportCrew.name} 按 ${input.assignmentAnalysis.inferredLeadDuty} / ${input.assignmentAnalysis.inferredSupportDuty} 协作` : "",
      input.roundTwoAnalysis?.sourceText ? `最后系统按“${shortenText(input.roundTwoAnalysis.sourceText, 20)}”这条修正继续推进` : ""
    ]
      .filter(Boolean)
      .join("，"),
    leadDossierNote: input.assignmentAnalysis
      ? `${input.leadCrew.name} 在这次任务里更像会顺着你的表达去主导 ${input.assignmentAnalysis.inferredLeadDuty}，并把“${input.roundTwoAnalysis?.inferredFocus ?? input.responseAnalysis?.inferredFocus ?? "沉默坐标"}”这条线拉到前面。`
      : `${input.leadCrew.name} 在这次任务里承担了最前面的判断压力。`,
    supportDossierNote: input.assignmentAnalysis
      ? `${input.supportCrew.name} 没有只是陪同，Ta 在 ${input.assignmentAnalysis.inferredSupportDuty} 位上把零散碎片托住，让主分析结果没有散开。`
      : `${input.supportCrew.name} 在这次任务里提供了关键支援。`
  };
}
