import type {
  ChapterOneCompletionRequest,
  ChapterOneCompletionResult,
  ChapterTwoAssignmentRequest,
  ChapterTwoCompletionRequest,
  ChapterTwoCompletionResult,
  ChapterTwoResponseRequest,
  ChapterTwoRoundAnalysisRequest,
  CrewDialogueRequest,
  CrewDialogueResult,
  CrewAnalysisRequest,
  CrewGenerationRequest,
  CrewGenerationResult,
  GenerationProvider,
  PromptBundle,
  ShipTaskRunRequest,
  ShipTaskRunResult
} from "@/types/ai";
import type {
  ChapterTwoAssignmentAnalysis,
  ChapterTwoDuty,
  ChapterTwoFocus,
  ChapterTwoSignalAnalysis,
  CrewDossierEntry,
  CrewFormType,
  CrewRole,
  CrewTalent,
  CrewTemperament,
  RecruitSignalAnalysis,
  ShipLogEntry
} from "@/types/game";
import { getServerAIConfig } from "@/lib/ai/config";
import { mockGenerationProvider } from "@/lib/ai/mock-provider";
import {
  buildCrewDialogueCharacterSheet,
  buildCrewDialogueCurrentTask,
  buildCrewDialogueMemoryLayer,
  buildCrewDialogueSystemLayer
} from "@/lib/prompts/crew-dialogue";
import { providerPromptBindings } from "@/lib/prompts/provider-bindings";

type JsonRecord = Record<string, unknown>;

const crewFormTypes: CrewFormType[] = ["mechanical", "biological", "energy", "hybrid"];
const crewRoles: CrewRole[] = ["scout", "repair", "record", "pilot"];
const crewTemperaments: CrewTemperament[] = ["calm", "warm", "cunning", "steady"];
const crewTalents: CrewTalent[] = ["decode", "track", "mend", "invent"];
const chapterTwoFocuses: ChapterTwoFocus[] = ["身份线索", "坐标结构", "异常语气"];
const chapterTwoDuties: ChapterTwoDuty[] = ["前线解析", "后方稳定", "环境扫描", "记录还原"];

function ensureString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function hasChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text);
}

function ensureChineseString(value: unknown, fallback: string) {
  const candidate = ensureString(value, fallback);
  return hasChinese(candidate) ? candidate : fallback;
}

function ensureStringArray(value: unknown, fallback: string[] = [], max = 4) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return items.length > 0 ? [...new Set(items)].slice(0, max) : fallback;
}

function ensureChineseStringArray(value: unknown, fallback: string[] = [], max = 4) {
  const candidate = ensureStringArray(value, fallback, max);
  return candidate.some((item) => hasChinese(item)) ? candidate : fallback;
}

function ensureEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function ensureJsonObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function stripJsonFence(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function readMessageContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("\n");
  }

  return "";
}

async function requestModelText(bundle: PromptBundle): Promise<string> {
  const config = getServerAIConfig();

  if (!config.dashscope.apiKey) {
    throw new Error("阿里百炼文本 provider 未配置 DASHSCOPE_API_KEY。");
  }

  const response = await fetch(`${config.dashscope.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.dashscope.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.dashscope.model,
      temperature: 0.85,
      messages: [
        {
          role: "system",
          content: bundle.system
        },
        {
          role: "system",
          content: bundle.developer
        },
        {
          role: "user",
          content: bundle.user
        }
      ]
    }),
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error && typeof data.error === "object" && "message" in data.error
        ? String(data.error.message)
        : `阿里百炼文本接口返回 ${response.status}`;
    throw new Error(message);
  }

  return readMessageContent((data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content).trim();
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function requestModelTextFromMessages(messages: ChatMessage[], temperature = 0.8): Promise<string> {
  const config = getServerAIConfig();

  if (!config.dashscope.apiKey) {
    throw new Error("阿里百炼文本 provider 未配置 DASHSCOPE_API_KEY。");
  }

  const response = await fetch(`${config.dashscope.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.dashscope.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.dashscope.model,
      temperature,
      messages
    }),
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error && typeof data.error === "object" && "message" in data.error
        ? String(data.error.message)
        : `阿里百炼文本接口返回 ${response.status}`;
    throw new Error(message);
  }

  return readMessageContent((data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content).trim();
}

