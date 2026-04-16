import type {
  ChapterOneCompletionRequest,
  ChapterOneCompletionResult,
  ChapterTwoCompletionRequest,
  ChapterTwoCompletionResult,
  ChapterTwoRoundAnalysisRequest,
  ChapterTwoRoundOneExecutionRequest,
  ChapterTwoRoundTwoExecutionRequest,
  CrewAnalysisRequest,
  CrewDialogueRequest,
  CrewDialogueResult,
  CrewGenerationRequest,
  CrewGenerationResult,
  GenerationProvider,
  ShipTaskRunRequest,
  ShipTaskRunResult,
  SignalMissionPreparationRequest,
  SignalMissionRepairRequest
} from "@/types/ai";
import { providerPromptBindings } from "@/lib/prompts/provider-bindings";
import type { CrewDossierEntry, ShipLogEntry } from "@/types/game";
import {
  analyzeChapterTwoAssignmentInput,
  analyzeChapterTwoResponseInput,
    analyzeChapterTwoRoundInput,
    analyzeRecruitSignal,
    analyzeSignalSource,
    finalizeChapterTwo,
    generateChapterTwoEcho,
    respondCrewConversation,
    generateCrew,
  generateSignalSources,
  repairSignal,
  runChapterTwoRoundOne,
  runChapterTwoRoundTwo,
  runShipTask
} from "@/lib/mock-generators";

function createShipLogEntry(input: {
  title: string;
  body: string;
  tag: string;
}): ShipLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    tag: input.tag
  };
}

function createDossierEntry(input: {
  title: string;
  body: string;
  tag: string;
}): CrewDossierEntry {
  return {
    id: `dossier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    tag: input.tag
  };
}

export const mockGenerationProvider: GenerationProvider = {
  mode: "mock",
  providerId: "mock",
  prompts: providerPromptBindings,

  analyzeCrew(request: CrewAnalysisRequest) {
    return analyzeRecruitSignal(request.form);
  },

  generateCrew(request: CrewGenerationRequest): CrewGenerationResult {
    const analysis = request.analysis ?? analyzeRecruitSignal(request.form);
    const crew = generateCrew(request.form, request.variant, analysis);
    return { analysis, crew };
  },

  chatWithCrew(request: CrewDialogueRequest): CrewDialogueResult {
    return respondCrewConversation(request);
  },

  prepareSignalSources(request: SignalMissionPreparationRequest) {
    return generateSignalSources(request.crew);
  },

  analyzeSignal(input) {
    return analyzeSignalSource(input.crew, input.source);
  },

  repairSignal(request: SignalMissionRepairRequest) {
    return repairSignal(request.crew, {
      source: request.source,
      nature: request.nature,
      missingInfo: request.missingInfo
    });
  },

  runShipTask(request: ShipTaskRunRequest): ShipTaskRunResult {
    const taskResult = runShipTask(request.task, request.crew);
    const shipLog = createShipLogEntry({
      title: request.task.title,
      body: `${taskResult.outcomeSummary} 你们这次留下的重点是：${taskResult.discoveredHint}`,
      tag: taskResult.resultTone === "matched" ? "分工正确" : taskResult.resultTone === "creative" ? "意外解法" : "冒险回收"
    });

    return {
      taskResult,
      shipLog
    };
  },

  generateChapterTwoEcho(input) {
    return generateChapterTwoEcho(input.crewRoster, input.activeCrew);
  },

  analyzeChapterTwoResponse(request) {
    return analyzeChapterTwoResponseInput(request);
  },

  analyzeChapterTwoAssignment(request) {
    return analyzeChapterTwoAssignmentInput(request);
  },

  analyzeChapterTwoRound(request: ChapterTwoRoundAnalysisRequest) {
    return analyzeChapterTwoRoundInput(request);
  },

  runChapterTwoRoundOne(request: ChapterTwoRoundOneExecutionRequest) {
    return runChapterTwoRoundOne(request);
  },

  runChapterTwoRoundTwo(request: ChapterTwoRoundTwoExecutionRequest) {
    return runChapterTwoRoundTwo(request);
  },

  completeChapterOne(request: ChapterOneCompletionRequest): ChapterOneCompletionResult {
    const dossierEntry = createDossierEntry({
      title: "基础记忆抢救",
      body: `${request.crew.name} 与你一起接回了主舰最重要的三类基础记忆。主舰把这次协作记成了真正意义上的第一次并肩行动。`,
      tag: "信息库"
    });

    const shipLog = createShipLogEntry({
      title: "第一章归档",
      body: `${request.crew.name} 协助主舰接回基础记忆库，导航盘、故障分析台与船员档案同时恢复。`,
      tag: "章节完成"
    });

    return {
      dossierEntry,
      shipLog,
      statusNote: "基础记忆恢复完成。智脑已重新获得推测航路的能力。"
    };
  },

  completeChapterTwo(request: ChapterTwoCompletionRequest): ChapterTwoCompletionResult {
    const outcome = finalizeChapterTwo(request);

    const shipLog = createShipLogEntry({
      title: "第二章归档",
      body: `${outcome.logSummary}。${outcome.chapterThreeHook}`,
      tag: "新航线"
    });

    const leadDossierEntry = createDossierEntry({
      title: "沉默坐标前线记录",
      body: outcome.leadDossierNote,
      tag: "第二章"
    });

    const supportDossierEntry = createDossierEntry({
      title: "沉默坐标协作记录",
      body: outcome.supportDossierNote,
      tag: "第二章"
    });

    return {
      outcome,
      shipLog,
      leadDossierEntry,
      supportDossierEntry
    };
  }
};
