import type {
  ChapterTwoAssignmentAnalysis,
  ChapterTwoEcho,
  ChapterTwoOutcome,
  ChapterTwoRoundOneResult,
  ChapterTwoRoundTwoResult,
  ChapterTwoSignalAnalysis,
  ChapterTwoTruth,
  CrewBackstoryRevealKey,
  CrewChatMessage,
  CrewPortraitAsset,
  CrewDossierEntry,
  CrewMember,
  RecruitForm,
  RecruitSignalAnalysis,
  RepairedSignal,
  ShipLogEntry,
  ShipTask,
  SignalSource,
  TaskResult
} from "@/types/game";
import type { CrewCreationSpec, CrewDialogueIntentSpec, CrewImageIntentSpec, MissionIntentSpec } from "@/types/intent";

export type AIProviderMode = "mock" | "real";
export type AITextProviderId = "mock" | "dashscope";
export type AIImageProviderId = "mock" | "dashscope";

export type AIOperationId =
  | "crew-analyze"
  | "crew-generate"
  | "crew-chat"
  | "crew-image"
  | "signal-analyze"
  | "signal-repair"
  | "task-run"
  | "chapter-one-complete"
  | "chapter-two-response"
  | "chapter-two-assignment"
  | "chapter-two-round-one"
  | "chapter-two-round-two"
  | "chapter-two-complete";

export interface AIOperationState {
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  canRetry: boolean;
  usedFallback: boolean;
  updatedAt: number | null;
}

export interface CrewAnalysisRequest {
  form: RecruitForm;
}

export interface CrewGenerationRequest {
  form: RecruitForm;
  variant?: number;
  analysis?: RecruitSignalAnalysis | null;
  interpretedIntent?: CrewCreationSpec;
}

export interface CrewGenerationResult {
  analysis: RecruitSignalAnalysis;
  crew: CrewMember;
}

export interface CrewImageGenerationRequest {
  crew: CrewMember;
  variant?: number;
  mode?: "initial" | "refresh";
  interpretedIntent?: CrewImageIntentSpec;
}

export interface CrewImageGenerationResult {
  asset: CrewPortraitAsset;
}

export interface CrewDialogueRequest {
  crew: CrewMember;
  playerMessage: string;
  interpretedIntent?: CrewDialogueIntentSpec;
}

export interface CrewDialogueResult {
  reply: string;
  touchedBackstory: boolean;
  revealedKey: CrewBackstoryRevealKey | null;
  revealedFact: string | null;
  trustGain: number;
  bondNote: string | null;
  dossierEntry: CrewDossierEntry | null;
  shipLog: ShipLogEntry | null;
  messages: CrewChatMessage[];
}

export interface SignalMissionPreparationRequest {
  crew: CrewMember;
}

export interface SignalMissionRepairRequest {
  crew: CrewMember;
  source: SignalSource;
  nature: "distress" | "warning" | "coordinates";
  missingInfo: "location" | "sender" | "final-clue";
}

export interface ShipTaskRunRequest {
  task: ShipTask;
  crew: CrewMember;
}

export interface ShipTaskRunResult {
  taskResult: TaskResult;
  shipLog: ShipLogEntry;
}

export interface ChapterTwoResponseRequest {
  echo: ChapterTwoEcho;
  prompt: string;
  crewRoster: CrewMember[];
  interpretedIntent?: MissionIntentSpec;
}

export interface ChapterTwoAssignmentRequest {
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  prompt: string;
  interpretedIntent?: MissionIntentSpec;
}

export interface ChapterTwoRoundAnalysisRequest {
  prompt: string;
  fallbackFocus: "身份线索" | "坐标结构" | "异常语气";
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  round: "one" | "two";
  supportMode?: "维持原分工" | "让支援船员介入" | null;
  interpretedIntent?: MissionIntentSpec;
}

export interface ChapterTwoRoundOneExecutionRequest {
  echo: ChapterTwoEcho;
  truth: ChapterTwoTruth;
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  leadDuty: "前线解析" | "后方稳定" | "环境扫描" | "记录还原" | null;
  supportDuty: "前线解析" | "后方稳定" | "环境扫描" | "记录还原" | null;
  focus: "身份线索" | "坐标结构" | "异常语气";
  prompt: string;
  analysis: ChapterTwoSignalAnalysis;
}

