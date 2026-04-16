"use client";

import { useEffect, useMemo } from "react";

import { mockGenerationProvider } from "@/lib/ai/mock-provider";
import { remoteGenerationProvider } from "@/lib/ai/remote-provider";
import { getClientImageConfig } from "@/lib/ai-image/config";
import { getCrewImageProvider } from "@/lib/ai-image";
import { createInitialGameState, emptyChapterTwoState, emptyRecruitForm, emptySignalMission, labelMap, shipTaskCatalog, STORAGE_KEY } from "@/lib/game-constants";
import {
  generateChapterTwoTruth,
  generateCrewBackstory,
  inferCrewVisualProfile,
} from "@/lib/mock-generators";
import {
  analyzePlanetInput,
  buildPlanetModel,
  createFaultCaseRecord,
  createFaultDossier,
  createFaultRun,
  createFaultShipLog,
  createPlanetDossier,
  createPlanetShipLog,
  createRepairedSignal,
  resolveFaultChoice,
  unlockAfterFault,
  unlockAfterPlanet
} from "@/lib/memory-vault";
import {
  interpretChapterTwoAssignmentIntent,
  interpretChapterTwoResponseIntent,
  interpretChapterTwoRoundIntent,
  interpretCrewDialogueIntent,
  interpretCrewImageIntent,
  interpretRecruitIntent
} from "@/lib/intent-interpreter";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useGenerationRuntime } from "@/hooks/useGenerationRuntime";
import type {
  ChapterTwoDuty,
  ChapterTwoFinalChoice,
  ChapterTwoFocus,
  ChapterTwoRefinement,
  ChapterTwoSetback,
  CrewDossierEntry,
  CrewMember,
  FaultCaseRecord,
  GameState,
  PlanetInputState,
  PlanetMood,
  RecruitForm,
  ShipLogEntry,
  ShipTaskId,
  TaskResult
} from "@/types/game";

function getTrustLabel(level: number) {
  if (level >= 10) return "共振很深";
  if (level >= 8) return "已经很默契";
  if (level >= 5) return "开始信任";
  if (level >= 3) return "逐渐熟悉";
  return "刚刚登船";
}

function defaultDossierEntry(member: CrewMember): CrewDossierEntry {
  return {
    id: `${member.id}-arrival`,
    title: "初次登记",
    body: `${member.name} 已写入主舰船员名册，等待第一次正式协作。`,
    tag: "登船"
  };
}

function normalizePortraitEchoes(member: CrewMember) {
  const rawEchoes = Array.isArray(member.portraitEchoes) ? member.portraitEchoes : [];
  const currentAsset = member.portraitAsset ?? null;
  const pool = [...rawEchoes, ...(currentAsset ? [currentAsset] : [])];
  const deduped = new Map<number, NonNullable<CrewMember["portraitAsset"]>>();

  pool.forEach((asset) => {
    if (asset && typeof asset.revision === "number") {
      deduped.set(asset.revision, asset);
    }
  });

  return Array.from(deduped.values()).sort((left, right) => right.revision - left.revision);
}

function normalizeCrewMember(member: CrewMember): CrewMember {
  const trustLevel = typeof member.trustLevel === "number" && member.trustLevel > 0 ? member.trustLevel : 1;
  const dossierEntries = Array.isArray(member.dossierEntries) && member.dossierEntries.length > 0 ? member.dossierEntries : [defaultDossierEntry(member)];
  const portraitEchoes = normalizePortraitEchoes(member);
  const visualProfile =
    member.visualSubject && Array.isArray(member.visualGuardrails)
      ? {
          visualSubject: member.visualSubject,
          visualGuardrails: member.visualGuardrails
        }
      : inferCrewVisualProfile({
          description: member.recruitSignal ?? member.customPrompt ?? member.notes ?? "",
          formType: member.formType,
          keywords: Array.isArray(member.signalKeywords) ? member.signalKeywords : [],
          styleTags: Array.isArray(member.styleTags) ? member.styleTags : []
        });
  const backstory =
    member.backstory ??
    generateCrewBackstory({
      id: member.id,
      name: member.name,
      role: member.role,
      talent: member.talent,
      temperament: member.temperament
    });

  return {
    ...member,
    styleTags: Array.isArray(member.styleTags) ? member.styleTags : [],
    specialFocus: member.specialFocus ?? "",
    customPrompt: member.customPrompt ?? "",
    recruitSignal: member.recruitSignal ?? member.customPrompt ?? member.notes ?? "",
    imagePromptHint: member.imagePromptHint ?? "",
    signalKeywords: Array.isArray(member.signalKeywords) ? member.signalKeywords : Array.isArray(member.styleTags) ? member.styleTags.slice(0, 2) : [],
    signalSummary: member.signalSummary ?? "这位伙伴的轮廓来自你发出的招募信号。",
    suggestedFocuses: Array.isArray(member.suggestedFocuses)
      ? member.suggestedFocuses
      : member.specialFocus
        ? [member.specialFocus]
        : [],
    bondStatus: member.bondStatus ?? "等待第一次共同行动",
    trustLevel,
    trustLabel: member.trustLabel ?? getTrustLabel(trustLevel),
    dossierEntries,
    visualSubject: visualProfile.visualSubject,
    visualGuardrails: visualProfile.visualGuardrails,
    portraitAsset: member.portraitAsset ?? portraitEchoes[0] ?? null,
    portraitEchoes,
    backstory,
    revealedBackstoryKeys: Array.isArray(member.revealedBackstoryKeys) ? member.revealedBackstoryKeys : [],
    conversationLog: Array.isArray(member.conversationLog) ? member.conversationLog : []
  };
}

function getRecruitSourceKey(form: RecruitForm) {
  return [form.description.trim(), form.notes.trim()].filter(Boolean).join("｜");
}

function normalizeTaskResult(result: TaskResult | null): TaskResult | null {
  if (!result) {
    return null;
  }

  return {
    ...result,
    trustGain: typeof result.trustGain === "number" ? result.trustGain : 1,
    trustNote: result.trustNote ?? "这次任务让你们之间多了一点新的默契。",
    dossierEntry:
      result.dossierEntry ??
      {
        id: `${result.assignedCrewId}-${result.taskId}-legacy`,
        title: result.title,
        body: result.outcomeSummary,
        tag: "旧记录"
      }
  };
}

function normalizePlanetInput(input: Partial<PlanetInputState> | null | undefined): PlanetInputState {
  return {
    name: input?.name ?? "",
    appearance: input?.appearance ?? "",
    environment: input?.environment ?? "",
    mood: (input?.mood as PlanetMood | null | undefined) ?? null,
    notes: input?.notes ?? ""
  };
}

function normalizeFaultCaseRecords(input: FaultCaseRecord[] | null | undefined) {
  return Array.isArray(input) ? input : [];
}

