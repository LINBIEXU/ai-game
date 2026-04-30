import { createInitialGameState } from "@/lib/game-constants";
import type {
  CloudCrewRecord,
  CloudProgressRecord,
  CloudSaveSummary,
  CloudSnapshot,
  CloudWorkRecord,
  RestoreEnvelope,
  WorkBuildContext
} from "@/types/cloud-save";
import type { CrewMember, GameState, PlanetModel } from "@/types/game";

function uniqueCrewPool(state: GameState) {
  const pool = new Map<string, CrewMember>();

  if (state.generatedCrew) {
    pool.set(state.generatedCrew.id, state.generatedCrew);
  }

  state.crewRoster.forEach((crew) => {
    pool.set(crew.id, crew);
  });

  return Array.from(pool.values());
}

function createdAtFromCrew(crew: CrewMember) {
  return (
    crew.portraitAsset?.updatedAt ??
    crew.portraitEchoes[crew.portraitEchoes.length - 1]?.updatedAt ??
    Date.now()
  );
}

export function buildCrewRecords(state: GameState, userId: string, existing = new Map<string, CloudCrewRecord>()): CloudCrewRecord[] {
  const now = Date.now();
  const onboardIds = new Set(state.crewRoster.map((crew) => crew.id));

  return uniqueCrewPool(state).map((crew) => {
    const current = existing.get(`${userId}:${crew.id}`);

    return {
      _id: `${userId}:${crew.id}`,
      userId,
      name: crew.name,
      profile: crew,
      echoes: crew.portraitEchoes,
      bond: {
        trustLevel: crew.trustLevel,
        trustLabel: crew.trustLabel,
        bondStatus: crew.bondStatus
      },
      metadata: {
        isOnboard: onboardIds.has(crew.id),
        isGenerated: state.generatedCrew?.id === crew.id,
        isActive: state.activeCrewId === crew.id
      },
      createdAt: current?.createdAt ?? createdAtFromCrew(crew),
      updatedAt: now
    };
  });
}

function planetWorkContent(planet: PlanetModel) {
  return `${planet.summary} 标志性建筑或景观：${planet.landmarkFeature || "待补充"}。资源分布为 水源 ${planet.resourceProfile.water} / 矿物 ${planet.resourceProfile.mineral} / 能源 ${planet.resourceProfile.energy} / 生态 ${planet.resourceProfile.ecology} / 遗迹数据 ${planet.resourceProfile.relicData}。`;
}

function crewWorkContent(state: GameState, crew: CrewMember) {
  const latestNote = crew.dossierEntries[0]?.body ?? crew.backstory.reasonToJoin;
  return `${crew.title} · ${crew.trustLabel}。${latestNote}`;
}

function faultCaseContent(record: GameState["faultCaseRecords"][number]) {
  return `${record.summary} 学到的规则：${record.learnedRule}`;
}

function resolveLastRestorePoint(state: GameState) {
  if (state.chapterTwo.outcome) {
    return "第二章黑匣成果";
  }

  if (state.chapterTwo.currentStep !== "response" || state.chapterTwo.echo) {
    return "第二章科技黑匣";
  }

  if (state.signalMission.planet.status === "analyzed") {
    return "第一关星球建模确认";
  }

  if (state.signalMission.planet.status === "restored" || state.signalMission.repairedSignal) {
    return "信息库修复完成";
  }

  if (state.generatedCrew && !state.crewOnboard) {
    return "船员生成结果";
  }

  if (state.currentScene === "task-result") {
    return "任务结果回顾";
  }

  return state.currentScene;
}

export function buildSaveSummary(state: GameState, works: CloudWorkRecord[]): CloudSaveSummary {
  const activeCrew =
    state.crewRoster.find((crew) => crew.id === state.activeCrewId) ??
    (state.generatedCrew?.id === state.activeCrewId ? state.generatedCrew : null) ??
    state.generatedCrew ??
    state.crewRoster[0] ??
    null;
  const activePlanet = state.signalMission.planet.confirmedModel ?? state.planetCatalog[0] ?? null;
  const currentFaultNode = state.signalMission.faultRun.nodes[state.signalMission.faultRun.currentNodeIndex] ?? null;
  const latestWorkIds = [...works].sort((left, right) => right.updatedAt - left.updatedAt).slice(0, 6).map((work) => work._id);
  const latestLogIds = state.shipLogs.slice(0, 6).map((log) => log.id);

  return {
    activeCrewId: activeCrew?.id ?? null,
    activeCrewName: activeCrew?.name ?? null,
    activeScene: state.currentScene,
    activeChapter: state.chapterTwoUnlocked || state.chapterTwoComplete ? "chapter-two" : "chapter-one",
    activePlanetId: activePlanet?.id ?? null,
    activePlanetName: activePlanet?.name ?? null,
    activePortraitRevision: activeCrew?.portraitAsset?.revision ?? activeCrew?.portraitEchoes[0]?.revision ?? null,
    faultRunSeedId: state.signalMission.faultRun.activeSeed?.id ?? null,
    faultRunStatus: state.signalMission.faultRun.status,
    checkpointNodeId: currentFaultNode?.id ?? null,
    checkpointStage: currentFaultNode?.stage ?? null,
    latestWorkIds,
    latestLogIds,
    shipStatusNote: state.shipStatusNote,
    lastRestorePoint: resolveLastRestorePoint(state),
    lastSavedAt: Date.now()
  };
}

