import type { CrewMember, FaultOutcome, FaultRunChoice, FaultRunHistoryEntry, FaultRunState } from "@/types/game";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCrewBonus(crew: CrewMember, choice: FaultRunChoice) {
  const matchedRole = choice.recommendedRoles.includes(crew.role);

  if (matchedRole) {
    if (crew.role === "scout") {
      return { stability: 0, evidence: 6, time: 1, note: `${crew.name} 先摸到了隐藏线索，证据清晰度上升。` };
    }
    if (crew.role === "repair") {
      return { stability: 8, evidence: 0, time: 0, note: `${crew.name} 把震荡压住了一截，系统稳定度回升。` };
    }
    if (crew.role === "record") {
      return { stability: 2, evidence: 5, time: 0, note: `${crew.name} 把因果顺序重新排整齐了。` };
    }

    return { stability: 2, evidence: 2, time: 3, note: `${crew.name} 帮你提前判断了风险方向，争取到更多时间窗口。` };
  }

  if (crew.talent === "decode") {
    return { stability: 0, evidence: 3, time: 0, note: `${crew.name} 还是拆开了一点噪声。` };
  }
  if (crew.talent === "mend") {
    return { stability: 3, evidence: 0, time: 0, note: `${crew.name} 勉强稳住了回溯边缘。` };
  }
  if (crew.talent === "track") {
    return { stability: 0, evidence: 2, time: 1, note: `${crew.name} 追上了一小段快消失的痕迹。` };
  }

  return { stability: 0, evidence: 1, time: 1, note: `${crew.name} 提供了一个还能用的小补丁。` };
}

function buildOutcome(run: FaultRunState): FaultOutcome {
  const seed = run.activeSeed;
  const latestRule = run.history[run.history.length - 1]?.principle ?? "复杂系统需要边走边验证。";

  if (!seed) {
    return {
      grade: "fail",
      title: "回溯中断",
      summary: "这轮没有拿到足够稳定的恢复结果。",
      unlockedFeature: "故障台保留了失败片段",
      truthFragment: "系统只抢回了一点碎片，下一轮还可以继续补证据。",
      systemNote: "这次回溯崩塌了，但不是白做。",
      recommendedNextStep: "换一种判断顺序，再开下一轮回溯。",
      learnedRule: latestRule
    };
  }

  if (run.evidence >= 60 && run.stability >= 44 && run.timeWindow > 0) {
    return {
      grade: "success",
      title: `${seed.title} 已完整写回案例库`,
      summary: `你们不仅修好了 ${seed.type} 这次故障，还把它整理成了后续可调用的标准案例。`,
      unlockedFeature: "故障案例匹配已上线",
      truthFragment: seed.hiddenTruth,
      systemNote: "历史故障记录可查询，后续任务可调用案例匹配。",
      recommendedNextStep: "返回主舰，查看故障处理台与历史档案。",
      learnedRule: latestRule
    };
  }

  if (run.evidence >= 36 || run.history.length >= 3) {
    return {
      grade: "partial",
      title: `${seed.title} 留下了可用片段`,
      summary: `这轮没能完整修复 ${seed.type}，但你保住了足够多的可信片段。`,
      unlockedFeature: "故障片段档案可回看",
      truthFragment: seed.hiddenTruth.slice(0, 28),
      systemNote: "案例库还没完全恢复，但下一轮会带着这些片段继续开始。",
      recommendedNextStep: "回到故障台，带着新片段重开一轮。",
      learnedRule: latestRule
    };
  }

  return {
    grade: "fail",
    title: `${seed.title} 在噪声里崩塌了`,
    summary: "这轮回溯没站稳，系统只抢救到极少量失败片段。",
    unlockedFeature: "回溯失败片段已归档",
    truthFragment: "这次最像答案的那条线，其实没有被验证。",
    systemNote: "主舰保住了最低限度的记录，没有直接黑屏失败。",
    recommendedNextStep: "重新进入故障台，先补证据再判断。",
    learnedRule: latestRule
  };
}

export function resolveFaultChoice(run: FaultRunState, choiceId: string, crew: CrewMember): FaultRunState {
  const node = run.nodes[run.currentNodeIndex];
  const choice = node?.choices.find((item) => item.id === choiceId);

  if (!node || !choice) {
    return run;
  }

  const bonus = getCrewBonus(crew, choice);
  const requirementFailed = typeof choice.requiresEvidence === "number" && run.evidence < choice.requiresEvidence;
  const penalty = requirementFailed ? { stability: -14, evidence: -4, time: -2 } : { stability: 0, evidence: 0, time: 0 };
  const rescue = choice.rescueWhenLowStability && run.stability <= 34 ? 6 : 0;
  const nextStability = clamp(run.stability + choice.effect.stability + bonus.stability + penalty.stability + rescue, 0, 100);
  const nextEvidence = clamp(run.evidence + choice.effect.evidence + bonus.evidence + penalty.evidence, 0, 100);
  const nextTime = clamp(run.timeWindow + choice.effect.time + bonus.time + penalty.time, 0, 30);
  const historyEntry: FaultRunHistoryEntry = {
    nodeId: node.id,
    nodeTitle: node.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    summary: requirementFailed ? `${choice.summary} 但证据不够，系统被这步拉偏了。` : choice.summary,
    principle: choice.principle,
    delta: {
      stability: nextStability - run.stability,
      evidence: nextEvidence - run.evidence,
      time: nextTime - run.timeWindow
    },
    crewSupport: bonus.note,
    after: {
      stability: nextStability,
      evidence: nextEvidence,
      time: nextTime
    }
  };
  const nextIndex = run.currentNodeIndex + 1;
  const shouldResolve = nextIndex >= run.nodes.length || nextStability <= 0 || nextTime <= 0;
  const nextRun: FaultRunState = {
    ...run,
    currentNodeIndex: shouldResolve ? run.currentNodeIndex : nextIndex,
    stability: nextStability,
    evidence: nextEvidence,
    timeWindow: nextTime,
    history: [...run.history, historyEntry]
  };

  if (!shouldResolve) {
    return nextRun;
  }

  const result = buildOutcome(nextRun);
  const fragments =
    result.grade === "success"
      ? run.partialFragments
      : Array.from(new Set([...run.partialFragments, result.truthFragment])).slice(0, 6);

  const resolvedRun: FaultRunState = {
    ...nextRun,
    status: "resolved",
    partialFragments: fragments,
    result
  };

  return resolvedRun;
}
