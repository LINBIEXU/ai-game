import type { CrewMember, FaultChoiceEffect, FaultOutcome, FaultRunChoice, FaultRunHistoryEntry, FaultRunState, FaultSeedType } from "@/types/game";

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

function getSeedChoiceModifier(seedType: FaultSeedType | undefined, choiceId: string): FaultChoiceEffect & { note: string | null } {
  if (!seedType) {
    return { stability: 0, evidence: 0, time: 0, note: null };
  }

  if (seedType === "撞击小行星") {
    if (choiceId === "stabilize-shell" || choiceId === "seal-and-sample") {
      return { stability: 6, evidence: 0, time: 0, note: "这次是物理冲击链，先稳系统能防止二次损伤。 " };
    }
    if (choiceId === "copy-similar-case") {
      return { stability: -5, evidence: -2, time: 0, note: "撞击后的二次校准被跳过，相似案例会遮住真正断点。 " };
    }
  }

  if (seedType === "外部信号干扰") {
    if (choiceId === "filter-noise" || choiceId === "pull-raw-log") {
      return { stability: 0, evidence: 7, time: 0, note: "外部干扰最怕噪声混入，原始证据和过滤动作格外有效。 " };
    }
    if (choiceId === "copy-similar-case") {
      return { stability: -8, evidence: -6, time: 1, note: "诱饵信号故意长得像旧案例，直接套模板会触发误判。 " };
    }
  }

  if (seedType === "核心过载") {
    if (choiceId === "mark-missing-data" || choiceId === "verify-hypothesis") {
      return { stability: 3, evidence: 5, time: 0, note: "核心过载来自目标边界不清，先标缺口再验证能把推演拉回正轨。 " };
    }
    if (choiceId === "push-fuzzy-goal") {
      return { stability: -10, evidence: -5, time: 1, note: "模糊目标会让过载核心输出更流畅，却更偏离真实原因。 " };
    }
  }

  if (seedType === "权限误操作") {
    if (choiceId === "rebuild-timeline" || choiceId === "mark-missing-data") {
      return { stability: 1, evidence: 7, time: 0, note: "权限事故的关键在时间线，谁先获得权限比谁看起来像责任人更重要。 " };
    }
    if (choiceId === "force-restore") {
      return { stability: -7, evidence: -3, time: 0, note: "权限范围没收紧时强修，会把测试命令继续当正式命令执行。 " };
    }
  }

  if (seedType === "未知污染侵入") {
    if (choiceId === "filter-noise" || choiceId === "save-confirmed-fragments") {
      return { stability: 4, evidence: 8, time: -1, note: "污染样本会模仿正确日志，先过滤、再保存可信片段更安全。 " };
    }
    if (choiceId === "amplify-anomaly" || choiceId === "write-full-case") {
      return { stability: -9, evidence: -4, time: 0, note: "污染还没隔离就放大或写回，容易得到看似合理的错误恢复。 " };
    }
  }

  return { stability: 0, evidence: 0, time: 0, note: null };
}

function getRecoveryPercent(run: FaultRunState, grade: FaultOutcome["grade"]) {
  const base = Math.round(run.evidence * 0.55 + run.stability * 0.3 + Math.max(0, run.timeWindow) * 1.6);

  if (grade === "success") return clamp(base + 18, 78, 100);
  if (grade === "partial") return clamp(base, 38, 76);
  return clamp(base, 8, 34);
}

function getBroughtBack(run: FaultRunState, grade: FaultOutcome["grade"]) {
  const seed = run.activeSeed;
  const latestChoices = run.history.slice(-2).map((entry) => entry.choiceLabel);
  const base = [
    seed ? `${seed.type} 的事故主因线索` : "一段事故主因线索",
    ...latestChoices.map((choice) => `决策记录：${choice}`)
  ];

  if (grade === "success") {
    return [...base, "可用于后续任务的案例匹配规则"].slice(0, 4);
  }

  if (grade === "partial") {
    return [...base, "下一轮可继承的可信片段"].slice(0, 4);
  }

  return ["回溯崩塌前的残片", "一条失败原因记录", "下一轮避坑提示"];
}

function getCrewContribution(run: FaultRunState) {
  const supportNotes = run.history.map((entry) => entry.crewSupport).filter(Boolean);

  if (supportNotes.length === 0) {
    return "船员保持了最低限度的协作通道，让主舰没有直接丢失本轮记录。";
  }

  return supportNotes[supportNotes.length - 1]!;
}