function sortWorksWithSummary(works: CloudWorkRecord[], summary?: CloudSaveSummary | null) {
  if (!summary?.latestWorkIds?.length) {
    return [...works].sort((left, right) => right.updatedAt - left.updatedAt);
  }

  const order = new Map(summary.latestWorkIds.map((id, index) => [id, index]));
  return [...works].sort((left, right) => {
    const leftRank = order.get(left._id);
    const rightRank = order.get(right._id);

    if (leftRank != null && rightRank != null) return leftRank - rightRank;
    if (leftRank != null) return -1;
    if (rightRank != null) return 1;
    return right.updatedAt - left.updatedAt;
  });
}

export function buildWorkRecords(
  state: GameState,
  userId: string,
  context: WorkBuildContext,
  existing = new Map<string, CloudWorkRecord>()
): CloudWorkRecord[] {
  const now = Date.now();
  const works: CloudWorkRecord[] = state.planetCatalog.map((planet) => {
    const id = `${userId}:planet-model:${planet.id}`;
    const current = existing.get(id);

    return {
      _id: id,
      userId,
      type: "planet-model",
      title: planet.name,
      content: planetWorkContent(planet),
      metadata: {
        coordinateLabel: planet.coordinateLabel,
        mood: planet.mood,
        dangerLabel: planet.dangerLabel,
        environmentTrait: planet.environmentTrait,
        landmarkFeature: planet.landmarkFeature ?? null,
        tags: planet.tags,
        resourceProfile: planet.resourceProfile,
        production: planet.production,
        explorationHooks: planet.explorationHooks
      },
      createdAt: current?.createdAt ?? now,
      updatedAt: now
    };
  });

  uniqueCrewPool(state).forEach((crew) => {
    const id = `${userId}:crew-dossier:${crew.id}`;
    const current = existing.get(id);
    works.push({
      _id: id,
      userId,
      type: "crew-dossier",
      title: `${crew.name} 船员档案`,
      content: crewWorkContent(state, crew),
      metadata: {
        crewId: crew.id,
        role: crew.role,
        talent: crew.talent,
        trustLevel: crew.trustLevel,
        trustLabel: crew.trustLabel,
        bondStatus: crew.bondStatus,
        activePortraitRevision: crew.portraitAsset?.revision ?? crew.portraitEchoes[0]?.revision ?? null
      },
      createdAt: current?.createdAt ?? createdAtFromCrew(crew),
      updatedAt: now
    });
  });

  if (context.repairedSignal) {
    const id = `${userId}:memory-vault-report:${context.repairedSignal.coordinateLabel}`;
    const current = existing.get(id);
    works.push({
      _id: id,
      userId,
      type: "memory-vault-report",
      title: context.repairedSignal.title,
      content: context.repairedSignal.summary,
      metadata: {
        coordinateLabel: context.repairedSignal.coordinateLabel,
        repairSummary: context.repairedSignal.repairSummary,
        restoredFeatures: context.repairedSignal.restoredFeatures,
        nextLead: context.repairedSignal.nextLead
      },
      createdAt: current?.createdAt ?? now,
      updatedAt: now
    });
  }

  if (context.chapterTwoOutcome) {
    const id = `${userId}:chapter-two-outcome:${context.chapterTwoOutcome.scannedZone}`;
    const current = existing.get(id);
    works.push({
      _id: id,
      userId,
      type: "chapter-two-outcome",
      title: context.chapterTwoOutcome.title,
      content: context.chapterTwoOutcome.summary,
      metadata: {
        worldChange: context.chapterTwoOutcome.worldChange,
        scannedZone: context.chapterTwoOutcome.scannedZone,
        chapterThreeHook: context.chapterTwoOutcome.chapterThreeHook,
        fragments: context.chapterTwoOutcome.fragments,
        technologyPointsAwarded: context.chapterTwoOutcome.technologyPointsAwarded,
        unlockedModule: context.chapterTwoOutcome.unlockedModule,
        titleEarned: context.chapterTwoOutcome.titleEarned,
        defeatedEcho: context.chapterTwoOutcome.defeatedEcho,
        completedAt: context.chapterTwoOutcome.completedAt
      },
      createdAt: current?.createdAt ?? now,
      updatedAt: now
    });
  }

  state.faultCaseRecords.forEach((record) => {
    const id = `${userId}:fault-case:${record.id}`;
    const current = existing.get(id);
    works.push({
      _id: id,
      userId,
      type: "fault-case",
      title: record.title,
      content: faultCaseContent(record),
      metadata: {
        seedType: record.seedType,
        grade: record.grade,
        truthFragment: record.truthFragment,
        timelineNotes: record.timelineNotes
      },
      createdAt: current?.createdAt ?? now,
      updatedAt: now
    });
  });

  return works;
}