export interface ChapterTwoRoundTwoExecutionRequest {
  echo: ChapterTwoEcho;
  truth: ChapterTwoTruth;
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  focus: "身份线索" | "坐标结构" | "异常语气";
  roundOne: ChapterTwoRoundOneResult;
  refinement: "补发讯人细节" | "切换主分析员" | "强化区域描述";
  supportMode: "维持原分工" | "让支援船员介入";
  prompt: string;
  analysis: ChapterTwoSignalAnalysis;
}

export interface ChapterOneCompletionRequest {
  crew: CrewMember;
}

export interface ChapterOneCompletionResult {
  dossierEntry: CrewDossierEntry;
  shipLog: ShipLogEntry;
  statusNote: string;
}

export interface ChapterTwoCompletionRequest {
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  finalChoice: "深入追踪" | "记录后返航" | "激活隐藏模块";
  roundTwo: ChapterTwoRoundTwoResult;
  responseAnalysis: ChapterTwoSignalAnalysis | null;
  assignmentAnalysis: ChapterTwoAssignmentAnalysis | null;
  roundOneAnalysis: ChapterTwoSignalAnalysis | null;
  roundTwoAnalysis: ChapterTwoSignalAnalysis | null;
}

export interface ChapterTwoCompletionResult {
  outcome: ChapterTwoOutcome;
  shipLog: ShipLogEntry;
  leadDossierEntry: CrewDossierEntry;
  supportDossierEntry: CrewDossierEntry;
}

export interface PromptBundle {
  blueprintId: string;
  label: string;
  system: string;
  developer: string;
  user: string;
  negative?: string;
}

export interface ProviderPromptBindings {
  worldRules: PromptBundle;
  analyzeCrew(request: CrewAnalysisRequest): PromptBundle;
  generateCrew(request: CrewGenerationRequest): PromptBundle;
  chatWithCrew(request: CrewDialogueRequest): PromptBundle;
  generateCrewImage(request: CrewImageGenerationRequest): PromptBundle;
  analyzeChapterTwoResponse(request: ChapterTwoResponseRequest): PromptBundle;
  analyzeChapterTwoAssignment(request: ChapterTwoAssignmentRequest): PromptBundle;
  analyzeChapterTwoRound(request: ChapterTwoRoundAnalysisRequest): PromptBundle;
  generateShipTaskLog(request: ShipTaskRunRequest, result?: ShipTaskRunResult | null): PromptBundle;
  generateShipTaskDossier(request: ShipTaskRunRequest, result?: ShipTaskRunResult | null): PromptBundle;
  generateChapterOneLog(request: ChapterOneCompletionRequest, result?: ChapterOneCompletionResult | null): PromptBundle;
  generateChapterOneDossier(request: ChapterOneCompletionRequest, result?: ChapterOneCompletionResult | null): PromptBundle;
  generateChapterTwoLog(request: ChapterTwoCompletionRequest, result?: ChapterTwoCompletionResult | null): PromptBundle;
  generateChapterTwoLeadDossier(request: ChapterTwoCompletionRequest, result?: ChapterTwoCompletionResult | null): PromptBundle;
  generateChapterTwoSupportDossier(request: ChapterTwoCompletionRequest, result?: ChapterTwoCompletionResult | null): PromptBundle;
}

export type AIServiceOperation =
  | "analyzeCrew"
  | "generateCrew"
  | "chatWithCrew"
  | "prepareSignalSources"
  | "analyzeSignal"
  | "repairSignal"
  | "runShipTask"
  | "generateChapterTwoEcho"
  | "analyzeChapterTwoResponse"
  | "analyzeChapterTwoAssignment"
  | "analyzeChapterTwoRound"
  | "runChapterTwoRoundOne"
  | "runChapterTwoRoundTwo"
  | "completeChapterOne"
  | "completeChapterTwo";

export interface AIServicePayloadMap {
  analyzeCrew: CrewAnalysisRequest;
  generateCrew: CrewGenerationRequest;
  chatWithCrew: CrewDialogueRequest;
  prepareSignalSources: SignalMissionPreparationRequest;
  analyzeSignal: { crew: CrewMember; source: SignalSource };
  repairSignal: SignalMissionRepairRequest;
  runShipTask: ShipTaskRunRequest;
  generateChapterTwoEcho: { crewRoster: CrewMember[]; activeCrew: CrewMember | null };
  analyzeChapterTwoResponse: ChapterTwoResponseRequest;
  analyzeChapterTwoAssignment: ChapterTwoAssignmentRequest;
  analyzeChapterTwoRound: ChapterTwoRoundAnalysisRequest;
  runChapterTwoRoundOne: ChapterTwoRoundOneExecutionRequest;
  runChapterTwoRoundTwo: ChapterTwoRoundTwoExecutionRequest;
  completeChapterOne: ChapterOneCompletionRequest;
  completeChapterTwo: ChapterTwoCompletionRequest;
}