async function requestModelJson<T>(bundle: PromptBundle, schemaHint: string): Promise<T> {
  const config = getServerAIConfig();

  if (!config.dashscope.apiKey) {
    throw new Error("阿里百炼文本 provider 未配置 DASHSCOPE_API_KEY。");
  }

  const response = await fetch(`${config.dashscope.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.dashscope.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.dashscope.model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: bundle.system
        },
        {
          role: "system",
          content: [bundle.developer, "<json_only>只返回一个 JSON 对象，不要输出 Markdown、解释和额外前后缀。</json_only>", schemaHint].join("\n\n")
        },
        {
          role: "user",
          content: bundle.user
        }
      ]
    }),
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error && typeof data.error === "object" && "message" in data.error
        ? String(data.error.message)
        : `阿里百炼文本接口返回 ${response.status}`;
    throw new Error(message);
  }

  const content = readMessageContent((data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content);
  const parsed = JSON.parse(stripJsonFence(content));
  return parsed as T;
}

function normalizeCrewAnalysis(raw: unknown, fallback: RecruitSignalAnalysis): RecruitSignalAnalysis {
  const json = ensureJsonObject(raw);
  const keywords = ensureChineseStringArray(json.keywords, fallback.extractedKeywords, 5);
  const focuses = ensureChineseStringArray(json.suggestedFocuses, fallback.suggestedFocuses, 3);

  return {
    sourceText: fallback.sourceText,
    extractedKeywords: keywords,
    inferredFormType: ensureEnum(json.inferredFormType, crewFormTypes, fallback.inferredFormType),
    inferredRole: ensureEnum(json.inferredRole, crewRoles, fallback.inferredRole),
    inferredTemperament: ensureEnum(json.inferredTemperament, crewTemperaments, fallback.inferredTemperament),
    inferredTalent: ensureEnum(json.inferredTalent, crewTalents, fallback.inferredTalent),
    suggestedFocuses: focuses,
    roleSummary: ensureChineseString(json.roleSummary, fallback.roleSummary),
    styleSummary: ensureChineseString(json.styleSummary, fallback.styleSummary),
    summary: ensureChineseString(json.summary, fallback.summary)
  };
}

function normalizeShipLog(raw: unknown, fallback: ShipLogEntry): ShipLogEntry {
  const json = ensureJsonObject(raw);

  return {
    ...fallback,
    title: ensureChineseString(json.title, fallback.title),
    body: ensureChineseString(json.body, fallback.body),
    tag: ensureChineseString(json.tag, fallback.tag)
  };
}

function normalizeDossier(raw: unknown, fallback: CrewDossierEntry): CrewDossierEntry {
  const json = ensureJsonObject(raw);

  return {
    ...fallback,
    title: ensureChineseString(json.title, fallback.title),
    body: ensureChineseString(json.body, fallback.body),
    tag: ensureChineseString(json.tag, fallback.tag)
  };
}

function normalizeChapterTwoAnalysis(raw: unknown, fallback: ChapterTwoSignalAnalysis): ChapterTwoSignalAnalysis {
  const json = ensureJsonObject(raw);

  return {
    sourceText: fallback.sourceText,
    extractedKeywords: ensureChineseStringArray(json.keywords, fallback.extractedKeywords, 4),
    inferredFocus: ensureEnum(json.inferredFocus, chapterTwoFocuses, fallback.inferredFocus),
    pathSummary: ensureChineseString(json.pathSummary ?? json.refinedSummary, fallback.pathSummary),
    crewFit: ensureChineseString(json.crewFit, fallback.crewFit),
    riskHint: ensureChineseString(json.riskHint ?? json.remainingQuestion, fallback.riskHint)
  };
}

function normalizeChapterTwoAssignmentAnalysis(
  raw: unknown,
  fallback: ChapterTwoAssignmentAnalysis
): ChapterTwoAssignmentAnalysis {
  const json = ensureJsonObject(raw);
  const base = normalizeChapterTwoAnalysis(raw, fallback);

  return {
    ...base,
    inferredLeadDuty: ensureEnum(json.inferredLeadDuty, chapterTwoDuties, fallback.inferredLeadDuty),
    inferredSupportDuty: ensureEnum(json.inferredSupportDuty, chapterTwoDuties, fallback.inferredSupportDuty),
    collaborationSummary: ensureString(json.collaborationSummary, fallback.collaborationSummary)
  };
}

function normalizeDialogueReply(raw: string, fallback: string) {
  const trimmed = raw.trim().replace(/^["'“”]+|["'“”]+$/g, "");

  if (!trimmed) {
    return fallback;
  }

  const withoutPrefix = trimmed.replace(/^(启明|诺瓦|船员|伙伴)\s*[：:]\s*/u, "").trim();
  return hasChinese(withoutPrefix) ? withoutPrefix : fallback;
}

function isRephraseRequest(message: string) {
  const text = message.trim();
  return ["换种说法", "别这么说", "你怎么又这样说", "你能说点别的吗", "重说", "别这样讲"].some((item) =>
    text.includes(item)
  );
}

function extractRecentCrewOpenings(conversationLog: CrewDialogueRequest["crew"]["conversationLog"]) {
  return conversationLog
    .filter((message) => message.role === "crew")
    .slice(-3)
    .map((message) => message.body.trim().slice(0, 14))
    .filter(Boolean);
}

function normalizeForRepeatCheck(text: string) {
  return text.replace(/[：:，,。.!！？?、“”"'（）()\s]/g, "").trim();
}

function isRepeatedDialogue(candidate: string, recentCrewReplies: string[]) {
  const current = normalizeForRepeatCheck(candidate);
  if (!current) {
    return false;
  }

  return recentCrewReplies.some((reply) => {
    const past = normalizeForRepeatCheck(reply);
    if (!past) {
      return false;
    }

    if (current === past) {
      return true;
    }

    const sameOpening = candidate.trim().slice(0, 8) && candidate.trim().slice(0, 8) === reply.trim().slice(0, 8);
    const overlap = current.length > 8 && past.length > 8 && (current.includes(past.slice(0, 10)) || past.includes(current.slice(0, 10)));
    return sameOpening || overlap;
  });
}

function buildCrewDialogueBaseInput(request: CrewDialogueRequest) {
  const crew = request.crew;

  return {
    crewName: crew.name,
    crewTitle: crew.title,
    abilityTag: crew.abilityTag,
    temperament: crew.temperament,
    bondStatus: crew.bondStatus,
    speakingStyle: crew.backstory.speakingStyle,
    backstoryOrigin: crew.backstory.origin,
    backstoryReason: crew.backstory.reasonToJoin,
    backstoryQuestion: crew.backstory.hiddenQuestion,
    revealedKeys: crew.revealedBackstoryKeys,
    intentSummary: request.interpretedIntent?.focusSummary,
    responseGoal: request.interpretedIntent?.responseGoal
  };
}

function buildRecentDialogueMessages(request: CrewDialogueRequest): ChatMessage[] {
  return request.crew.conversationLog.slice(-6).flatMap<ChatMessage>((message) => {
    if (message.role === "player") {
      return [{ role: "user", content: message.body }];
    }

    if (message.role === "crew") {
      return [{ role: "assistant", content: message.body }];
    }

    return [];
  });
}

function buildCrewDialogueRewriteMessages(request: CrewDialogueRequest, previousReply: string): ChatMessage[] {
  const baseInput = buildCrewDialogueBaseInput(request);
  const recentOpenings = extractRecentCrewOpenings(request.crew.conversationLog);

  return [
    {
      role: "system",
      content: buildCrewDialogueSystemLayer()
    },
    {
      role: "system",
      content: buildCrewDialogueCharacterSheet(baseInput)
    },
    {
      role: "system",
      content: buildCrewDialogueMemoryLayer(baseInput)
    },
    {
      role: "system",
      content: [
        buildCrewDialogueCurrentTask({
          ...baseInput,
          rephraseRequested: true,
          avoidPhrases: [...recentOpenings, previousReply.slice(0, 14)].filter(Boolean)
        }),
        "上一版回答过于接近历史表达。请换一个新的开头、新的句式和新的组织方式，但仍保持同一角色。"
      ].join("\n\n")
    },
    ...buildRecentDialogueMessages(request),
    {
      role: "user",
      content: request.playerMessage
    }
  ];
}

function buildCrewChatMessages(request: CrewDialogueRequest): ChatMessage[] {
  const baseInput = buildCrewDialogueBaseInput(request);
  const recentOpenings = extractRecentCrewOpenings(request.crew.conversationLog);
  const rephraseRequested = request.interpretedIntent?.rephraseRequested ?? isRephraseRequest(request.playerMessage);

  return [
    {
      role: "system",
      content: buildCrewDialogueSystemLayer()
    },
    {
      role: "system",
      content: buildCrewDialogueCharacterSheet(baseInput)
    },
    {
      role: "system",
      content: buildCrewDialogueMemoryLayer(baseInput)
    },
    {
      role: "system",
      content: buildCrewDialogueCurrentTask({
        ...baseInput,
        rephraseRequested,
        avoidPhrases: recentOpenings
      })
    },
    ...buildRecentDialogueMessages(request),
    {
      role: "user",
      content: request.playerMessage
    }
  ];
}

const crewAnalysisSchemaHint = `返回 JSON：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "inferredFormType": "mechanical | biological | energy | hybrid",
  "inferredRole": "scout | repair | record | pilot",
  "inferredTemperament": "calm | warm | cunning | steady",
  "inferredTalent": "decode | track | mend | invent",
  "suggestedFocuses": ["短语1", "短语2"],
  "roleSummary": "一句职责判断",
  "styleSummary": "一句风格判断",
  "summary": "一句系统理解回执"
}`;

const crewGenerationSchemaHint = `返回 JSON：
{
  "name": "2-4字名字",
  "title": "身份标题",
  "intro": "1-3句自我介绍",
  "abilityTag": "一个能力标签",
  "summary": "一句系统为何这样理解的总结",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "suggestedFocuses": ["短语1", "短语2"]
}`;

const missionAnalysisSchemaHint = `返回 JSON：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "inferredFocus": "身份线索 | 坐标结构 | 异常语气",
  "pathSummary": "一句阶段分析",
  "crewFit": "一句船员适配说明",
  "riskHint": "一句风险提示"
}`;

const missionAssignmentSchemaHint = `返回 JSON：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "inferredFocus": "身份线索 | 坐标结构 | 异常语气",
  "inferredLeadDuty": "前线解析 | 后方稳定 | 环境扫描 | 记录还原",
  "inferredSupportDuty": "前线解析 | 后方稳定 | 环境扫描 | 记录还原",
  "collaborationSummary": "一句协作判断",
  "pathSummary": "一句推进路径",
  "crewFit": "一句分工适配说明",
  "riskHint": "一句风险提示"
}`;

const missionRefinementSchemaHint = `返回 JSON：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "inferredFocus": "身份线索 | 坐标结构 | 异常语气",
  "refinedSummary": "一句更接近真相的分析",
  "crewFit": "一句协作变化说明",
  "remainingQuestion": "一句仍未讲透的疑点"
}`;

const crewDialogueSchemaHint = `返回 JSON：
{
  "reply": "1-3句简体中文回复",
  "toneNote": "一句内部备注，可选"
}`;

const shortRecordSchemaHint = `返回 JSON：
{
  "title": "短标题",
  "body": "1-2句正文",
  "tag": "短标签"
}`;

export const dashscopeTextProvider: GenerationProvider = {
  mode: "real",
  providerId: "dashscope",
  prompts: providerPromptBindings,

  async analyzeCrew(request: CrewAnalysisRequest) {
    const fallback = await Promise.resolve(mockGenerationProvider.analyzeCrew(request));
    const bundle = providerPromptBindings.analyzeCrew(request);
    const raw = await requestModelJson(bundle, crewAnalysisSchemaHint);
    return normalizeCrewAnalysis(raw, fallback);
  },

  async generateCrew(request: CrewGenerationRequest): Promise<CrewGenerationResult> {
    const analysis = request.analysis ?? (await this.analyzeCrew({ form: request.form }));
    const base = await Promise.resolve(mockGenerationProvider.generateCrew({ ...request, analysis }));
    const bundle = providerPromptBindings.generateCrew({ ...request, analysis });
    const raw = ensureJsonObject(await requestModelJson(bundle, crewGenerationSchemaHint));

    return {
      analysis: {
        ...analysis,
        extractedKeywords: ensureChineseStringArray(raw.keywords, analysis.extractedKeywords, 5),
        suggestedFocuses: ensureChineseStringArray(raw.suggestedFocuses, analysis.suggestedFocuses, 3),
        summary: ensureChineseString(raw.summary, analysis.summary)
      },
      crew: {
        ...base.crew,
        name: ensureChineseString(raw.name, base.crew.name),
        title: ensureChineseString(raw.title, base.crew.title),
        intro: ensureChineseString(raw.intro, base.crew.intro),
        abilityTag: ensureChineseString(raw.abilityTag, base.crew.abilityTag),
        signalSummary: ensureChineseString(raw.summary, base.crew.signalSummary),
        signalKeywords: ensureChineseStringArray(raw.keywords, base.crew.signalKeywords, 5),
        suggestedFocuses: ensureChineseStringArray(raw.suggestedFocuses, base.crew.suggestedFocuses, 3)
      }
    };
  },

  async chatWithCrew(request: CrewDialogueRequest): Promise<CrewDialogueResult> {
    const fallback = await Promise.resolve(mockGenerationProvider.chatWithCrew(request));
    const recentCrewReplies = request.crew.conversationLog.filter((message) => message.role === "crew").slice(-3).map((message) => message.body);
    let raw = await requestModelTextFromMessages(buildCrewChatMessages(request), 0.75);
    let reply = normalizeDialogueReply(raw, fallback.reply);

    if (isRepeatedDialogue(reply, recentCrewReplies)) {
      raw = await requestModelTextFromMessages(buildCrewDialogueRewriteMessages(request, reply), 0.9);
      reply = normalizeDialogueReply(raw, reply);
    }

    return {
      ...fallback,
      reply
    };
  },

  prepareSignalSources(request) {
    return mockGenerationProvider.prepareSignalSources(request);
  },

  analyzeSignal(input) {
    return mockGenerationProvider.analyzeSignal(input);
  },

  repairSignal(request) {
    return mockGenerationProvider.repairSignal(request);
  },

  async runShipTask(request: ShipTaskRunRequest): Promise<ShipTaskRunResult> {
    const base = await Promise.resolve(mockGenerationProvider.runShipTask(request));
    const [shipLogRaw, dossierRaw] = await Promise.all([
      requestModelJson(providerPromptBindings.generateShipTaskLog(request, base), shortRecordSchemaHint),
      requestModelJson(providerPromptBindings.generateShipTaskDossier(request, base), shortRecordSchemaHint)
    ]);

    return {
      taskResult: {
        ...base.taskResult,
        dossierEntry: normalizeDossier(dossierRaw, base.taskResult.dossierEntry)
      },
      shipLog: normalizeShipLog(shipLogRaw, base.shipLog)
    };
  },

  generateChapterTwoEcho(input) {
    return mockGenerationProvider.generateChapterTwoEcho(input);
  },

  async analyzeChapterTwoResponse(request: ChapterTwoResponseRequest) {
    const fallback = await Promise.resolve(mockGenerationProvider.analyzeChapterTwoResponse(request));
    const raw = await requestModelJson(providerPromptBindings.analyzeChapterTwoResponse(request), missionAnalysisSchemaHint);
    return normalizeChapterTwoAnalysis(raw, fallback);
  },

  async analyzeChapterTwoAssignment(request: ChapterTwoAssignmentRequest) {
    const fallback = await Promise.resolve(mockGenerationProvider.analyzeChapterTwoAssignment(request));
    const raw = await requestModelJson(providerPromptBindings.analyzeChapterTwoAssignment(request), missionAssignmentSchemaHint);
    return normalizeChapterTwoAssignmentAnalysis(raw, fallback);
  },

  async analyzeChapterTwoRound(request: ChapterTwoRoundAnalysisRequest) {
    const fallback = await Promise.resolve(mockGenerationProvider.analyzeChapterTwoRound(request));
    const schemaHint = request.round === "two" ? missionRefinementSchemaHint : missionAnalysisSchemaHint;
    const raw = await requestModelJson(providerPromptBindings.analyzeChapterTwoRound(request), schemaHint);
    return normalizeChapterTwoAnalysis(raw, fallback);
  },

  runChapterTwoRoundOne(request) {
    return mockGenerationProvider.runChapterTwoRoundOne(request);
  },

  runChapterTwoRoundTwo(request) {
    return mockGenerationProvider.runChapterTwoRoundTwo(request);
  },

  async completeChapterOne(request: ChapterOneCompletionRequest): Promise<ChapterOneCompletionResult> {
    const base = await Promise.resolve(mockGenerationProvider.completeChapterOne(request));
    const [shipLogRaw, dossierRaw] = await Promise.all([
      requestModelJson(providerPromptBindings.generateChapterOneLog(request, base), shortRecordSchemaHint),
      requestModelJson(providerPromptBindings.generateChapterOneDossier(request, base), shortRecordSchemaHint)
    ]);

    return {
      ...base,
      shipLog: normalizeShipLog(shipLogRaw, base.shipLog),
      dossierEntry: normalizeDossier(dossierRaw, base.dossierEntry)
    };
  },

  async completeChapterTwo(request: ChapterTwoCompletionRequest): Promise<ChapterTwoCompletionResult> {
    const base = await Promise.resolve(mockGenerationProvider.completeChapterTwo(request));
    const [shipLogRaw, leadRaw, supportRaw] = await Promise.all([
      requestModelJson(providerPromptBindings.generateChapterTwoLog(request, base), shortRecordSchemaHint),
      requestModelJson(providerPromptBindings.generateChapterTwoLeadDossier(request, base), shortRecordSchemaHint),
      requestModelJson(providerPromptBindings.generateChapterTwoSupportDossier(request, base), shortRecordSchemaHint)
    ]);

    return {
      ...base,
      shipLog: normalizeShipLog(shipLogRaw, base.shipLog),
      leadDossierEntry: normalizeDossier(leadRaw, base.leadDossierEntry),
      supportDossierEntry: normalizeDossier(supportRaw, base.supportDossierEntry)
    };
  }
};