function buildOutcome(run: FaultRunState): FaultOutcome {
  const seed = run.activeSeed;
  const latestRule = run.history[run.history.length - 1]?.principle ?? "复杂系统需要边走边验证。";

  if (!seed) {
    const grade = "fail";
    return {
      grade,
      title: "回溯中断",
      summary: "这轮没有拿到足够稳定的恢复结果。",
      unlockedFeature: "故障台保留了失败片段",
      truthFragment: "系统只抢回了一点碎片，下一轮还可以继续补证据。",
      systemNote: "这次回溯崩塌了，但不是白做。",
      recommendedNextStep: "换一种判断顺序，再开下一轮回溯。",
      learnedRule: latestRule,
      recoveryPercent: getRecoveryPercent(run, grade),
      broughtBack: getBroughtBack(run, grade),
      crewContribution: getCrewContribution(run),
      hallucinationNote: "当证据太少时，系统会用已有模式补空白，这就是幻觉容易出现的地方。"
    };
  }

  if (run.evidence >= 60 && run.stability >= 44 && run.timeWindow > 0) {
    const grade = "success";
    return {
      grade,
      title: `${seed.title} 已完整写回案例库`,
      summary: `你们不仅修好了 ${seed.type} 这次故障，还把它整理成了后续可调用的标准案例。`,
      unlockedFeature: "故障案例匹配已上线",
      truthFragment: seed.hiddenTruth,
      systemNote: "历史故障记录可查询，后续任务可调用案例匹配。",
      recommendedNextStep: "返回主舰，查看故障处理台与历史档案。",
      learnedRule: latestRule,
      recoveryPercent: getRecoveryPercent(run, grade),
      broughtBack: getBroughtBack(run, grade),
      crewContribution: getCrewContribution(run),
      hallucinationNote: "这次先补证据再写回，系统没有被相似案例和噪声牵着走。"
    };
  }

  if (run.evidence >= 36 || run.history.length >= 3) {
    const grade = "partial";
    return {
      grade,
      title: `${seed.title} 留下了可用片段`,
      summary: `这轮没能完整修复 ${seed.type}，但你保住了足够多的可信片段。`,
      unlockedFeature: "故障片段档案可回看",
      truthFragment: seed.hiddenTruth.slice(0, 28),
      systemNote: "案例库还没完全恢复，但下一轮会带着这些片段继续开始。",
      recommendedNextStep: "回到故障台，带着新片段重开一轮。",
      learnedRule: latestRule,
      recoveryPercent: getRecoveryPercent(run, grade),
      broughtBack: getBroughtBack(run, grade),
      crewContribution: getCrewContribution(run),
      hallucinationNote: "因为证据还不完整，系统只能保留可信片段，不能把猜测当成完整真相。"
    };
  }

  const grade = "fail";
  return {
    grade,
    title: `${seed.title} 在噪声里崩塌了`,
    summary: "这轮回溯没站稳，系统只抢救到极少量失败片段。",
    unlockedFeature: "回溯失败片段已归档",
    truthFragment: "这次最像答案的那条线，其实没有被验证。",
    systemNote: "主舰保住了最低限度的记录，没有直接黑屏失败。",
    recommendedNextStep: "重新进入故障台，先补证据再判断。",
    learnedRule: latestRule,
    recoveryPercent: getRecoveryPercent(run, grade),
    broughtBack: getBroughtBack(run, grade),
    crewContribution: getCrewContribution(run),
    hallucinationNote: "系统把噪声和缺口补成了一个看似顺的解释，这就是本轮幻觉来源。"
  };
}

export function resolveFaultChoice(run: FaultRunState, choiceId: string, crew: CrewMember): FaultRunState {
  const node = run.nodes[run.currentNodeIndex];
  const choice = node?.choices.find((item) => item.id === choiceId);

  if (!node || !choice) {
    return run;
  }

  const bonus = getCrewBonus(crew, choice);
  const seedModifier = getSeedChoiceModifier(run.activeSeed?.type, choice.id);
  const requirementFailed = typeof choice.requiresEvidence === "number" && run.evidence < choice.requiresEvidence;
  const penalty = requirementFailed ? { stability: -14, evidence: -4, time: -2 } : { stability: 0, evidence: 0, time: 0 };
  const rescue = choice.rescueWhenLowStability && run.stability <= 34 ? 6 : 0;
  const nextStability = clamp(run.stability + choice.effect.stability + bonus.stability + seedModifier.stability + penalty.stability + rescue, 0, 100);
  const nextEvidence = clamp(run.evidence + choice.effect.evidence + bonus.evidence + seedModifier.evidence + penalty.evidence, 0, 100);
  const nextTime = clamp(run.timeWindow + choice.effect.time + bonus.time + seedModifier.time + penalty.time, 0, 30);
  const historyEntry: FaultRunHistoryEntry = {
    nodeId: node.id,
    nodeTitle: node.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    summary: `${seedModifier.note ?? ""}${requirementFailed ? `${choice.summary} 但证据不够，系统被这步拉偏了。` : choice.summary}`,
    principle: choice.principle,
    delta: {
      stability: nextStability - run.stability,
      evidence: nextEvidence - run.evidence,
      time: nextTime - run.timeWindow
    },
    crewSupport: bonus.note,
    seedInteraction: seedModifier.note,
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