export interface AIServiceResultMap {
  analyzeCrew: RecruitSignalAnalysis;
  generateCrew: CrewGenerationResult;
  chatWithCrew: CrewDialogueResult;
  prepareSignalSources: SignalSource[];
  analyzeSignal: string[];
  repairSignal: RepairedSignal;
  runShipTask: ShipTaskRunResult;
  generateChapterTwoEcho: ChapterTwoEcho;
  analyzeChapterTwoResponse: ChapterTwoSignalAnalysis;
  analyzeChapterTwoAssignment: ChapterTwoAssignmentAnalysis;
  analyzeChapterTwoRound: ChapterTwoSignalAnalysis;
  runChapterTwoRoundOne: ChapterTwoRoundOneResult;
  runChapterTwoRoundTwo: ChapterTwoRoundTwoResult;
  completeChapterOne: ChapterOneCompletionResult;
  completeChapterTwo: ChapterTwoCompletionResult;
}

export interface AIServiceRequest<TOperation extends AIServiceOperation = AIServiceOperation> {
  operation: TOperation;
  payload: AIServicePayloadMap[TOperation];
}

export interface AIServiceSuccess<TOperation extends AIServiceOperation = AIServiceOperation> {
  ok: true;
  operation: TOperation;
  providerMode: AIProviderMode;
  providerId: AITextProviderId;
  data: AIServiceResultMap[TOperation];
}

export interface AIServiceError<TOperation extends AIServiceOperation = AIServiceOperation> {
  ok: false;
  operation: TOperation;
  providerMode: AIProviderMode;
  providerId: AITextProviderId;
  error: string;
}

export interface GenerationProvider {
  mode: AIProviderMode;
  providerId: AITextProviderId;
  prompts?: ProviderPromptBindings;
  analyzeCrew(request: CrewAnalysisRequest): Promise<RecruitSignalAnalysis> | RecruitSignalAnalysis;
  generateCrew(request: CrewGenerationRequest): Promise<CrewGenerationResult> | CrewGenerationResult;
  chatWithCrew(request: CrewDialogueRequest): Promise<CrewDialogueResult> | CrewDialogueResult;
  prepareSignalSources(request: SignalMissionPreparationRequest): Promise<SignalSource[]> | SignalSource[];
  analyzeSignal(input: { crew: CrewMember; source: SignalSource }): Promise<string[]> | string[];
  repairSignal(request: SignalMissionRepairRequest): Promise<RepairedSignal> | RepairedSignal;
  runShipTask(request: ShipTaskRunRequest): Promise<ShipTaskRunResult> | ShipTaskRunResult;
  generateChapterTwoEcho(input: { crewRoster: CrewMember[]; activeCrew: CrewMember | null }): Promise<ChapterTwoEcho> | ChapterTwoEcho;
  analyzeChapterTwoResponse(request: ChapterTwoResponseRequest): Promise<ChapterTwoSignalAnalysis> | ChapterTwoSignalAnalysis;
  analyzeChapterTwoAssignment(request: ChapterTwoAssignmentRequest): Promise<ChapterTwoAssignmentAnalysis> | ChapterTwoAssignmentAnalysis;
  analyzeChapterTwoRound(request: ChapterTwoRoundAnalysisRequest): Promise<ChapterTwoSignalAnalysis> | ChapterTwoSignalAnalysis;
  runChapterTwoRoundOne(request: ChapterTwoRoundOneExecutionRequest): Promise<ChapterTwoRoundOneResult> | ChapterTwoRoundOneResult;
  runChapterTwoRoundTwo(request: ChapterTwoRoundTwoExecutionRequest): Promise<ChapterTwoRoundTwoResult> | ChapterTwoRoundTwoResult;
  completeChapterOne(request: ChapterOneCompletionRequest): Promise<ChapterOneCompletionResult> | ChapterOneCompletionResult;
  completeChapterTwo(request: ChapterTwoCompletionRequest): Promise<ChapterTwoCompletionResult> | ChapterTwoCompletionResult;
}

export interface ImageGenerationProvider {
  mode: AIProviderMode;
  providerId: AIImageProviderId;
  prompts?: Pick<ProviderPromptBindings, "worldRules" | "generateCrewImage">;
  generateCrewImage(request: CrewImageGenerationRequest): Promise<CrewImageGenerationResult> | CrewImageGenerationResult;
}
