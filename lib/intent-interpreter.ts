import {
  analyzeChapterTwoAssignmentInput,
  analyzeChapterTwoResponseInput,
  analyzeChapterTwoRoundInput,
  analyzeRecruitSignal,
  inferCrewVisualProfile
} from "@/lib/mock-generators";
import { labelMap } from "@/lib/game-constants";
import type {
  ChapterTwoAssignmentRequest,
  ChapterTwoResponseRequest,
  ChapterTwoRoundAnalysisRequest,
  CrewGenerationRequest,
  CrewImageGenerationRequest
} from "@/types/ai";
import type { CrewMember, RecruitForm } from "@/types/game";
import type {
  CrewCreationSpec,
  CrewDialogueIntentKind,
  CrewDialogueIntentSpec,
  CrewImageIntentSpec,
  InterpretedIntent,
  MissionIntentSpec
} from "@/types/intent";

function extractKeywords(text: string) {
  return Array.from(
    new Set(
      text
        .split(/[，。！？、；\n\r\s]/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2 && item.length <= 8)
    )
  ).slice(0, 4);
}

function includesAny(text: string, words: readonly string[]) {
  return words.some((word) => text.includes(word));
}

function isPersonLikeSubject(subject: string) {
  return /人类|人形|女性|男性|少女|少年|精灵/.test(subject);
}

function isFemalePortraitIntent(text: string, visualSubject: string) {
  return /女性|少女|女孩|女生|女人|女战士|女巫|公主|魔法少女|美少女|御姐/.test(`${text} ${visualSubject}`);
}

function wantsEasternAesthetic(text: string, visualSubject: string) {
  return (
    isFemalePortraitIntent(text, visualSubject) ||
    includesAny(text, ["东方", "中式", "新中式", "国风", "古典", "古风", "清冷", "含蓄", "电影感", "现实系"])
  );
}

function inferImageStyleDirection(text: string, visualSubject?: string) {
  const personLike = visualSubject ? isPersonLikeSubject(visualSubject) : false;

  if (includesAny(text, ["写实", "realistic", "半写实", "电影感", "cinematic"])) {
    return personLike
      ? "强写实电影感人物角色设定图，优先做东方审美取向的高级人物形象：真实骨相、真实解剖、真实皮肤纹理、克制色彩、电影级光影、概念设计质感；禁止退回二次元卡面、儿童插画、低幼绘本风、Q版卡通、影楼写真或美颜海报风"
      : "强写实电影感角色设定图，结构真实，材质清楚，光影克制，概念美术质感明确；禁止退回儿童插画、低幼绘本风、Q版卡通、廉价二次元立绘或摄影棚写真";
  }

  if (includesAny(text, ["厚涂", "painterly", "油画", "概念设计"])) {
    return personLike
      ? "厚涂电影概念设定风人物肖像，笔触克制，体积与骨相明确，面部真实，不做儿童绘本、Q版、可爱贴纸风或低龄动漫卡面"
      : "厚涂概念插画风，笔触明确，体积和材质清楚，避免二次元卡牌感、儿童绘本感和低幼卡通感";
  }

  if (includesAny(text, ["动漫", "动画", "二次元", "赛璐璐"])) {
    return "克制的动画角色设定风，可以有动画感，但不要廉价手游立绘，不要幼态化";
  }

  if (personLike) {
    return "高级半写实人物角色设定图，偏电影概念美术和东方人物审美，结构真实、服装材质清楚、气质克制；不要回退成儿童插画、低幼动漫、可爱绘本、Q版卡通或廉价偶像立绘";
  }

  return "高质量游戏角色设定插画，重视主体和服装设计，不默认二次元脸，不默认幼态风格，不回退成儿童绘本或低幼卡通";
}