function normalizeGameState(input: GameState): GameState {
  const base = createInitialGameState();
  const rawScene: string | undefined = (input as { currentScene?: string }).currentScene;
  const normalizedGeneratedCrew = input.generatedCrew ? normalizeCrewMember(input.generatedCrew) : null;

  const normalizedRoster = Array.isArray(input.crewRoster)
    ? input.crewRoster.map((member) => normalizeCrewMember(member))
    : normalizedGeneratedCrew
      ? [normalizedGeneratedCrew]
      : [];

  const activeCrewId =
    input.activeCrewId && normalizedRoster.some((member) => member.id === input.activeCrewId)
      ? input.activeCrewId
      : normalizedRoster[0]?.id ?? null;

  return {
    ...base,
    ...input,
    currentScene: rawScene === "bridge" ? "hub" : (rawScene as GameState["currentScene"] | undefined) ?? base.currentScene,
    recruitForm: {
      ...base.recruitForm,
      ...input.recruitForm,
      description: input.recruitForm?.description ?? "",
      styleTags: Array.isArray(input.recruitForm?.styleTags) ? input.recruitForm.styleTags : []
    },
    recruitAnalysis:
      input.recruitAnalysis && typeof input.recruitAnalysis === "object"
        ? {
            ...input.recruitAnalysis,
            extractedKeywords: Array.isArray(input.recruitAnalysis.extractedKeywords) ? input.recruitAnalysis.extractedKeywords : [],
            suggestedFocuses: Array.isArray(input.recruitAnalysis.suggestedFocuses) ? input.recruitAnalysis.suggestedFocuses : [],
            sourceText: input.recruitAnalysis.sourceText ?? ""
          }
        : null,
    generatedCrew: normalizedGeneratedCrew,
    crewRoster: normalizedRoster,
    activeCrewId,
    hubSignalSeen:
      input.hubSignalSeen ??
      Boolean(
        input.crewOnboard ||
          input.firstStarLit ||
          input.chapterComplete ||
          input.chapterTwoUnlocked ||
          (Array.isArray(input.crewRoster) && input.crewRoster.length > 0)
      ),
    signalMission: {
      ...emptySignalMission(),
      ...input.signalMission,
      restoredZones: Array.isArray((input.signalMission as GameState["signalMission"])?.restoredZones)
        ? (input.signalMission as GameState["signalMission"]).restoredZones
        : [],
      review: input.signalMission?.review ?? null,
      summary: input.signalMission?.summary ?? null,
      planet: {
        ...emptySignalMission().planet,
        ...input.signalMission?.planet,
        input: normalizePlanetInput(input.signalMission?.planet?.input),
        analysis: input.signalMission?.planet?.analysis ?? null,
        confirmedModel: input.signalMission?.planet?.confirmedModel ?? null,
        unlockSummary: Array.isArray(input.signalMission?.planet?.unlockSummary) ? input.signalMission.planet.unlockSummary : []
      },
      faultRun: {
        ...emptySignalMission().faultRun,
        ...input.signalMission?.faultRun,
        activeSeed: input.signalMission?.faultRun?.activeSeed ?? null,
        nodes: Array.isArray(input.signalMission?.faultRun?.nodes) ? input.signalMission.faultRun.nodes : [],
        history: Array.isArray(input.signalMission?.faultRun?.history) ? input.signalMission.faultRun.history : [],
        partialFragments: Array.isArray(input.signalMission?.faultRun?.partialFragments) ? input.signalMission.faultRun.partialFragments : [],
        result: input.signalMission?.faultRun?.result ?? null
      },
      unlocks: {
        ...emptySignalMission().unlocks,
        ...input.signalMission?.unlocks
      }
    },
    planetCatalog: Array.isArray(input.planetCatalog) ? input.planetCatalog : [],
    faultCaseRecords: normalizeFaultCaseRecords(input.faultCaseRecords),
    taskDesk: {
      tasks: Array.isArray(input.taskDesk?.tasks) && input.taskDesk.tasks.length > 0 ? input.taskDesk.tasks : shipTaskCatalog,
      selectedTaskId: input.taskDesk?.selectedTaskId ?? null,
      assignedCrewId: input.taskDesk?.assignedCrewId ?? null,
      latestResult: normalizeTaskResult(input.taskDesk?.latestResult ?? null)
    },
    chapterTwoUnlocked: input.chapterTwoUnlocked ?? false,
    chapterTwoRouteLocked: input.chapterTwoRouteLocked ?? false,
    chapterTwoComplete: input.chapterTwoComplete ?? false,
    chapterThreeHintUnlocked: input.chapterThreeHintUnlocked ?? false,
    scannedRegionLabel: input.scannedRegionLabel ?? null,
    newRegionAlert: input.newRegionAlert ?? false,
    chapterTwo: {
      ...emptyChapterTwoState(),
      ...input.chapterTwo,
      truth: input.chapterTwo?.truth ?? null,
      attemptCount: typeof input.chapterTwo?.attemptCount === "number" ? input.chapterTwo.attemptCount : 0,
      lastSetback: input.chapterTwo?.lastSetback ?? null
    },
    shipLogs: Array.isArray(input.shipLogs) ? input.shipLogs : [],
    shipStatusNote: input.shipStatusNote ?? null
  };
}

function updateCrewState(current: GameState, crewId: string, updater: (member: CrewMember) => CrewMember) {
  return {
    crewRoster: current.crewRoster.map((member) => (member.id === crewId ? updater(member) : member)),
    generatedCrew: current.generatedCrew && current.generatedCrew.id === crewId ? updater(current.generatedCrew) : current.generatedCrew
  };
}

function updateMultipleCrew(current: GameState, crewIds: string[], updater: (member: CrewMember) => CrewMember) {
  const idSet = new Set(crewIds);

  return {
    crewRoster: current.crewRoster.map((member) => (idSet.has(member.id) ? updater(member) : member)),
    generatedCrew: current.generatedCrew && idSet.has(current.generatedCrew.id) ? updater(current.generatedCrew) : current.generatedCrew
  };
}

function appendShipLog(current: GameState, entry: GameState["shipLogs"][number]) {
  return [entry, ...current.shipLogs].slice(0, 14);
}

