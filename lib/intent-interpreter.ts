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

function inferImageStyleDirection(text: string) {
  if (includesAny(text, ["写实", "realistic", "半写实", "电影感", "cinematic"])) {
    return "半写实电影感角色设定图，结构真实，材质清楚，不做摄影棚写真，不做幼态大眼，不回退成低龄二次元";
  }

  if (includesAny(text, ["厚涂", "painterly", "油画", "概念设计"])) {
    return "厚涂概念插画风，笔触明确，体积和材质清楚，避免二次元卡牌感";
  }

  if (includesAny(text, ["动漫", "动画", "二次元", "赛璐璐"])) {
    return "克制的动画角色设定风，可以有动画感，但不要廉价手游立绘，不要幼态化";
  }

  return "高质量游戏角色设定插画，重视主体和服装设计，不默认二次元脸，不默认幼态风格";
}

function inferWardrobeDirection(text: string, crew: CrewMember) {
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
    return "若玩家未写明服装，就按轻便探索服或旅行服自然推断，不默认宇航服或机甲";
  }

  if (crew.role === "repair") {
    return "若玩家未写明服装，就按功能型工作服自然推断，不默认机械装甲外骨骼";
  }

  if (crew.role === "record") {
    return "若玩家未写明服装，就按档案官、学者或研究者常服自然推断，不默认科技战甲";
  }

  return "若玩家未写明服装，就按角色身份自然推断常服、旅行服或礼装，不默认宇航服、机甲或机械装甲";
}

function inferNegativeHints(text: string, visualSubject: string) {
  const hints = ["不要文字", "不要主体跑偏"];

  if (visualSubject.includes("人类")) {
    hints.push("不要猫耳", "不要兽耳", "不要尾巴", "不要兽尾", "不要角", "不要翅膀");
  }

  if (!includesAny(text, ["机甲", "装甲", "战甲", "宇航服", "外骨骼", "机械义体"])) {
    hints.push("不要默认机械装甲", "不要默认宇航服");
  }

  if (includesAny(text, ["写实", "realistic", "半写实", "电影感"])) {
    hints.push("不要低龄化", "不要大眼卡通脸", "不要重二次元");
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
    formType: analysis.inferredFormType,
    keywords: analysis.extractedKeywords,
    styleTags: [...form.styleTags, ...analysis.suggestedFocuses]
  });

  return {
    rawInput: [form.description.trim(), form.notes.trim()].filter(Boolean).join("｜"),
    extractedKeywords: analysis.extractedKeywords,
    confirmationTitle: `系统更像把这位伙伴理解成 ${labelMap.role[analysis.inferredRole]} · ${labelMap.talent[analysis.inferredTalent]}`,
    confirmationBody: `${analysis.summary} 当前主体将锁定为 ${visual.visualSubject}。`,
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
      styleDirection: inferImageStyleDirection(rawInput),
      wardrobeDirection: inferWardrobeDirection(rawInput, crew),
      roleAura: `${crew.title} · ${crew.abilityTag} · ${crew.bondStatus}`,
      echoVariance:
        request.mode === "refresh"
          ? "保持同一角色身份，仅允许服装、配色、配件和局部纹理发生平行宇宙差异"
          : "先稳定主轮廓，再补角色细节",
      negativeHints: inferNegativeHints(rawInput, overriddenVisual.visualSubject)
    }
  };
}

export function buildStructuredCrewGenerationRequest(request: CrewGenerationRequest): CrewGenerationRequest {
  return {
    ...request,
    interpretedIntent: request.interpretedIntent ?? interpretRecruitIntent(request.form).finalizedSpec
  };
}
