import type {
  CrewDossierEntry,
  CrewMember,
  FaultCaseRecord,
  FaultOutcome,
  FaultRunState,
  PlanetModel,
  RepairedSignal,
  ShipLogEntry
} from "@/types/game";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPlanetShipLog(planet: PlanetModel): ShipLogEntry {
  return {
    id: makeId("log-planet"),
    title: `${planet.name} 已写入星图`,
    body: `${planet.summary} 标志性建筑或景观：${planet.landmarkFeature || "待补充"}。资源产出已启动，导航盘恢复到可调用状态。`,
    tag: "星图写入"
  };
}

export function createPlanetDossier(crew: CrewMember, planet: PlanetModel): CrewDossierEntry {
  return {
    id: makeId("dossier-planet"),
    title: "第一颗星球建模",
    body: `${crew.name} 参与建立了 ${planet.name} 的世界模型，并把第一份可调用星球档案写回主舰。`,
    tag: "导航修复"
  };
}

export function createFaultCaseRecord(run: FaultRunState, outcome: FaultOutcome): FaultCaseRecord {
  return {
    id: makeId("fault-case"),
    seedType: run.activeSeed?.type ?? "外部信号干扰",
    title: outcome.title,
    grade: outcome.grade,
    summary: outcome.summary,
    truthFragment: outcome.truthFragment,
    learnedRule: outcome.learnedRule,
    timelineNotes: run.history.map((entry) => `${entry.nodeTitle}：${entry.choiceLabel}`)
  };
}

export function createFaultShipLog(outcome: FaultOutcome): ShipLogEntry {
  return {
    id: makeId("log-fault"),
    title: outcome.title,
    body: `${outcome.summary} ${outcome.systemNote}`,
    tag: outcome.grade === "success" ? "案例恢复" : outcome.grade === "partial" ? "部分恢复" : "回溯失败"
  };
}

export function createFaultDossier(crew: CrewMember, outcome: FaultOutcome): CrewDossierEntry {
  return {
    id: makeId("dossier-fault"),
    title: "故障回溯演算",
    body: `${crew.name} 在故障回溯里留下了这次协作结果：${outcome.summary}`,
    tag: outcome.grade === "success" ? "案例库" : "回溯"
  };
}

export function createRepairedSignal(input: {
  planet: PlanetModel;
  crew: CrewMember;
  outcome: FaultOutcome;
}): RepairedSignal {
  return {
    title: "信息库前两关恢复完成",
    summary: `${input.planet.name} 已成为第一颗可调用星球模型，故障案例库也重新获得了基础推演能力。`,
    crewComment: `${input.crew.name} 参与了星球建模和故障回溯，这位伙伴现在不只是登船对象，而是真正参与过主舰恢复的人。`,
    coordinateLabel: input.planet.coordinateLabel,
    sourceLabel: input.planet.name,
    unlockedSector: `${input.planet.name} 外环观测带`,
    nextLead: "导航盘和故障处理台都已经能立刻调用。下一段远征会从第一颗星球留下的坐标继续向外展开。",
    repairSummary: input.outcome.summary,
    aiLine: "主舰已经重新学会两件重要的事：先建立世界模型，再用证据把故障一步步推回真相。",
    restoredFeatures: [
      "第一颗星球正式写入星图",
      "资源开始定时产出",
      "导航盘恢复可调用状态",
      "故障处理台上线",
      "历史案例记录可查询"
    ]
  };
}