function createSetbackLog(setback: ChapterTwoSetback, action: "swap-crew" | "retry-strategy"): ShipLogEntry {
  return {
    id: `log-setback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: action === "swap-crew" ? "沉默坐标误判记录" : "沉默坐标回环记录",
    body: `${setback.summary} ${setback.learnedClue} ${action === "swap-crew" ? setback.crewHint : setback.strategyHint}`,
    tag: "软失败"
  };
}

function createSetbackDossier(member: CrewMember, setback: ChapterTwoSetback, tag: string): CrewDossierEntry {
  return {
    id: `dossier-setback-${member.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "沉默坐标误判",
    body: `${member.name} 在这次尝试里先碰到了外层误导回路。${setback.learnedClue}`,
    tag
  };
}

function createEchoDossier(member: CrewMember, revision: number, echoNote: string) {
  return {
    id: `dossier-echo-${member.id}-${revision}`,
    title: revision <= 1 ? "初始回响归档" : `平行回响 ${revision}`,
    body:
      revision <= 1
        ? `${member.name} 的第一条外形回响已写入档案。${echoNote}`
        : `${member.name} 的另一条平行宇宙外形回响已被主舰锁定。${echoNote} 这类投影通常会在异常信号余波里变得更清楚。`,
    tag: revision <= 1 ? "回响" : "多宇宙"
  };
}

function createEchoLog(member: CrewMember, revision: number, echoNote: string): ShipLogEntry {
  return {
    id: `log-echo-${member.id}-${revision}-${Date.now()}`,
    title: revision <= 1 ? `${member.name} 的初始回响已归档` : `${member.name} 捕捉到新的平行回响`,
    body:
      revision <= 1
        ? `主舰已锁定 ${member.name} 的第一条宇宙外形投影。${echoNote}`
        : `高维波动为 ${member.name} 带来了一条新的外形回声。${echoNote} 这类回响通常会在任务后的异常余波里短暂变强，系统已将其归入同一名船员的平行记录。`,
    tag: revision <= 1 ? "档案同步" : "回响事件"
  };
}

function buildSignalReview(input: {
  zone: "navigation" | "malfunction" | "crew";
  phase: "analysis" | "restore";
  title: string;
  eyebrow: string;
  summary: string;
  detail: string;
  systemRead: string;
  worldChange: string;
  responseNote: string;
  causalNote: string;
  coreStateLabel: string;
  highlights: string[];
  tone?: "info" | "success" | "warm";
}) {
  return {
    zone: input.zone,
    phase: input.phase,
    title: input.title,
    eyebrow: input.eyebrow,
    summary: input.summary,
    detail: input.detail,
    systemRead: input.systemRead,
    worldChange: input.worldChange,
    responseNote: input.responseNote,
    causalNote: input.causalNote,
    coreStateLabel: input.coreStateLabel,
    highlights: input.highlights,
    tone: input.tone ?? "info"
  } as const;
}

function describeEchoShift(member: CrewMember, revision: number) {
  const variations = [
    `${member.visualSubject} 的主轮廓稳定，但舱服线条向更轻的宇宙分支偏移了一点。`,
    `${member.visualSubject} 仍保持同一身份，只是外层色温和配件结构出现了另一条世界线的差异。`,
    `${member.visualSubject} 的核心气质没有变化，只是这一次更像从另一片星区投下来的同名外形。`
  ];

  return variations[Math.max(0, revision - 1) % variations.length];
}

export function useGameState() {
  const imageMode = useMemo(() => getClientImageConfig().mode, []);
  const generationProvider = useMemo(() => remoteGenerationProvider, []);
  const imageProvider = useMemo(() => getCrewImageProvider(imageMode), [imageMode]);
  const fallbackProvider = useMemo(() => mockGenerationProvider, []);
  const fallbackImageProvider = useMemo(() => getCrewImageProvider("mock"), []);
  const { operations, runOperation, resetOperation } = useGenerationRuntime();
  const { value: state, setValue: setState, isHydrated, remove } = useLocalStorage<GameState>(
    STORAGE_KEY,
    createInitialGameState
  );
  const safeState = useMemo(() => normalizeGameState(state), [state]);

  useEffect(() => {
    const normalized = normalizeGameState(state);

    if (JSON.stringify(normalized) !== JSON.stringify(state)) {
      setState(normalized);
    }
  }, [setState, state]);

  const updateState = (updater: (current: GameState) => GameState) => {
    setState((current) => updater(normalizeGameState(current)));
  };

  const generateCrewPortraitImage = async (crew: CrewMember, mode: "initial" | "refresh" = "initial") => {
    const variant = Math.max(crew.portraitAsset?.revision ?? 0, crew.portraitEchoes[0]?.revision ?? 0) + 1;
    const interpretedIntent = interpretCrewImageIntent({ crew, variant, mode }).finalizedSpec;
    const result = await runOperation({
      id: "crew-image",
      handler: () => imageProvider.generateCrewImage({ crew, variant, mode, interpretedIntent }),
      fallback: () => fallbackImageProvider.generateCrewImage({ crew, variant, mode, interpretedIntent })
    });

    updateState((current) => {
      const updated = updateCrewState(current, crew.id, (member) => {
        const portraitEchoes = [result.asset, ...member.portraitEchoes.filter((asset) => asset.revision !== result.asset.revision)].slice(0, 6);
        const echoNote =
          result.asset.echoNote ??
          (result.asset.revision <= 1 ? `${member.visualSubject} 的主轮廓与主舰第一次完成同步。` : describeEchoShift(member, result.asset.revision));

        return {
          ...member,
          portraitAsset: {
            ...result.asset,
            echoNote
          },
          portraitEchoes: portraitEchoes.map((asset) => (asset.revision === result.asset.revision ? { ...asset, echoNote } : asset)),
          dossierEntries: [createEchoDossier(member, result.asset.revision, echoNote), ...member.dossierEntries].slice(0, 8)
        };
      });

      const currentCrew = current.crewRoster.find((member) => member.id === crew.id) ?? current.generatedCrew ?? crew;
      const echoNote =
        result.asset.echoNote ??
        (result.asset.revision <= 1 ? `${currentCrew.visualSubject} 的主轮廓与主舰第一次完成同步。` : describeEchoShift(currentCrew, result.asset.revision));

      return {
        ...current,
        ...updated,
        shipStatusNote: mode === "refresh" ? `${crew.name} 的另一条宇宙回响已写入船员档案` : `${crew.name} 的初始宇宙回响已归档`,
        shipLogs: appendShipLog(current, createEchoLog(currentCrew, result.asset.revision, echoNote))
      };
    });
  };

  const selectCrewPortraitEcho = (crewId: string, revision: number) => {
    updateState((current) => {
      const targetCrew = current.crewRoster.find((member) => member.id === crewId) ?? (current.generatedCrew?.id === crewId ? current.generatedCrew : null);
      const selectedEcho = targetCrew?.portraitEchoes.find((asset) => asset.revision === revision) ?? null;

      if (!targetCrew || !selectedEcho) {
        return current;
      }

      const updated = updateCrewState(current, crewId, (member) => ({
        ...member,
        portraitAsset: selectedEcho
      }));

      return {
        ...current,
        ...updated,
        shipStatusNote: `${targetCrew.name} 当前采用 ${selectedEcho.styleLabel}`
      };
    });
  };

  const awaken = () => {
    updateState((current) => ({
      ...current,
      currentScene: "hub"
    }));
  };

  const returnToHub = () => {
    updateState((current) => ({
      ...current,
      currentScene: "hub"
    }));
  };

  const openRecruitment = () => {
    resetOperation("crew-analyze");
    resetOperation("crew-generate");
    resetOperation("crew-image");
    updateState((current) => ({
      ...current,
      recruitForm: emptyRecruitForm(),
      recruitAnalysis: null,
      currentScene: "recruit"
    }));
  };

  const openCrewBay = () => {
    updateState((current) => ({
      ...current,
      currentScene: "crew-bay"
    }));
  };

  const completeHubBriefing = () => {
    updateState((current) => ({
      ...current,
      hubSignalSeen: true,
      currentScene: "hub",
      shipStatusNote: "首要任务已锁定：招募第一位船员"
    }));
  };

  const openCrewChat = (crewId: string) => {
    updateState((current) => ({
      ...current,
      activeCrewId: crewId,
      currentScene: "crew-chat"
    }));
  };

  const returnToCrewBay = () => {
    updateState((current) => ({
      ...current,
      currentScene: "crew-bay"
    }));
  };

  const openTaskBoard = () => {
    resetOperation("task-run");
    updateState((current) => ({
      ...current,
      currentScene: "task-board",
      taskDesk: {
        ...current.taskDesk,
        tasks: current.taskDesk.tasks.length > 0 ? current.taskDesk.tasks : shipTaskCatalog
      }
    }));
  };

  const openLogbook = () => {
    updateState((current) => ({
      ...current,
      currentScene: "logbook"
    }));
  };

  const openChapterTwoPortal = () => {
    updateState((current) => ({
      ...current,
      currentScene: "chapter-two-portal",
      newRegionAlert: false
    }));
  };

  const startChapterTwoMission = async () => {
    const current = normalizeGameState(safeState);
    if (current.chapterTwo.echo && current.chapterTwo.truth && !current.chapterTwoComplete) {
      updateState((stateCurrent) => ({
        ...stateCurrent,
        currentScene: "chapter-two-mission",
        shipStatusNote: stateCurrent.chapterTwo.lastSetback?.statusNote ?? "沉默坐标回应仍在等待新的判断。"
      }));
      return;
    }

    const activeCrew = current.crewRoster.find((member) => member.id === current.activeCrewId) ?? current.generatedCrew ?? null;
    const echo = await Promise.resolve(generationProvider.generateChapterTwoEcho({ crewRoster: current.crewRoster, activeCrew }));
    const truth = generateChapterTwoTruth({ crewRoster: current.crewRoster, activeCrew, echo });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      currentScene: "chapter-two-mission",
      chapterTwoRouteLocked: true,
      chapterTwo: {
        ...emptyChapterTwoState(),
        currentStep: "response",
        echo,
        truth
      },
      shipStatusNote: "沉默坐标回应已展开，双船员协作分析准备开始"
    }));
  };

  const advanceChapterTwoStep = () => {
    updateState((current) => {
      const nextStep = current.chapterTwo.currentStep === "response"
        ? "assign"
        : current.chapterTwo.currentStep === "assign"
          ? "round-one"
          : current.chapterTwo.currentStep === "round-one"
            ? "round-two"
            : current.chapterTwo.currentStep === "round-two"
              ? "decision"
              : current.chapterTwo.currentStep;

      return {
        ...current,
        chapterTwo: {
          ...current.chapterTwo,
          currentStep: nextStep
        }
      };
    });
  };

  const setChapterTwoCrew = (slot: "leadCrewId" | "supportCrewId", crewId: string) => {
    updateState((current) => {
      const next = {
        ...current.chapterTwo,
        [slot]: crewId,
        assignmentAnalysis: null
      };

      if (next.leadCrewId && next.supportCrewId && next.leadCrewId === next.supportCrewId) {
        next.supportCrewId = null;
      }

      return {
        ...current,
        chapterTwo: next
      };
    });
  };

  const setChapterTwoDuty = (slot: "leadDuty" | "supportDuty", duty: ChapterTwoDuty) => {
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        [slot]: duty,
        assignmentAnalysis: current.chapterTwo.assignmentAnalysis
      }
    }));
  };

  const setChapterTwoResponsePrompt = (prompt: string) => {
    resetOperation("chapter-two-response");
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        responsePrompt: prompt,
        responseAnalysis: null
      }
    }));
  };

  const analyzeChapterTwoResponse = async () => {
    const current = normalizeGameState(safeState);
    const echo = current.chapterTwo.echo;

    if (!echo) {
      return;
    }
    const interpretedIntent = interpretChapterTwoResponseIntent({
      echo,
      prompt: current.chapterTwo.responsePrompt,
      crewRoster: current.crewRoster
    });

    const responseAnalysis = await runOperation({
      id: "chapter-two-response",
      handler: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      }),
      fallback: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterTwo: {
        ...stateCurrent.chapterTwo,
        responseAnalysis,
        roundOneFocus: stateCurrent.chapterTwo.roundOneFocus ?? responseAnalysis.inferredFocus
      }
    }));
  };

  const setChapterTwoAssignmentPrompt = (prompt: string) => {
    resetOperation("chapter-two-assignment");
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        assignmentPrompt: prompt,
        assignmentAnalysis: null
      }
    }));
  };

  const analyzeChapterTwoAssignment = async () => {
    const current = normalizeGameState(safeState);
    const leadCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId);
    const supportCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.supportCrewId);

    if (!leadCrew || !supportCrew) {
      return;
    }
    const interpretedIntent = interpretChapterTwoAssignmentIntent({
      leadCrew,
      supportCrew,
      prompt: current.chapterTwo.assignmentPrompt
    });

    const assignmentAnalysis = await runOperation({
      id: "chapter-two-assignment",
      handler: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        inferredLeadDuty: interpretedIntent.finalizedSpec.preferredLeadDuty ?? "前线解析",
        inferredSupportDuty: interpretedIntent.finalizedSpec.preferredSupportDuty ?? "后方稳定",
        collaborationSummary: interpretedIntent.confirmationTitle,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      }),
      fallback: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        inferredLeadDuty: interpretedIntent.finalizedSpec.preferredLeadDuty ?? "前线解析",
        inferredSupportDuty: interpretedIntent.finalizedSpec.preferredSupportDuty ?? "后方稳定",
        collaborationSummary: interpretedIntent.confirmationTitle,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterTwo: {
        ...stateCurrent.chapterTwo,
        assignmentAnalysis,
        leadDuty: stateCurrent.chapterTwo.leadDuty ?? assignmentAnalysis.inferredLeadDuty,
        supportDuty: stateCurrent.chapterTwo.supportDuty ?? assignmentAnalysis.inferredSupportDuty,
        roundOneFocus: stateCurrent.chapterTwo.roundOneFocus ?? assignmentAnalysis.inferredFocus
      }
    }));
  };

  const setChapterTwoRoundOneFocus = (focus: ChapterTwoFocus) => {
    resetOperation("chapter-two-round-one");
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        roundOneFocus: focus
      }
    }));
  };

  const setChapterTwoRoundOnePrompt = (prompt: string) => {
    resetOperation("chapter-two-round-one");
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        roundOnePrompt: prompt,
        roundOneAnalysis: null
      }
    }));
  };

  const analyzeChapterTwoRoundOne = async () => {
    const current = normalizeGameState(safeState);
    const leadCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId);
    const supportCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.supportCrewId);
    const fallbackFocus = current.chapterTwo.roundOneFocus ?? current.chapterTwo.assignmentAnalysis?.inferredFocus ?? current.chapterTwo.responseAnalysis?.inferredFocus;

    if (!leadCrew || !supportCrew || !fallbackFocus) {
      return;
    }
    const interpretedIntent = interpretChapterTwoRoundIntent({
      prompt: current.chapterTwo.roundOnePrompt,
      fallbackFocus,
      leadCrew,
      supportCrew,
      round: "one"
    });

    const roundOneAnalysis = await runOperation({
      id: "chapter-two-round-one",
      handler: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      }),
      fallback: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterTwo: {
        ...stateCurrent.chapterTwo,
        roundOneAnalysis,
        roundOneFocus: stateCurrent.chapterTwo.roundOneFocus ?? roundOneAnalysis.inferredFocus
      }
    }));
  };

  const runChapterTwoFirstPass = async () => {
    const current = normalizeGameState(safeState);
    const echo = current.chapterTwo.echo;
    const truth = current.chapterTwo.truth;
    const leadCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId);
    const supportCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.supportCrewId);
    const focus = current.chapterTwo.roundOneFocus;
    const analysis = current.chapterTwo.roundOneAnalysis;

    if (!echo || !truth || !leadCrew || !supportCrew || !focus || !analysis) {
      return;
    }

    const roundOneResult = await runOperation({
      id: "chapter-two-round-one",
      handler: () =>
        generationProvider.runChapterTwoRoundOne({
          echo,
          truth,
          leadCrew,
          supportCrew,
          leadDuty: current.chapterTwo.leadDuty,
          supportDuty: current.chapterTwo.supportDuty,
          focus,
          prompt: current.chapterTwo.roundOnePrompt,
          analysis
        }),
      fallback: () =>
        fallbackProvider.runChapterTwoRoundOne({
          echo,
          truth,
          leadCrew,
          supportCrew,
          leadDuty: current.chapterTwo.leadDuty,
          supportDuty: current.chapterTwo.supportDuty,
          focus,
          prompt: current.chapterTwo.roundOnePrompt,
          analysis
        })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterTwo: {
        ...stateCurrent.chapterTwo,
        currentStep: "round-two",
        roundOneResult
      }
    }));
  };

  const setChapterTwoRefinement = (refinement: ChapterTwoRefinement) => {
    resetOperation("chapter-two-round-two");
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        roundTwoRefinement: refinement
      }
    }));
  };

  const setChapterTwoSupportMode = (mode: "维持原分工" | "让支援船员介入") => {
    resetOperation("chapter-two-round-two");
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        roundTwoSupportMode: mode
      }
    }));
  };

  const setChapterTwoRoundTwoPrompt = (prompt: string) => {
    resetOperation("chapter-two-round-two");
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        roundTwoPrompt: prompt,
        roundTwoAnalysis: null
      }
    }));
  };

  const analyzeChapterTwoRoundTwo = async () => {
    const current = normalizeGameState(safeState);
    const leadCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId);
    const supportCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.supportCrewId);
    const fallbackFocus = current.chapterTwo.roundOneFocus ?? current.chapterTwo.responseAnalysis?.inferredFocus;

    if (!leadCrew || !supportCrew || !fallbackFocus) {
      return;
    }
    const interpretedIntent = interpretChapterTwoRoundIntent({
      prompt: current.chapterTwo.roundTwoPrompt,
      fallbackFocus,
      leadCrew,
      supportCrew,
      round: "two",
      supportMode: current.chapterTwo.roundTwoSupportMode
    });

    const roundTwoAnalysis = await runOperation({
      id: "chapter-two-round-two",
      handler: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      }),
      fallback: async () => ({
        sourceText: interpretedIntent.rawInput,
        extractedKeywords: interpretedIntent.extractedKeywords,
        inferredFocus: interpretedIntent.finalizedSpec.focus,
        pathSummary: interpretedIntent.finalizedSpec.reasoningPath,
        crewFit: interpretedIntent.finalizedSpec.crewApproach,
        riskHint: interpretedIntent.finalizedSpec.riskDirection
      })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterTwo: {
        ...stateCurrent.chapterTwo,
        roundTwoAnalysis
      }
    }));
  };

  const runChapterTwoSecondPass = async () => {
    const current = normalizeGameState(safeState);
    const echo = current.chapterTwo.echo;
    const truth = current.chapterTwo.truth;
    const leadCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId);
    const supportCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.supportCrewId);
    const focus = current.chapterTwo.roundOneFocus;
    const roundOne = current.chapterTwo.roundOneResult;
    const refinement = current.chapterTwo.roundTwoRefinement;
    const supportMode = current.chapterTwo.roundTwoSupportMode;
    const analysis = current.chapterTwo.roundTwoAnalysis;

    if (!echo || !truth || !leadCrew || !supportCrew || !focus || !roundOne || !refinement || !supportMode || !analysis) {
      return;
    }

    const roundTwoResult = await runOperation({
      id: "chapter-two-round-two",
      handler: () =>
        generationProvider.runChapterTwoRoundTwo({
          echo,
          truth,
          leadCrew,
          supportCrew,
          focus,
          roundOne,
          refinement,
          supportMode,
          prompt: current.chapterTwo.roundTwoPrompt,
          analysis
        }),
      fallback: () =>
        fallbackProvider.runChapterTwoRoundTwo({
          echo,
          truth,
          leadCrew,
          supportCrew,
          focus,
          roundOne,
          refinement,
          supportMode,
          prompt: current.chapterTwo.roundTwoPrompt,
          analysis
        })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterTwo: {
        ...stateCurrent.chapterTwo,
        currentStep: "decision",
        roundTwoResult,
        lastSetback: roundTwoResult.setback
      }
    }));
  };

  const setChapterTwoFinalChoice = (choice: ChapterTwoFinalChoice) => {
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        finalChoice: choice
      }
    }));
  };

  const completeChapterTwo = async () => {
    const current = normalizeGameState(safeState);
    const leadCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId);
    const supportCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.supportCrewId);
    const roundTwo = current.chapterTwo.roundTwoResult;
    const finalChoice = current.chapterTwo.finalChoice;

    if (!leadCrew || !supportCrew || !roundTwo || roundTwo.outcomeType === "soft-fail" || !finalChoice) {
      return;
    }

    const completion = await runOperation({
      id: "chapter-two-complete",
      handler: () =>
        generationProvider.completeChapterTwo({
          leadCrew,
          supportCrew,
          finalChoice,
          roundTwo,
          responseAnalysis: current.chapterTwo.responseAnalysis,
          assignmentAnalysis: current.chapterTwo.assignmentAnalysis,
          roundOneAnalysis: current.chapterTwo.roundOneAnalysis,
          roundTwoAnalysis: current.chapterTwo.roundTwoAnalysis
        }),
      fallback: () =>
        fallbackProvider.completeChapterTwo({
          leadCrew,
          supportCrew,
          finalChoice,
          roundTwo,
          responseAnalysis: current.chapterTwo.responseAnalysis,
          assignmentAnalysis: current.chapterTwo.assignmentAnalysis,
          roundOneAnalysis: current.chapterTwo.roundOneAnalysis,
          roundTwoAnalysis: current.chapterTwo.roundTwoAnalysis
        })
    });

    updateState((stateCurrent) => {
      const updated = updateMultipleCrew(stateCurrent, [leadCrew.id, supportCrew.id], (member) => {
        const trustBoost = member.id === leadCrew.id ? 2 : 1;
        const trustLevel = member.trustLevel + trustBoost;
        const dossierEntry = member.id === leadCrew.id ? completion.leadDossierEntry : completion.supportDossierEntry;

        return {
          ...member,
          trustLevel,
          trustLabel: getTrustLabel(trustLevel),
          bondStatus: member.id === leadCrew.id ? "参与第二章前线解析" : "参与第二章协同支援",
          dossierEntries: [dossierEntry, ...member.dossierEntries].slice(0, 8)
        };
      });

      return {
        ...stateCurrent,
        ...updated,
        currentScene: "chapter-two-result",
        activeCrewId: leadCrew.id,
        chapterTwoComplete: true,
        chapterThreeHintUnlocked: true,
        scannedRegionLabel: completion.outcome.scannedZone,
        chapterTwo: {
          ...stateCurrent.chapterTwo,
          outcome: completion.outcome
        },
        shipStatusNote: completion.outcome.worldChange,
        shipLogs: appendShipLog(stateCurrent, completion.shipLog)
      };
    });
  };

  const resolveChapterTwoSetback = (action: "swap-crew" | "retry-strategy") => {
    updateState((current) => {
      const setback = current.chapterTwo.roundTwoResult?.setback ?? current.chapterTwo.lastSetback;

      if (!setback) {
        return current;
      }

      const involvedIds = [current.chapterTwo.leadCrewId, current.chapterTwo.supportCrewId].filter(Boolean) as string[];
      const updatedCrew = updateMultipleCrew(current, involvedIds, (member) => ({
        ...member,
        bondStatus: action === "swap-crew" ? "等待重新排布" : "准备改写策略",
        dossierEntries: [createSetbackDossier(member, setback, action === "swap-crew" ? "误判" : "回环"), ...member.dossierEntries].slice(0, 8)
      }));

      return {
        ...current,
        ...updatedCrew,
        currentScene: action === "swap-crew" ? "hub" : "chapter-two-mission",
        shipStatusNote: setback.statusNote,
        shipLogs: appendShipLog(current, createSetbackLog(setback, action)),
        chapterTwo: {
          ...current.chapterTwo,
          attemptCount: current.chapterTwo.attemptCount + 1,
          currentStep: action === "swap-crew" ? "assign" : "response",
          responsePrompt: "",
          responseAnalysis: null,
          leadCrewId: action === "swap-crew" ? null : current.chapterTwo.leadCrewId,
          supportCrewId: action === "swap-crew" ? null : current.chapterTwo.supportCrewId,
          leadDuty: action === "swap-crew" ? null : current.chapterTwo.leadDuty,
          supportDuty: action === "swap-crew" ? null : current.chapterTwo.supportDuty,
          roundOneFocus: action === "swap-crew" ? null : current.chapterTwo.roundOneFocus,
          assignmentPrompt: action === "swap-crew" ? "" : current.chapterTwo.assignmentPrompt,
          assignmentAnalysis: action === "swap-crew" ? null : current.chapterTwo.assignmentAnalysis,
          roundOnePrompt: "",
          roundOneAnalysis: null,
          roundOneResult: null,
          roundTwoPrompt: "",
          roundTwoAnalysis: null,
          roundTwoResult: null,
          roundTwoRefinement: null,
          roundTwoSupportMode: null,
          finalChoice: null,
          lastSetback: setback
        }
      };
    });
  };

  const updateRecruitForm = <Key extends keyof RecruitForm>(field: Key, value: RecruitForm[Key]) => {
    if (field === "description" || field === "notes" || field === "styleTags" || field === "specialFocus") {
      resetOperation("crew-analyze");
    }
    resetOperation("crew-generate");
    updateState((current) => ({
      ...current,
      recruitForm: {
        ...current.recruitForm,
        [field]: value
      },
      recruitAnalysis: field === "description" || field === "notes" ? null : current.recruitAnalysis
    }));
  };

  const analyzeRecruitInput = async () => {
    const current = normalizeGameState(safeState);
    const interpreted = interpretRecruitIntent(current.recruitForm);
    const recruitAnalysis = await runOperation({
      id: "crew-analyze",
      handler: async () => ({
        sourceText: interpreted.rawInput,
        extractedKeywords: interpreted.extractedKeywords,
        inferredFormType: interpreted.finalizedSpec.formType,
        inferredRole: interpreted.finalizedSpec.role,
        inferredTemperament: interpreted.finalizedSpec.temperament,
        inferredTalent: interpreted.finalizedSpec.talent,
        suggestedFocuses: interpreted.finalizedSpec.suggestedFocuses,
        roleSummary: `${labelMap.role[interpreted.finalizedSpec.role]} + ${labelMap.talent[interpreted.finalizedSpec.talent]}`,
        styleSummary: `${labelMap.temperament[interpreted.finalizedSpec.temperament]} · ${labelMap.formType[interpreted.finalizedSpec.formType]}`,
        summary: interpreted.confirmationBody
      }),
      fallback: async () => ({
        sourceText: interpreted.rawInput,
        extractedKeywords: interpreted.extractedKeywords,
        inferredFormType: interpreted.finalizedSpec.formType,
        inferredRole: interpreted.finalizedSpec.role,
        inferredTemperament: interpreted.finalizedSpec.temperament,
        inferredTalent: interpreted.finalizedSpec.talent,
        suggestedFocuses: interpreted.finalizedSpec.suggestedFocuses,
        roleSummary: `${labelMap.role[interpreted.finalizedSpec.role]} + ${labelMap.talent[interpreted.finalizedSpec.talent]}`,
        styleSummary: `${labelMap.temperament[interpreted.finalizedSpec.temperament]} · ${labelMap.formType[interpreted.finalizedSpec.formType]}`,
        summary: interpreted.confirmationBody
      })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      recruitAnalysis
    }));
  };

  const generateCrewMember = async (variant = safeState.crewVariant) => {
    const current = normalizeGameState(safeState);
    const interpretedIntent = interpretRecruitIntent(current.recruitForm).finalizedSpec;
    const freshAnalysis =
      current.recruitAnalysis && current.recruitAnalysis.sourceText === getRecruitSourceKey(current.recruitForm)
        ? current.recruitAnalysis
        : null;

    const result = await runOperation({
      id: "crew-generate",
      handler: () => generationProvider.generateCrew({ form: current.recruitForm, variant, analysis: freshAnalysis, interpretedIntent }),
      fallback: () => fallbackProvider.generateCrew({ form: current.recruitForm, variant, analysis: freshAnalysis, interpretedIntent })
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      recruitAnalysis: result.analysis,
      crewVariant: variant,
      generatedCrew: result.crew,
      currentScene: "crew-result"
    }));

    void generateCrewPortraitImage(result.crew, "initial");
  };

  const rerollCrew = async () => {
    await generateCrewMember(safeState.crewVariant + 1);
  };

  const boardCrew = () => {
    updateState((current) => ({
      ...current,
      crewRoster: current.generatedCrew
        ? [current.generatedCrew, ...current.crewRoster.filter((member) => member.id !== current.generatedCrew?.id)]
        : current.crewRoster,
      activeCrewId: current.generatedCrew?.id ?? current.activeCrewId,
      crewOnboard: true,
      currentScene: "hub",
      shipStatusNote: current.generatedCrew ? `${current.generatedCrew.name} 已进入主舰船员舱` : current.shipStatusNote
    }));
  };

  const setActiveCrew = (crewId: string) => {
    updateState((current) => ({
      ...current,
      activeCrewId: crewId
    }));
  };

  const regenerateCrewPortrait = async (crewId: string) => {
    const current = normalizeGameState(safeState);
    const targetCrew = current.crewRoster.find((member) => member.id === crewId) ?? (current.generatedCrew?.id === crewId ? current.generatedCrew : null);

    if (!targetCrew) {
      return;
    }

    await generateCrewPortraitImage(targetCrew, "refresh");
  };

  const updateCrewImagePromptHint = (crewId: string, prompt: string) => {
    updateState((current) => {
      const updated = updateCrewState(current, crewId, (member) => ({
        ...member,
        imagePromptHint: prompt
      }));

      return {
        ...current,
        ...updated
      };
    });
  };

  const sendCrewMessage = async (crewId: string, playerMessage: string) => {
    const current = normalizeGameState(safeState);
    const targetCrew = current.crewRoster.find((member) => member.id === crewId) ?? (current.generatedCrew?.id === crewId ? current.generatedCrew : null);

    if (!targetCrew || !playerMessage.trim()) {
      return;
    }
    const interpretedIntent = interpretCrewDialogueIntent({ crew: targetCrew, playerMessage });

    const result = await runOperation({
      id: "crew-chat",
      handler: () => generationProvider.chatWithCrew({ crew: targetCrew, playerMessage, interpretedIntent: interpretedIntent.finalizedSpec }),
      fallback: () => fallbackProvider.chatWithCrew({ crew: targetCrew, playerMessage, interpretedIntent: interpretedIntent.finalizedSpec })
    });

    updateState((stateCurrent) => {
      const updated = updateCrewState(stateCurrent, crewId, (member) => {
        const trustLevel = member.trustLevel + result.trustGain;
        const revealedBackstoryKeys =
          result.revealedKey && !member.revealedBackstoryKeys.includes(result.revealedKey)
            ? [...member.revealedBackstoryKeys, result.revealedKey]
            : member.revealedBackstoryKeys;

        return {
          ...member,
          trustLevel,
          trustLabel: getTrustLabel(trustLevel),
          bondStatus: result.bondNote ?? member.bondStatus,
          revealedBackstoryKeys,
          conversationLog: [
            ...member.conversationLog,
            {
              id: `system-intent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              role: "system" as const,
              body: interpretedIntent.confirmationTitle,
              kind: "message" as const
            },
            ...result.messages
          ].slice(-14),
          dossierEntries: result.dossierEntry ? [result.dossierEntry, ...member.dossierEntries].slice(0, 8) : member.dossierEntries
        };
      });

      return {
        ...stateCurrent,
        ...updated,
        shipStatusNote: result.bondNote ?? stateCurrent.shipStatusNote,
        shipLogs: result.shipLog ? appendShipLog(stateCurrent, result.shipLog) : stateCurrent.shipLogs
      };
    });
  };

  const restoreSystems = () => {
    updateState((current) => ({
      ...current,
      systemsRestored: true,
      currentScene: current.hubSignalSeen ? current.currentScene : "hub-briefing",
      shipStatusNote: current.hubSignalSeen ? "主舰任务台已联机" : "本舰同步频道已建立"
    }));
  };

  const selectTask = (taskId: ShipTaskId) => {
    updateState((current) => ({
      ...current,
      taskDesk: {
        ...current.taskDesk,
        selectedTaskId: taskId,
        assignedCrewId: current.taskDesk.assignedCrewId ?? current.activeCrewId
      }
    }));
  };

  const assignTaskCrew = (crewId: string) => {
    updateState((current) => ({
      ...current,
      taskDesk: {
        ...current.taskDesk,
        assignedCrewId: crewId
      }
    }));
  };

  const runSelectedTask = async () => {
    const current = normalizeGameState(safeState);
    const task = current.taskDesk.tasks.find((item) => item.id === current.taskDesk.selectedTaskId);
    const crew = current.crewRoster.find((member) => member.id === current.taskDesk.assignedCrewId);

    if (!task || !crew) {
      return;
    }

    const result = await runOperation({
      id: "task-run",
      handler: () => generationProvider.runShipTask({ task, crew }),
      fallback: () => fallbackProvider.runShipTask({ task, crew })
    });

    updateState((stateCurrent) => {
      const completionCount = task.completionCount + 1;
      const trustLevel = crew.trustLevel + result.taskResult.trustGain;
      const updatedCrewState = updateCrewState(stateCurrent, crew.id, (member) => ({
        ...member,
        trustLevel,
        trustLabel: getTrustLabel(trustLevel),
        bondStatus: `${task.title} 完成 · 第 ${completionCount} 次出动`,
        dossierEntries: [result.taskResult.dossierEntry, ...member.dossierEntries].slice(0, 8)
      }));

      return {
        ...stateCurrent,
        ...updatedCrewState,
        currentScene: "task-result",
        firstStarLit: stateCurrent.firstStarLit || task.id === "trace-anomaly",
        activeCrewId: crew.id,
        taskDesk: {
          ...stateCurrent.taskDesk,
          latestResult: result.taskResult,
          tasks: stateCurrent.taskDesk.tasks.map((item) => (item.id === task.id ? { ...item, completionCount } : item))
        },
        shipStatusNote: result.taskResult.shipChange,
        shipLogs: appendShipLog(stateCurrent, result.shipLog)
      };
    });
  };

  const finishTaskResult = () => {
    updateState((current) => ({
      ...current,
      currentScene: "hub",
      taskDesk: {
        ...current.taskDesk,
        selectedTaskId: null,
        assignedCrewId: null
      }
    }));
  };

  const getActiveVaultCrew = (current: GameState) =>
    current.crewRoster.find((member) => member.id === current.activeCrewId) ?? current.generatedCrew ?? null;

  const openSignalMission = async () => {
    resetOperation("signal-analyze");
    resetOperation("signal-repair");
    const current = normalizeGameState(safeState);
    const crew = getActiveVaultCrew(current);

    if (!crew) {
      return;
    }

    updateState((stateCurrent) => ({
      ...stateCurrent,
      currentScene: stateCurrent.signalMission.repairedSignal
        ? "signal-aftermath"
        : stateCurrent.signalMission.planet.status === "restored"
          ? "signal-review"
          : "signal-mission",
      signalMission: {
        ...stateCurrent.signalMission,
        currentStage:
          stateCurrent.signalMission.repairedSignal
            ? "restored"
            : stateCurrent.signalMission.planet.status === "restored"
              ? "fault"
              : stateCurrent.signalMission.currentStage
      },
      shipStatusNote: "信息库前两层已接入：先建立第一颗星球，再回到过去修复故障案例库。"
    }));
  };

  const acknowledgeSignalAlert = () => {
    updateState((current) => ({
      ...current,
      signalMission: {
        ...current.signalMission,
        currentStage: current.signalMission.planet.status === "restored" ? "fault" : "planet",
        summary: null
      }
    }));
  };

  const updatePlanetInput = <Key extends keyof PlanetInputState>(field: Key, value: PlanetInputState[Key]) => {
    resetOperation("signal-analyze");
    resetOperation("signal-repair");
    updateState((current) => ({
      ...current,
      signalMission: {
        ...current.signalMission,
        summary: null,
        planet: {
          ...current.signalMission.planet,
          input: {
            ...current.signalMission.planet.input,
            [field]: value
          },
          analysis:
            field === "appearance" || field === "environment" || field === "mood" || field === "notes" || field === "name"
              ? null
              : current.signalMission.planet.analysis
        }
      }
    }));
  };

  const analyzePlanetModel = async () => {
    const current = normalizeGameState(safeState);
    const { input, seed } = current.signalMission.planet;

    if (!input.appearance.trim() || !input.environment.trim() || !input.mood) {
      return;
    }

    const analysis = await runOperation({
      id: "signal-analyze",
      handler: () => analyzePlanetInput(input, seed),
      fallback: () => analyzePlanetInput(input, seed)
    });

    updateState((stateCurrent) => ({
      ...stateCurrent,
      signalMission: {
        ...stateCurrent.signalMission,
        currentStage: "planet",
        planet: {
          ...stateCurrent.signalMission.planet,
          status: "analyzed",
          analysis,
          input: {
            ...stateCurrent.signalMission.planet.input,
            name: stateCurrent.signalMission.planet.input.name || analysis.suggestedName
          }
        },
        summary: {
          title: "星球轮廓已成形",
          body: analysis.summary,
          unlockedFeatures: [
            `环境特征：${analysis.environmentTrait}`,
            `危险等级：${analysis.dangerLabel}`,
            `资源分布：${analysis.resourceProfile.water}/${analysis.resourceProfile.mineral}/${analysis.resourceProfile.energy}/${analysis.resourceProfile.ecology}/${analysis.resourceProfile.relicData}`
          ]
        }
      }
    }));
  };

  const restorePlanetModel = async () => {
    const current = normalizeGameState(safeState);
    const crew = getActiveVaultCrew(current);
    const analysis = current.signalMission.planet.analysis;

    if (!crew || !analysis) {
      return;
    }

    const planet = await runOperation({
      id: "signal-repair",
      handler: () =>
        buildPlanetModel({
          signalSeed: current.signalMission.planet.seed,
          planetInput: current.signalMission.planet.input,
          analysis
        }),
      fallback: () =>
        buildPlanetModel({
          signalSeed: current.signalMission.planet.seed,
          planetInput: current.signalMission.planet.input,
          analysis
        })
    });

    updateState((stateCurrent) => {
      const updatedCrew = updateCrewState(stateCurrent, crew.id, (member) => {
        const trustLevel = member.trustLevel + 1;

        return {
          ...member,
          trustLevel,
          trustLabel: getTrustLabel(trustLevel),
          bondStatus: `和你一起建立了 ${planet.name} 的世界模型`,
          dossierEntries: [createPlanetDossier(member, planet), ...member.dossierEntries].slice(0, 8)
        };
      });

      return {
        ...stateCurrent,
        ...updatedCrew,
        currentScene: "signal-review",
        firstStarLit: true,
        activeCrewId: crew.id,
        planetCatalog: [planet, ...stateCurrent.planetCatalog.filter((item) => item.id !== planet.id)],
        shipStatusNote: `${planet.name} 已写入星图，资源产出与导航盘同步恢复。`,
        shipLogs: appendShipLog(stateCurrent, createPlanetShipLog(planet)),
        signalMission: {
          ...stateCurrent.signalMission,
          currentStage: "fault",
          restoredZones: stateCurrent.signalMission.restoredZones.includes("planet")
            ? stateCurrent.signalMission.restoredZones
            : [...stateCurrent.signalMission.restoredZones, "planet"],
          unlocks: unlockAfterPlanet(stateCurrent.signalMission.unlocks),
          summary: {
            title: "第一关完成：星球建模与导航修复",
            body: `${planet.name} 已正式写入星图。资源开始定时产出，第一个可探索坐标已经点亮。`,
            unlockedFeatures: [
              "星球命名并存档",
              "导航盘恢复",
              "资源开始产出",
              "第一个可探索坐标点亮",
              "航行记忆系统解锁"
            ]
          },
          planet: {
            ...stateCurrent.signalMission.planet,
            status: "restored",
            confirmedModel: planet,
            unlockSummary: [
              "第一颗星球正式写入星图",
              "资源开始定时产出",
              "导航盘恢复",
              "第一个可探索坐标点亮",
              "航行记忆系统正式解锁"
            ]
          },
          faultRun: {
            ...stateCurrent.signalMission.faultRun,
            status: "ready"
          }
        }
      };
    });
  };

  const startFaultRun = () => {
    const current = normalizeGameState(safeState);
    const crew = getActiveVaultCrew(current);
    const planet = current.signalMission.planet.confirmedModel;

    if (!crew || !planet || current.signalMission.planet.status !== "restored") {
      return;
    }

    updateState((stateCurrent) => {
      const attempt = stateCurrent.signalMission.faultRun.attemptCount + 1;
      const nextRun = createFaultRun(
        `${planet.id}-${crew.id}-${attempt}-${stateCurrent.signalMission.faultRun.partialFragments.join("|")}`,
        stateCurrent.signalMission.faultRun.partialFragments
      );

      return {
        ...stateCurrent,
        currentScene: "signal-review",
        shipStatusNote: `故障回溯第 ${attempt} 轮已接入：${nextRun.activeSeed?.title ?? "回溯链"}`,
        signalMission: {
          ...stateCurrent.signalMission,
          currentStage: "fault",
          summary: null,
          faultRun: {
            ...nextRun,
            attemptCount: attempt
          }
        }
      };
    });
  };

  const chooseFaultOption = async (choiceId: string) => {
    const current = normalizeGameState(safeState);
    const crew = getActiveVaultCrew(current);
    const planet = current.signalMission.planet.confirmedModel;

    if (!crew || !planet || current.signalMission.faultRun.status !== "running") {
      return;
    }

    const nextRun = await runOperation({
      id: "signal-repair",
      handler: () => resolveFaultChoice(current.signalMission.faultRun, choiceId, crew),
      fallback: () => resolveFaultChoice(current.signalMission.faultRun, choiceId, crew)
    });

    updateState((stateCurrent) => {
      const updatedState: GameState = {
        ...stateCurrent,
        currentScene: "signal-review" as const,
        signalMission: {
          ...stateCurrent.signalMission,
          currentStage: nextRun.status === "resolved" && nextRun.result?.grade === "success" ? "restored" : "fault",
          faultRun: nextRun,
          summary:
            nextRun.status === "resolved" && nextRun.result
              ? {
                  title: nextRun.result.title,
                  body: nextRun.result.summary,
                  unlockedFeatures: [
                    `系统稳定度 ${nextRun.stability}`,
                    `证据清晰度 ${nextRun.evidence}`,
                    `时间窗口 ${nextRun.timeWindow}`,
                    nextRun.result.learnedRule
                  ]
                }
              : stateCurrent.signalMission.summary
        },
        shipStatusNote:
          nextRun.status === "resolved" && nextRun.result
            ? nextRun.result.systemNote
            : nextRun.history[nextRun.history.length - 1]?.summary ?? stateCurrent.shipStatusNote
      };

      if (nextRun.status !== "resolved" || !nextRun.result) {
        return updatedState;
      }

      const caseRecord = createFaultCaseRecord(nextRun, nextRun.result);
      const shipLogs = appendShipLog(stateCurrent, createFaultShipLog(nextRun.result));
      const faultCaseRecords = [caseRecord, ...stateCurrent.faultCaseRecords].slice(0, 12);

      if (nextRun.result.grade !== "success") {
        return {
          ...updatedState,
          faultCaseRecords,
          shipLogs
        };
      }

      const repairedSignal = createRepairedSignal({
        planet,
        crew,
        outcome: nextRun.result
      });
      const updatedCrew = updateCrewState(stateCurrent, crew.id, (member) => {
        const trustLevel = member.trustLevel + 2;

        return {
          ...member,
          trustLevel,
          trustLabel: getTrustLabel(trustLevel),
          bondStatus: "完成了第一次故障回溯演算",
          dossierEntries: [createFaultDossier(member, nextRun.result!), ...member.dossierEntries].slice(0, 8)
        };
      });

      return {
        ...updatedState,
        ...updatedCrew,
        currentScene: "signal-aftermath",
        chapterComplete: true,
        chapterTwoUnlocked: true,
        newRegionAlert: true,
        activeCrewId: crew.id,
        shipLogs,
        faultCaseRecords,
        signalMission: {
          ...updatedState.signalMission,
          restoredZones: updatedState.signalMission.restoredZones.includes("fault")
            ? updatedState.signalMission.restoredZones
            : [...updatedState.signalMission.restoredZones, "fault"],
          unlocks: unlockAfterFault(updatedState.signalMission.unlocks),
          repairedSignal,
          summary: {
            title: "第二关完成：故障回溯演算",
            body: `${nextRun.result.summary} 故障处理台与历史案例库已可立刻调用。`,
            unlockedFeatures: [
              "故障处理台上线",
              "历史故障记录可查询",
              "后续任务可调用案例匹配",
              "飞船过去真相的一部分被找回"
            ]
          }
        }
      };
    });
  };

  const retryFaultRun = () => {
    startFaultRun();
  };

  const finalizeChapterOne = () => {
    updateState((current) => ({
      ...current,
      currentScene: "signal-aftermath"
    }));
  };

  const openChapterComplete = () => {
    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterComplete: true,
      currentScene: "chapter-complete"
    }));
  };

  const restartMission = () => {
    remove();
  };

  const closeSignalReview = () => {
    updateState((current) => ({
      ...current,
      currentScene: "signal-mission"
    }));
  };

  const resetSignalMission = () => {
    updateState((stateCurrent) => ({
      ...stateCurrent,
      signalMission: emptySignalMission()
    }));
  };

  return {
    state: safeState,
    operations,
    isHydrated,
    canGenerateCrew:
      safeState.recruitForm.description.trim().length > 0 &&
      Boolean(safeState.recruitAnalysis) &&
      safeState.recruitAnalysis?.sourceText === getRecruitSourceKey(safeState.recruitForm),
    canAnalyzePlanet:
      safeState.signalMission.planet.input.appearance.trim().length > 0 &&
      safeState.signalMission.planet.input.environment.trim().length > 0 &&
      Boolean(safeState.signalMission.planet.input.mood),
    canRestorePlanet: Boolean(safeState.signalMission.planet.analysis),
    canStartFaultRun:
      safeState.signalMission.planet.status === "restored" &&
      safeState.signalMission.faultRun.status !== "running",
    canContinueFaultRun: safeState.signalMission.faultRun.status === "running",
    canFinalizeChapterOne: Boolean(safeState.signalMission.repairedSignal),
    canRunTask: Boolean(safeState.taskDesk.selectedTaskId) && Boolean(safeState.taskDesk.assignedCrewId),
    canRunChapterTwoRoundOne:
      Boolean(safeState.chapterTwo.leadCrewId) &&
      Boolean(safeState.chapterTwo.supportCrewId) &&
      safeState.chapterTwo.leadCrewId !== safeState.chapterTwo.supportCrewId &&
      Boolean(safeState.chapterTwo.leadDuty) &&
      Boolean(safeState.chapterTwo.supportDuty) &&
      Boolean(safeState.chapterTwo.roundOneFocus) &&
      Boolean(safeState.chapterTwo.roundOneAnalysis),
    canRunChapterTwoRoundTwo:
      Boolean(safeState.chapterTwo.roundOneResult) &&
      Boolean(safeState.chapterTwo.roundTwoRefinement) &&
      Boolean(safeState.chapterTwo.roundTwoSupportMode) &&
      Boolean(safeState.chapterTwo.roundTwoAnalysis),
    canCompleteChapterTwo:
      Boolean(safeState.chapterTwo.roundTwoResult) &&
      safeState.chapterTwo.roundTwoResult?.outcomeType !== "soft-fail" &&
      Boolean(safeState.chapterTwo.finalChoice),
    awaken,
    returnToHub,
    completeHubBriefing,
    openRecruitment,
    openCrewBay,
    openCrewChat,
    returnToCrewBay,
    openTaskBoard,
    openLogbook,
    openChapterTwoPortal,
    startChapterTwoMission,
    advanceChapterTwoStep,
    setChapterTwoResponsePrompt,
    analyzeChapterTwoResponse,
    setChapterTwoCrew,
    setChapterTwoDuty,
    setChapterTwoAssignmentPrompt,
    analyzeChapterTwoAssignment,
    setChapterTwoRoundOneFocus,
    setChapterTwoRoundOnePrompt,
    analyzeChapterTwoRoundOne,
    runChapterTwoFirstPass,
    setChapterTwoRefinement,
    setChapterTwoSupportMode,
    setChapterTwoRoundTwoPrompt,
    analyzeChapterTwoRoundTwo,
    runChapterTwoSecondPass,
    setChapterTwoFinalChoice,
    completeChapterTwo,
    resolveChapterTwoSetback,
    updateRecruitForm,
    analyzeRecruitInput,
    generateCrewMember,
    rerollCrew,
    regenerateCrewPortrait,
    updateCrewImagePromptHint,
    sendCrewMessage,
    boardCrew,
    setActiveCrew,
    selectCrewPortraitEcho,
    selectTask,
    assignTaskCrew,
    runSelectedTask,
    finishTaskResult,
    restoreSystems,
    openSignalMission,
    acknowledgeSignalAlert,
    updatePlanetInput,
    analyzePlanetModel,
    restorePlanetModel,
    startFaultRun,
    chooseFaultOption,
    retryFaultRun,
    finalizeChapterOne,
    closeSignalReview,
    openChapterComplete,
    restartMission,
    resetSignalMission,
    resetOperation
  };
}