export function buildProgressRecord(state: GameState, userId: string, existing?: CloudProgressRecord | null): CloudProgressRecord {
  const works = buildWorkRecords(
    state,
    userId,
    {
      repairedSignal: state.signalMission.repairedSignal,
      chapterTwoOutcome: state.chapterTwo.outcome
    }
  );
  const summary = buildSaveSummary(state, works);

  return {
    _id: `${userId}:main`,
    userId,
    chapter: {
      currentScene: state.currentScene,
      chapterComplete: state.chapterComplete,
      chapterTwoUnlocked: state.chapterTwoUnlocked,
      chapterTwoComplete: state.chapterTwoComplete
    },
    memoryVault: state.signalMission,
    planetUnlocked: state.signalMission.planet.status === "restored" || state.planetCatalog.length > 0,
    faultRunState: state.signalMission.faultRun,
    progression: {
      activeCrewId: state.activeCrewId,
      crewVariant: state.crewVariant,
      crewOnboard: state.crewOnboard,
      systemsRestored: state.systemsRestored,
      hubSignalSeen: state.hubSignalSeen,
      firstStarLit: state.firstStarLit,
      chapterTwoRouteLocked: state.chapterTwoRouteLocked,
      chapterThreeHintUnlocked: state.chapterThreeHintUnlocked,
      scannedRegionLabel: state.scannedRegionLabel,
      newRegionAlert: state.newRegionAlert
    },
    generatedCrewId: state.generatedCrew?.id ?? null,
    recruitState: {
      form: state.recruitForm,
      analysis: state.recruitAnalysis
    },
    planetCatalog: state.planetCatalog,
    faultCaseRecords: state.faultCaseRecords,
    taskDesk: state.taskDesk,
    chapterTwoState: state.chapterTwo,
    shipLogs: state.shipLogs,
    shipStatusNote: state.shipStatusNote,
    summary,
    updatedAt: summary.lastSavedAt
  };
}

export function restoreStateFromSnapshot(snapshot: CloudSnapshot): RestoreEnvelope | null {
  if (!snapshot.progress) {
    return null;
  }

  const base = createInitialGameState();
  const crewDocs = [...snapshot.crews].sort((left, right) => right.updatedAt - left.updatedAt);
  const crewMap = new Map(crewDocs.map((item) => [item.profile.id, item.profile]));
  const roster = crewDocs.filter((item) => item.metadata.isOnboard).map((item) => item.profile);
  const summary = snapshot.progress.summary;
  const generatedCrew =
    (snapshot.progress.generatedCrewId ? crewMap.get(snapshot.progress.generatedCrewId) : null) ??
    crewDocs.find((item) => item.metadata.isGenerated)?.profile ??
    null;
  const activeCrewId =
    (summary?.activeCrewId && (crewMap.has(summary.activeCrewId) || generatedCrew?.id === summary.activeCrewId)
      ? summary.activeCrewId
      : snapshot.progress.progression.activeCrewId) ?? null;
  const orderedWorks = sortWorksWithSummary(snapshot.works, summary);

  return {
    restoredAt: snapshot.progress.updatedAt,
    works: orderedWorks,
    state: {
      ...base,
      currentScene: snapshot.progress.chapter.currentScene,
      recruitForm: snapshot.progress.recruitState?.form ?? base.recruitForm,
      recruitAnalysis: snapshot.progress.recruitState?.analysis ?? base.recruitAnalysis,
      crewVariant: snapshot.progress.progression.crewVariant,
      generatedCrew,
      crewRoster: roster,
      activeCrewId,
      crewOnboard: snapshot.progress.progression.crewOnboard,
      systemsRestored: snapshot.progress.progression.systemsRestored,
      hubSignalSeen: snapshot.progress.progression.hubSignalSeen,
      firstStarLit: snapshot.progress.progression.firstStarLit,
      chapterComplete: snapshot.progress.chapter.chapterComplete,
      chapterTwoUnlocked: snapshot.progress.chapter.chapterTwoUnlocked,
      chapterTwoRouteLocked: snapshot.progress.progression.chapterTwoRouteLocked,
      chapterTwoComplete: snapshot.progress.chapter.chapterTwoComplete,
      chapterThreeHintUnlocked: snapshot.progress.progression.chapterThreeHintUnlocked,
      scannedRegionLabel: snapshot.progress.progression.scannedRegionLabel,
      newRegionAlert: snapshot.progress.progression.newRegionAlert,
      planetCatalog: snapshot.progress.planetCatalog,
      faultCaseRecords: snapshot.progress.faultCaseRecords,
      signalMission: snapshot.progress.memoryVault,
      taskDesk: snapshot.progress.taskDesk,
      chapterTwo: snapshot.progress.chapterTwoState,
      shipLogs: snapshot.progress.shipLogs,
      shipStatusNote: snapshot.progress.shipStatusNote
    }
  };
}