function inferHumanPortraitDirection(text: string, visualSubject: string) {
  const elegant =
    includesAny(text, ["东方", "中式", "新中式", "古典", "古风", "含蓄", "克制", "电影感"]) ||
    includesAny(visualSubject, ["女性", "少女", "精灵"]);

  if (includesAny(text, ["动漫", "动画", "二次元", "赛璐璐"])) {
    return "如果主体是人物，保留东方人物骨相和自然五官比例，眼睛有神但不过大，脸型舒展，眉眼清楚，鼻唇结构克制，避免低龄二次元偶像脸、夸张双眼皮、网红妆感、塑料皮和卡牌美少女模板";
  }

  if (includesAny(text, ["写实", "半写实", "电影感", "realistic", "cinematic"])) {
    return "如果主体是人物，优先做东方电影感人物角色：先保证气质与骨相，再处理五官；脸型自然舒展或偏鹅蛋/长椭圆，颧颌关系清楚但不过硬，眉眼清楚、眼裂自然、鼻梁和鼻头结构克制，唇形自然不过厚，保留真实皮肤纹理、轻微瑕疵和面部体积；不要磨皮塑料感，不要摄影棚写真，不要儿童感脸型，不要网红模板脸";
  }

  if (elegant) {
    return "如果主体是人物，优先做偏东方审美的高级角色形象：气质先于浓妆，脸部骨相清楚但不过硬，五官自然集中，眼神明确，头发与服装材质克制真实，避免网红脸、幼态脸、童颜化处理和廉价偶像立绘感";
  }

  return "如果主体是人物，优先保证人物脸部结构自然：脸型舒展，五官比例真实，眼睛不过大，鼻唇克制，皮肤有真实质感和体积，不做网红脸、幼态脸、磨皮脸、儿童插画脸或廉价卡牌立绘感";
}

function inferPortraitAestheticSystem(text: string, visualSubject: string) {
  if (!isPersonLikeSubject(visualSubject)) {
    return undefined;
  }

  if (wantsEasternAesthetic(text, visualSubject)) {
    return "审美体系：东方电影感女性角色 / 中式高级感人物设定 / 新中式现实系 editorial。低饱和、高留白、克制光影、真实人物气质优先；目标是有辨识度的角色脸，不是通用漂亮脸、网红脸或刻板亚洲默认脸。";
  }

  return "审美体系：现实系人物设定图，角色气质优先于漂亮模板，保留真实人物差异和辨识度；不要把人物处理成 AI 默认美女脸或偶像海报脸。";
}

function inferPortraitTemperamentFrame(crew: CrewMember, text: string, visualSubject: string) {
  if (!isPersonLikeSubject(visualSubject)) {
    return undefined;
  }

  const base = {
    calm: "冷静、清醒、克制，情绪不外放，眼神有判断力",
    warm: "温和但不甜腻，亲近感来自真实表情而不是可爱模板",
    cunning: "疏离、敏锐、略有锋芒，像在观察而不是摆拍",
    steady: "安静、稳定、有承受力，气质成熟但不成人化"
  }[crew.temperament];

  const roleTone = {
    scout: "带一点前线观察者的警觉，不做甜妹式亲和",
    repair: "带一点修复者的专注和手作感，不做精致摆拍",
    record: "带一点档案官的沉静和记忆感，不做偶像化微笑",
    pilot: "带一点领航者的方向感和决断力，不做柔弱模板"
  }[crew.role];

  const easternTone = wantsEasternAesthetic(text, visualSubject) ? "整体清冷克制、有东方电影里的含蓄张力，不甜腻、不卖萌、不偶像化。" : "整体真实、清楚、有角色判断力，不做模板化漂亮。";

  return `气质骨架：${base}；${roleTone}；${easternTone}`;
}

function inferPortraitFacialStructure(text: string, visualSubject: string) {
  if (!isPersonLikeSubject(visualSubject)) {
    return undefined;
  }

  if (wantsEasternAesthetic(text, visualSubject)) {
    return "面部结构层：保留面部留白感和自然比例，轮廓清楚但不过度削尖；骨相与肉相平衡，允许轻微不对称和真实细节；眼神清醒、安静、有距离感，眼睛不要过大；表情克制，嘴角自然不甜笑；可以有一两个辨识度特征，如略冷的眼神、自然颧颌关系、黑发层次、淡眉或素净唇色，但不要堆五官零件。";
  }

  return "面部结构层：脸部要有真实体积和辨识度，五官比例自然，允许轻微不完美和个人特征；避免过度对称、磨皮、模板美颜、夸张大眼和 V 型锥子脸。";
}

function inferPortraitWorldWardrobeSpec(text: string, crew: CrewMember, visualSubject: string) {
  if (!isPersonLikeSubject(visualSubject)) {
    return undefined;
  }

  const explicitWardrobe = inferWardrobeDirection(text, crew);
  const easternLayer = wantsEasternAesthetic(text, visualSubject)
    ? "世界观与服饰层：新中式科幻或东方未来感可作为默认底层，使用低饱和布料、哑光金属、细窄结构线、旧船档案感或旅人层次；不要做影楼古风写真、网红汉服写真或商品模特硬照。"
    : "世界观与服饰层：角色设定图优先，服饰服务身份和世界观，不做商品模特图、影楼写真或统一飞船制服。";

  return `${easternLayer} ${explicitWardrobe}`;
}

