import {
  chapterTwoBlackboxFragmentLocationIds,
  chapterTwoEvidenceFragmentLocationId
} from "@/lib/chapter-two-exploration";
import type { GameState, RecruitForm } from "@/types/game";

export interface CurrentObjective {
  label: string;
  tone?: "default" | "urgent" | "complete";
}

function getRecruitSourceKey(form: RecruitForm) {
  return [form.description.trim(), form.notes.trim()].filter(Boolean).join("｜");
}

function isRecruitAnalysisFresh(state: GameState) {
  return Boolean(state.recruitAnalysis && state.recruitAnalysis.sourceText === getRecruitSourceKey(state.recruitForm));
}

function hasPlanetInputSignal(state: GameState) {
  const input = state.signalMission.planet.input;

  return Boolean(input.appearance.trim() && input.environment.trim() && input.mood);
}

function getHubObjective(state: GameState): CurrentObjective {
  if (!state.systemsRestored) {
    return { label: "修复主舱核心", tone: "urgent" };
  }

  if (state.crewRoster.length === 0) {
    return { label: "接入第一位同行者" };
  }

  if (!state.firstStarLit) {
    return { label: "写入第一颗母星" };
  }

  if (state.chapterTwoComplete) {
    return { label: "返回母星整理远征记录", tone: "complete" };
  }

  if (state.chapterTwoUnlocked) {
    return { label: "返回主舰查看远航门", tone: state.newRegionAlert ? "urgent" : "default" };
  }

  return { label: "查看主舰下一处亮起模块" };
}

function getRecruitObjective(state: GameState): CurrentObjective {
  if (!state.recruitForm.description.trim()) {
    return { label: "发出第一条招募信号" };
  }

  if (!isRecruitAnalysisFresh(state)) {
    return { label: "让主舰读懂招募信号" };
  }

  return { label: "确认第一位同行者" };
}

function getSignalMissionObjective(state: GameState): CurrentObjective {
  if (state.signalMission.currentStage === "alert") {
    return { label: "进入信息库第一页" };
  }

  if (state.signalMission.planet.status === "restored" || state.firstStarLit) {
    return { label: "返回主舰查看远航门", tone: "complete" };
  }

  if (!state.signalMission.planet.analysis) {
    return { label: hasPlanetInputSignal(state) ? "让主舰理解母星轮廓" : "描述第一颗母星" };
  }

  return { label: "写入第一颗母星" };
}

function getChapterTwoMissionObjective(state: GameState): CurrentObjective {
  const mission = state.chapterTwo;
  const evidenceWellCompleted = mission.exploredLocationIds.includes(chapterTwoEvidenceFragmentLocationId);
  const blackboxFragmentCount = chapterTwoBlackboxFragmentLocationIds.filter((id) => mission.exploredLocationIds.includes(id)).length;
  const blackboxReady = mission.blackBoxUnlocked || blackboxFragmentCount >= chapterTwoBlackboxFragmentLocationIds.length;

  if (mission.outcome || state.chapterTwoComplete) {
    return { label: "返回主舰整理归档", tone: "complete" };
  }

  if (mission.currentStep !== "response") {
    return { label: "稳定失序回声", tone: "urgent" };
  }

  if (mission.sceneState === "ship_bridge" || mission.sceneState === "launch_sequence" || mission.sceneState === "warp_travel") {
    return { label: "从主舰出发" };
  }

  if (mission.sceneState === "sector_view" || mission.sceneState === "planet_preview" || mission.sceneState === "planet_descent") {
    return { label: "进入言衡星" };
  }

  if (blackboxReady) {
    return { label: "四束信息光已汇聚，触碰黑匣", tone: "urgent" };
  }

  if (!evidenceWellCompleted) {
    return { label: "修复证据回声井" };
  }

  return { label: "修复一处言衡星地标" };
}

function getHomePlanetObjective(state: GameState): CurrentObjective {
  if (state.chapterTwoComplete) {
    return { label: "整理远征记录", tone: "complete" };
  }

  if ((state.homePlanetHub.activeFeatures ?? []).length === 0) {
    return { label: "点亮一座母星建筑" };
  }

  return { label: "整理母星作品与档案" };
}

function getReviewObjective(state: GameState): CurrentObjective {
  if (state.chapterTwoComplete) {
    return { label: "返回母星整理远征记录", tone: "complete" };
  }

  if (state.chapterTwoUnlocked) {
    return { label: "返回主舰查看远航门" };
  }

  return { label: "返回主舰查看下一步航线" };
}

export function getCurrentObjective(state: GameState): CurrentObjective {
  switch (state.currentScene) {
    case "awakening":
      return { label: "唤醒主舱核心", tone: "urgent" };
    case "hub":
      return getHubObjective(state);
    case "hub-briefing":
      return { label: "接收主舰同步" };
    case "recruit":
      return getRecruitObjective(state);
    case "crew-result":
      return { label: "确认同行者登船", tone: "complete" };
    case "signal-mission":
      return getSignalMissionObjective(state);
    case "experience-result":
      return { label: state.chapterTwoUnlocked ? "返回主舰查看远航门" : "接入第二章航线" };
    case "trial-bridge":
      return { label: "从母星前往言衡星" };
    case "chapter-two-portal":
      return state.chapterTwoComplete
        ? { label: "回看黑匣归档", tone: "complete" }
        : { label: state.chapterTwoRouteLocked ? "继续言衡星远征" : "从主舰出发", tone: state.newRegionAlert ? "urgent" : "default" };
    case "chapter-two-mission":
      return getChapterTwoMissionObjective(state);
    case "chapter-two-result":
      return { label: "返回主舰整理归档", tone: "complete" };
    case "home-planet-hub":
      return getHomePlanetObjective(state);
    case "crew-bay":
      return { label: state.firstStarLit ? "返回主舰查看航线" : "返回主舰写入第一颗母星" };
    case "crew-chat":
      return { label: "收好同行者回应" };
    case "task-board":
      return { label: state.taskDesk.assignedCrewId ? "执行这次舰内任务" : "派出同行者协作" };
    case "task-result":
      return { label: "收回任务记录", tone: "complete" };
    case "archive":
    case "logbook":
    case "trial-result":
    case "parent-summary":
    case "signal-review":
    case "signal-aftermath":
    case "chapter-complete":
      return getReviewObjective(state);
    default:
      return { label: "返回主舰查看下一步航线" };
  }
}
