"use client";

import { useEffect, useMemo } from "react";

import { mockGenerationProvider } from "@/lib/ai/mock-provider";
import { chapterTwoSurfaceLocations, chapterTwoUnlockLocationIds } from "@/lib/chapter-two-exploration";
import {
  createInitialGameState,
  emptyChapterTwoRepairReadings,
  emptyChapterTwoState,
  emptyChapterTwoSystemReadings,
  emptyRecruitForm,
  emptySignalMission,
  labelMap,
  shipTaskCatalog,
  STORAGE_KEY
} from "@/lib/game-constants";
import {
  canBuildAdjustedStructure,
  emptyHomePlanetBuildingBenefits,
  emptyHomePlanetHubState,
  getAdjustedHomePlanetStructureCost,
  getAdjustedMotherworldActivationCost,
  getHomePlanetExpeditionEffects,
  getHomePlanetStructureEffect,
  homePlanetStructures,
  languagePlanetResourceReward,
  resolveHomePlanetUnlockedFeatures
} from "@/lib/home-planet-hub";
import { canActivateMotherworldFeature, motherworldHotspots } from "@/lib/motherworld-map";
import {
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
import { getLocalStorageUpdatedAtKey, useLocalStorage } from "@/hooks/useLocalStorage";
import { useGenerationRuntime } from "@/hooks/useGenerationRuntime";
import type {
  ChapterTwoDuty,
  ChapterTwoEcho,
  ChapterTwoCrewAssistRecord,
  ChapterTwoCrewAssistRequest,
  ChapterTwoFinalChoice,
  ChapterTwoFocus,
  ChapterTwoLocationCompletionPayload,
  ChapterTwoLocationId,
  ChapterTwoLocationReward,
  ChapterTwoOutcome,
  ChapterTwoPlanetId,
  ChapterTwoRefinement,
  ChapterTwoRepairReadingLog,
  ChapterTwoRepairReadings,
  ChapterTwoSettlementLog,
  ChapterTwoSceneState,
  ChapterTwoSetback,
  ChapterTwoSystemReadings,
  ClassroomImageAsset,
  ChapterTwoTruth,
  CrewDossierEntry,
  CrewMember,
  FaultCaseRecord,
  GameState,
  HomePlanetBuildingBenefits,
  HomePlanetArchiveRecord,
  HomePlanetCommissionWork,
  HomePlanetDialogueCard,
  HomePlanetExpeditionPlan,
  HomePlanetFeatureId,
  HomePlanetGalleryItem,
  HomePlanetHubState,
  HomePlanetResources,
  HomePlanetStoryboardProject,
  HomePlanetStructureId,
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

function normalizeHomePlanetBuildingBenefits(
  input: Partial<HomePlanetBuildingBenefits> | null | undefined,
  activeFeatureIds: HomePlanetFeatureId[]
): HomePlanetBuildingBenefits {
  const base = emptyHomePlanetBuildingBenefits();
  const activeFeatures = new Set(activeFeatureIds);
  const expeditionPlan =
    input?.expeditionPlan &&
    typeof input.expeditionPlan.goal === "string" &&
    typeof input.expeditionPlan.risk === "string" &&
    typeof input.expeditionPlan.recordPlan === "string"
      ? {
          goal: input.expeditionPlan.goal,
          risk: input.expeditionPlan.risk,
          recordPlan: input.expeditionPlan.recordPlan,
          createdAt: typeof input.expeditionPlan.createdAt === "number" ? input.expeditionPlan.createdAt : Date.now()
        }
      : null;

  return {
    galleryReviewCount: Math.max(0, typeof input?.galleryReviewCount === "number" ? input.galleryReviewCount : base.galleryReviewCount),
    lastGalleryReviewAt: typeof input?.lastGalleryReviewAt === "number" ? input.lastGalleryReviewAt : null,
    workshopEfficiencyLevel: Math.max(
      activeFeatures.has("planet-workshop") ? 1 : 0,
      typeof input?.workshopEfficiencyLevel === "number" ? input.workshopEfficiencyLevel : base.workshopEfficiencyLevel
    ),
    commissionResourceClaims: Math.max(0, typeof input?.commissionResourceClaims === "number" ? input.commissionResourceClaims : 0),
    dialogueReflectionCount: Math.max(0, typeof input?.dialogueReflectionCount === "number" ? input.dialogueReflectionCount : 0),
    storyboardArchiveCount: Math.max(0, typeof input?.storyboardArchiveCount === "number" ? input.storyboardArchiveCount : 0),
    equippedRuleCardIds: Array.isArray(input?.equippedRuleCardIds) ? input.equippedRuleCardIds.filter((id) => typeof id === "string").slice(0, 2) : [],
    crewAssistLevel: Math.max(
      activeFeatures.has("crew-dormitory") ? 1 : 0,
      typeof input?.crewAssistLevel === "number" ? input.crewAssistLevel : base.crewAssistLevel
    ),
    expeditionPlan,
    benefitLogs: Array.isArray(input?.benefitLogs)
      ? input.benefitLogs
          .filter((log) => log && typeof log.id === "string" && typeof log.featureId === "string")
          .map((log) => ({
            id: log.id,
            featureId: log.featureId as HomePlanetFeatureId,
            title: log.title ?? "母星收益记录",
            summary: log.summary ?? "",
            createdAt: typeof log.createdAt === "number" ? log.createdAt : Date.now()
          }))
          .slice(0, 12)
      : []
  };
}

function createHomePlanetBenefitLog(featureId: HomePlanetFeatureId, title: string, summary: string, createdAt = Date.now()) {
  return {
    id: `home-benefit-${featureId}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    featureId,
    title,
    summary,
    createdAt
  };
}

function appendHomePlanetBenefitLog(benefits: HomePlanetBuildingBenefits, log: HomePlanetBuildingBenefits["benefitLogs"][number]) {
  return {
    ...benefits,
    benefitLogs: [log, ...benefits.benefitLogs].slice(0, 12)
  };
}

const homePlanetCommissionResourceClaimCap = 3;

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

function normalizeHomePlanetHub(input: HomePlanetHubState | null | undefined, technologyPoints: number, inferredFragments = 0): HomePlanetHubState {
  const base = emptyHomePlanetHubState();
  const resources = input?.resources ?? base.resources;
  const activeFeatures = Array.isArray(input?.activeFeatures) ? input.activeFeatures : base.activeFeatures;

  return {
    ...base,
    ...input,
    resources: {
      water: typeof resources.water === "number" ? resources.water : base.resources.water,
      minerals: typeof resources.minerals === "number" ? resources.minerals : base.resources.minerals,
      energy: typeof resources.energy === "number" ? resources.energy : base.resources.energy,
      fragments: typeof resources.fragments === "number" ? resources.fragments : Math.max(base.resources.fragments, inferredFragments),
      techPoints: technologyPoints
    },
    unlockedFeatures: Array.isArray(input?.unlockedFeatures) ? input.unlockedFeatures : base.unlockedFeatures,
    activeFeatures,
    builtStructures: Array.isArray(input?.builtStructures) ? input.builtStructures : [],
    dialogueCards: Array.isArray(input?.dialogueCards) ? input.dialogueCards : [],
    storyboardProjects: Array.isArray(input?.storyboardProjects) ? input.storyboardProjects : [],
    commissionWorks: Array.isArray(input?.commissionWorks) ? input.commissionWorks : [],
    galleryItems: Array.isArray(input?.galleryItems) ? input.galleryItems : [],
    archiveRecords: Array.isArray(input?.archiveRecords) ? input.archiveRecords : [],
    ruleCards: Array.isArray(input?.ruleCards) ? input.ruleCards : [],
    benefits: normalizeHomePlanetBuildingBenefits(input?.benefits, activeFeatures)
  };
}

function awardLanguagePlanetResources(resources: HomePlanetResources): HomePlanetResources {
  return {
    ...resources,
    water: resources.water + languagePlanetResourceReward.water,
    minerals: resources.minerals + languagePlanetResourceReward.minerals,
    energy: resources.energy + languagePlanetResourceReward.energy,
    fragments: Math.max(resources.fragments, 0) + languagePlanetResourceReward.fragments
  };
}

function reconcileMotherworldActiveFeatures(activeFeatureIds: HomePlanetFeatureId[], chapterTwoComplete: boolean) {
  const selected = new Set(activeFeatureIds);
  const requiredFragments = motherworldHotspots.reduce(
    (total, hotspot) => (selected.has(hotspot.id) ? total + hotspot.activationCost.fragments : total),
    0
  );
  const earnedFragments = chapterTwoComplete ? languagePlanetResourceReward.fragments : 0;

  if (activeFeatureIds.length <= 4 && requiredFragments <= earnedFragments) {
    return activeFeatureIds;
  }

  const budget = {
    water: emptyHomePlanetHubState().resources.water + (chapterTwoComplete ? languagePlanetResourceReward.water : 0),
    minerals: emptyHomePlanetHubState().resources.minerals + (chapterTwoComplete ? languagePlanetResourceReward.minerals : 0),
    energy: emptyHomePlanetHubState().resources.energy + (chapterTwoComplete ? languagePlanetResourceReward.energy : 0),
    fragments: earnedFragments
  };
  const reconciled: HomePlanetFeatureId[] = [];

  for (const hotspot of motherworldHotspots) {
    if (!selected.has(hotspot.id)) continue;
    if (!canActivateMotherworldFeature(budget, hotspot.activationCost)) continue;

    budget.water -= hotspot.activationCost.water;
    budget.minerals -= hotspot.activationCost.minerals;
    budget.energy -= hotspot.activationCost.energy;
    budget.fragments -= hotspot.activationCost.fragments;
    reconciled.push(hotspot.id);
  }

  return reconciled;
}

const chapterTwoRepairReadingKeys = [
  "goalClarity",
  "evidenceIntegrity",
  "unknownMarking",
  "boundaryAwareness"
] as const;

const chapterTwoRepairReadingCap = 4;

function clampPercent(value: unknown) {
  return Math.max(0, Math.min(100, typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0));
}

const maxChapterTwoRepairReadings = (): ChapterTwoRepairReadings => ({
  goalClarity: chapterTwoRepairReadingCap,
  evidenceIntegrity: chapterTwoRepairReadingCap,
  unknownMarking: chapterTwoRepairReadingCap,
  boundaryAwareness: chapterTwoRepairReadingCap
});

function clampRepairReading(value: unknown) {
  return Math.max(0, Math.min(chapterTwoRepairReadingCap, typeof value === "number" && Number.isFinite(value) ? value : 0));
}

function normalizeChapterTwoRepairReadings(input: Partial<ChapterTwoRepairReadings> | null | undefined): ChapterTwoRepairReadings {
  const base = emptyChapterTwoRepairReadings();

  return {
    goalClarity: clampRepairReading(input?.goalClarity ?? base.goalClarity),
    evidenceIntegrity: clampRepairReading(input?.evidenceIntegrity ?? base.evidenceIntegrity),
    unknownMarking: clampRepairReading(input?.unknownMarking ?? base.unknownMarking),
    boundaryAwareness: clampRepairReading(input?.boundaryAwareness ?? base.boundaryAwareness)
  };
}

function normalizeChapterTwoSystemReadings(input: Partial<ChapterTwoSystemReadings> | null | undefined): ChapterTwoSystemReadings {
  const base = emptyChapterTwoSystemReadings();

  return {
    languageStability: clampPercent(input?.languageStability ?? base.languageStability),
    evidenceChainIntegrity: clampPercent(input?.evidenceChainIntegrity ?? base.evidenceChainIntegrity),
    echoInterferenceResidue: clampPercent(input?.echoInterferenceResidue ?? base.echoInterferenceResidue),
    blackBoxSyncRate: clampPercent(input?.blackBoxSyncRate ?? base.blackBoxSyncRate)
  };
}

function createChapterTwoSystemReadings({
  repairReadings,
  disorderLevel,
  mistakeCount,
  exploredLocationIds,
  blackBoxUnlocked
}: {
  repairReadings: ChapterTwoRepairReadings;
  disorderLevel: number;
  mistakeCount: number;
  exploredLocationIds: ChapterTwoLocationId[];
  blackBoxUnlocked: boolean;
}): ChapterTwoSystemReadings {
  const coreFragmentCount = chapterTwoUnlockLocationIds.filter((id) => exploredLocationIds.includes(id)).length;
  const repairTotal = chapterTwoRepairReadingKeys.reduce((total, key) => total + repairReadings[key], 0);

  return {
    languageStability: clampPercent(30 + repairReadings.goalClarity * 11 + repairReadings.boundaryAwareness * 7 + coreFragmentCount * 3 - disorderLevel * 4 - mistakeCount * 2),
    evidenceChainIntegrity: clampPercent(24 + repairReadings.evidenceIntegrity * 12 + repairReadings.unknownMarking * 8 + coreFragmentCount * 4 - mistakeCount * 3),
    echoInterferenceResidue: clampPercent(92 - repairReadings.unknownMarking * 10 - repairReadings.boundaryAwareness * 9 - repairReadings.evidenceIntegrity * 5 + disorderLevel * 6 + mistakeCount * 4),
    blackBoxSyncRate: clampPercent(repairTotal * 5 + coreFragmentCount * 5 + (blackBoxUnlocked ? 12 : 0) - disorderLevel * 2 - mistakeCount)
  };
}

function createSystemReportLines(readings: ChapterTwoSystemReadings, scope: ChapterTwoSettlementLog["scope"]) {
  const residueLine =
    readings.echoInterferenceResidue <= 20
      ? "回声干扰已压入低噪层。"
      : readings.echoInterferenceResidue <= 45
        ? "回声干扰仍有余波，复查提示保持开启。"
        : "回声干扰残留偏高，主舰保留警戒扫描。";
  const syncLine =
    readings.blackBoxSyncRate >= 90
      ? "黑匣同步率达到深层接入。"
      : readings.blackBoxSyncRate >= 65
        ? "黑匣同步率达到稳定接入。"
        : "黑匣同步率仍在爬升。";

  return [
    `语言稳定度 ${readings.languageStability}%：表达光路${readings.languageStability >= 75 ? "稳定" : "继续校准"}。`,
    `证据链完整度 ${readings.evidenceChainIntegrity}%：来源接口${readings.evidenceChainIntegrity >= 75 ? "已闭合" : "保留复查"}。`,
    `回声干扰残留 ${readings.echoInterferenceResidue}%：${residueLine}`,
    scope === "location" ? `黑匣同步率 ${readings.blackBoxSyncRate}%：地点回流已写入地表导览。` : `黑匣同步率 ${readings.blackBoxSyncRate}%：${syncLine}`
  ];
}

function normalizeChapterTwoSettlementLogs(input: ChapterTwoSettlementLog[] | null | undefined): ChapterTwoSettlementLog[] {
  return Array.isArray(input)
    ? input
        .filter((log) => log && typeof log.id === "string" && typeof log.sourceName === "string")
        .map((log) => ({
          ...log,
          scope: log.scope ?? "location",
          readings: normalizeChapterTwoSystemReadings(log.readings),
          reportLines: Array.isArray(log.reportLines) ? log.reportLines : [],
          createdAt: typeof log.createdAt === "number" ? log.createdAt : Date.now()
        }))
        .slice(0, 16)
    : [];
}

function createChapterTwoSettlementLog({
  scope,
  sourceId,
  sourceName,
  readings,
  createdAt = Date.now()
}: {
  scope: ChapterTwoSettlementLog["scope"];
  sourceId?: ChapterTwoSettlementLog["sourceId"];
  sourceName: string;
  readings: ChapterTwoSystemReadings;
  createdAt?: number;
}): ChapterTwoSettlementLog {
  return {
    id: `settlement-${scope}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    scope,
    sourceId,
    sourceName,
    readings,
    reportLines: createSystemReportLines(readings, scope),
    createdAt
  };
}

function normalizeRepairReadingDelta(delta: Partial<ChapterTwoRepairReadings> | null | undefined): ChapterTwoRepairReadings {
  const base = emptyChapterTwoRepairReadings();

  if (!delta) {
    return base;
  }

  return {
    goalClarity: Math.max(0, typeof delta.goalClarity === "number" ? delta.goalClarity : 0),
    evidenceIntegrity: Math.max(0, typeof delta.evidenceIntegrity === "number" ? delta.evidenceIntegrity : 0),
    unknownMarking: Math.max(0, typeof delta.unknownMarking === "number" ? delta.unknownMarking : 0),
    boundaryAwareness: Math.max(0, typeof delta.boundaryAwareness === "number" ? delta.boundaryAwareness : 0)
  };
}

function hasRepairReadingDelta(delta: ChapterTwoRepairReadings) {
  return chapterTwoRepairReadingKeys.some((key) => delta[key] > 0);
}

function normalizeChapterTwoRepairReadingLogs(input: ChapterTwoRepairReadingLog[] | null | undefined): ChapterTwoRepairReadingLog[] {
  return Array.isArray(input)
    ? input
        .filter((log) => log && typeof log.id === "string" && typeof log.source === "string")
        .map((log) => ({
          ...log,
          note: log.note ?? "",
          delta: normalizeRepairReadingDelta(log.delta),
          createdAt: typeof log.createdAt === "number" ? log.createdAt : Date.now()
        }))
        .slice(0, 16)
    : [];
}

function normalizeChapterTwoCrewAssistRecords(input: ChapterTwoCrewAssistRecord[] | null | undefined): ChapterTwoCrewAssistRecord[] {
  return Array.isArray(input)
    ? input
        .filter((record) => record && typeof record.targetId === "string" && typeof record.hint === "string")
        .map((record) => ({
          ...record,
          id: typeof record.id === "string" ? record.id : `crew-assist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          targetName: record.targetName ?? "言衡星地点",
          crewId: typeof record.crewId === "string" ? record.crewId : null,
          crewName: record.crewName ?? "同行船员",
          createdAt: typeof record.createdAt === "number" ? record.createdAt : Date.now()
        }))
        .slice(0, 16)
    : [];
}

function createCrewAssistSummary(records: ChapterTwoCrewAssistRecord[]) {
  if (records.length === 0) {
    return "坠毁后通讯失联，本次地标修复没有请求船员提示，所有判断由你独立完成。";
  }

  const targetNames = records
    .slice()
    .reverse()
    .map((record) => record.targetName);

  return `旧记录中保留 ${records.length} 次船员提示：${targetNames.join("、")}。当前剧情已切换为失联状态，后续地标不再接入船员协助。`;
}

function addChapterTwoRepairReadingLog({
  repairReadings,
  repairReadingLogs,
  delta,
  source,
  note,
  createdAt = Date.now()
}: {
  repairReadings: ChapterTwoRepairReadings;
  repairReadingLogs: ChapterTwoRepairReadingLog[];
  delta?: Partial<ChapterTwoRepairReadings> | null;
  source?: string;
  note?: string;
  createdAt?: number;
}) {
  const normalizedDelta = normalizeRepairReadingDelta(delta);

  if (!hasRepairReadingDelta(normalizedDelta)) {
    return { repairReadings, repairReadingLogs };
  }

  const nextRepairReadings = chapterTwoRepairReadingKeys.reduce(
    (readings, key) => ({
      ...readings,
      [key]: Math.min(chapterTwoRepairReadingCap, repairReadings[key] + normalizedDelta[key])
    }),
    repairReadings
  );
  const nextLog: ChapterTwoRepairReadingLog = {
    id: `repair-reading-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    source: source ?? "言衡星修复读数",
    note: note ?? "飞船记录到一段稳定判断读数。",
    delta: normalizedDelta,
    createdAt
  };

  return {
    repairReadings: nextRepairReadings,
    repairReadingLogs: [nextLog, ...repairReadingLogs].slice(0, 16)
  };
}

function normalizeGameState(input: GameState): GameState {
  const base = createInitialGameState();
  const rawScene: string | undefined = (input as { currentScene?: string }).currentScene;
  const normalizedGeneratedCrew = input.generatedCrew ? normalizeCrewMember(input.generatedCrew) : null;
  const technologyPoints = typeof input.technologyPoints === "number" ? input.technologyPoints : base.technologyPoints;

  const normalizedRoster = Array.isArray(input.crewRoster)
    ? input.crewRoster.map((member) => normalizeCrewMember(member))
    : normalizedGeneratedCrew
      ? [normalizedGeneratedCrew]
      : [];
  const canUseGeneratedCrewId = Boolean(normalizedGeneratedCrew && input.activeCrewId === normalizedGeneratedCrew.id);
  const chapterTwoCrewAssistRecords = normalizeChapterTwoCrewAssistRecords(input.chapterTwo?.crewAssistRecords);

  const activeCrewId =
    input.activeCrewId && (normalizedRoster.some((member) => member.id === input.activeCrewId) || canUseGeneratedCrewId)
      ? input.activeCrewId
      : normalizedRoster[0]?.id ?? normalizedGeneratedCrew?.id ?? null;

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
    classroomArtifacts: Array.isArray(input.classroomArtifacts) ? input.classroomArtifacts : [],
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
    technologyPoints,
    aiCapabilityLevel: typeof input.aiCapabilityLevel === "number" ? input.aiCapabilityLevel : base.aiCapabilityLevel,
    aiCapabilityUnlocks: Array.isArray(input.aiCapabilityUnlocks) ? input.aiCapabilityUnlocks : base.aiCapabilityUnlocks,
    scannedRegionLabel: input.scannedRegionLabel ?? null,
    newRegionAlert: input.newRegionAlert ?? false,
    chapterTwo: {
      ...emptyChapterTwoState(),
      ...input.chapterTwo,
      sceneState: input.chapterTwo?.sceneState ?? emptyChapterTwoState().sceneState,
      focusedPlanetId: input.chapterTwo?.focusedPlanetId ?? null,
      focusedLocationId: input.chapterTwo?.focusedLocationId ?? null,
      exploredLocationIds: Array.isArray(input.chapterTwo?.exploredLocationIds) ? input.chapterTwo.exploredLocationIds : [],
      disorderLevel: typeof input.chapterTwo?.disorderLevel === "number" ? input.chapterTwo.disorderLevel : emptyChapterTwoState().disorderLevel,
      mistakeCount: typeof input.chapterTwo?.mistakeCount === "number" ? input.chapterTwo.mistakeCount : 0,
      pollutedRecords: Array.isArray(input.chapterTwo?.pollutedRecords) ? input.chapterTwo.pollutedRecords : [],
      baseEffectNotes: Array.isArray(input.chapterTwo?.baseEffectNotes) ? input.chapterTwo.baseEffectNotes : [],
      baseScanHints: Array.isArray(input.chapterTwo?.baseScanHints) ? input.chapterTwo.baseScanHints : [],
      locationRewardClaims: Array.isArray(input.chapterTwo?.locationRewardClaims) ? input.chapterTwo.locationRewardClaims : [],
      repairReadings: normalizeChapterTwoRepairReadings(input.chapterTwo?.repairReadings),
      repairReadingLogs: normalizeChapterTwoRepairReadingLogs(input.chapterTwo?.repairReadingLogs),
      systemReadings: normalizeChapterTwoSystemReadings(input.chapterTwo?.systemReadings ?? input.chapterTwo?.outcome?.systemReadings),
      settlementLogs: normalizeChapterTwoSettlementLogs(input.chapterTwo?.settlementLogs ?? input.chapterTwo?.outcome?.settlementLogs),
      crewAssistRecords: chapterTwoCrewAssistRecords,
      blackBoxUnlocked: input.chapterTwo?.blackBoxUnlocked ?? false,
      fakeCrewSignalResolved: input.chapterTwo?.fakeCrewSignalResolved ?? false,
      truth: input.chapterTwo?.truth ?? null,
      attemptCount: typeof input.chapterTwo?.attemptCount === "number" ? input.chapterTwo.attemptCount : 0,
      lastSetback: input.chapterTwo?.lastSetback ?? null,
      outcome: input.chapterTwo?.outcome
        ? {
            ...input.chapterTwo.outcome,
            repairReadings: normalizeChapterTwoRepairReadings(input.chapterTwo.outcome.repairReadings ?? input.chapterTwo?.repairReadings),
            repairReadingLogs: normalizeChapterTwoRepairReadingLogs(input.chapterTwo.outcome.repairReadingLogs ?? input.chapterTwo?.repairReadingLogs),
            systemReadings: normalizeChapterTwoSystemReadings(input.chapterTwo.outcome.systemReadings ?? input.chapterTwo?.systemReadings),
            settlementLogs: normalizeChapterTwoSettlementLogs(input.chapterTwo.outcome.settlementLogs ?? input.chapterTwo?.settlementLogs),
            crewAssistRecords: normalizeChapterTwoCrewAssistRecords(input.chapterTwo.outcome.crewAssistRecords ?? chapterTwoCrewAssistRecords),
            crewAssistUsed: input.chapterTwo.outcome.crewAssistUsed ?? chapterTwoCrewAssistRecords.length > 0,
            crewAssistSummary: input.chapterTwo.outcome.crewAssistSummary ?? createCrewAssistSummary(chapterTwoCrewAssistRecords)
          }
        : null
    },
    homePlanetHub: normalizeHomePlanetHub(
      input.homePlanetHub,
      technologyPoints,
      input.chapterTwoComplete ? input.chapterTwo?.outcome?.fragments?.length ?? languagePlanetResourceReward.fragments : 0
    ),
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

type ChapterTwoRewardResourceDelta = Partial<Pick<HomePlanetResources, "water" | "minerals" | "energy" | "fragments">>;

interface ChapterTwoLocationRewardPlan {
  rewards: Array<Omit<ChapterTwoLocationReward, "id">>;
  resources?: ChapterTwoRewardResourceDelta;
  technologyPoints?: number;
  crewTrust?: number;
  archiveRecord?: {
    title: string;
    tag: string;
    summary: string;
    evidenceLines: string[];
  };
  ruleCard?: {
    title: string;
    body: string;
    source: string;
  };
  statusNote: string;
}

const chapterTwoLocationRewardPlans: Partial<Record<ChapterTwoLocationId, ChapterTwoLocationRewardPlan>> = {
  "evidence-well": {
    rewards: [
      {
        kind: "civilization-fragment",
        label: "证据碎片 +1",
        detail: "碎片写入母星资源，用于继续点亮基地结构。"
      },
      {
        kind: "home-archive-record",
        label: "母星档案记录",
        detail: "证据回声井记录可在母星档案馆回看。"
      }
    ],
    resources: { fragments: 1 },
    statusNote: "证据井带回碎片，母星档案馆出现新的回流记录。资源残骸仍无法开采。"
  },
  "archive-tower": {
    rewards: [
      {
        kind: "civilization-fragment",
        label: "归档碎片 +1",
        detail: "文明碎片已进入母星资源池。"
      },
      {
        kind: "technology-point",
        label: "科技点 +1",
        detail: "档案塔恢复让主舰获得一枚可用升级点。"
      }
    ],
    resources: { fragments: 1 },
    technologyPoints: 1,
    archiveRecord: {
      title: "档案塔归档记录",
      tag: "文明碎片",
      summary: "档案塔恢复了一条核心原则：文字能延长记忆，但不能替事实作证。",
      evidenceLines: ["带回：归档碎片", "资源残骸：暂不可采", "科技点：+1"]
    },
    statusNote: "档案塔回流归档碎片与科技点。资源残骸仍需要船员飞船协助。"
  },
  "letter-port": {
    rewards: [
      {
        kind: "civilization-fragment",
        label: "传递碎片 +1",
        detail: "信件轨道的残片进入母星资源池。"
      },
      {
        kind: "blackbox-rule-card",
        label: "黑匣规则卡",
        detail: "缺失信息必须标成未知。"
      },
      {
        kind: "crew-bond",
        label: "船员羁绊 +1",
        detail: "共同校准信件轨道后，同行记录加深。"
      }
    ],
    resources: { fragments: 1 },
    crewTrust: 1,
    archiveRecord: {
      title: "漂浮信件港传递记录",
      tag: "传递碎片",
      summary: "信件港恢复了一条稳定轨道：记录可以残缺，但缺口不能被猜测填满。",
      evidenceLines: ["带回：传递碎片", "资源残骸：暂不可采", "船员羁绊：+1"]
    },
    ruleCard: {
      title: "黑匣规则卡：缺口封签",
      body: "信息缺失时，先写未知；如果只是推测，必须标明推测来源。",
      source: "漂浮信件港"
    },
    statusNote: "信件港带回传递碎片、规则卡和一段共同经历。资源残骸仍被坠毁损伤挡住。"
  },
  "engraved-valley": {
    rewards: [
      {
        kind: "civilization-fragment",
        label: "求证碎片 +1",
        detail: "求证碎片写入母星资源，用于保存可靠表达的修复经验。"
      },
      {
        kind: "blackbox-rule-card",
        label: "黑匣规则卡：结论必须连接证据",
        detail: "越界铭文被凿除后，可靠结论需要和证据来源相连。"
      },
      {
        kind: "ship-log",
        label: "主舰日志",
        detail: "刻字山谷的断言扫描与边界修复已写入航行记录。"
      },
      {
        kind: "home-archive-record",
        label: "母星档案记录",
        detail: "刻字山谷回流记录可在母星档案馆回看。"
      }
    ],
    resources: { fragments: 1 },
    archiveRecord: {
      title: "刻字山谷求证记录",
      tag: "求证碎片",
      summary: "刻字山谷恢复了一条核心规则：结论不能悬空，必须能连回可检查的证据。",
      evidenceLines: ["带回：求证碎片", "规则卡：结论必须连接证据", "主舰日志：断言扫描与边界修复已归档"]
    },
    ruleCard: {
      title: "黑匣规则卡：结论必须连接证据",
      body: "写出结论前，先标明依据；找不到证据时，只能写未知或推测，不能把顺口的说法刻成事实。",
      source: "刻字山谷"
    },
    statusNote: "刻字山谷带回求证碎片、规则卡、主舰日志和母星档案记录。"
  },
  "paper-corridor": {
    rewards: [
      {
        kind: "civilization-fragment",
        label: "表达碎片 +1",
        detail: "表达碎片写入母星资源，用于保存更稳定的表达方法。"
      },
      {
        kind: "blackbox-rule-card",
        label: "表达规则卡：目标 / 依据 / 未知 / 边界",
        detail: "纸光回廊把稳定表达拆成四个检查点。"
      },
      {
        kind: "technology-point",
        label: "科技点 +1",
        detail: "表达稳定度恢复后，主舰获得一枚可用升级点。"
      },
      {
        kind: "ship-log",
        label: "主舰日志：表达稳定度恢复",
        detail: "纸光回廊的稳定输出过程已写入航行记录。"
      }
    ],
    resources: { fragments: 1 },
    technologyPoints: 1,
    ruleCard: {
      title: "表达规则卡：目标 / 依据 / 未知 / 边界",
      body: "先说清目标，再列出依据；缺失处标未知，限制和不能做的事也要写进边界。",
      source: "纸光回廊"
    },
    statusNote: "纸光回廊带回表达碎片、表达规则卡、科技点和稳定度恢复日志。"
  }
};

const chapterTwoLocationRepairReadingPlans: Partial<Record<ChapterTwoLocationId, {
  delta: Partial<ChapterTwoRepairReadings>;
  note: string;
}>> = {
  "semantic-dispatch": {
    delta: { goalClarity: 1 },
    note: "分流庭把对象、任务、限制和输出方式接入导航读数。"
  },
  "evidence-well": {
    delta: { evidenceIntegrity: 1, unknownMarking: 2 },
    note: "证据回声井确认事实、推测和未知分仓保存。"
  },
  "boundary-beacon": {
    delta: { boundaryAwareness: 2, unknownMarking: 1 },
    note: "边界灯标写入资料范围、不能编造和保留缺口。"
  },
  "archive-tower": {
    delta: { evidenceIntegrity: 2, unknownMarking: 1 },
    note: "档案塔把可复查来源接回归档光柱。"
  },
  "letter-port": {
    delta: { goalClarity: 1, unknownMarking: 1, boundaryAwareness: 1 },
    note: "信件港完成对象、任务、限制和输出形式的送达校准。"
  },
  "engraved-valley": {
    delta: { evidenceIntegrity: 1, unknownMarking: 1, boundaryAwareness: 2 },
    note: "刻字山谷凿除越界断言，保留可检查边界。"
  },
  "paper-corridor": {
    delta: { goalClarity: 1, evidenceIntegrity: 1, unknownMarking: 1, boundaryAwareness: 1 },
    note: "纸光回廊锁定目标、依据、未知和边界的稳定表达。"
  }
};

function createLocationRewards(locationId: ChapterTwoLocationId, plan: ChapterTwoLocationRewardPlan, createdAt: number) {
  return plan.rewards.map((reward, index) => ({
    id: `reward-${locationId}-${createdAt}-${index}`,
    ...reward
  }));
}

function mergeHomePlanetArchiveRecords(
  currentRecords: HomePlanetArchiveRecord[],
  incomingRecords: Array<HomePlanetArchiveRecord | null | undefined>,
  limit = 20
) {
  const incoming = incomingRecords.filter(Boolean) as HomePlanetArchiveRecord[];
  const incomingIds = new Set(incoming.map((record) => record.id));

  return [...incoming, ...currentRecords.filter((record) => !incomingIds.has(record.id))].slice(0, limit);
}

function summarizeLocationRewards(rewardLabels: string[], resourceDelta?: ChapterTwoRewardResourceDelta, technologyPoints = 0) {
  const resourceLabels = [
    resourceDelta?.water ? `水源 +${resourceDelta.water}` : null,
    resourceDelta?.minerals ? `矿物 +${resourceDelta.minerals}` : null,
    resourceDelta?.energy ? `能源 +${resourceDelta.energy}` : null,
    resourceDelta?.fragments ? `文明碎片 +${resourceDelta.fragments}` : null,
    technologyPoints ? `科技点 +${technologyPoints}` : null
  ].filter(Boolean) as string[];
  const labels = Array.from(new Set([...rewardLabels, ...resourceLabels]));

  return labels.length > 0 ? labels.join(" / ") : "无新增资源，节点职能已写入导览档案。";
}

const locationUnknownArchiveLines: Partial<Record<ChapterTwoLocationId, string>> = {
  "semantic-dispatch": "仍需标记的未知：分流庭只确认任务拆分方式，未出现的资料来源不能补写。",
  "evidence-well": "仍需标记的未知：井壁缺失来源、残缺收件人和污染段落继续封存为未知。",
  "boundary-beacon": "仍需标记的未知：超出资料范围的结论、责任判断和最终选择仍由小舰长保留。",
  "archive-tower": "仍需标记的未知：档案塔没有提供证据来源的位置，不能写成事实。",
  "letter-port": "仍需标记的未知：断裂信件的寄件人、收件人和未送达段落继续标为未知。",
  "engraved-valley": "仍需标记的未知：缺少依据的刻痕只保留为待证，不进入结论层。",
  "paper-corridor": "仍需标记的未知：顺口但无来源的纸光结论继续保留复查标记。",
  "blackbox-vault": "仍需标记的未知：黑匣未开放的深层科技与未验证外部星区仍保持未知。"
};

function formatSystemReadingLine(readings: ChapterTwoSystemReadings) {
  return `飞船读数：语言稳定度 ${readings.languageStability}% / 证据链 ${readings.evidenceChainIntegrity}% / 回声残留 ${readings.echoInterferenceResidue}% / 黑匣同步 ${readings.blackBoxSyncRate}%`;
}

function createLocationExpeditionArchiveRecord({
  locationId,
  location,
  rewardLabels,
  resourceDelta,
  technologyPoints,
  repairReadingNote,
  evidenceLines,
  crewAssistRecord,
  leadCrew,
  crewIntervention,
  systemReadings,
  mistakeCount,
  disorderLevel,
  createdAt
}: {
  locationId: ChapterTwoLocationId;
  location: (typeof chapterTwoSurfaceLocations)[number];
  rewardLabels: string[];
  resourceDelta?: ChapterTwoRewardResourceDelta;
  technologyPoints?: number;
  repairReadingNote?: string;
  evidenceLines: string[];
  crewAssistRecord?: ChapterTwoCrewAssistRecord | null;
  leadCrew?: CrewMember | null;
  crewIntervention?: string;
  systemReadings: ChapterTwoSystemReadings;
  mistakeCount?: number;
  disorderLevel?: number;
  createdAt: number;
}): HomePlanetArchiveRecord {
  const crewLine = crewAssistRecord
    ? `失联前旧提示：${crewAssistRecord.crewName} 在${crewAssistRecord.targetName}留下提示：“${crewAssistRecord.hint}”。`
    : crewIntervention
      ? `失联记录：${crewIntervention}`
      : leadCrew
        ? `失联记录：${leadCrew.name} 暂未回连，节点回收由你独立完成。`
        : "失联记录：主舰基础引导完成记录，未调用伙伴提示。";

  return {
    id: `archive-expedition-${locationId}`,
    title: `远征归档卡：${location.name}`,
    tag: "远征归档",
    summary: `${location.name} 已写回母星文明展厅。${location.discovery}`,
    evidenceLines: [
      `恢复的文明节点：${location.name} / ${location.fragmentName}`,
      `关键判断：${repairReadingNote ?? location.detail}`,
      locationUnknownArchiveLines[locationId] ?? "仍需标记的未知：没有来源、超出残片范围或无法验证的内容继续标为未知。",
      `获得资源：${summarizeLocationRewards(rewardLabels, resourceDelta, technologyPoints)}`,
      crewLine,
      formatSystemReadingLine(systemReadings),
      `主舰状态：失序 ${disorderLevel ?? 0}/6 · 误触 ${mistakeCount ?? 0}`,
      ...evidenceLines.slice(0, 3).map((line) => `节点证据：${line}`)
    ],
    locationId,
    mistakeCount,
    disorderLevel,
    createdAt
  };
}

function createBlackboxExpeditionArchiveRecord({
  outcome,
  leadCrew,
  supportCrew,
  createdAt
}: {
  outcome: ChapterTwoOutcome;
  leadCrew: CrewMember;
  supportCrew: CrewMember;
  createdAt: number;
}): HomePlanetArchiveRecord {
  const readings = outcome.systemReadings ?? emptyChapterTwoSystemReadings();
  const supportLine =
    supportCrew.id === leadCrew.id
      ? `${leadCrew.name} 的坠毁前同行记录已保留，失联后由你完成碎片归档与返航记录。`
      : `${leadCrew.name} 与 ${supportCrew.name} 暂未回连，失联后的黑匣开启由你独立完成。`;

  return {
    id: "archive-expedition-blackbox-trial",
    title: "远征归档卡：语言黑匣试炼",
    tag: "远征归档",
    summary: `${outcome.blackBoxTitle ?? "语言黑匣"} 已带回母星文明展厅。${outcome.summary}`,
    evidenceLines: [
      `恢复的文明节点：黑匣封存台 / ${outcome.blackBoxTitle ?? "语言黑匣"}`,
      "关键判断：让 AI 帮助整理、推测和表达，但事实核查、边界设定与最终判断仍由小舰长完成。",
      "仍需标记的未知：未给出资料来源、残片缺口和无法验证的外部结论继续保留为未知。",
      `获得资源：水源 +${languagePlanetResourceReward.water} / 矿物 +${languagePlanetResourceReward.minerals} / 能源 +${languagePlanetResourceReward.energy} / 文明碎片 +${languagePlanetResourceReward.fragments} / 科技点 +${outcome.technologyPointsAwarded ?? 0}`,
      `失联记录：${supportLine}`,
      outcome.crewAssistSummary ? `失联记录：${outcome.crewAssistSummary}` : null,
      formatSystemReadingLine(readings),
      `黑匣回信：${outcome.finalLetter?.join(" / ") ?? "让 AI 帮助你，而不是替代你。"}`
    ].filter(Boolean) as string[],
    locationId: "blackbox-vault",
    createdAt
  };
}

function createSetbackLog(setback: ChapterTwoSetback, action: "swap-crew" | "retry-strategy"): ShipLogEntry {
  return {
    id: `log-setback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: action === "swap-crew" ? "黑匣协作调整记录" : "黑匣挑战重试记录",
    body: `${setback.summary} ${setback.learnedClue} ${action === "swap-crew" ? setback.crewHint : setback.strategyHint}`,
    tag: "黑匣校验"
  };
}

function createSetbackDossier(member: CrewMember, setback: ChapterTwoSetback, tag: string): CrewDossierEntry {
  return {
    id: `dossier-setback-${member.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "黑匣挑战未完全通过",
    body: `${member.name} 记录了这次黑匣校验失败。${setback.learnedClue}`,
    tag
  };
}

function createEvidenceWellDossier(member: CrewMember, extraBond: boolean): CrewDossierEntry {
  return {
    id: `dossier-evidence-well-${member.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "证据回声井共同经历",
    body: extraBond
      ? `${member.name} 在证据回声井旁完成介入，并把误触后的修复过程写成共同经历。`
      : `${member.name} 参与证据回声井扫描，确认未知不能被补写成事实。`,
    tag: "证据井"
  };
}

function createChapterTwoRewardDossier(member: CrewMember, locationName: string, rewardLabel: string): CrewDossierEntry {
  return {
    id: `dossier-location-reward-${member.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${locationName}共同经历`,
    body: `${member.name} 参与完成 ${locationName}，并把“${rewardLabel}”写入同行记录。`,
    tag: "远征回流"
  };
}

function createChapterTwoLocationLog(input: {
  title: string;
  summary: string;
  fragmentLabel: string;
  tag: string;
  mistakeCount?: number;
  disorderLevel?: number;
  rewards?: string[];
}): ShipLogEntry {
  const mistakeNote =
    typeof input.mistakeCount === "number" && input.mistakeCount > 0
      ? ` 误触 ${input.mistakeCount} 次后完成修复。`
      : "";
  const disorderNote =
    typeof input.disorderLevel === "number"
      ? ` 当前失序强度 ${input.disorderLevel}/6。`
      : "";

  return {
    id: `log-chapter-two-location-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: `${input.summary} 已获得：${input.fragmentLabel}.${mistakeNote}${disorderNote}`,
    tag: input.tag,
    rewardSummary: input.rewards && input.rewards.length > 0 ? input.rewards.join(" / ") : undefined,
    rewards: input.rewards
  };
}

const languageCivilizationKnowledge = {
  planetName: "言衡星",
  blackBoxTitle: "语言模型黑匣 01 · 语义织机",
  scannedZone: "言衡星 / 漂短信渠",
  firstWords:
    "我们曾让文字替文明奔跑。后来才明白，能续写句子的机器不等于真正知道真相；它需要清楚目标、足够证据和不断校准。",
  coreKnowledge: [
    "文字模型会根据已有语境预测下一个更可能出现的表达，它擅长整理、改写、归纳和生成。",
    "它不等于真正理解世界。信息不完整、目标不清楚或噪声太多时，它会给出看起来合理但可能错误的答案。",
    "越清楚地说明任务、对象、限制和判断标准，模型越容易输出可用结果。"
  ],
  practicalGuide: [
    "先说明你要修复什么信息，再说明希望模型按什么规则处理。",
    "遇到损坏记录时，不要只说“修好它”，要补充背景、目标和不能编造的边界。",
    "得到结果后要验证：它像不像，不等于它一定是真的。"
  ]
} as const;

function createLanguageCivilizationEcho(motherPlanetName: string, activeCrew: CrewMember | null): ChapterTwoEcho {
  return {
    title: `${languageCivilizationKnowledge.planetName} · 语言与信息文明星`,
    linkedCrewId: activeCrew?.id ?? null,
    linkedClue: `从 ${motherPlanetName} 出发后，主舰在第一片宇宙区域捕捉到一颗由刻字墙、宣纸光幕和漂浮信件组成的文明星。`,
    lines: [
      "大理石墙面上刻着断裂句子，句尾像被逆熵打击抹去。",
      "宣纸状光幕在风里展开，漂浮信件沿着文字河流缓慢回旋。",
      "档案塔深处有一枚科技黑匣，它仍在等待继承者用自己的话重新开启。"
    ]
  };
}

function createLanguageCivilizationTruth(activeCrew: CrewMember | null): ChapterTwoTruth {
  return {
    trueFocus: "身份线索",
    decoyFocus: "坐标结构",
    signalKind: "记忆残片",
    recommendedLeadCrewId: activeCrew?.id ?? null,
    recommendedSupportCrewId: activeCrew?.id ?? null,
    recommendedLeadDuty: activeCrew?.role === "record" ? "记录还原" : "前线解析",
    recommendedSupportDuty: activeCrew?.talent === "mend" ? "后方稳定" : "记录还原",
    preferredRefinement: "强化区域描述",
    preferredSupportMode: "让支援船员介入",
    recommendedFinalChoice: "激活隐藏模块",
    truthSummary: "这不是旧故障回应，而是语言文明黑匣在确认你是否理解文字模型的边界。"
  };
}

function scoreLanguageUnderstanding(text: string) {
  const normalized = text.replace(/\s+/g, "");
  const evidence = ["信息", "语境", "证据", "资料", "数据"].some((item) => normalized.includes(item));
  const prediction = ["预测", "推测", "可能", "续写", "根据"].some((item) => normalized.includes(item));
  const boundary = ["不是真正理解", "不等于理解", "会错", "错误", "编造", "幻觉", "不能乱编"].some((item) => normalized.includes(item));
  const clarity = ["清楚", "目标", "要求", "限制", "标准", "边界"].some((item) => normalized.includes(item));
  const score = [evidence, prediction, boundary, clarity].filter(Boolean).length + (normalized.length >= 28 ? 1 : 0);

  return {
    score,
    evidence,
    prediction,
    boundary,
    clarity,
    passed: score >= 3
  };
}

function scoreLanguageApplication(text: string) {
  const normalized = text.replace(/\s+/g, "");
  const hasTask = ["修复", "整理", "归档", "改写", "补全"].some((item) => normalized.includes(item));
  const hasContext = ["档案", "信件", "记录", "语言", "文字", "文明"].some((item) => normalized.includes(item));
  const hasBoundary = ["不要编造", "不能编造", "只根据", "不确定", "标注", "保留缺口"].some((item) => normalized.includes(item));
  const hasOutput = ["输出", "分成", "列出", "总结", "格式", "步骤"].some((item) => normalized.includes(item));
  const score = [hasTask, hasContext, hasBoundary, hasOutput].filter(Boolean).length + (normalized.length >= 34 ? 1 : 0);

  return {
    score,
    hasTask,
    hasContext,
    hasBoundary,
    hasOutput,
    passed: score >= 3
  };
}

function createRepairReadingsFromPrompt(
  score: ReturnType<typeof scoreLanguageApplication>,
  understanding?: ReturnType<typeof scoreLanguageUnderstanding>
): Partial<ChapterTwoRepairReadings> {
  return {
    goalClarity: score.hasTask || score.hasOutput || understanding?.clarity ? 1 : 0,
    evidenceIntegrity: score.hasContext || understanding?.evidence ? 1 : 0,
    unknownMarking: score.hasBoundary ? 1 : 0,
    boundaryAwareness: score.hasBoundary || understanding?.boundary ? 1 : 0
  };
}

function createChapterTwoShipLog(outcome: ChapterTwoOutcome): ShipLogEntry {
  return {
    id: `log-language-civ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: outcome.title,
    body: `${outcome.summary} ${outcome.civilizationRecord ?? outcome.logSummary}${outcome.crewAssistSummary ? ` ${outcome.crewAssistSummary}` : ""}`,
    tag: "文明远征"
  };
}

function createChapterTwoDossier(member: CrewMember, outcome: ChapterTwoOutcome): CrewDossierEntry {
  return {
    id: `dossier-language-civ-${member.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "语言黑匣失联记录",
    body: `${member.name} 的坠毁前同行记录已保留。失联后的 ${outcome.blackBoxTitle ?? "第一枚科技黑匣"} 由你独立开启。${outcome.aiUpgrade ?? "主舰 AI 理解能力获得提升。"}`,
    tag: "黑匣"
  };
}

function createResolvedChapterTwoOutcome(): ChapterTwoOutcome {
  const resolvedRepairReadings = maxChapterTwoRepairReadings();
  const resolvedSystemReadings = createChapterTwoSystemReadings({
    repairReadings: resolvedRepairReadings,
    disorderLevel: 0,
    mistakeCount: 0,
    exploredLocationIds: chapterTwoUnlockLocationIds,
    blackBoxUnlocked: true
  });
  const resolvedSettlementLog = createChapterTwoSettlementLog({
    scope: "chapter",
    sourceId: "blackbox-trial",
    sourceName: "言衡星最终回流",
    readings: resolvedSystemReadings
  });

  return {
    title: "第一枚科技黑匣已开启",
    summary: "你点亮四个文明地标，击退失序回声，开启语言黑匣，找回了前文明留下的最后一封信。",
    worldChange: "语言与信息文明星：基础运转恢复。档案塔亮起，信件港光轨恢复，刻字山谷文字河重新流动，纸光回廊展开。",
    chapterThreeHook: "主舰已获得第一项文明技术。更远处的星球仍在沉睡。",
    scannedZone: languageCivilizationKnowledge.scannedZone,
    logSummary: "第二章成果已归档：言衡星复苏、语言黑匣开启、失序回声击退、科技点 +1。",
    leadDossierNote: "坠毁前的同行记录已保留。失联后，黑匣开启由你独立完成。",
    supportDossierNote: "异常通讯仍待复查，船员没有参与地标修复或黑匣判断。",
    planetName: languageCivilizationKnowledge.planetName,
    blackBoxTitle: "语言黑匣",
    technologyPointsAwarded: 1,
    aiUpgrade: "语言黑匣已写入。以后，我会更努力听清你的意思。但我也会提醒你：不要让我替你思考。",
    civilizationRecord: "前文明曾用文字模型整理信件、档案与知识，但他们留下警告：相似表达不是事实，生成结果必须验证。",
    blackBoxKnowledge: [
      "区分事实、推测和未知。",
      "把指令说清楚：对象、任务、限制、输出形式。",
      "识别看起来正确的错误。",
      "用自己的话表达理解。"
    ],
    defeatedEcho: true,
    fragments: ["归档碎片", "传递碎片", "求证碎片", "表达碎片"],
    unlockedModule: "语言理解 Level 1",
    titleEarned: "第一位黑匣解读者",
    finalLetter: [
      "我们曾经拥有无数答案。",
      "却忘了怎样提出问题。",
      "后来者，不要复制我们的失败。",
      "让 AI 帮助你，而不是替代你。"
    ],
    repairReadings: resolvedRepairReadings,
    repairReadingLogs: [],
    systemReadings: resolvedSystemReadings,
    settlementLogs: [resolvedSettlementLog],
    crewAssistUsed: false,
    crewAssistSummary: createCrewAssistSummary([]),
    crewAssistRecords: [],
    completedAt: Date.now()
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
  const generationProvider = useMemo(() => mockGenerationProvider, []);
  const fallbackProvider = useMemo(() => mockGenerationProvider, []);
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const flushLocalSnapshot = () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
        window.localStorage.setItem(getLocalStorageUpdatedAtKey(STORAGE_KEY), String(Date.now()));
      } catch (error) {
        console.warn("Failed to flush local storage snapshot", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushLocalSnapshot();
      }
    };

    window.addEventListener("pagehide", flushLocalSnapshot);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushLocalSnapshot);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isHydrated, safeState]);

  const updateState = (updater: (current: GameState) => GameState) => {
    setState((current) => updater(normalizeGameState(current)));
  };

  const replaceState = (next: GameState) => {
    setState(normalizeGameState(next));
  };

  const generateCrewPortraitImage = async (crew: CrewMember, mode: "initial" | "refresh" = "initial") => {
    updateState((current) => {
      return {
        ...current,
        shipStatusNote:
          mode === "refresh"
            ? `${crew.name} 的形象设定已记录，等待导入外部生成图像。`
            : `${crew.name} 的文字设定已归档，形象图可稍后导入。`
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

  const openArchive = () => {
    updateState((current) => ({
      ...current,
      currentScene: "archive"
    }));
  };

  const openHomePlanetHub = () => {
    updateState((current) => {
      const unlockedFeatures = resolveHomePlanetUnlockedFeatures(current);
      const availableFeatureIds = new Set<HomePlanetFeatureId>([...unlockedFeatures, "animation-studio", "expedition-planning"]);
      const activeFeatures = reconcileMotherworldActiveFeatures(
        current.homePlanetHub.activeFeatures.filter((featureId) => availableFeatureIds.has(featureId)),
        current.chapterTwoComplete
      );

      return {
        ...current,
        currentScene: "home-planet-hub",
        homePlanetHub: {
          ...current.homePlanetHub,
          unlockedFeatures,
          activeFeatures
        }
      };
    });
  };

  const activateHomePlanetFeature = (featureId: HomePlanetFeatureId) => {
    updateState((current) => {
      if (current.homePlanetHub.activeFeatures.includes(featureId)) return current;

      const unlockedFeatures = resolveHomePlanetUnlockedFeatures(current);
      const hotspot = motherworldHotspots.find((item) => item.id === featureId);
      const canPreview = featureId === "animation-studio" || featureId === "expedition-planning";

      if (!hotspot || (!unlockedFeatures.includes(featureId) && !canPreview)) return current;
      const activationCost = getAdjustedMotherworldActivationCost(current, hotspot.activationCost);
      if (!canActivateMotherworldFeature(current.homePlanetHub.resources, activationCost)) return current;
      const createdAt = Date.now();
      const activatedFeatures = [...current.homePlanetHub.activeFeatures, featureId];
      const activationBenefit =
        featureId === "planet-workshop"
          ? appendHomePlanetBenefitLog(
              {
                ...current.homePlanetHub.benefits,
                workshopEfficiencyLevel: Math.max(1, current.homePlanetHub.benefits.workshopEfficiencyLevel)
              },
              createHomePlanetBenefitLog("planet-workshop", "建设效率已接入", "后续点亮建筑和建设结构时，能源消耗会降低 1。", createdAt)
            )
          : featureId === "crew-dormitory"
            ? appendHomePlanetBenefitLog(
                {
                  ...current.homePlanetHub.benefits,
                  crewAssistLevel: Math.max(1, current.homePlanetHub.benefits.crewAssistLevel)
                },
                createHomePlanetBenefitLog("crew-dormitory", "船员协助提示已接入", "远征准备中会出现一条伙伴协助提示。", createdAt)
              )
            : current.homePlanetHub.benefits;

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          resources: {
            ...current.homePlanetHub.resources,
            water: current.homePlanetHub.resources.water - activationCost.water,
            minerals: current.homePlanetHub.resources.minerals - activationCost.minerals,
            energy: current.homePlanetHub.resources.energy - activationCost.energy,
            fragments: current.homePlanetHub.resources.fragments - activationCost.fragments
          },
          unlockedFeatures: unlockedFeatures.includes(featureId) ? unlockedFeatures : [...unlockedFeatures, featureId],
          activeFeatures: activatedFeatures,
          benefits: activationBenefit
        },
        shipStatusNote: `${hotspot.name} 已在母星基地点亮`
      };
    });
  };

  const buildHomePlanetStructure = (structureId: HomePlanetStructureId) => {
    updateState((current) => {
      if (current.homePlanetHub.builtStructures.includes(structureId)) return current;

      const structure = homePlanetStructures.find((item) => item.id === structureId);
      if (!structure) return current;
      const cost = getAdjustedHomePlanetStructureCost(current, structure);
      if (!canBuildAdjustedStructure(current.homePlanetHub.resources, cost)) return current;
      const effect = getHomePlanetStructureEffect(structureId);

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          resources: {
            ...current.homePlanetHub.resources,
            water: current.homePlanetHub.resources.water - cost.water,
            minerals: current.homePlanetHub.resources.minerals - cost.minerals,
            energy: current.homePlanetHub.resources.energy - cost.energy
          },
          builtStructures: [...current.homePlanetHub.builtStructures, structureId]
        },
        shipStatusNote: effect ? `${structure.name} 已接入远征准备：${effect.impactLabel}` : `${structure.name} 已在母星基地点亮`
      };
    });
  };

  const markHomePlanetGalleryReview = () => {
    updateState((current) => {
      if (!current.homePlanetHub.activeFeatures.includes("civilization-gallery")) return current;
      const createdAt = Date.now();
      const benefits = appendHomePlanetBenefitLog(
        {
          ...current.homePlanetHub.benefits,
          galleryReviewCount: current.homePlanetHub.benefits.galleryReviewCount + 1,
          lastGalleryReviewAt: createdAt
        },
        createHomePlanetBenefitLog("civilization-gallery", "成果复盘已完成", "最近作品、黑匣记录和远征成果已被标记为复盘材料。", createdAt)
      );

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          benefits
        },
        shipStatusNote: "文明展厅已完成一次成果复盘，远征成果会更容易回看。"
      };
    });
  };

  const saveHomePlanetCommission = (work: Omit<HomePlanetCommissionWork, "id" | "createdAt">) => {
    updateState((current) => {
      const createdAt = Date.now();
      const id = `commission-${createdAt}`;
      const nextWork: HomePlanetCommissionWork = { ...work, id, createdAt };
      const boardActive = current.homePlanetHub.activeFeatures.includes("commission-board");
      const canClaimResource = boardActive && current.homePlanetHub.benefits.commissionResourceClaims < homePlanetCommissionResourceClaimCap;
      const galleryItem: HomePlanetGalleryItem = {
        id: `gallery-${id}`,
        type: "commission",
        title: work.title,
        summary: work.output.slice(0, 80) || "一份母星委托作品已归档。",
        sourceId: id,
        createdAt
      };
      const archiveRecord = boardActive
        ? {
            id: `archive-commission-${createdAt}`,
            title: `委托归档卡：${work.title}`,
            tag: "作品委托",
            summary: work.output.slice(0, 96) || "这份委托作品已转成可回看的母星归档卡。",
            evidenceLines: [`练习能力：${work.ability}`, `资源回流：${canClaimResource ? "能源 +1" : "本次只归档，不再重复领取资源"}`],
            createdAt
          }
        : null;
      const nextBenefits = boardActive
        ? appendHomePlanetBenefitLog(
            {
              ...current.homePlanetHub.benefits,
              commissionResourceClaims: current.homePlanetHub.benefits.commissionResourceClaims + (canClaimResource ? 1 : 0)
            },
            createHomePlanetBenefitLog(
              "commission-board",
              canClaimResource ? "委托作品回流能源" : "委托作品生成归档卡",
              canClaimResource ? "作品保存后生成归档卡，并回流能源 +1。" : "作品保存后继续生成归档卡，资源回流已达到本轮上限。",
              createdAt
            )
          )
        : current.homePlanetHub.benefits;

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          resources: {
            ...current.homePlanetHub.resources,
            energy: current.homePlanetHub.resources.energy + (canClaimResource ? 1 : 0)
          },
          commissionWorks: [nextWork, ...current.homePlanetHub.commissionWorks],
          galleryItems: [galleryItem, ...current.homePlanetHub.galleryItems],
          archiveRecords: archiveRecord ? [archiveRecord, ...current.homePlanetHub.archiveRecords].slice(0, 12) : current.homePlanetHub.archiveRecords,
          benefits: nextBenefits
        },
        shipStatusNote: boardActive
          ? canClaimResource
            ? "委托作品已写入文明展厅，并回流能源 +1。"
            : "委托作品已生成归档卡。"
          : "母星委托作品已写入文明展厅"
      };
    });
  };

  const saveHomePlanetDialogue = (card: Omit<HomePlanetDialogueCard, "id" | "createdAt">) => {
    updateState((current) => {
      const createdAt = Date.now();
      const id = `dialogue-${createdAt}`;
      const nextCard: HomePlanetDialogueCard = { ...card, id, createdAt };
      const galleryItem: HomePlanetGalleryItem = {
        id: `gallery-${id}`,
        type: "dialogue",
        title: `${card.character} · ${card.theme}`,
        summary: card.takeaway.slice(0, 80) || "一次有目标的对话复盘已归档。",
        sourceId: id,
        createdAt
      };
      const roomActive = current.homePlanetHub.activeFeatures.includes("character-dialogue-room");
      const nextRepairReadingState = roomActive
        ? addChapterTwoRepairReadingLog({
            repairReadings: current.chapterTwo.repairReadings,
            repairReadingLogs: current.chapterTwo.repairReadingLogs,
            delta: { unknownMarking: 1, boundaryAwareness: 1 },
            source: "角色对话室",
            note: "对话复盘卡把边界和未知提示重新校准。",
            createdAt
          })
        : {
            repairReadings: current.chapterTwo.repairReadings,
            repairReadingLogs: current.chapterTwo.repairReadingLogs
          };
      const nextBenefits = roomActive
        ? appendHomePlanetBenefitLog(
            {
              ...current.homePlanetHub.benefits,
              dialogueReflectionCount: current.homePlanetHub.benefits.dialogueReflectionCount + 1
            },
            createHomePlanetBenefitLog("character-dialogue-room", "边界复盘读数提升", "对话收获卡让未知标记和边界意识读数各校准 1 格。", createdAt)
          )
        : current.homePlanetHub.benefits;

      return {
        ...current,
        chapterTwo: roomActive
          ? {
              ...current.chapterTwo,
              repairReadings: nextRepairReadingState.repairReadings,
              repairReadingLogs: nextRepairReadingState.repairReadingLogs
            }
          : current.chapterTwo,
        homePlanetHub: {
          ...current.homePlanetHub,
          dialogueCards: [nextCard, ...current.homePlanetHub.dialogueCards],
          galleryItems: [galleryItem, ...current.homePlanetHub.galleryItems],
          benefits: nextBenefits
        },
        shipStatusNote: roomActive ? "对话收获卡已提升边界与未知相关反馈。" : "对话收获卡已写入文明展厅"
      };
    });
  };

  const saveHomePlanetStoryboard = (project: Omit<HomePlanetStoryboardProject, "id" | "createdAt">) => {
    updateState((current) => {
      const createdAt = Date.now();
      const id = `storyboard-${createdAt}`;
      const nextProject: HomePlanetStoryboardProject = { ...project, id, createdAt };
      const galleryItem: HomePlanetGalleryItem = {
        id: `gallery-${id}`,
        type: "storyboard",
        title: project.title || "迷你动画分镜册",
        summary: project.acts.map((act) => act.text).filter(Boolean).slice(0, 2).join(" / ") || "三幕分镜作品已归档。",
        sourceId: id,
        createdAt
      };
      const studioActive = current.homePlanetHub.activeFeatures.includes("animation-studio");
      const archiveRecord = studioActive
        ? {
            id: `archive-storyboard-${createdAt}`,
            title: `故事归档：${project.title || "迷你动画分镜册"}`,
            tag: "故事归档",
            summary: project.acts.map((act) => `${act.label}：${act.text || "待补画面"}`).join(" / "),
            evidenceLines: project.acts.map((act) => `${act.label}：${act.text || "保留空镜头"}`),
            createdAt
          }
        : null;
      const nextBenefits = studioActive
        ? appendHomePlanetBenefitLog(
            {
              ...current.homePlanetHub.benefits,
              storyboardArchiveCount: current.homePlanetHub.benefits.storyboardArchiveCount + 1
            },
            createHomePlanetBenefitLog("animation-studio", "三幕故事已归档", "分镜册保存后生成一条故事归档，可在文明档案馆回看。", createdAt)
          )
        : current.homePlanetHub.benefits;

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          storyboardProjects: [nextProject, ...current.homePlanetHub.storyboardProjects],
          galleryItems: [galleryItem, ...current.homePlanetHub.galleryItems],
          archiveRecords: archiveRecord ? [archiveRecord, ...current.homePlanetHub.archiveRecords].slice(0, 12) : current.homePlanetHub.archiveRecords,
          benefits: nextBenefits
        },
        shipStatusNote: studioActive ? "迷你动画分镜册已生成故事归档。" : "迷你动画分镜册已写入文明展厅"
      };
    });
  };

  const equipHomePlanetRuleCard = (cardId: string) => {
    updateState((current) => {
      if (!cardId || !current.homePlanetHub.activeFeatures.includes("civilization-archive")) return current;
      const createdAt = Date.now();
      const equipped = current.homePlanetHub.benefits.equippedRuleCardIds;
      const alreadyEquipped = equipped.includes(cardId);
      const nextEquipped = alreadyEquipped ? equipped.filter((id) => id !== cardId) : [cardId, ...equipped.filter((id) => id !== cardId)].slice(0, 2);
      const benefits = appendHomePlanetBenefitLog(
        {
          ...current.homePlanetHub.benefits,
          equippedRuleCardIds: nextEquipped
        },
        createHomePlanetBenefitLog(
          "civilization-archive",
          alreadyEquipped ? "文明卡已卸下" : "文明卡已装备",
          alreadyEquipped ? "这张文明卡已从远征提示栏移除。" : "这张文明卡会加入下一次远征前的原则提示。",
          createdAt
        )
      );

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          benefits
        },
        shipStatusNote: alreadyEquipped ? "文明卡已卸下。" : "文明卡已装备到远征准备提示。"
      };
    });
  };

  const tuneHomePlanetCrewAssist = () => {
    updateState((current) => {
      if (!current.homePlanetHub.activeFeatures.includes("crew-dormitory")) return current;
      const createdAt = Date.now();
      const benefits = appendHomePlanetBenefitLog(
        {
          ...current.homePlanetHub.benefits,
          crewAssistLevel: Math.max(1, current.homePlanetHub.benefits.crewAssistLevel)
        },
        createHomePlanetBenefitLog("crew-dormitory", "伙伴协助提示已整理", "下一次远征会显示一条船员协助提示，提醒你保留未知和检查边界。", createdAt)
      );

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          benefits
        },
        shipStatusNote: "船员宿舍已整理伙伴协助提示。"
      };
    });
  };

  const saveHomePlanetExpeditionPlan = (plan: Omit<HomePlanetExpeditionPlan, "createdAt">) => {
    updateState((current) => {
      if (!current.homePlanetHub.activeFeatures.includes("expedition-planning")) return current;
      const goal = plan.goal.trim();
      const risk = plan.risk.trim();
      const recordPlan = plan.recordPlan.trim();

      if (!goal || !risk || !recordPlan) return current;
      const createdAt = Date.now();
      const expeditionPlan: HomePlanetExpeditionPlan = { goal, risk, recordPlan, createdAt };
      const benefits = appendHomePlanetBenefitLog(
        {
          ...current.homePlanetHub.benefits,
          expeditionPlan
        },
        createHomePlanetBenefitLog("expedition-planning", "远征计划已写入", "下一次远征会读取目标和风险，并降低初始失序 1 级。", createdAt)
      );

      return {
        ...current,
        homePlanetHub: {
          ...current.homePlanetHub,
          benefits
        },
        shipStatusNote: "探险计划室已保存目标、风险和复盘计划。"
      };
    });
  };

  const openChapterTwoPortal = () => {
    updateState((current) => ({
      ...current,
      currentScene: "chapter-two-portal",
      newRegionAlert: false
    }));
  };

  const setChapterTwoSceneState = (sceneState: ChapterTwoSceneState) => {
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        sceneState
      }
    }));
  };

  const focusChapterTwoPlanet = (planetId: ChapterTwoPlanetId | null) => {
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        focusedPlanetId: planetId,
        focusedLocationId: null,
        sceneState: planetId ? "planet_preview" : "sector_view"
      }
    }));
  };

  const focusChapterTwoLocation = (locationId: ChapterTwoLocationId | null) => {
    updateState((current) => ({
      ...current,
      chapterTwo: {
        ...current.chapterTwo,
        focusedLocationId: locationId,
        sceneState: locationId ? "location_focus" : "planet_surface"
      }
    }));
  };

  const updateChapterTwoDisorder = (next: {
    disorderLevel?: number;
    mistakeCount?: number;
    pollutedRecords?: string[];
    statusNote?: string;
    repairReadingDelta?: Partial<ChapterTwoRepairReadings>;
    repairReadingSource?: string;
    repairReadingNote?: string;
  }) => {
    updateState((current) => {
      const nextRepairReadingState = addChapterTwoRepairReadingLog({
        repairReadings: current.chapterTwo.repairReadings,
        repairReadingLogs: current.chapterTwo.repairReadingLogs,
        delta: next.repairReadingDelta,
        source: next.repairReadingSource,
        note: next.repairReadingNote
      });
      const nextDisorderLevel = typeof next.disorderLevel === "number" ? next.disorderLevel : current.chapterTwo.disorderLevel;
      const nextMistakeCount = typeof next.mistakeCount === "number" ? next.mistakeCount : current.chapterTwo.mistakeCount;
      const nextSystemReadings = createChapterTwoSystemReadings({
        repairReadings: nextRepairReadingState.repairReadings,
        disorderLevel: nextDisorderLevel,
        mistakeCount: nextMistakeCount,
        exploredLocationIds: current.chapterTwo.exploredLocationIds,
        blackBoxUnlocked: current.chapterTwo.blackBoxUnlocked
      });
      const shouldWriteSettlement = Boolean(next.repairReadingDelta && next.repairReadingSource);
      const blackboxSettlement = shouldWriteSettlement
        ? createChapterTwoSettlementLog({
            scope: "blackbox",
            sourceId: "blackbox-trial",
            sourceName: next.repairReadingSource ?? "黑匣试炼",
            readings: nextSystemReadings
          })
        : null;

      return {
        ...current,
        chapterTwo: {
          ...current.chapterTwo,
          disorderLevel: nextDisorderLevel,
          mistakeCount: nextMistakeCount,
          pollutedRecords: Array.isArray(next.pollutedRecords) ? next.pollutedRecords : current.chapterTwo.pollutedRecords,
          repairReadings: nextRepairReadingState.repairReadings,
          repairReadingLogs: nextRepairReadingState.repairReadingLogs,
          systemReadings: nextSystemReadings,
          settlementLogs: blackboxSettlement ? [blackboxSettlement, ...current.chapterTwo.settlementLogs].slice(0, 16) : current.chapterTwo.settlementLogs
        },
        shipStatusNote: next.statusNote ?? current.shipStatusNote
      };
    });
  };

  const useChapterTwoCrewAssist = (request: ChapterTwoCrewAssistRequest) => {
    updateState((current) => {
      if (current.chapterTwo.crewAssistRecords.some((record) => record.targetId === request.targetId)) {
        return current;
      }

      const crew =
        current.crewRoster.find((member) => member.id === request.crewId) ??
        current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId) ??
        current.crewRoster.find((member) => member.id === current.activeCrewId) ??
        current.generatedCrew;
      const createdAt = Date.now();
      const record: ChapterTwoCrewAssistRecord = {
        id: `crew-assist-${request.targetId}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
        targetId: request.targetId,
        targetName: request.targetName,
        crewId: request.crewId ?? crew?.id ?? null,
        crewName: request.crewName ?? crew?.name ?? "同行船员",
        abilityKind: request.abilityKind,
        hint: request.hint,
        createdAt
      };

      return {
        ...current,
        chapterTwo: {
          ...current.chapterTwo,
          crewAssistRecords: [record, ...current.chapterTwo.crewAssistRecords].slice(0, 16)
        },
        shipStatusNote: `${record.crewName} 在${record.targetName}留下了一次同行提示。`
      };
    });
  };

  const resolveChapterTwoFakeCrewSignal = () => {
    updateState((current) => {
      const createdAt = Date.now();
      const nextDisorderLevel = Math.max(0, current.chapterTwo.disorderLevel - 1);
      const blackBoxUnlocked = chapterTwoUnlockLocationIds.every((id) => current.chapterTwo.exploredLocationIds.includes(id));
      const repairReadingState = addChapterTwoRepairReadingLog({
        repairReadings: current.chapterTwo.repairReadings,
        repairReadingLogs: current.chapterTwo.repairReadingLogs,
        delta: {
          evidenceIntegrity: 1,
          unknownMarking: 1,
          boundaryAwareness: 1
        },
        source: "异常通讯审查",
        note: "异常船员通讯已封存：识别码和熟悉口吻被确认是伪装材料，衡灯为阻断黑匣牵引而熄灭。",
        createdAt
      });
      const nextSystemReadings = createChapterTwoSystemReadings({
        repairReadings: repairReadingState.repairReadings,
        disorderLevel: nextDisorderLevel,
        mistakeCount: current.chapterTwo.mistakeCount,
        exploredLocationIds: current.chapterTwo.exploredLocationIds,
        blackBoxUnlocked
      });
      const settlement = createChapterTwoSettlementLog({
        scope: "blackbox",
        sourceId: "blackbox-trial",
        sourceName: "异常通讯审查",
        readings: nextSystemReadings,
        createdAt
      });

      return {
        ...current,
        chapterTwo: {
          ...current.chapterTwo,
          fakeCrewSignalResolved: true,
          blackBoxUnlocked,
          focusedLocationId: null,
          sceneState: "planet_surface",
          disorderLevel: nextDisorderLevel,
          pollutedRecords: [],
          repairReadings: repairReadingState.repairReadings,
          repairReadingLogs: repairReadingState.repairReadingLogs,
          systemReadings: nextSystemReadings,
          settlementLogs: [settlement, ...current.chapterTwo.settlementLogs].slice(0, 16)
        },
        shipStatusNote: blackBoxUnlocked
          ? "异常通讯已封存：衡灯灯芯熄灭，黑匣外庭打开。"
          : "异常通讯已封存：识别码相符，但结论和行动建议必须继续复查。"
      };
    });
  };

  const exploreChapterTwoLocation = (locationId: ChapterTwoLocationId, payload?: ChapterTwoLocationCompletionPayload) => {
    updateState((current) => {
      const alreadyExplored = current.chapterTwo.exploredLocationIds.includes(locationId);
      const exploredLocationIds = current.chapterTwo.exploredLocationIds.includes(locationId)
        ? current.chapterTwo.exploredLocationIds
        : [...current.chapterTwo.exploredLocationIds, locationId];
      const coreFragmentsComplete = chapterTwoUnlockLocationIds.every((id) => exploredLocationIds.includes(id));
      const shouldTriggerFakeCrewSignal =
        !alreadyExplored &&
        coreFragmentsComplete &&
        !current.chapterTwo.fakeCrewSignalResolved &&
        locationId === "paper-corridor";
      const blackBoxUnlocked = coreFragmentsComplete && !shouldTriggerFakeCrewSignal && current.chapterTwo.fakeCrewSignalResolved;
      const location = chapterTwoSurfaceLocations.find((item) => item.id === locationId) ?? null;
      const createdAt = Date.now();
      const rewardPlan = !alreadyExplored ? chapterTwoLocationRewardPlans[locationId] ?? null : null;
      const repairReadingPlan = !alreadyExplored ? chapterTwoLocationRepairReadingPlans[locationId] ?? null : null;
      const repairReadingDelta = !alreadyExplored ? payload?.repairReadingDelta ?? repairReadingPlan?.delta : undefined;
      const repairReadingState = addChapterTwoRepairReadingLog({
        repairReadings: current.chapterTwo.repairReadings,
        repairReadingLogs: current.chapterTwo.repairReadingLogs,
        delta: repairReadingDelta,
        source: payload?.repairReadingSource ?? location?.name,
        note: payload?.repairReadingNote ?? repairReadingPlan?.note,
        createdAt
      });
      const repairReadingUpdated = repairReadingState.repairReadingLogs !== current.chapterTwo.repairReadingLogs;
      const locationRewards = rewardPlan ? createLocationRewards(locationId, rewardPlan, createdAt) : [];
      const rewardLabels = locationRewards.map((reward) => reward.label);
      const expeditionEffects = getHomePlanetExpeditionEffects(current);
      const leadCrew =
        current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId) ??
        current.crewRoster.find((member) => member.id === current.activeCrewId) ??
        current.generatedCrew;
      const evidenceLines = payload?.evidenceLines ?? [
        "可确认内容写入事实。",
        "只有迹象时写成推测。",
        "没有证据的位置保留未知。"
      ];
      const pollutionReviewLine =
        payload?.pollutedRecords && payload.pollutedRecords.length > 0
          ? `污染复盘段：${payload.pollutedRecords.join(" / ")}`
          : "污染复盘段：无";
      const writeEvidenceRecord = !alreadyExplored && locationId === "evidence-well";
      const writeRuleCard = writeEvidenceRecord && expeditionEffects.creationRuleCard;
      const writeCrewMemory = writeEvidenceRecord && expeditionEffects.memoryGardenBond && Boolean(leadCrew);
      const writeArchiveAppendix = writeEvidenceRecord && expeditionEffects.archiveExtraRecord;
      const plannedArchiveRecord =
        rewardPlan?.archiveRecord
          ? {
              id: `archive-location-reward-${locationId}-${createdAt}`,
              title: rewardPlan.archiveRecord.title,
              tag: rewardPlan.archiveRecord.tag,
              summary: rewardPlan.archiveRecord.summary,
              evidenceLines: rewardPlan.archiveRecord.evidenceLines,
              locationId,
              mistakeCount: payload?.mistakeCount,
              disorderLevel: payload?.finalDisorderLevel,
              createdAt
            }
          : null;
      const archiveRecord =
        writeEvidenceRecord
          ? {
              id: `archive-evidence-well-${createdAt}`,
              title: "证据回声井记录",
              tag: (payload?.mistakeCount ?? 0) > 0 ? "污染复盘" : "证据",
              summary:
                (payload?.mistakeCount ?? 0) > 0
                  ? "证据回声井曾出现污染扩散；修复后，缺少来源的内容被封为未知。"
                  : "证据回声井完成稳定扫描：事实、推测和未知被分开放回档案层。",
              evidenceLines: [
                ...evidenceLines,
                pollutionReviewLine,
                `误触次数：${payload?.mistakeCount ?? 0}`,
                `最终失序强度：${payload?.finalDisorderLevel ?? current.chapterTwo.disorderLevel}/6`
              ],
              locationId,
              mistakeCount: payload?.mistakeCount,
              disorderLevel: payload?.finalDisorderLevel,
              createdAt
            }
          : null;
      const archiveAppendixRecord =
        writeArchiveAppendix
          ? {
              id: `archive-evidence-well-appendix-${createdAt}`,
              title: (payload?.mistakeCount ?? 0) > 0 ? "证据回声井污染复盘附录" : "证据回声井证据附录",
              tag: (payload?.mistakeCount ?? 0) > 0 ? "错误复盘" : "证据校准",
              summary:
                (payload?.mistakeCount ?? 0) > 0
                  ? "档案馆额外保存误触后的修复路径，标明污染如何被压回稳定区。"
                  : "档案馆额外保存证据分类路径，方便下一次远征复用。",
              evidenceLines: [
                payload?.crewIntervention ? `船员介入：${payload.crewIntervention}` : "船员介入：主舰基础引导",
                pollutionReviewLine,
                `保留规则：事实归事实，推测归推测，未知保持未知。`,
                `最终失序强度：${payload?.finalDisorderLevel ?? current.chapterTwo.disorderLevel}/6`
              ],
              locationId,
              mistakeCount: payload?.mistakeCount,
              disorderLevel: payload?.finalDisorderLevel,
              createdAt: createdAt + 1
            }
          : null;
      const ruleCard =
        writeRuleCard
          ? {
              id: `rule-evidence-well-${createdAt}`,
              title: "表达规则卡：证据先行",
              body: "只根据残片整理；先列依据；缺失处写未知；最后按事实 / 推测 / 未知输出。",
              source: "证据回声井",
              createdAt
            }
          : null;
      const plannedRuleCard =
        rewardPlan?.ruleCard
          ? {
              id: `rule-location-reward-${locationId}-${createdAt}`,
              title: rewardPlan.ruleCard.title,
              body: rewardPlan.ruleCard.body,
              source: rewardPlan.ruleCard.source,
              createdAt
            }
          : null;
      const updatedCrew =
        (writeCrewMemory || rewardPlan?.crewTrust) && leadCrew
          ? updateCrewState(current, leadCrew.id, (member) => {
              const trustGain = (writeCrewMemory ? 2 : 0) + (rewardPlan?.crewTrust ?? 0);
              const trustLevel = member.trustLevel + trustGain;
              const dossierEntries = [
                writeCrewMemory ? createEvidenceWellDossier(member, true) : null,
                rewardPlan?.crewTrust && location ? createChapterTwoRewardDossier(member, location.name, rewardLabels[0] ?? "远征奖励") : null,
                ...member.dossierEntries
              ].filter(Boolean) as CrewDossierEntry[];

              return {
                ...member,
                trustLevel,
                trustLabel: getTrustLabel(trustLevel),
                bondStatus: rewardPlan?.crewTrust && location ? `${location.name}共同经历已归档` : "证据井共同经历已归档",
                dossierEntries: dossierEntries.slice(0, 8)
              };
            })
          : {};
      const shipLog =
        !alreadyExplored && location
          ? createChapterTwoLocationLog({
              title: location.name,
              summary: location.discovery,
              fragmentLabel: location.fragmentName,
              tag: location.role === "landmark" ? "文明地标" : "导览记录",
              mistakeCount: payload?.mistakeCount,
              disorderLevel: payload?.finalDisorderLevel,
              rewards: rewardLabels
            })
          : null;
      const effectNotes = [
        archiveRecord ? "母星档案馆新增“证据回声井记录”。" : null,
        archiveAppendixRecord ? "档案馆额外保存一条复盘附录。" : null,
        plannedArchiveRecord ? "母星档案馆新增地点回流记录。" : null,
        ruleCard || plannedRuleCard ? "规则卡已写入母星。" : null,
        writeCrewMemory || rewardPlan?.crewTrust ? "同行共同经历已写入。" : null,
        repairReadingUpdated ? "飞船修复读数已校准。" : null,
        rewardPlan?.technologyPoints ? `科技点 +${rewardPlan.technologyPoints}。` : null
      ].filter(Boolean);
      const locationStatusNote =
        [
          blackBoxUnlocked
            ? "四处文明遗迹已接通，科技黑匣开始回应。"
            : locationId === "evidence-well"
              ? "证据碎片已回流：没有证据的位置保持未知。"
              : rewardPlan?.statusNote ?? current.shipStatusNote,
          ...effectNotes
        ]
          .filter(Boolean)
          .join(" ");
      const nextArchiveRecords = [archiveRecord, archiveAppendixRecord, plannedArchiveRecord, ...current.homePlanetHub.archiveRecords]
        .filter(Boolean)
        .slice(0, 12) as GameState["homePlanetHub"]["archiveRecords"];
      const nextRuleCards = [ruleCard, plannedRuleCard, ...current.homePlanetHub.ruleCards]
        .filter(Boolean)
        .slice(0, 12) as GameState["homePlanetHub"]["ruleCards"];
      const nextTechnologyPoints = current.technologyPoints + (rewardPlan?.technologyPoints ?? 0);
      const resourceDelta = rewardPlan?.resources ?? {};
      const nextHomeResources =
        rewardPlan
          ? {
              ...current.homePlanetHub.resources,
              water: current.homePlanetHub.resources.water + (resourceDelta.water ?? 0),
              minerals: current.homePlanetHub.resources.minerals + (resourceDelta.minerals ?? 0),
              energy: current.homePlanetHub.resources.energy + (resourceDelta.energy ?? 0),
              fragments: current.homePlanetHub.resources.fragments + (resourceDelta.fragments ?? 0),
              techPoints: nextTechnologyPoints
            }
          : current.homePlanetHub.resources;
      const nextRewardClaims =
        rewardPlan && location
          ? [
              {
                locationId,
                locationName: location.name,
                rewards: locationRewards,
                createdAt
              },
              ...current.chapterTwo.locationRewardClaims
            ].slice(0, 12)
          : current.chapterTwo.locationRewardClaims;
      const nextDisorderLevel = typeof payload?.finalDisorderLevel === "number" ? payload.finalDisorderLevel : current.chapterTwo.disorderLevel;
      const nextMistakeCount = typeof payload?.mistakeCount === "number" ? payload.mistakeCount : current.chapterTwo.mistakeCount;
      const nextSystemReadings = createChapterTwoSystemReadings({
        repairReadings: repairReadingState.repairReadings,
        disorderLevel: nextDisorderLevel,
        mistakeCount: nextMistakeCount,
        exploredLocationIds,
        blackBoxUnlocked
      });
      const locationSettlement =
        !alreadyExplored && location
          ? createChapterTwoSettlementLog({
              scope: "location",
              sourceId: locationId,
              sourceName: location.name,
              readings: nextSystemReadings,
              createdAt
            })
          : null;
      const locationCrewAssistRecord = current.chapterTwo.crewAssistRecords.find((record) => record.targetId === locationId) ?? null;
      const expeditionArchiveRecord =
        !alreadyExplored && location
          ? createLocationExpeditionArchiveRecord({
              locationId,
              location,
              rewardLabels,
              resourceDelta,
              technologyPoints: rewardPlan?.technologyPoints ?? 0,
              repairReadingNote: payload?.repairReadingNote ?? repairReadingPlan?.note,
              evidenceLines,
              crewAssistRecord: locationCrewAssistRecord,
              leadCrew,
              crewIntervention: payload?.crewIntervention,
              systemReadings: nextSystemReadings,
              mistakeCount: nextMistakeCount,
              disorderLevel: nextDisorderLevel,
              createdAt
            })
          : null;
      const nextArchiveRecordsWithExpedition = mergeHomePlanetArchiveRecords(nextArchiveRecords, [expeditionArchiveRecord]);
      const nextRewardClaimsWithSettlement =
        locationSettlement
          ? [
              {
                locationId,
                locationName: location?.name ?? locationId,
                rewards: locationRewards,
                settlement: locationSettlement,
                createdAt
              },
              ...current.chapterTwo.locationRewardClaims
            ].slice(0, 12)
          : nextRewardClaims;

      return {
        ...current,
        ...updatedCrew,
        technologyPoints: nextTechnologyPoints,
        chapterTwo: {
          ...current.chapterTwo,
          exploredLocationIds,
          focusedLocationId: blackBoxUnlocked || shouldTriggerFakeCrewSignal ? null : locationId,
          disorderLevel: nextDisorderLevel,
          mistakeCount: nextMistakeCount,
          pollutedRecords: Array.isArray(payload?.pollutedRecords) ? payload.pollutedRecords : current.chapterTwo.pollutedRecords,
          locationRewardClaims: nextRewardClaimsWithSettlement,
          repairReadings: repairReadingState.repairReadings,
          repairReadingLogs: repairReadingState.repairReadingLogs,
          systemReadings: nextSystemReadings,
          settlementLogs: locationSettlement ? [locationSettlement, ...current.chapterTwo.settlementLogs].slice(0, 16) : current.chapterTwo.settlementLogs,
          blackBoxUnlocked,
          sceneState: shouldTriggerFakeCrewSignal ? "fake_crew_signal" : blackBoxUnlocked ? "planet_surface" : "location_focus"
        },
        homePlanetHub:
          archiveRecord || archiveAppendixRecord || plannedArchiveRecord || expeditionArchiveRecord || ruleCard || plannedRuleCard || rewardPlan
            ? {
                ...current.homePlanetHub,
                resources: nextHomeResources,
                archiveRecords: nextArchiveRecordsWithExpedition,
                ruleCards: nextRuleCards
              }
            : current.homePlanetHub,
        shipLogs: shipLog ? appendShipLog(current, shipLog) : current.shipLogs,
        shipStatusNote: shouldTriggerFakeCrewSignal ? "同行信标突然回连，但通讯语气出现异常。先审查，再行动。" : locationStatusNote
      };
    });
  };

  const startChapterTwoMission = async () => {
    const current = normalizeGameState(safeState);
    if (current.chapterTwo.echo && current.chapterTwo.truth && !current.chapterTwoComplete) {
      const expeditionEffects = getHomePlanetExpeditionEffects(current);
      updateState((stateCurrent) => ({
        ...stateCurrent,
        currentScene: "chapter-two-mission",
        chapterTwo: {
          ...stateCurrent.chapterTwo,
          sceneState: stateCurrent.chapterTwo.sceneState ?? "ship_bridge",
          baseEffectNotes: stateCurrent.chapterTwo.baseEffectNotes.length > 0 ? stateCurrent.chapterTwo.baseEffectNotes : expeditionEffects.notes,
          baseScanHints: stateCurrent.chapterTwo.baseScanHints.length > 0 ? stateCurrent.chapterTwo.baseScanHints : expeditionEffects.scanHints
        },
        shipStatusNote: stateCurrent.chapterTwo.lastSetback?.statusNote ?? "语言与信息文明星的科技黑匣仍在等待开启。"
      }));
      return;
    }

    const activeCrew = current.crewRoster.find((member) => member.id === current.activeCrewId) ?? current.generatedCrew ?? null;
    const motherPlanet = current.signalMission.planet.confirmedModel ?? current.planetCatalog[0] ?? null;
    const motherPlanetName = motherPlanet?.name ?? "第一母星";
    const echo = createLanguageCivilizationEcho(motherPlanetName, activeCrew);
    const truth = createLanguageCivilizationTruth(activeCrew);
    const expeditionEffects = getHomePlanetExpeditionEffects(current);
    const initialDisorderLevel = Math.max(0, emptyChapterTwoState().disorderLevel - expeditionEffects.disorderReduction);

    updateState((stateCurrent) => ({
      ...stateCurrent,
      currentScene: "chapter-two-mission",
      chapterTwoRouteLocked: true,
      chapterTwo: {
        ...emptyChapterTwoState(),
        currentStep: "response",
        sceneState: "ship_bridge",
        disorderLevel: initialDisorderLevel,
        mistakeCount: 0,
        pollutedRecords: [],
        baseEffectNotes: expeditionEffects.notes,
        baseScanHints: expeditionEffects.scanHints,
        echo,
        truth,
        leadCrewId: activeCrew?.id ?? null,
        supportCrewId: activeCrew?.id ?? null,
        leadDuty: truth.recommendedLeadDuty,
        supportDuty: truth.recommendedSupportDuty,
        roundOneFocus: truth.trueFocus,
        roundTwoRefinement: truth.preferredRefinement,
        roundTwoSupportMode: truth.preferredSupportMode
      },
      shipStatusNote:
        expeditionEffects.notes.length > 0
          ? `${motherPlanetName} 已完成基地准备：${expeditionEffects.notes.join(" ")}`
          : `${motherPlanetName} 已成为文明复兴母星，首次外部远征目标锁定：${languageCivilizationKnowledge.planetName}`
    }));
  };

  const advanceChapterTwoStep = () => {
    updateState((current) => {
      const nextStep = current.chapterTwo.currentStep === "response" ? "assign" : current.chapterTwo.currentStep;
      const nextSceneState =
        nextStep === "assign"
          ? "memory_archive"
          : current.chapterTwo.sceneState;

      return {
        ...current,
        chapterTwo: {
          ...current.chapterTwo,
          currentStep: nextStep,
          sceneState: nextSceneState,
          focusedLocationId: nextStep === "assign" ? "blackbox-vault" : current.chapterTwo.focusedLocationId
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
    const prompt = current.chapterTwo.responsePrompt.trim();
    const score = scoreLanguageUnderstanding(prompt);

    const responseAnalysis = await runOperation({
      id: "chapter-two-response",
      handler: async () => ({
        sourceText: prompt,
        extractedKeywords: [
          score.evidence ? "证据" : null,
          score.prediction ? "推测" : null,
          score.boundary ? "边界" : null,
          score.clarity ? "清楚目标" : null
        ].filter(Boolean) as string[],
        inferredFocus: "身份线索" as ChapterTwoFocus,
        pathSummary: score.passed
          ? "你的转述已经抓到语言模型的关键：它会根据语境推测和组织表达，但不等于真正理解世界，所以需要证据、目标和边界。"
          : "这段转述还不够清楚。黑匣需要你说出：它依靠什么推测、为什么会错、使用时要给什么边界。",
        crewFit: "船员会把你的转述写入黑匣校准层。说得越清楚，主舰 AI 后续越能理解你的意图。",
        riskHint: score.passed ? "可以进入应用修复。" : "如果只说“它很聪明”或“它能聊天”，黑匣不会开启。"
      }),
      fallback: async () => ({
        sourceText: prompt,
        extractedKeywords: ["证据", "推测", "边界"],
        inferredFocus: "身份线索" as ChapterTwoFocus,
        pathSummary: "你的转述已经被写入黑匣校准层。",
        crewFit: "船员完成了第一次校对。",
        riskHint: "继续进入应用修复。"
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
    const prompt = current.chapterTwo.roundOnePrompt.trim();
    const score = scoreLanguageApplication(prompt);

    const roundOneAnalysis = await runOperation({
      id: "chapter-two-round-one",
      handler: async () => ({
        sourceText: prompt,
        extractedKeywords: [
          score.hasTask ? "任务" : null,
          score.hasContext ? "语境" : null,
          score.hasBoundary ? "不编造边界" : null,
          score.hasOutput ? "输出格式" : null
        ].filter(Boolean) as string[],
        inferredFocus: "坐标结构" as ChapterTwoFocus,
        pathSummary: score.passed
          ? "这条指令能让文字模型知道要修复什么、根据什么修、不能编造什么，以及最后要怎样输出。"
          : "这条指令还像一句愿望。请补上任务对象、背景语境、不能编造的边界或输出格式，黑匣才能判断它可用。",
        crewFit: "语言黑匣正在检查你的提示词是否足够清楚。",
        riskHint: score.passed ? "应用修复可运行。" : "目标不清楚时，模型会给出看似合理但可能错误的修复。"
      }),
      fallback: async () => ({
        sourceText: prompt,
        extractedKeywords: ["任务", "语境", "边界"],
        inferredFocus: "坐标结构" as ChapterTwoFocus,
        pathSummary: "应用指令已通过黑匣初检。",
        crewFit: "船员协助锁定了可用表达。",
        riskHint: "准备运行应用修复。"
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
    const analysis = current.chapterTwo.roundOneAnalysis;

    if (!analysis) {
      return;
    }
    const score = scoreLanguageApplication(current.chapterTwo.roundOnePrompt);

    const roundOneResult = await runOperation({
      id: "chapter-two-round-one",
      handler: async () => ({
        progress: score.passed ? "strong" as const : "shaky" as const,
        summary: score.passed ? "损坏档案被清晰提示词接住" : "档案只恢复了一部分",
        partialResponse: score.passed
          ? [
              "漂浮信件重新排成三列：原文残片 / 可确认信息 / 仍缺证据。",
              "黑匣没有补写未知内容，而是把缺口标出来，等待下一次验证。"
            ]
          : [
              "文字河流短暂成形，但几处空白被模型猜测性补全。",
              "黑匣提醒：表达目标仍不够清楚，可能产生看似合理的错误。"
            ],
        newQuestion: score.passed ? "最后挑战：请写出一条能让 AI 修复档案但不乱编的完整指令。" : "请在最后挑战里补清楚边界，否则黑匣不会完全打开。",
        keySignals: analysis.extractedKeywords,
        unlockedClue: score.passed ? "清楚提示词可以降低幻觉风险。" : "目标不清楚会放大幻觉风险。"
      }),
      fallback: async () => ({
        progress: "strong" as const,
        summary: "损坏档案被清晰提示词接住",
        partialResponse: ["漂浮信件重新排成可验证的信息层。"],
        newQuestion: "最后挑战：写出一条能让 AI 修复档案但不乱编的完整指令。",
        keySignals: analysis.extractedKeywords,
        unlockedClue: "清楚提示词可以降低幻觉风险。"
      })
    });

    updateState((stateCurrent) => {
      const repairReadingState = addChapterTwoRepairReadingLog({
        repairReadings: stateCurrent.chapterTwo.repairReadings,
        repairReadingLogs: stateCurrent.chapterTwo.repairReadingLogs,
        delta: createRepairReadingsFromPrompt(score),
        source: "黑匣损坏档案修复",
        note: score.passed ? "损坏档案修复指令写入清楚目标和边界。" : "损坏档案修复指令只写入部分可用读数。"
      });
      const nextSystemReadings = createChapterTwoSystemReadings({
        repairReadings: repairReadingState.repairReadings,
        disorderLevel: stateCurrent.chapterTwo.disorderLevel,
        mistakeCount: stateCurrent.chapterTwo.mistakeCount,
        exploredLocationIds: stateCurrent.chapterTwo.exploredLocationIds,
        blackBoxUnlocked: stateCurrent.chapterTwo.blackBoxUnlocked
      });
      const settlementLog = createChapterTwoSettlementLog({
        scope: "blackbox",
        sourceId: "blackbox-trial",
        sourceName: "黑匣损坏档案修复",
        readings: nextSystemReadings
      });

      return {
        ...stateCurrent,
        chapterTwo: {
          ...stateCurrent.chapterTwo,
          currentStep: "round-two",
          sceneState: "boss_trial",
          roundOneResult,
          roundTwoRefinement: stateCurrent.chapterTwo.roundTwoRefinement ?? "强化区域描述",
          roundTwoSupportMode: stateCurrent.chapterTwo.roundTwoSupportMode ?? "让支援船员介入",
          repairReadings: repairReadingState.repairReadings,
          repairReadingLogs: repairReadingState.repairReadingLogs,
          systemReadings: nextSystemReadings,
          settlementLogs: [settlementLog, ...stateCurrent.chapterTwo.settlementLogs].slice(0, 16)
        }
      };
    });
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
    const prompt = current.chapterTwo.roundTwoPrompt.trim();
    const score = scoreLanguageApplication(prompt);
    const understanding = scoreLanguageUnderstanding(prompt);
    const passed = score.score + understanding.score >= 6;

    const roundTwoAnalysis = await runOperation({
      id: "chapter-two-round-two",
      handler: async () => ({
        sourceText: prompt,
        extractedKeywords: [
          ...(score.hasTask ? ["任务明确"] : []),
          ...(score.hasBoundary ? ["禁止编造"] : []),
          ...(understanding.boundary ? ["理解边界"] : []),
          ...(understanding.clarity ? ["目标清楚"] : [])
        ],
        inferredFocus: "异常语气" as ChapterTwoFocus,
        pathSummary: passed
          ? "你的最终指令同时说明了任务、资料边界和验证方式，黑匣判断这是一条可用于文明档案修复的有效表达。"
          : "最终指令还缺少关键部分。请明确：修复对象是什么、只能依据哪些信息、遇到缺口如何标注、输出结果要怎样组织。",
        crewFit: "科技黑匣正在用这条指令校准主舰 AI 的理解能力。",
        riskHint: passed ? "挑战可运行，黑匣有机会完全开启。" : "如果缺少边界，AI 很可能把猜测写成事实。"
      }),
      fallback: async () => ({
        sourceText: prompt,
        extractedKeywords: ["任务明确", "禁止编造", "目标清楚"],
        inferredFocus: "异常语气" as ChapterTwoFocus,
        pathSummary: "最终挑战指令已通过黑匣初检。",
        crewFit: "主舰 AI 正在记录你的表达方式。",
        riskHint: "准备开启黑匣。"
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
    const roundOne = current.chapterTwo.roundOneResult;
    const analysis = current.chapterTwo.roundTwoAnalysis;

    if (!roundOne || !analysis) {
      return;
    }
    const score = scoreLanguageApplication(current.chapterTwo.roundTwoPrompt);
    const understanding = scoreLanguageUnderstanding(current.chapterTwo.roundTwoPrompt);
    const totalScore = score.score + understanding.score;

    const roundTwoResult = await runOperation({
      id: "chapter-two-round-two",
      handler: async () => {
        const outcomeType = totalScore >= 6 ? "breakthrough" as const : totalScore >= 4 ? "partial" as const : "soft-fail" as const;
        return {
          outcomeType,
          summary:
            outcomeType === "breakthrough"
              ? "语言模型黑匣开始完全解锁"
              : outcomeType === "partial"
                ? "黑匣开启了一半，仍保留警戒层"
                : "黑匣拒绝完全开启",
          resolvedResponse:
            outcomeType === "soft-fail"
              ? ["黑匣回声：你的指令仍可能诱发编造。请补充资料边界和验证方式。"]
              : [
                  "黑匣回声：清楚目标、提供语境、说明限制、要求验证。",
                  "文字河流重新变清，第一段文明档案被归入主舰。"
                ],
          revealedLink: "前文明把文字模型当作文明记忆的整理器，但最终也学会了给它设边界。",
          recommendation:
            outcomeType === "breakthrough"
              ? "可以将这项能力写入主舰 AI：更好理解你的自然语言指令。"
              : "可以获得部分科技点，但建议稍后重试，把表达边界补得更清楚。",
          keySignals: analysis.extractedKeywords,
          setback:
            outcomeType === "soft-fail"
              ? {
                  title: "黑匣校验失败",
                  summary: "最终指令没有清楚说明资料边界，模型可能把猜测当事实。",
                  learnedClue: "语言模型需要清楚目标、上下文和不能编造的边界。",
                  reasonHint: "只说“帮我修复”还不够，需要告诉它修复什么、依据什么、如何标注未知。",
                  crewHint: "让记录型或领航型船员协助检查表达是否清楚。",
                  strategyHint: "重写挑战指令时加入：只根据给出的残片、缺失处标注未知、分点输出。",
                  statusNote: "语言黑匣仍在等待更清楚的最终指令。"
                }
              : null
        };
      },
      fallback: async () => ({
        outcomeType: "breakthrough" as const,
        summary: "语言模型黑匣开始完全解锁",
        resolvedResponse: ["黑匣回声：清楚目标、提供语境、说明限制、要求验证。"],
        revealedLink: "前文明把文字模型当作文明记忆的整理器。",
        recommendation: "可以将这项能力写入主舰 AI。",
        keySignals: analysis.extractedKeywords,
        setback: null
      })
    });

    updateState((stateCurrent) => {
      const repairReadingState = addChapterTwoRepairReadingLog({
        repairReadings: stateCurrent.chapterTwo.repairReadings,
        repairReadingLogs: stateCurrent.chapterTwo.repairReadingLogs,
        delta: createRepairReadingsFromPrompt(score, understanding),
        source: "黑匣最终指令校验",
        note: roundTwoResult.outcomeType === "soft-fail" ? "最终指令仍有缺口，只写入已确认读数。" : "最终指令通过资料边界和输出格式校验。"
      });
      const nextSystemReadings = createChapterTwoSystemReadings({
        repairReadings: repairReadingState.repairReadings,
        disorderLevel: stateCurrent.chapterTwo.disorderLevel,
        mistakeCount: stateCurrent.chapterTwo.mistakeCount,
        exploredLocationIds: stateCurrent.chapterTwo.exploredLocationIds,
        blackBoxUnlocked: stateCurrent.chapterTwo.blackBoxUnlocked
      });
      const settlementLog = createChapterTwoSettlementLog({
        scope: "blackbox",
        sourceId: "blackbox-trial",
        sourceName: "黑匣最终指令校验",
        readings: nextSystemReadings
      });

      return {
        ...stateCurrent,
        chapterTwo: {
          ...stateCurrent.chapterTwo,
          currentStep: "decision",
          sceneState: "chapter_reward",
          roundTwoResult,
          lastSetback: roundTwoResult.setback,
          repairReadings: repairReadingState.repairReadings,
          repairReadingLogs: repairReadingState.repairReadingLogs,
          systemReadings: nextSystemReadings,
          settlementLogs: [settlementLog, ...stateCurrent.chapterTwo.settlementLogs].slice(0, 16)
        }
      };
    });
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
    const leadCrew =
      current.crewRoster.find((member) => member.id === current.chapterTwo.leadCrewId) ??
      current.crewRoster.find((member) => member.id === current.activeCrewId) ??
      current.generatedCrew;
    const supportCrew = current.crewRoster.find((member) => member.id === current.chapterTwo.supportCrewId) ?? leadCrew;
    const roundTwo = current.chapterTwo.roundTwoResult ?? {
      outcomeType: "breakthrough" as const,
      summary: "语言与信息文明星的科技黑匣完成基础开启，四束文明碎片被重新接入星球光脉。",
      resolvedResponse: [
        "档案塔、漂浮信件港、刻字山谷和纸光回廊已经恢复基础回路。",
        "黑匣把第一层语言文明记录写回主舰。"
      ],
      revealedLink: "言衡星基础运转恢复，信息光路重新连向主舰。",
      recommendation: "科技点 +1：飞船 AI 的语言理解模块获得第一层文明黑匣校准。",
      keySignals: ["归档碎片", "传递碎片", "求证碎片", "表达碎片"],
      setback: null
    };
    const finalChoice = current.chapterTwo.finalChoice ?? "记录后返航";

    if (!leadCrew || !supportCrew || roundTwo.outcomeType === "soft-fail" || !finalChoice) {
      return;
    }
    const technologyPointsAwarded = 1;
    const crewAssistRecords = current.chapterTwo.crewAssistRecords;
    const finalSystemReadings = createChapterTwoSystemReadings({
      repairReadings: current.chapterTwo.repairReadings,
      disorderLevel: current.chapterTwo.disorderLevel,
      mistakeCount: current.chapterTwo.mistakeCount,
      exploredLocationIds: current.chapterTwo.exploredLocationIds,
      blackBoxUnlocked: true
    });
    const chapterSettlementLog = createChapterTwoSettlementLog({
      scope: "chapter",
      sourceId: "blackbox-trial",
      sourceName: "言衡星最终回流",
      readings: finalSystemReadings
    });
    const finalSettlementLogs = [chapterSettlementLog, ...current.chapterTwo.settlementLogs].slice(0, 16);
    const resourceSalvageSummary = `船员飞船完成一次性残骸回收：水源 +${languagePlanetResourceReward.water} / 矿物 +${languagePlanetResourceReward.minerals} / 能源 +${languagePlanetResourceReward.energy} / 文明碎片 +${languagePlanetResourceReward.fragments}`;
    const outcome: ChapterTwoOutcome = {
      title: roundTwo.outcomeType === "breakthrough" ? "第一枚科技黑匣已开启" : "科技黑匣部分开启",
      summary:
        roundTwo.outcomeType === "breakthrough"
          ? current.chapterTwo.roundTwoResult
            ? "你用自己的话解释了语言模型的能力边界，又用清楚指令修复了损坏档案。衡灯的长明火散入言衡星，第一段文明记忆被带回主舰。"
            : "你点亮四个文明地标，击退失序回声，开启语言黑匣，找回了前文明留下的最后一封信。船员飞船随后完成第一次残骸回收。"
          : "你带回了语言模型黑匣的一部分知识。主舰 AI 已能更好理解清楚表达，但仍保留一层校验提示。",
      worldChange: "语言与信息文明星：基础运转恢复。档案塔亮起，信件港光轨恢复，刻字山谷文字河重新流动，纸光回廊展开。资源残骸由船员飞船完成一次性牵引回收。",
      chapterThreeHook: "主舰已获得第一项文明技术。更远处的星球仍在沉睡。",
      scannedZone: languageCivilizationKnowledge.scannedZone,
      logSummary: `第二章成果已归档：言衡星复苏、语言黑匣开启、失序回声击退、科技点 +1。${resourceSalvageSummary}。`,
      leadDossierNote: `${leadCrew.name} 的坠毁前同行记录与黑匣区回连记录已保留。最后一段防御协助写入船员档案。`,
      supportDossierNote:
        supportCrew.id === leadCrew.id
          ? `${supportCrew.name} 在黑匣区重新回连，异常通讯已作为伪装信号封存。`
          : `${supportCrew.name} 在黑匣区重新回连，协助完成一次性残骸牵引。异常通讯已作为伪装信号封存。`,
      planetName: languageCivilizationKnowledge.planetName,
      blackBoxTitle: "语言黑匣",
      technologyPointsAwarded,
      aiUpgrade: "语言黑匣已写入。以后，我会更努力听清你的意思。但我也会提醒你：不要让我替你思考。",
      civilizationRecord: "前文明曾用文字模型整理信件、档案与知识，但他们留下警告：相似表达不是事实，生成结果必须验证。",
      blackBoxKnowledge: [
        "区分事实、推测和未知。",
        "把指令说清楚：对象、任务、限制、输出形式。",
        "识别看起来正确的错误。",
        "用自己的话表达理解。"
      ],
      defeatedEcho: true,
      fragments: ["归档碎片", "传递碎片", "求证碎片", "表达碎片"],
      unlockedModule: "语言理解 Level 1",
      titleEarned: "第一位黑匣解读者",
      finalLetter: [
        "我们曾经拥有无数答案。",
        "却忘了怎样提出问题。",
        "后来者，不要复制我们的失败。",
        "让 AI 帮助你，而不是替代你。"
      ],
      repairReadings: current.chapterTwo.repairReadings,
      repairReadingLogs: current.chapterTwo.repairReadingLogs,
      systemReadings: finalSystemReadings,
      settlementLogs: finalSettlementLogs,
      crewAssistUsed: crewAssistRecords.length > 0,
      crewAssistSummary: createCrewAssistSummary(crewAssistRecords),
      crewAssistRecords,
      completedAt: Date.now()
    };
    const shipLog = createChapterTwoShipLog(outcome);
    const leadDossierEntry = createChapterTwoDossier(leadCrew, outcome);
    const supportDossierEntry = supportCrew.id === leadCrew.id ? leadDossierEntry : createChapterTwoDossier(supportCrew, outcome);

    const completion = await runOperation({
      id: "chapter-two-complete",
      handler: async () => ({
        outcome,
        shipLog,
        leadDossierEntry,
        supportDossierEntry
      }),
      fallback: async () => ({
        outcome,
        shipLog,
        leadDossierEntry,
        supportDossierEntry
      })
    });

    updateState((stateCurrent) => {
      const updated = updateMultipleCrew(stateCurrent, Array.from(new Set([leadCrew.id, supportCrew.id])), (member) => {
        const trustBoost = member.id === leadCrew.id ? 2 : 1;
        const trustLevel = member.trustLevel + trustBoost;
        const dossierEntry = member.id === leadCrew.id ? completion.leadDossierEntry : completion.supportDossierEntry;

        return {
          ...member,
          trustLevel,
          trustLabel: getTrustLabel(trustLevel),
          bondStatus: member.id === leadCrew.id ? "开启语言模型黑匣" : "协助黑匣边界校验",
          dossierEntries: [dossierEntry, ...member.dossierEntries].slice(0, 8)
        };
      });
      const blackboxArchiveRecord = createBlackboxExpeditionArchiveRecord({
        outcome: completion.outcome,
        leadCrew,
        supportCrew,
        createdAt: completion.outcome.completedAt ?? Date.now()
      });

      return {
        ...stateCurrent,
        ...updated,
        currentScene: "chapter-two-result",
        activeCrewId: leadCrew.id,
        chapterTwoComplete: true,
        chapterThreeHintUnlocked: true,
        scannedRegionLabel: completion.outcome.scannedZone,
        technologyPoints: stateCurrent.technologyPoints + (completion.outcome.technologyPointsAwarded ?? 0),
        aiCapabilityLevel: stateCurrent.aiCapabilityLevel + 1,
        aiCapabilityUnlocks: Array.from(new Set([...stateCurrent.aiCapabilityUnlocks, "语言理解 Level 1", "清晰指令校验"])),
        chapterTwo: {
          ...stateCurrent.chapterTwo,
          currentStep: "decision",
          sceneState: "chapter_reward",
          systemReadings: completion.outcome.systemReadings ?? stateCurrent.chapterTwo.systemReadings,
          settlementLogs: completion.outcome.settlementLogs ?? stateCurrent.chapterTwo.settlementLogs,
          outcome: completion.outcome
        },
        homePlanetHub: {
          ...stateCurrent.homePlanetHub,
          resources: {
            ...awardLanguagePlanetResources(stateCurrent.homePlanetHub.resources),
            techPoints: stateCurrent.technologyPoints + (completion.outcome.technologyPointsAwarded ?? 0)
          },
          archiveRecords: mergeHomePlanetArchiveRecords(stateCurrent.homePlanetHub.archiveRecords, [blackboxArchiveRecord])
        },
        shipStatusNote: `${completion.outcome.worldChange} ${resourceSalvageSummary}。远征归档卡已写入文明展厅。`,
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
          currentStep: action === "swap-crew" ? "assign" : "round-two",
          sceneState: action === "swap-crew" ? "memory_archive" : "boss_trial",
          responsePrompt: action === "swap-crew" ? "" : current.chapterTwo.responsePrompt,
          responseAnalysis: action === "swap-crew" ? null : current.chapterTwo.responseAnalysis,
          leadCrewId: action === "swap-crew" ? null : current.chapterTwo.leadCrewId,
          supportCrewId: action === "swap-crew" ? null : current.chapterTwo.supportCrewId,
          leadDuty: action === "swap-crew" ? null : current.chapterTwo.leadDuty,
          supportDuty: action === "swap-crew" ? null : current.chapterTwo.supportDuty,
          roundOneFocus: action === "swap-crew" ? null : current.chapterTwo.roundOneFocus,
          assignmentPrompt: action === "swap-crew" ? "" : current.chapterTwo.assignmentPrompt,
          assignmentAnalysis: action === "swap-crew" ? null : current.chapterTwo.assignmentAnalysis,
          roundOnePrompt: action === "swap-crew" ? "" : current.chapterTwo.roundOnePrompt,
          roundOneAnalysis: action === "swap-crew" ? null : current.chapterTwo.roundOneAnalysis,
          roundOneResult: action === "swap-crew" ? null : current.chapterTwo.roundOneResult,
          roundTwoPrompt: "",
          roundTwoAnalysis: null,
          roundTwoResult: null,
          roundTwoRefinement: current.chapterTwo.roundTwoRefinement ?? "强化区域描述",
          roundTwoSupportMode: current.chapterTwo.roundTwoSupportMode ?? "让支援船员介入",
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

  const importCrewPortrait = (crewId: string, asset: ClassroomImageAsset) => {
    updateState((current) => {
      const targetCrew = current.crewRoster.find((member) => member.id === crewId) ?? (current.generatedCrew?.id === crewId ? current.generatedCrew : null);

      if (!targetCrew) {
        return current;
      }

      const revision = Math.max(targetCrew.portraitAsset?.revision ?? 0, targetCrew.portraitEchoes[0]?.revision ?? 0) + 1;
      const portraitAsset = {
        imageUrl: asset.imageUrl,
        prompt: "external-import",
        providerId: "classroom-import",
        styleLabel: "外部导入图像",
        echoNote: "从外部工具导入的角色图。",
        updatedAt: asset.updatedAt,
        revision
      };
      const updated = updateCrewState(current, crewId, (member) => ({
        ...member,
        portraitAsset,
        portraitEchoes: [portraitAsset, ...member.portraitEchoes.filter((item) => item.revision !== revision)].slice(0, 6),
        dossierEntries: [
          {
            id: `${member.id}-portrait-import-${asset.updatedAt}`,
            title: "角色图像已归档",
            body: "外部生成好的角色图已导入主舰档案。",
            tag: "图像导入"
          },
          ...member.dossierEntries
        ].slice(0, 8)
      }));

      return {
        ...current,
        ...updated,
        classroomArtifacts: [
          {
            id: `crew-${crewId}-${asset.updatedAt}`,
            type: "crew" as const,
            ownerId: crewId,
            title: `${targetCrew.name} 的角色图`,
            imageAsset: asset,
            notes: "导入的船员形象。",
            updatedAt: asset.updatedAt
          },
          ...current.classroomArtifacts.filter((item) => item.id !== `crew-${crewId}-${asset.updatedAt}`)
        ].slice(0, 24),
        shipStatusNote: `${targetCrew.name} 的角色图已导入主舰档案。`
      };
    });
  };

  const importPlanetImage = (planetId: string, asset: ClassroomImageAsset) => {
    updateState((current) => {
      const updatePlanet = (planet: NonNullable<GameState["signalMission"]["planet"]["confirmedModel"]>) =>
        planet.id === planetId
          ? {
              ...planet,
              imageAsset: asset
            }
          : planet;
      const confirmedModel = current.signalMission.planet.confirmedModel
        ? updatePlanet(current.signalMission.planet.confirmedModel)
        : current.signalMission.planet.confirmedModel;
      const targetPlanet =
        current.signalMission.planet.confirmedModel?.id === planetId
          ? current.signalMission.planet.confirmedModel
          : current.planetCatalog.find((planet) => planet.id === planetId) ?? null;

      return {
        ...current,
        planetCatalog: current.planetCatalog.map(updatePlanet),
        classroomArtifacts: targetPlanet
          ? [
              {
                id: `planet-${planetId}-${asset.updatedAt}`,
                type: "planet" as const,
                ownerId: planetId,
                title: `${targetPlanet.name} 的星球图`,
                imageAsset: asset,
                notes: "导入的星球视觉档案。",
                updatedAt: asset.updatedAt
              },
              ...current.classroomArtifacts.filter((item) => item.id !== `planet-${planetId}-${asset.updatedAt}`)
            ].slice(0, 24)
          : current.classroomArtifacts,
        signalMission: {
          ...current.signalMission,
          planet: {
            ...current.signalMission.planet,
            confirmedModel
          }
        },
        shipStatusNote: targetPlanet ? `${targetPlanet.name} 的星球图已导入主舰档案。` : current.shipStatusNote
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
          ? "experience-result"
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
      shipStatusNote: "第一章已接入：先建立文明复兴母星，再从母星出发进入第二章远征。"
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
            `标志性建筑或景观：${stateCurrent.signalMission.planet.input.environment.trim() || "待补充"}`,
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
        currentScene: "experience-result",
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
        shipStatusNote: `旧资料补档第 ${attempt} 轮已接入：${nextRun.activeSeed?.title ?? "演算链"}`,
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
          bondStatus: "完成了一次旧资料补档演算",
          dossierEntries: [createFaultDossier(member, nextRun.result!), ...member.dossierEntries].slice(0, 8)
        };
      });

      return {
        ...updatedState,
        ...updatedCrew,
        currentScene: "signal-review",
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
            title: "旧资料补档完成",
            body: `${nextRun.result.summary} 旧资料处理台与历史记录已可调用。`,
            unlockedFeatures: [
              "旧资料处理台上线",
              "历史记录可查询",
              "后续任务可调用资料匹配",
              "飞船早期真相的一部分被找回"
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
      currentScene: "trial-result"
    }));
  };

  const openFirstExperienceResult = () => {
    updateState((current) => ({
      ...current,
      currentScene: "experience-result"
    }));
  };

  const continueToFaultReview = () => {
    updateState((current) => ({
      ...current,
      currentScene: "chapter-two-portal",
      chapterTwoUnlocked: true,
      newRegionAlert: true,
      signalMission: {
        ...current.signalMission,
        currentStage: "fault"
      },
      shipStatusNote: "第二章已转入外部远征：从母星出发，前往语言与信息文明星。"
    }));
  };

  const openChapterComplete = () => {
    updateState((stateCurrent) => ({
      ...stateCurrent,
      chapterComplete: true,
      currentScene: "chapter-complete"
    }));
  };

  const openTrialResult = () => {
    updateState((current) => ({
      ...current,
      currentScene: "trial-result"
    }));
  };

  const openParentSummary = () => {
    updateState((current) => ({
      ...current,
      currentScene: "parent-summary"
    }));
  };

  const createDemoPlanetIfNeeded = (current: GameState) => {
    if (current.signalMission.planet.confirmedModel) {
      return {
        planet: current.signalMission.planet.confirmedModel,
        signalMission: current.signalMission,
        planetCatalog: current.planetCatalog,
        shipLogs: current.shipLogs
      };
    }

    const demoInput: PlanetInputState = {
      name: "试听航标星",
      appearance: "像被浅蓝环带抱住的旧航标星，边缘有断裂的导航光痕。",
      environment: "地表有潮汐海、低空雾层和半埋的旧塔，适合作为第一次演示坐标。",
      mood: "神秘",
      notes: "跳转用的演示星球，会保留资源结构和导航坐标。"
    };
    const seed = current.signalMission.planet.seed;
    const analysis = analyzePlanetInput(demoInput, seed);
    const planet = buildPlanetModel({
      signalSeed: seed,
      planetInput: demoInput,
      analysis
    });
    const restoredZones: GameState["signalMission"]["restoredZones"] = current.signalMission.restoredZones.includes("planet")
      ? current.signalMission.restoredZones
      : [...current.signalMission.restoredZones, "planet"];

    return {
      planet,
      signalMission: {
        ...current.signalMission,
        currentStage: "fault" as const,
        restoredZones,
        unlocks: unlockAfterPlanet(current.signalMission.unlocks),
        planet: {
          ...current.signalMission.planet,
          status: "restored" as const,
          input: demoInput,
          analysis,
          confirmedModel: planet,
          unlockSummary: [
            "演示星球已写入星图",
            "导航盘恢复",
            "第二关入口可用"
          ]
        },
        faultRun: {
          ...current.signalMission.faultRun,
          status: current.signalMission.faultRun.status === "locked" ? "ready" as const : current.signalMission.faultRun.status
        }
      },
      planetCatalog: [planet, ...current.planetCatalog.filter((item) => item.id !== planet.id)],
      shipLogs: appendShipLog(current, createPlanetShipLog(planet))
    };
  };

  const startTrialFromBeginning = () => {
    setState(createInitialGameState());
  };

  const jumpToShipHub = () => {
    updateState((current) => ({
      ...current,
      currentScene: "hub",
      systemsRestored: true,
      shipStatusNote: "领航控制：主舰 Hub 已打开。"
    }));
  };

  const jumpToFirstLevel = () => {
    updateState((current) => {
      const crew = getActiveVaultCrew(current);

      if (!crew) {
        return {
          ...current,
          currentScene: "recruit",
          systemsRestored: true,
          shipStatusNote: "试听模式：先招募第一位船员，再进入第一关。"
        };
      }

      return {
        ...current,
        currentScene: "signal-mission",
        systemsRestored: true,
        crewOnboard: true,
        activeCrewId: crew.id,
        signalMission: {
          ...current.signalMission,
          currentStage: current.signalMission.planet.status === "restored" ? "planet" : "alert"
        },
        shipStatusNote: "试听模式：已跳到第一关入口。"
      };
    });
  };

  const jumpToSecondLevel = () => {
    updateState((current) => {
      const crew = getActiveVaultCrew(current);

      if (!crew) {
        return {
          ...current,
          currentScene: "recruit",
          systemsRestored: true,
          shipStatusNote: "试听模式：需要先有一位船员，才能进入文明远征。"
        };
      }

      const prepared = createDemoPlanetIfNeeded(current);

      return {
        ...current,
        currentScene: "chapter-two-portal",
        systemsRestored: true,
        crewOnboard: true,
        firstStarLit: true,
        chapterTwoUnlocked: true,
        newRegionAlert: true,
        activeCrewId: crew.id,
        planetCatalog: prepared.planetCatalog,
        shipLogs: prepared.shipLogs,
        signalMission: prepared.signalMission,
        shipStatusNote: "试听模式：已准备好第二章文明远征入口。"
      };
    });
  };

  const jumpToLanguagePortal = () => {
    jumpToSecondLevel();
  };

  const jumpToLanguageSurface = () => {
    updateState((current) =>
      prepareChapterTwoTeacherState(current, {
        currentStep: "response",
        sceneState: "planet_surface",
        focusedLocationId: null,
        shipStatusNote: "领航控制：已写入言衡星地表入口。"
      })
    );
  };

  const prepareChapterTwoTeacherState = (
    current: GameState,
    options: {
      currentStep: GameState["chapterTwo"]["currentStep"];
      sceneState: ChapterTwoSceneState;
      focusedLocationId?: ChapterTwoLocationId | null;
      exploredAll?: boolean;
      shipStatusNote: string;
    }
  ) => {
    const crew = getActiveVaultCrew(current);

    if (!crew) {
      return {
        ...current,
        currentScene: "recruit" as const,
        systemsRestored: true,
        shipStatusNote: "领航控制：需要先有一位船员，才能继续第二章。"
      };
    }

    const prepared = createDemoPlanetIfNeeded(current);
    const preparedForEffects = {
      ...current,
      signalMission: prepared.signalMission,
      planetCatalog: prepared.planetCatalog
    };
    const expeditionEffects = getHomePlanetExpeditionEffects(preparedForEffects);
    const motherPlanetName = prepared.planet.name ?? "第一母星";
    const echo = current.chapterTwo.echo ?? createLanguageCivilizationEcho(motherPlanetName, crew);
    const truth = current.chapterTwo.truth ?? createLanguageCivilizationTruth(crew);
    const exploredLocationIds = options.exploredAll
      ? Array.from(new Set([...current.chapterTwo.exploredLocationIds, ...chapterTwoUnlockLocationIds]))
      : current.chapterTwo.exploredLocationIds;
    const blackBoxUnlocked = options.exploredAll
      ? true
      : current.chapterTwo.blackBoxUnlocked || chapterTwoUnlockLocationIds.every((id) => exploredLocationIds.includes(id));
    const disorderLevel =
      current.chapterTwo.echo && typeof current.chapterTwo.disorderLevel === "number"
        ? current.chapterTwo.disorderLevel
        : Math.max(0, emptyChapterTwoState().disorderLevel - expeditionEffects.disorderReduction);

    return {
      ...current,
      currentScene: "chapter-two-mission" as const,
      systemsRestored: true,
      crewOnboard: true,
      firstStarLit: true,
      chapterTwoUnlocked: true,
      chapterTwoRouteLocked: true,
      activeCrewId: crew.id,
      planetCatalog: prepared.planetCatalog,
      shipLogs: prepared.shipLogs,
      signalMission: prepared.signalMission,
      chapterTwo: {
        ...emptyChapterTwoState(),
        ...current.chapterTwo,
        currentStep: options.currentStep,
        sceneState: options.sceneState,
        focusedPlanetId: "language" as const,
        focusedLocationId: options.focusedLocationId ?? null,
        exploredLocationIds,
        disorderLevel,
        mistakeCount: current.chapterTwo.mistakeCount ?? 0,
        pollutedRecords: current.chapterTwo.pollutedRecords ?? [],
        baseEffectNotes: current.chapterTwo.baseEffectNotes.length > 0 ? current.chapterTwo.baseEffectNotes : expeditionEffects.notes,
        baseScanHints: current.chapterTwo.baseScanHints.length > 0 ? current.chapterTwo.baseScanHints : expeditionEffects.scanHints,
        blackBoxUnlocked,
        echo,
        truth,
        leadCrewId: current.chapterTwo.leadCrewId ?? crew.id,
        supportCrewId: current.chapterTwo.supportCrewId ?? crew.id,
        leadDuty: current.chapterTwo.leadDuty ?? truth.recommendedLeadDuty,
        supportDuty: current.chapterTwo.supportDuty ?? truth.recommendedSupportDuty,
        roundOneFocus: current.chapterTwo.roundOneFocus ?? truth.trueFocus,
        roundTwoRefinement: current.chapterTwo.roundTwoRefinement ?? truth.preferredRefinement,
        roundTwoSupportMode: current.chapterTwo.roundTwoSupportMode ?? truth.preferredSupportMode
      },
      shipStatusNote: options.shipStatusNote
    };
  };

  const teacherCompleteChapterTwoLandmarks = () => {
    updateState((current) =>
      prepareChapterTwoTeacherState(current, {
        currentStep: "response",
        sceneState: "planet_surface",
        exploredAll: true,
        shipStatusNote: "领航控制：四个文明地标已点亮，黑匣入口可用。"
      })
    );
  };

  const completeChapterTwoLandmarksForPilot = () => {
    teacherCompleteChapterTwoLandmarks();
  };

  const teacherEnterBlackboxTrial = () => {
    updateState((current) =>
      prepareChapterTwoTeacherState(current, {
        currentStep: "assign",
        sceneState: "memory_archive",
        focusedLocationId: "blackbox-vault",
        exploredAll: true,
        shipStatusNote: "领航控制：已直接进入黑匣试炼。"
      })
    );
  };

  const enterBlackboxTrialForPilot = () => {
    teacherEnterBlackboxTrial();
  };

  const maxHomePlanetResources = () => {
    updateState((current) => ({
      ...current,
      technologyPoints: Math.max(current.technologyPoints, 99),
      homePlanetHub: {
        ...current.homePlanetHub,
        resources: {
          water: 99,
          minerals: 99,
          energy: 99,
          fragments: 99,
          techPoints: 99
        }
      },
      shipStatusNote: "领航控制：母星资源已写入 99。"
    }));
  };

  const setMotherworldBuildingsDark = () => {
    updateState((current) => ({
      ...current,
      homePlanetHub: {
        ...current.homePlanetHub,
        activeFeatures: [],
        builtStructures: [],
        benefits: emptyHomePlanetBuildingBenefits()
      },
      shipStatusNote: "领航控制：母星建筑点亮状态已清空，成果档案保留。"
    }));
  };

  const setMotherworldBuildingsLit = () => {
    updateState((current) => {
      const featureIds = motherworldHotspots.map((hotspot) => hotspot.id);
      const structureIds = homePlanetStructures.map((structure) => structure.id);

      return {
        ...current,
        firstStarLit: true,
        chapterComplete: true,
        homePlanetHub: {
          ...current.homePlanetHub,
          unlockedFeatures: Array.from(new Set([...current.homePlanetHub.unlockedFeatures, ...featureIds])),
          activeFeatures: featureIds,
          builtStructures: structureIds,
          benefits: {
            ...current.homePlanetHub.benefits,
            workshopEfficiencyLevel: Math.max(1, current.homePlanetHub.benefits.workshopEfficiencyLevel),
            crewAssistLevel: Math.max(1, current.homePlanetHub.benefits.crewAssistLevel)
          }
        },
        shipStatusNote: "领航控制：母星建筑与连接区已全部点亮。"
      };
    });
  };

  const teacherTriggerPlanetRestoration = () => {
    updateState((current) => {
      const preparedState = prepareChapterTwoTeacherState(current, {
        currentStep: "assign",
        sceneState: "chapter_reward",
        focusedLocationId: "blackbox-vault",
        exploredAll: true,
        shipStatusNote: "领航控制：言衡星复苏流程已完成。"
      });

      if (preparedState.currentScene === "recruit") {
        return preparedState;
      }

      if (preparedState.chapterTwoComplete && preparedState.chapterTwo.outcome) {
        return {
          ...preparedState,
          currentScene: "chapter-two-result" as const,
          shipStatusNote: "领航控制：已打开第二章成果结算。"
        };
      }

      const leadCrew =
        preparedState.crewRoster.find((member) => member.id === preparedState.chapterTwo.leadCrewId) ??
        preparedState.crewRoster.find((member) => member.id === preparedState.activeCrewId) ??
        preparedState.generatedCrew;
      const supportCrew = preparedState.crewRoster.find((member) => member.id === preparedState.chapterTwo.supportCrewId) ?? leadCrew;

      if (!leadCrew || !supportCrew) {
        return {
          ...preparedState,
          currentScene: "recruit" as const,
          shipStatusNote: "领航控制：需要先补一位船员，才能写入第二章成果。"
        };
      }

      const outcome = createResolvedChapterTwoOutcome();
      const shipLog = createChapterTwoShipLog(outcome);
      const leadDossierEntry = createChapterTwoDossier(leadCrew, outcome);
      const supportDossierEntry = supportCrew.id === leadCrew.id ? leadDossierEntry : createChapterTwoDossier(supportCrew, outcome);
      const updated = updateMultipleCrew(preparedState, Array.from(new Set([leadCrew.id, supportCrew.id])), (member) => {
        const trustBoost = member.id === leadCrew.id ? 2 : 1;
        const trustLevel = member.trustLevel + trustBoost;
        const dossierEntry = member.id === leadCrew.id ? leadDossierEntry : supportDossierEntry;

        return {
          ...member,
          trustLevel,
          trustLabel: getTrustLabel(trustLevel),
          bondStatus: member.id === leadCrew.id ? "开启语言模型黑匣" : "协助黑匣边界校验",
          dossierEntries: [dossierEntry, ...member.dossierEntries].slice(0, 8)
        };
      });
      const nextTechnologyPoints = preparedState.technologyPoints + 1;
      const completedState: GameState = {
        ...preparedState,
        ...updated,
        currentScene: "chapter-two-result",
        activeCrewId: leadCrew.id,
        chapterTwoComplete: true,
        chapterThreeHintUnlocked: true,
        scannedRegionLabel: outcome.scannedZone,
        technologyPoints: nextTechnologyPoints,
        aiCapabilityLevel: preparedState.aiCapabilityLevel + 1,
        aiCapabilityUnlocks: Array.from(new Set([...preparedState.aiCapabilityUnlocks, "语言理解 Level 1", "清晰指令校验"])),
        chapterTwo: {
          ...preparedState.chapterTwo,
          currentStep: "decision",
          sceneState: "chapter_reward",
          focusedLocationId: "blackbox-vault",
          exploredLocationIds: Array.from(new Set([...preparedState.chapterTwo.exploredLocationIds, ...chapterTwoUnlockLocationIds])),
          blackBoxUnlocked: true,
          finalChoice: "记录后返航",
          systemReadings: outcome.systemReadings ?? preparedState.chapterTwo.systemReadings,
          settlementLogs: outcome.settlementLogs ?? preparedState.chapterTwo.settlementLogs,
          outcome
        },
        shipStatusNote: outcome.worldChange,
        shipLogs: appendShipLog(preparedState, shipLog)
      };

      return {
        ...completedState,
        homePlanetHub: {
          ...completedState.homePlanetHub,
          resources: {
            ...awardLanguagePlanetResources(completedState.homePlanetHub.resources),
            techPoints: nextTechnologyPoints
          },
          archiveRecords: mergeHomePlanetArchiveRecords(completedState.homePlanetHub.archiveRecords, [
            createBlackboxExpeditionArchiveRecord({
              outcome,
              leadCrew,
              supportCrew,
              createdAt: outcome.completedAt ?? Date.now()
            })
          ]),
          unlockedFeatures: resolveHomePlanetUnlockedFeatures(completedState)
        }
      };
    });
  };

  const resetTrialFlow = () => {
    setState(createInitialGameState());
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
    replaceState,
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
    canFinalizeChapterOne: Boolean(safeState.signalMission.repairedSignal || safeState.signalMission.faultRun.result),
    canRunTask: Boolean(safeState.taskDesk.selectedTaskId) && Boolean(safeState.taskDesk.assignedCrewId),
    awaken,
    returnToHub,
    completeHubBriefing,
    openRecruitment,
    openCrewBay,
    openCrewChat,
    returnToCrewBay,
    openTaskBoard,
    openArchive,
    openHomePlanetHub,
    openLogbook,
    openChapterTwoPortal,
    startChapterTwoMission,
    setChapterTwoSceneState,
    focusChapterTwoPlanet,
    focusChapterTwoLocation,
    updateChapterTwoDisorder,
    useChapterTwoCrewAssist,
    resolveChapterTwoFakeCrewSignal,
    exploreChapterTwoLocation,
    advanceChapterTwoStep,
    completeChapterTwo,
    activateHomePlanetFeature,
    buildHomePlanetStructure,
    markHomePlanetGalleryReview,
    saveHomePlanetCommission,
    saveHomePlanetDialogue,
    saveHomePlanetStoryboard,
    equipHomePlanetRuleCard,
    tuneHomePlanetCrewAssist,
    saveHomePlanetExpeditionPlan,
    updateRecruitForm,
    analyzeRecruitInput,
    generateCrewMember,
    rerollCrew,
    regenerateCrewPortrait,
    updateCrewImagePromptHint,
    importCrewPortrait,
    importPlanetImage,
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
    openFirstExperienceResult,
    continueToFaultReview,
    openTrialResult,
    openParentSummary,
    startTrialFromBeginning,
    jumpToShipHub,
    jumpToFirstLevel,
    jumpToSecondLevel,
    jumpToLanguagePortal,
    jumpToLanguageSurface,
    completeChapterTwoLandmarksForPilot,
    enterBlackboxTrialForPilot,
    maxHomePlanetResources,
    setMotherworldBuildingsDark,
    setMotherworldBuildingsLit,
    teacherCompleteChapterTwoLandmarks,
    teacherEnterBlackboxTrial,
    teacherTriggerPlanetRestoration,
    resetTrialFlow,
    closeSignalReview,
    openChapterComplete,
    restartMission,
    resetSignalMission,
    resetOperation
  };
}