function buildPortraitNegativeConstraints(text: string, visualSubject: string) {
  if (!isPersonLikeSubject(visualSubject)) {
    return [];
  }

  const constraints = [
    "不要刻板亚洲模板脸",
    "不要 stereotypical Asian face",
    "不要 generic AI pretty face",
    "不要 AI 默认美女脸",
    "不要网红脸",
    "不要整容感",
    "不要 influencer face",
    "不要甜妹模板",
    "不要 sweet idol expression",
    "不要大眼微笑模板",
    "不要 doll-like skin",
    "不要过度磨皮",
    "不要发光塑料皮肤",
    "不要 sharp V-line chin",
    "不要锥子脸",
    "不要低质量古风写真感",
    "不要 cheap costume-drama portrait look",
    "不要廉价二次元人脸",
    "不要幼态少女漫画脸"
  ];

  if (wantsEasternAesthetic(text, visualSubject)) {
    constraints.push(
      "不要把东方审美简化成单眼皮刻板符号",
      "不要模板化韩式偶像妆",
      "不要统一黑长直网红脸",
      "不要千篇一律亚洲默认脸",
      "不要妆容盖过角色气质",
      "不要过白磨皮和玻璃皮"
    );
  }

  return Array.from(new Set(constraints));
}

function inferPortraitGenerationPlan(text: string, visualSubject: string) {
  if (!isPersonLikeSubject(visualSubject)) {
    return undefined;
  }

  return wantsEasternAesthetic(text, visualSubject)
    ? "两阶段内部策略：第一优先级先稳定脸与气质方向，确认骨相、眼神、发型和面部辨识度；第二优先级再补服装、世界观元素、半身/全身构图和背景。不要让服装与背景抢走脸部质量。"
    : "两阶段内部策略：先稳定主体脸部和气质，再补服装与背景；不要一次性让装饰压过角色本身。";
}

function inferWardrobeDirection(text: string, crew: CrewMember) {
  const clothingMatches = [
    "水手服",
    "魔法少女",
    "礼服",
    "长裙",
    "裙装",
    "校服",
    "制服",
    "铠甲",
    "盔甲",
    "战甲",
    "装甲",
    "法袍",
    "长袍",
    "斗篷",
    "披风",
    "风衣",
    "夹克",
    "裙子",
    "便服",
    "古装",
    "汉服",
    "和服",
    "运动服",
    "探险服"
  ].filter((item) => text.includes(item));

  if (clothingMatches.length > 0) {
    return `服装严格优先采用玩家写到的“${clothingMatches.slice(0, 3).join("、")}”方向，并按角色身份补细节；不要改成宇航服、机甲、机械装甲或统一飞船制服`;
  }

  if (includesAny(text, ["水手服"])) {
    return "服装优先理解成利落的水手风战斗服或仪式感制服，不要改成机甲或宇航服";
  }

  if (includesAny(text, ["魔法少女", "美少女战士", "变身少女"])) {
    return "服装按魔法少女战斗礼装理解，轻盈、有识别度、有变身感，但不要照搬现成 IP 造型";
  }

  if (includesAny(text, ["礼服", "长裙", "裙装"])) {
    return "服装优先按礼服或裙装方向理解，保持角色行动性，不要强行套机甲外壳";
  }

  if (includesAny(text, ["校服", "制服"])) {
    return "服装优先按玩家提到的制服方向理解，不要自动升级成科技舱制服";
  }

  if (includesAny(text, ["铠甲", "盔甲", "战甲", "装甲"])) {
    return "只有在玩家明确提到时才使用护甲或装甲，并保持与角色身份匹配";
  }

  if (includesAny(text, ["法袍", "长袍", "斗篷"])) {
    return "服装按法袍或长袍方向理解，保留布料层次和角色身份感";
  }

  if (crew.role === "scout") {
    return "若玩家未写明服装，就按轻便旅行服、户外常服或角色职业服自然推断；明确不要默认宇航服、太空服、飞船制服或机甲";
  }

  if (crew.role === "repair") {
    return "若玩家未写明服装，就按轻便工具服、围裙、工装或角色常服自然推断；明确不要默认机械装甲、外骨骼、宇航服";
  }

  if (crew.role === "record") {
    return "若玩家未写明服装，就按档案官、学者、旅行记录者或研究者常服自然推断；明确不要默认科技战甲、宇航服或飞船制服";
  }

  return "若玩家未写明服装，就按角色身份自然推断常服、旅行服、职业服或礼装；明确不要默认宇航服、太空服、机甲、机械装甲或统一飞船制服";
}

