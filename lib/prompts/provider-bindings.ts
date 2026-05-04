import type {
  ChapterOneCompletionRequest,
  ChapterOneCompletionResult,
  ChapterTwoAssignmentRequest,
  ChapterTwoCompletionRequest,
  ChapterTwoCompletionResult,
  ChapterTwoResponseRequest,
  ChapterTwoRoundAnalysisRequest,
  CrewAnalysisRequest,
  CrewDialogueRequest,
  CrewImageGenerationRequest,
  CrewGenerationRequest,
  PromptBundle,
  ProviderPromptBindings,
  ShipTaskRunRequest,
  ShipTaskRunResult
} from "@/types/ai";
import { labelMap } from "@/lib/game-constants";
import { crewDossierPrompt } from "@/lib/prompts/crew-dossier";
import { crewDialoguePrompt } from "@/lib/prompts/crew-dialogue";
import { crewGenerationPrompt } from "@/lib/prompts/crew-generation";
import { buildCrewImageNegativePrompt, crewImagePrompt } from "@/lib/prompts/crew-image";
import { missionAnalysisPrompt } from "@/lib/prompts/mission-analysis";
import { missionRefinementPrompt } from "@/lib/prompts/mission-refinement";
import { shipLogPrompt } from "@/lib/prompts/ship-log";
import type { PromptBlueprint } from "@/lib/prompts/types";
import { worldRulesPrompt } from "@/lib/prompts/world-rules";

function composePrompt<TInput>(blueprint: PromptBlueprint<TInput>, input: TInput): PromptBundle {
  return {
    blueprintId: blueprint.id,
    label: blueprint.label,
    system: [worldRulesPrompt.system, blueprint.system].join("\n\n"),
    developer: [worldRulesPrompt.developer, blueprint.developer].join("\n\n"),
    user: blueprint.buildUserPrompt(input)
  };
}

