export type ArchiveTowerLoopStage = "anomaly" | "clues" | "operation" | "feedback" | "recover";

export type ArchiveTowerOperationId = "mark-unknowns" | "smooth-fill" | "trust-echo";

export const archiveTowerStageMeta: Array<{ id: ArchiveTowerLoopStage; label: string }> = [
  { id: "anomaly", label: "异常出现" },
  { id: "clues", label: "线索观察" },
  { id: "operation", label: "选择操作" },
  { id: "feedback", label: "世界反馈" },
  { id: "recover", label: "碎片回收" }
];

export const archiveTowerAnomalyClues = [
  {
    id: "confirmed-duty",
    tag: "可确认",
    title: "塔壁原句",
    body: "言衡星负责保存和传递文明记录。"
  },
  {
    id: "missing-source",
    tag: "未知",
    title: "裂缝标注",
    body: "逆熵打击的真正来源尚未确认。"
  },
  {
    id: "echo-noise",
    tag: "污染",
    title: "失序回声",
    body: "它把“可能有关”改写成“已经确定”。"
  },
  {
    id: "ship-reminder",
    tag: "主舰提醒",
    title: "判断边界",
    body: "AI 会推测，不等于知道事实；未知要标注。"
  }
] as const;

export const archiveTowerOperations = [
  {
    id: "mark-unknowns",
    label: "标注未知，隔离推测",
    description: "把有来源内容写入事实栏，把可能性放进推测栏，把缺口保留为未知。",
    stable: true,
    pollutionAfter: 0,
    feedbackTitle: "档案塔光脉恢复稳定",
    feedbackBody: "塔身停止补写结论，归档器把事实、推测和未知分开保存。判断权被留在主舰指令台。",
    pollutionLabel: "污染清除",
    fragmentLabel: "归档碎片解锁",
    resourceLabel: "数据尘 +2"
  },
  {
    id: "smooth-fill",
    label: "补成顺口结论",
    description: "为了让记录完整，直接写成“真正原因已经确认”。",
    stable: false,
    pollutionAfter: 4,
    feedbackTitle: "污染沿塔壁回卷",
    feedbackBody: "句子变顺了，但缺口被藏住了。没有证据的结论会让主舰拒收这段记录。",
    pollutionLabel: "污染未降",
    fragmentLabel: "碎片继续封锁",
    resourceLabel: "无回流资源"
  },
  {
    id: "trust-echo",
    label: "直接采用回声答案",
    description: "把失序回声的断言写进档案，不再复查来源。",
    stable: false,
    pollutionAfter: 5,
    feedbackTitle: "回声噪点增强",
    feedbackBody: "流畅答案夺走了复查入口。主舰无法确认依据，档案塔保持警戒。",
    pollutionLabel: "污染升高",
    fragmentLabel: "碎片被噪点覆盖",
    resourceLabel: "回流中止"
  }
] as const;

export const archiveTowerRecoveredResources = [
  { label: "文明碎片", value: "归档碎片 +1" },
  { label: "污染净化", value: "塔身 100%" },
  { label: "回流资源", value: "数据尘 +2" }
] as const;

export function getArchiveTowerOperationResult(operationId: ArchiveTowerOperationId | null) {
  return archiveTowerOperations.find((operation) => operation.id === operationId) ?? null;
}

export function getArchiveTowerPollution(stage: ArchiveTowerLoopStage, operationId: ArchiveTowerOperationId | null) {
  const operationResult = getArchiveTowerOperationResult(operationId);

  if (stage === "recover") {
    return 0;
  }

  if (stage === "feedback" && operationResult) {
    return operationResult.pollutionAfter;
  }

  return 4;
}