function inferNegativeHints(text: string, visualSubject: string) {
  const hints = ["不要文字", "不要主体跑偏"];

  if (isPersonLikeSubject(visualSubject)) {
    hints.push("不要猫耳", "不要兽耳", "不要尾巴", "不要兽尾", "不要角", "不要翅膀");
    hints.push(
      "不要网红脸",
      "不要低龄幼态脸",
      "不要儿童插画脸",
      "不要少儿绘本感",
      "不要Q版",
      "不要chibi",
      "不要可爱贴纸风",
      "不要蜡笔儿童画",
      "不要稚嫩卡通脸",
      "不要塑料磨皮皮肤",
      "不要夸张大眼",
      "不要夸张双眼皮",
      "不要韩式偶像妆感",
      "不要欧美浓颜模板脸",
      "不要扁平宽脸无骨相",
      "不要锥子脸",
      "不要影楼写真感"
    );
    hints.push(...buildPortraitNegativeConstraints(text, visualSubject));
  }

  if (!includesAny(text, ["机甲", "装甲", "战甲", "宇航服", "外骨骼", "机械义体"])) {
    hints.push("不要默认机械装甲", "不要默认宇航服");
  }

  if (includesAny(text, ["写实", "realistic", "半写实", "电影感"])) {
    hints.push("不要低龄化", "不要大眼卡通脸", "不要重二次元", "不要儿童绘本", "不要少儿美术课风格", "不要平涂卡通");
  }

  return Array.from(new Set(hints));
}

function detectDialogueKind(message: string): CrewDialogueIntentKind {
  const text = message.trim();

  if (["换种说法", "别这么说", "你怎么又这样说", "换个说法", "别这样讲", "说点别的"].some((item) => text.includes(item))) {
    return "rephrase";
  }

  if (["以前", "过去", "来历", "为什么来到", "为什么来", "从哪来", "隐瞒", "之前", "为什么会上船", "过去发生了什么"].some((item) => text.includes(item))) {
    return "background";
  }

  if (["你会什么", "擅长什么", "能做什么", "会做什么", "有什么本事"].some((item) => text.includes(item))) {
    return "capability";
  }

  if (["难过", "害怕", "紧张", "担心", "怕", "慌", "不安"].some((item) => text.includes(item))) {
    return "emotion";
  }

  if (["怎么做", "下一步", "先做什么", "怎么办", "信号", "坐标", "航路", "任务", "判断", "该不该"].some((item) => text.includes(item))) {
    return "task";
  }

  if (["你好", "在吗", "嗨", "早", "晚上好"].some((item) => text.includes(item))) {
    return "greeting";
  }

  return "casual";
}

function buildDialogueGoal(kind: CrewDialogueIntentKind) {
  switch (kind) {
    case "greeting":
      return "先自然接住这句招呼，再给一句带角色感的短回应。";
    case "capability":
      return "直接回答自己擅长什么，不要绕回背景。";
    case "task":
      return "先给当前任务相关的判断或提醒，不要空安慰。";
    case "background":
      return "如果触及稳定背景，只透露一小块，不要讲完。";
    case "emotion":
      return "先接住情绪，再给一句具体提醒或陪伴式判断。";
    case "rephrase":
      return "明显换一种表达，不要沿用上一轮骨架。";
    default:
      return "围绕这句自然接话，不要抢着讲设定。";
  }
}