function stripImageIPReferences(text: string) {
  return text
    .replace(/美少女战士|sailor moon/gi, "月光系魔法少女战士")
    .replace(/参考[^，。；\n]{0,24}/gi, "")
    .replace(/类似[^，。；\n]{0,24}/gi, "")
    .replace(/像[^，。；\n]{0,24}(一样|那样|风格|画风|同款|角色|版本)/gi, "")
    .replace(/(迪士尼|吉卜力|宫崎骏|皮克斯|漫威|dc|宝可梦|pokemon|哈利波特|星球大战|蜘蛛侠|钢铁侠|美国队长|蝙蝠侠|超人|初音未来|哆啦A梦|hello kitty|皮卡丘)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function summarizeCrew(crewName: string, title: string, extra: string) {
  return `${crewName} · ${title} · ${extra}`;
}

function summarizeRosterFromGeneration(request: CrewGenerationRequest) {
  return [
    ...(request.analysis?.suggestedFocuses ?? []).map((item) => `系统偏向：${item}`),
    ...(request.form.styleTags ?? []).map((item) => `微调：${item}`),
    ...(request.form.specialFocus ? [`特别强调：${request.form.specialFocus}`] : [])
  ];
}

export const providerPromptBindings: ProviderPromptBindings = {
  worldRules: {
    blueprintId: worldRulesPrompt.id,
    label: worldRulesPrompt.label,
    system: worldRulesPrompt.system,
    developer: worldRulesPrompt.developer,
    user: worldRulesPrompt.buildUserPrompt({})
  },

  analyzeCrew(request: CrewAnalysisRequest) {
    return composePrompt(crewGenerationPrompt, {
      playerDescription: request.form.description,
      followupNotes: request.form.notes,
      existingRefinements: [
        ...(request.form.styleTags ?? []),
        ...(request.form.specialFocus ? [request.form.specialFocus] : [])
      ]
    });
  },

  generateCrew(request: CrewGenerationRequest) {
    const interpreted = request.interpretedIntent;
    return composePrompt(crewGenerationPrompt, {
      playerDescription: interpreted
        ? `主体倾向：${labelMap.formType[interpreted.formType]}；职责倾向：${labelMap.role[interpreted.role]}；性格倾向：${labelMap.temperament[interpreted.temperament]}；能力偏好：${labelMap.talent[interpreted.talent]}`
        : request.form.description,
      followupNotes: request.form.notes,
      existingRefinements: interpreted
        ? [
            ...interpreted.styleKeywords,
            ...interpreted.suggestedFocuses,
            `主体锁定：${interpreted.visualSubject}`
          ].slice(0, 6)
        : summarizeRosterFromGeneration(request),
      currentRosterSummary: request.analysis
        ? [
            `系统已提取：${request.analysis.extractedKeywords.join("、") || "暂无关键词"}`,
            `系统判断：${request.analysis.roleSummary}`,
            `风格倾向：${request.analysis.styleSummary}`,
            ...(interpreted ? [`主体锁定：${interpreted.visualSubject}`] : [])
          ]
        : []
    });
  },

  chatWithCrew(request: CrewDialogueRequest) {
    return composePrompt(crewDialoguePrompt, {
      crewName: request.crew.name,
      crewTitle: request.crew.title,
      abilityTag: request.crew.abilityTag,
      temperament: request.crew.temperament,
      bondStatus: request.crew.bondStatus,
      speakingStyle: request.crew.backstory.speakingStyle,
      backstoryOrigin: request.crew.backstory.origin,
      backstoryReason: request.crew.backstory.reasonToJoin,
      backstoryQuestion: request.crew.backstory.hiddenQuestion,
      revealedKeys: request.crew.revealedBackstoryKeys,
      intentSummary: request.interpretedIntent?.focusSummary,
      responseGoal: request.interpretedIntent?.responseGoal,
      rephraseRequested: request.interpretedIntent?.rephraseRequested,
      avoidPhrases: request.interpretedIntent?.avoidOpenings
    });
  },

  generateCrewImage(request: CrewImageGenerationRequest) {
    const interpreted = request.interpretedIntent;
    const sanitizedHint = stripImageIPReferences(request.crew.imagePromptHint);
    const sanitizedSignal = stripImageIPReferences(
      [request.crew.recruitSignal, request.crew.customPrompt, request.crew.notes].filter(Boolean).join("；")
    );
    const sanitizedKeywords = (interpreted?.styleKeywords ?? [...request.crew.signalKeywords, ...request.crew.styleTags])
      .map((item) => stripImageIPReferences(item))
      .filter(Boolean)
      .slice(0, 5);
    const bundle = composePrompt(crewImagePrompt, {
      playerDescription: [sanitizedSignal, sanitizedHint].filter(Boolean).join("\n"),
      crewName: "",
      crewTitle: "",
      abilityTag: "",
      roleSummary: `偏${request.crew.abilityTag}，${request.crew.bondStatus}，保持同一角色的气质与职责`,
      visualSubject: interpreted?.visualSubject ?? request.crew.visualSubject,
      guardrails: interpreted?.visualGuardrails ?? request.crew.visualGuardrails,
      styleKeywords: sanitizedKeywords,
      styleDirection:
        interpreted?.styleDirection ?? "高质量游戏角色设定插画，重视主体与服装，不默认二次元，也不默认写实写真",
      wardrobeDirection:
        interpreted?.wardrobeDirection ?? "服装按原始描述和角色身份自然推断，不默认宇航服、机甲或机械装甲",
      portraitDirection: interpreted?.portraitDirection,
      portraitAestheticSystem: interpreted?.portraitAestheticSystem,
      portraitTemperamentFrame: interpreted?.portraitTemperamentFrame,
      portraitFacialStructure: interpreted?.portraitFacialStructure,
      portraitWorldWardrobeSpec: interpreted?.portraitWorldWardrobeSpec,
      portraitNegativeConstraints: interpreted?.portraitNegativeConstraints,
      portraitGenerationPlan: interpreted?.portraitGenerationPlan,
      parallelEchoNote:
        request.mode === "refresh"
          ? interpreted?.echoVariance ??
            "保持同一角色的职责、性格、能力和主体类型完全一致，只允许服装、配色、局部纹理、饰品与宇宙版本气质出现差异；不要默认加入宇航服或飞船制服。"
          : "这是这个角色首次被主舰记录的外形回响，需要先把核心身份稳定下来。",
      revision: request.variant ?? 1
    });

    return {
      ...bundle,
      negative: buildCrewImageNegativePrompt()
    };
  },

  analyzeChapterTwoResponse(request: ChapterTwoResponseRequest) {
    const interpreted = request.interpretedIntent;
    return composePrompt(missionAnalysisPrompt, {
      playerJudgment: interpreted
        ? `当前关注重点：${interpreted.focus}；推理路径：${interpreted.reasoningPath}；风险方向：${interpreted.riskDirection}`
        : request.prompt,
      missionContext: request.echo.title,
      activeCrewSummary: request.crewRoster.map((crew) => summarizeCrew(crew.name, crew.title, crew.abilityTag)),
      currentClues: [...request.echo.lines, request.echo.linkedClue, ...(interpreted ? [`系统确认：${interpreted.crewApproach}`] : [])]
    });
  },

  analyzeChapterTwoAssignment(request: ChapterTwoAssignmentRequest) {
    const interpreted = request.interpretedIntent;
    return composePrompt(missionAnalysisPrompt, {
      playerJudgment: interpreted
        ? `协作重点：${interpreted.crewApproach}；推理路径：${interpreted.reasoningPath}；风险方向：${interpreted.riskDirection}`
        : request.prompt,
      missionContext: "双船员协作排布",
      activeCrewSummary: [
        summarizeCrew(request.leadCrew.name, request.leadCrew.title, `候选前线 · ${request.leadCrew.abilityTag}`),
        summarizeCrew(request.supportCrew.name, request.supportCrew.title, `候选支援 · ${request.supportCrew.abilityTag}`)
      ],
      currentClues: [
        `${request.leadCrew.name} 当前角色：${request.leadCrew.bondStatus}`,
        `${request.supportCrew.name} 当前角色：${request.supportCrew.bondStatus}`
      ]
    });
  },

  analyzeChapterTwoRound(request: ChapterTwoRoundAnalysisRequest) {
    const interpreted = request.interpretedIntent;
    if (request.round === "two") {
      return composePrompt(missionRefinementPrompt, {
        firstPassSummary: `上一轮焦点：${interpreted?.focus ?? request.fallbackFocus}`,
        playerRefinement: interpreted ? `${interpreted.reasoningPath}｜${interpreted.riskDirection}` : request.prompt,
        crewCollaborationPlan: `${request.leadCrew.name} 主导，${request.supportCrew.name} ${request.supportMode ?? "维持支援"}`,
        remainingQuestion: "系统正在尝试把这段回应再压近一点。"
      });
    }

    return composePrompt(missionAnalysisPrompt, {
      playerJudgment: interpreted ? `${interpreted.reasoningPath}｜${interpreted.riskDirection}` : request.prompt,
      missionContext: `第一轮分析 · ${request.fallbackFocus}`,
      activeCrewSummary: [
        summarizeCrew(request.leadCrew.name, request.leadCrew.title, "主分析员"),
        summarizeCrew(request.supportCrew.name, request.supportCrew.title, "支援位")
      ],
      currentClues: [`当前默认焦点：${request.fallbackFocus}`]
    });
  },

  generateShipTaskLog(request: ShipTaskRunRequest, result?: ShipTaskRunResult | null) {
    return composePrompt(shipLogPrompt, {
      missionTitle: request.task.title,
      playerFocus: request.task.recommended,
      crewSummary: summarizeCrew(request.crew.name, request.crew.title, request.crew.abilityTag),
      missionOutcome: result?.taskResult.outcomeSummary ?? request.task.summary,
      worldChange: result?.taskResult.shipChange ?? request.task.risk
    });
  },

  generateShipTaskDossier(request: ShipTaskRunRequest, result?: ShipTaskRunResult | null) {
    return composePrompt(crewDossierPrompt, {
      crewName: request.crew.name,
      crewRoleSummary: summarizeCrew(request.crew.name, request.crew.title, request.crew.abilityTag),
      playerCommandStyle: request.task.recommended,
      missionExperience: result?.taskResult.outcomeSummary ?? request.task.summary,
      relationshipShift: result?.taskResult.trustNote ?? "这次任务会留下新的默契变化。"
    });
  },

  generateChapterOneLog(request: ChapterOneCompletionRequest, result?: ChapterOneCompletionResult | null) {
    return composePrompt(shipLogPrompt, {
      missionTitle: "第一章归档",
      playerFocus: "基础记忆库抢救",
      crewSummary: summarizeCrew(request.crew.name, request.crew.title, request.crew.abilityTag),
      missionOutcome: result?.shipLog.body ?? "航行、故障与船员记忆被重新接回，主舰重新获得了推测能力。",
      worldChange: result?.statusNote ?? "更远的新坐标开始回应。"
    });
  },

  generateChapterOneDossier(request: ChapterOneCompletionRequest, result?: ChapterOneCompletionResult | null) {
    return composePrompt(crewDossierPrompt, {
      crewName: request.crew.name,
      crewRoleSummary: summarizeCrew(request.crew.name, request.crew.title, request.crew.abilityTag),
      playerCommandStyle: "抢救主舰基础记忆",
      missionExperience: result?.dossierEntry.body ?? "这位船员与你一起完成了信息库抢救。",
      relationshipShift: "第一次并肩抢救主舰，让你们真正开始熟悉彼此。"
    });
  },

  generateChapterTwoLog(request: ChapterTwoCompletionRequest, result?: ChapterTwoCompletionResult | null) {
    return composePrompt(shipLogPrompt, {
      missionTitle: "第二章归档",
      playerFocus: request.responseAnalysis?.pathSummary ?? "沉默坐标调查",
      crewSummary: [
        summarizeCrew(request.leadCrew.name, request.leadCrew.title, "前线"),
        summarizeCrew(request.supportCrew.name, request.supportCrew.title, "支援")
      ].join(" / "),
      missionOutcome: result?.outcome.summary ?? request.roundTwo.summary,
      worldChange: result?.outcome.worldChange ?? request.roundTwo.recommendation
    });
  },

  generateChapterTwoLeadDossier(request: ChapterTwoCompletionRequest, result?: ChapterTwoCompletionResult | null) {
    return composePrompt(crewDossierPrompt, {
      crewName: request.leadCrew.name,
      crewRoleSummary: summarizeCrew(request.leadCrew.name, request.leadCrew.title, request.leadCrew.abilityTag),
      playerCommandStyle: request.assignmentAnalysis?.collaborationSummary ?? "前线主导",
      missionExperience: result?.leadDossierEntry.body ?? request.roundTwo.summary,
      relationshipShift: "这次前线解析让主舰开始记住 Ta 的独特协作方式。"
    });
  },

  generateChapterTwoSupportDossier(request: ChapterTwoCompletionRequest, result?: ChapterTwoCompletionResult | null) {
    return composePrompt(crewDossierPrompt, {
      crewName: request.supportCrew.name,
      crewRoleSummary: summarizeCrew(request.supportCrew.name, request.supportCrew.title, request.supportCrew.abilityTag),
      playerCommandStyle: request.assignmentAnalysis?.collaborationSummary ?? "支援介入",
      missionExperience: result?.supportDossierEntry.body ?? request.roundTwo.summary,
      relationshipShift: "这次支援协作让主舰更清楚 Ta 在队伍中的位置。"
    });
  }
};