export function interpretRecruitIntent(form: RecruitForm): InterpretedIntent<CrewCreationSpec> {
  const analysis = analyzeRecruitSignal(form);
  const visual = inferCrewVisualProfile({
    description: form.description || form.notes || form.customPrompt,
    formType: form.formType ?? analysis.inferredFormType,
    keywords: analysis.extractedKeywords,
    styleTags: [...form.styleTags, ...analysis.suggestedFocuses]
  });
  const selectedSummary = [
    labelMap.formType[analysis.inferredFormType],
    labelMap.role[analysis.inferredRole],
    labelMap.temperament[analysis.inferredTemperament],
    labelMap.talent[analysis.inferredTalent]
  ].join(" · ");

  return {
    rawInput: [form.description.trim(), form.notes.trim()].filter(Boolean).join("｜"),
    extractedKeywords: analysis.extractedKeywords,
    confirmationTitle: `主舰已按你的选择收拢这位伙伴：${selectedSummary}`,
    confirmationBody: `${analysis.summary} 当前主体会按“${visual.visualSubject}”继续收拢，但最终轮廓优先服从你亲手选定的形态、职责、气质和专长。`,
    adjustmentHints: analysis.suggestedFocuses,
    finalizedSpec: {
      formType: analysis.inferredFormType,
      role: analysis.inferredRole,
      temperament: analysis.inferredTemperament,
      talent: analysis.inferredTalent,
      suggestedFocuses: analysis.suggestedFocuses,
      visualSubject: visual.visualSubject,
      visualGuardrails: visual.visualGuardrails,
      styleKeywords: [...analysis.extractedKeywords, ...analysis.suggestedFocuses].slice(0, 5)
    }
  };
}

export function interpretChapterTwoResponseIntent(
  request: ChapterTwoResponseRequest
): InterpretedIntent<MissionIntentSpec> {
  const analysis = analyzeChapterTwoResponseInput(request);

  return {
    rawInput: request.prompt,
    extractedKeywords: analysis.extractedKeywords,
    confirmationTitle: `系统先把这轮判断压到了“${analysis.inferredFocus}”`,
    confirmationBody: `${analysis.pathSummary} ${analysis.crewFit}`,
    adjustmentHints: [analysis.inferredFocus, "换个调查重点", "先让更合适的船员介入"],
    finalizedSpec: {
      focus: analysis.inferredFocus,
      riskDirection: analysis.riskHint,
      crewApproach: analysis.crewFit,
      reasoningPath: analysis.pathSummary
    }
  };
}

export function interpretChapterTwoAssignmentIntent(
  request: ChapterTwoAssignmentRequest
): InterpretedIntent<MissionIntentSpec> {
  const analysis = analyzeChapterTwoAssignmentInput(request);

  return {
    rawInput: request.prompt,
    extractedKeywords: analysis.extractedKeywords,
    confirmationTitle: "系统已拆开这次协作排布",
    confirmationBody: `${analysis.collaborationSummary} ${analysis.pathSummary}`,
    adjustmentHints: [analysis.inferredLeadDuty, analysis.inferredSupportDuty, analysis.inferredFocus],
    finalizedSpec: {
      focus: analysis.inferredFocus,
      riskDirection: analysis.riskHint,
      crewApproach: analysis.crewFit,
      reasoningPath: analysis.collaborationSummary,
      preferredLeadDuty: analysis.inferredLeadDuty,
      preferredSupportDuty: analysis.inferredSupportDuty
    }
  };
}

export function interpretChapterTwoRoundIntent(
  request: ChapterTwoRoundAnalysisRequest
): InterpretedIntent<MissionIntentSpec> {
  const analysis = analyzeChapterTwoRoundInput(request);

  return {
    rawInput: request.prompt,
    extractedKeywords: analysis.extractedKeywords,
    confirmationTitle: `这一轮系统更偏向保留“${analysis.inferredFocus}”`,
    confirmationBody: `${analysis.pathSummary} ${analysis.crewFit}`,
    adjustmentHints: [analysis.inferredFocus, "补发讯人细节", "让支援船员介入"],
    finalizedSpec: {
      focus: analysis.inferredFocus,
      riskDirection: analysis.riskHint,
      crewApproach: analysis.crewFit,
      reasoningPath: analysis.pathSummary
    }
  };
}

export function interpretCrewDialogueIntent(input: {
  crew: CrewMember;
  playerMessage: string;
}): InterpretedIntent<CrewDialogueIntentSpec> {
  const kind = detectDialogueKind(input.playerMessage);
  const extracted = extractKeywords(input.playerMessage);

  return {
    rawInput: input.playerMessage,
    extractedKeywords: extracted,
    confirmationTitle: `频道已识别：${kind === "background" ? "深层追问" : kind === "task" ? "任务讨论" : kind === "capability" ? "能力确认" : kind === "rephrase" ? "要求换说法" : kind === "emotion" ? "情绪回应" : kind === "greeting" ? "轻量问候" : "普通闲聊"}`,
    confirmationBody:
      kind === "background"
        ? "这句话可能会碰到更深层的协作记忆，系统会先收住，不会一次把背景全翻出来。"
        : kind === "task"
          ? "这句会优先被当作任务讨论处理，角色会先回应眼前判断。"
          : kind === "rephrase"
            ? "这句会要求角色立刻换一种表达，不再沿用上一轮说法。"
            : "这句会先按当前问题回应，不会抢着讲背景。",
    adjustmentHints: extracted.length > 0 ? extracted : ["直接一点", "更像任务讨论", "别往背景里带"],
    finalizedSpec: {
      kind,
      focusSummary: extracted.join("、") || "当前问题本身",
      responseGoal: buildDialogueGoal(kind),
      shouldRevealBackground: kind === "background",
      rephraseRequested: kind === "rephrase",
      avoidOpenings: input.crew.conversationLog
        .filter((item) => item.role === "crew")
        .slice(-3)
        .map((item) => item.body.trim().slice(0, 14))
        .filter(Boolean)
    }
  };
}

export function interpretCrewImageIntent(
  request: CrewImageGenerationRequest
): InterpretedIntent<CrewImageIntentSpec> {
  const crew = request.crew;
  const rawInput = [crew.imagePromptHint, crew.recruitSignal, crew.customPrompt, crew.notes].filter(Boolean).join("｜");
  const styleKeywords = [...crew.signalKeywords, ...crew.styleTags].filter(Boolean).slice(0, 5);
  const overriddenVisual = inferCrewVisualProfile({
    description: rawInput || crew.visualSubject,
    formType: crew.formType,
    keywords: styleKeywords,
    styleTags: [crew.abilityTag, crew.title]
  });
  const portraitNegativeConstraints = buildPortraitNegativeConstraints(rawInput, overriddenVisual.visualSubject);

  return {
    rawInput,
    extractedKeywords: styleKeywords,
    confirmationTitle: `当前形象主体将锁定为 ${overriddenVisual.visualSubject}`,
    confirmationBody: `${crew.name} 会保持同一身份与职责，但会优先服从你刚输入的主体、服装和画风要求。`,
    adjustmentHints: [...styleKeywords, crew.abilityTag].slice(0, 4),
    finalizedSpec: {
      visualSubject: overriddenVisual.visualSubject,
      visualGuardrails: overriddenVisual.visualGuardrails,
      styleKeywords,
      styleDirection: inferImageStyleDirection(rawInput, overriddenVisual.visualSubject),
      wardrobeDirection: inferWardrobeDirection(rawInput, crew),
      portraitDirection: isPersonLikeSubject(overriddenVisual.visualSubject)
        ? inferHumanPortraitDirection(rawInput, overriddenVisual.visualSubject)
        : undefined,
      portraitAestheticSystem: inferPortraitAestheticSystem(rawInput, overriddenVisual.visualSubject),
      portraitTemperamentFrame: inferPortraitTemperamentFrame(crew, rawInput, overriddenVisual.visualSubject),
      portraitFacialStructure: inferPortraitFacialStructure(rawInput, overriddenVisual.visualSubject),
      portraitWorldWardrobeSpec: inferPortraitWorldWardrobeSpec(rawInput, crew, overriddenVisual.visualSubject),
      portraitNegativeConstraints,
      portraitGenerationPlan: inferPortraitGenerationPlan(rawInput, overriddenVisual.visualSubject),
      roleAura: `${crew.title} · ${crew.abilityTag} · ${crew.bondStatus}`,
      echoVariance:
        request.mode === "refresh"
          ? "保持同一角色身份，仅允许服装、配色、配件和局部纹理发生平行宇宙差异"
          : "先稳定主轮廓，再补角色细节",
      negativeHints: Array.from(new Set([...inferNegativeHints(rawInput, overriddenVisual.visualSubject), ...portraitNegativeConstraints]))
    }
  };
}

export function buildStructuredCrewGenerationRequest(request: CrewGenerationRequest): CrewGenerationRequest {
  return {
    ...request,
    interpretedIntent: request.interpretedIntent ?? interpretRecruitIntent(request.form).finalizedSpec
  };
}
