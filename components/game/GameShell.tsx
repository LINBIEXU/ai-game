"use client";

import { useEffect, useMemo, useState } from "react";

import { AwakeningScene } from "@/components/game/AwakeningScene";
import { ChapterOnePresentationLayer } from "@/components/game/ChapterOnePresentationLayer";
import { ClassroomLoginPanel } from "@/components/game/ClassroomLoginPanel";
import { CurrentObjectiveBeacon } from "@/components/game/CurrentObjectiveBeacon";
import { CrewRecruitPanel } from "@/components/game/CrewRecruitPanel";
import { CrewResultCard } from "@/components/game/CrewResultCard";
import { ChapterCompletePanel } from "@/components/game/chapter-one/ChapterCompletePanel";
import { ChapterTwoMissionPanel } from "@/components/game/chapter-two/ChapterTwoMissionPanel";
import { ChapterTwoPortalScene } from "@/components/game/chapter-two/ChapterTwoPortalScene";
import { ChapterTwoResultPanel } from "@/components/game/chapter-two/ChapterTwoResultPanel";
import { ExperienceResultPanel } from "@/components/game/chapter-one/ExperienceResultPanel";
import { HomePlanetHubPanel } from "@/components/game/home-planet/HomePlanetHubPanel";
import { ParentSummaryPanel } from "@/components/game/chapter-one/ParentSummaryPanel";
import { SignalAftermathPanel } from "@/components/game/chapter-one/SignalAftermathPanel";
import { SignalMissionPanel } from "@/components/game/chapter-one/SignalMissionPanel";
import { SignalReviewPanel } from "@/components/game/chapter-one/SignalReviewPanel";
import { TrialBridgePanel } from "@/components/game/chapter-one/TrialBridgePanel";
import { TrialResultPanel } from "@/components/game/chapter-one/TrialResultPanel";
import { ArchivePanel } from "@/components/game/hub/ArchivePanel";
import { CrewBayPanel } from "@/components/game/hub/CrewBayPanel";
import { CrewChatPanel } from "@/components/game/hub/CrewChatPanel";
import { LogbookPanel } from "@/components/game/hub/LogbookPanel";
import { ShipSignalBriefing } from "@/components/game/hub/ShipSignalBriefing";
import { ShipHubScene } from "@/components/game/hub/ShipHubScene";
import { TaskBoardPanel, TaskResultPanel } from "@/components/game/hub/TaskBoardPanel";
import { TransitionOverlay } from "@/components/game/TransitionOverlay";
import { useChapterOnePresentation } from "@/hooks/useChapterOnePresentation";
import { useClassroomProfile } from "@/hooks/useClassroomProfile";
import { useGameState } from "@/hooks/useGameState";
import { getCurrentObjective } from "@/lib/current-objective";

interface TransitionState {
  visible: boolean;
  title: string;
  detail: string;
  mode: "scan" | "unlock" | "arrival" | "jump";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function GameShell() {
  const {
    state,
    operations,
    isHydrated,
    replaceState,
    canGenerateCrew,
    canAnalyzePlanet,
    canRestorePlanet,
    canStartFaultRun,
    canContinueFaultRun,
    canFinalizeChapterOne,
    canRunTask,
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
    continueToFaultReview,
    openFirstExperienceResult,
    openTrialResult,
    openParentSummary,
    startTrialFromBeginning,
    jumpToShipHub,
    jumpToFirstLevel,
    jumpToLanguagePortal,
    jumpToLanguageSurface,
    completeChapterTwoLandmarksForPilot,
    enterBlackboxTrialForPilot,
    maxHomePlanetResources,
    setMotherworldBuildingsDark,
    setMotherworldBuildingsLit,
    teacherTriggerPlanetRestoration,
    resetTrialFlow,
    closeSignalReview,
    openChapterComplete,
    restartMission
  } = useGameState();
  const chapterOnePresentation = useChapterOnePresentation({
    state,
    operations
  });
  const [transition, setTransition] = useState<TransitionState>({
    visible: false,
    title: "",
    detail: "",
    mode: "scan"
  });
  const [utilityPanelOpen, setUtilityPanelOpen] = useState<"status" | "control" | null>(null);
  const [sceneKey, setSceneKey] = useState(0);
  const classroomProfile = useClassroomProfile({
    state,
    isHydrated,
    replaceState
  });

  const sceneAnimationToken = useMemo(
    () =>
      [
        state.currentScene,
        state.crewOnboard,
        state.systemsRestored,
        state.signalMission.currentStage,
        Boolean(state.signalMission.repairedSignal),
        state.firstStarLit,
        state.chapterComplete
      ].join(":"),
    [
      state.currentScene,
      state.crewOnboard,
      state.systemsRestored,
      state.signalMission.currentStage,
      state.signalMission.repairedSignal,
      state.firstStarLit,
      state.chapterComplete
    ]
  );

  useEffect(() => {
    setSceneKey((current) => current + 1);
  }, [sceneAnimationToken]);

  const activeRosterCrew = state.crewRoster.find((member) => member.id === state.activeCrewId) ?? null;
  const activeCrew = activeRosterCrew ?? state.generatedCrew ?? null;
  const importCrewImageFile = async (crewId: string, file: File) => {
    const asset = await classroomProfile.uploadImage({ kind: "crew", ownerId: crewId, file });
    importCrewPortrait(crewId, asset);
    return asset;
  };
  const importPlanetImageFile = async (planetId: string, file: File) => {
    const asset = await classroomProfile.uploadImage({ kind: "planet", ownerId: planetId, file });
    importPlanetImage(planetId, asset);
    return asset;
  };
  const showReturnButton =
    state.currentScene !== "awakening" &&
    state.currentScene !== "hub" &&
    state.currentScene !== "hub-briefing" &&
    state.currentScene !== "signal-review";
  const immersiveScenes = new Set([
    "hub",
    "recruit",
    "crew-result",
    "crew-bay",
    "archive",
    "logbook",
    "task-board",
    "task-result",
    "signal-mission",
    "home-planet-hub",
    "chapter-two-portal",
    "chapter-two-mission"
  ]);
  const immersiveFullscreen = immersiveScenes.has(state.currentScene);
  const hideImmersiveHeader = state.currentScene === "chapter-two-mission";
  const currentObjective = getCurrentObjective(state);
  const showPilotControls = process.env.NODE_ENV !== "production";

  const runTransition = async (
    config: Omit<TransitionState, "visible">,
    action: () => void | Promise<void>,
    minimum = 840
  ) => {
    setTransition({
      visible: true,
      ...config
    });

    await Promise.all([Promise.resolve(action()), wait(minimum)]);
    await wait(180);

    setTransition((current) => ({
      ...current,
      visible: false
    }));
  };

  if (!isHydrated) {
    return (
      <main className="starfield relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
        <div className="panel-surface rounded-[32px] px-8 py-10 text-center">
          <div className="soft-label text-[11px] text-white/45">主舱档案</div>
          <div className="mt-4 text-lg text-white/70">正在接入第一章本地进度...</div>
        </div>
      </main>
    );
  }

  if (!classroomProfile.isReady) {
    return (
      <ClassroomLoginPanel
        status={classroomProfile.status}
        message={classroomProfile.message}
        onLogin={classroomProfile.login}
      />
    );
  }

  return (
    <main
      className={`starfield relative min-h-screen overflow-hidden chapter-one-stage chapter-one-stage--${chapterOnePresentation.stage} ${
        immersiveFullscreen ? "px-0 py-0" : "px-4 py-6 md:px-6 md:py-8"
      }`}
      onPointerDownCapture={chapterOnePresentation.handlePointerDown}
    >
      <ChapterOnePresentationLayer
        stage={chapterOnePresentation.stage}
        cueLabel={chapterOnePresentation.cueLabel}
        soundEnabled={chapterOnePresentation.soundEnabled}
        audioReady={chapterOnePresentation.audioReady}
        onToggleSound={chapterOnePresentation.toggleSound}
      />
      <CurrentObjectiveBeacon objective={currentObjective} />
      <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 md:right-4">
        <button
          type="button"
          onClick={() => setUtilityPanelOpen((current) => (current === "status" ? null : "status"))}
          className="rounded-full border border-cyan-200/18 bg-black/42 px-3 py-3 text-xs font-semibold text-cyan-50/82 backdrop-blur-md transition hover:border-cyan-200/36 hover:bg-black/58 [writing-mode:vertical-rl]"
        >
          舰况
        </button>
        <button
          type="button"
          onClick={() => setUtilityPanelOpen((current) => (current === "control" ? null : "control"))}
          className="rounded-full border border-white/14 bg-black/42 px-3 py-3 text-xs font-semibold text-white/78 backdrop-blur-md transition hover:border-white/28 hover:bg-black/58 [writing-mode:vertical-rl]"
        >
          权限
        </button>
      </div>

      {utilityPanelOpen && (
        <div className="fixed right-16 top-1/2 z-40 max-h-[min(82vh,720px)] w-[20rem] max-w-[calc(100vw-5.5rem)] -translate-y-1/2 overflow-y-auto rounded-[24px] border border-white/10 bg-black/72 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl md:right-20">
          {utilityPanelOpen === "status" && (
            <div>
              <div className="soft-label text-[10px] text-cyan-100/50">主舰状态</div>
              <div className="mt-2 text-lg font-semibold text-white">{state.currentScene === "hub" ? "失落航星" : "主舰内操作"}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/55">
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-100/90">
                  {classroomProfile.status === "saving" ? "本地档案保存中" : classroomProfile.status === "saved" ? "本地档案已保存" : "本地主舰模式"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">舰长 {classroomProfile.profileName}</span>
              </div>
              <div className={`mt-3 text-xs leading-5 ${classroomProfile.status === "error" ? "text-amber-200/80" : "text-white/56"}`}>
                {classroomProfile.message}
              </div>
            </div>
          )}

          {utilityPanelOpen === "control" && (
            <div>
            <div className="soft-label text-[10px] text-white/40">本地主舰档案</div>
            <div className="mt-2 text-sm font-semibold text-white">{classroomProfile.profileName}</div>
            <div className="mt-1 text-xs text-white/55">
              {classroomProfile.status === "saving" ? "本地档案保存中" : classroomProfile.status === "saved" ? "本地档案已保存" : "本地主舰模式"}
            </div>
            <div className={`mt-2 text-xs leading-5 ${classroomProfile.status === "error" ? "text-amber-200/80" : "text-white/48"}`}>
              {classroomProfile.message}
            </div>

            <div className="mt-4 border-t border-white/8 pt-4">
              <div className="soft-label text-[10px] text-white/36">航行操作</div>
              <div className="mt-3 grid gap-2">
                {showReturnButton && (
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      returnToHub();
                    }}
                    className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                  >
                    返回主舰
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setUtilityPanelOpen(null);
                    restartMission();
                  }}
                  className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                >
                  重开这一轮
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUtilityPanelOpen(null);
                    classroomProfile.logout();
                  }}
                  className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                >
                  切换舰长
                </button>
              </div>
            </div>

            {showPilotControls && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <div className="soft-label text-[10px] text-white/36">领航控制</div>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "主舰 Hub 已写入",
                          detail: "直接打开主舰 Hub，并保持现有船员、星球和归档记录。",
                          mode: "jump"
                        },
                        jumpToShipHub,
                        420
                      );
                    }}
                    className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                  >
                    写入：主舰 Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "试听流程重新开始",
                          detail: "清空当前进度，回到开场状态。",
                          mode: "arrival"
                        },
                        startTrialFromBeginning,
                        520
                      );
                    }}
                    className="rounded-[16px] border border-amber-200/14 bg-amber-200/[0.08] px-4 py-3 text-left text-sm text-amber-50 transition hover:bg-amber-200/[0.14]"
                  >
                    重置：完整流程
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "第一关入口已写入",
                          detail: "如果还没有船员，会先进入船员招募；如果已有船员，会直接打开信息库第一关。",
                          mode: "scan"
                        },
                        jumpToFirstLevel,
                        520
                      );
                    }}
                    className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                  >
                    写入：第一关入口
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "言衡星入口已写入",
                          detail: "准备文明远征入口；如果缺少母星坐标，会生成一颗试听用母星。",
                          mode: "jump"
                        },
                        jumpToLanguagePortal,
                        620
                      );
                    }}
                    className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                  >
                    写入：言衡星入口
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "言衡星地表已写入",
                          detail: "直接进入言衡星地表导览；如果缺少船员，会先回到招募舱。",
                          mode: "jump"
                        },
                        jumpToLanguageSurface,
                        620
                      );
                    }}
                    className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                  >
                    写入：言衡星地表
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "四处地标已写入完成",
                          detail: "直接保留四枚文明碎片，并开启黑匣入口。",
                          mode: "unlock"
                        },
                        completeChapterTwoLandmarksForPilot,
                        520
                      );
                    }}
                    className="rounded-[16px] border border-cyan-200/12 bg-cyan-200/[0.06] px-4 py-3 text-left text-sm text-cyan-50 transition hover:bg-cyan-200/[0.12]"
                  >
                    写入：四地标完成
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "黑匣试炼已写入",
                          detail: "直接进入失序回声最终试炼。",
                          mode: "scan"
                        },
                        enterBlackboxTrialForPilot,
                        520
                      );
                    }}
                    className="rounded-[16px] border border-cyan-200/12 bg-cyan-200/[0.06] px-4 py-3 text-left text-sm text-cyan-50 transition hover:bg-cyan-200/[0.12]"
                  >
                    写入：黑匣试炼
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "言衡星复苏完成",
                          detail: "直接写入第二章成果、科技点和飞船 AI 升级。",
                          mode: "unlock"
                        },
                        teacherTriggerPlanetRestoration,
                        620
                      );
                    }}
                    className="rounded-[16px] border border-cyan-200/12 bg-cyan-200/[0.06] px-4 py-3 text-left text-sm text-cyan-50 transition hover:bg-cyan-200/[0.12]"
                  >
                    写入：言衡星复苏
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "母星资源已写入",
                          detail: "水源、矿物、能源、碎片和科技点都会写入 99。",
                          mode: "unlock"
                        },
                        maxHomePlanetResources,
                        420
                      );
                    }}
                    className="rounded-[16px] border border-cyan-200/12 bg-cyan-200/[0.06] px-4 py-3 text-left text-sm text-cyan-50 transition hover:bg-cyan-200/[0.12]"
                  >
                    写入：母星资源 99
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "母星建筑已转暗",
                          detail: "清空建筑点亮状态与基础结构，保留作品、归档和船员记录。",
                          mode: "arrival"
                        },
                        setMotherworldBuildingsDark,
                        420
                      );
                    }}
                    className="rounded-[16px] border border-amber-200/14 bg-amber-200/[0.08] px-4 py-3 text-left text-sm text-amber-50 transition hover:bg-amber-200/[0.14]"
                  >
                    写入：母星建筑全暗
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "母星建筑已全亮",
                          detail: "点亮所有母星建筑与基础结构，不扣除当前资源。",
                          mode: "unlock"
                        },
                        setMotherworldBuildingsLit,
                        520
                      );
                    }}
                    className="rounded-[16px] border border-cyan-200/12 bg-cyan-200/[0.06] px-4 py-3 text-left text-sm text-cyan-50 transition hover:bg-cyan-200/[0.12]"
                  >
                    写入：母星建筑全亮
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "打开试听成果总页",
                          detail: "主舰正在汇总船员、母星、黑匣远征和存档状态。",
                          mode: "unlock"
                        },
                        openTrialResult,
                        520
                      );
                    }}
                    className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/76 transition hover:border-white/22 hover:bg-white/[0.07]"
                  >
                    查看：最终成果页
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPanelOpen(null);
                      void runTransition(
                        {
                          title: "当前试听流程已重置",
                          detail: "重置这轮试听状态，保留当前身份入口。",
                          mode: "arrival"
                        },
                        resetTrialFlow,
                        520
                      );
                    }}
                    className="rounded-[16px] border border-amber-200/14 bg-amber-200/[0.08] px-4 py-3 text-left text-sm text-amber-50 transition hover:bg-amber-200/[0.14]"
                  >
                    重置：当前试听流程
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {!hideImmersiveHeader && !immersiveFullscreen && (
        <div className={immersiveFullscreen ? "pointer-events-none fixed left-4 top-4 z-30 md:left-6 md:top-6" : "mb-5 flex flex-wrap items-center justify-between gap-3"}>
          <div className={immersiveFullscreen ? "pointer-events-auto max-w-md rounded-[22px] border border-white/10 bg-black/32 px-4 py-3 text-white backdrop-blur-md" : ""}>
            <div className="soft-label text-[11px] text-white/42">{immersiveFullscreen ? "主舰状态" : "主舰控制台"}</div>
            <div className="mt-1 text-xl font-semibold text-white">{state.currentScene === "hub" ? "失落航星" : "主舰内操作"}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-100/90">
                {classroomProfile.status === "saving" ? "本地档案保存中" : classroomProfile.status === "saved" ? "本地档案已保存" : "本地主舰模式"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">舰长 {classroomProfile.profileName}</span>
            </div>
            <div className={`mt-2 text-xs ${classroomProfile.status === "error" ? "text-amber-200/80" : "text-white/56"}`}>
              {classroomProfile.message}
            </div>
          </div>
        </div>
      )}

      <div className={immersiveFullscreen ? "" : "mx-auto max-w-7xl"}>

        <div key={sceneKey} className={immersiveFullscreen ? "" : "mt-6"}>
          {state.currentScene === "awakening" && (
            <AwakeningScene
              onAwaken={() =>
                runTransition(
                  {
                    title: "主舱正在苏醒",
                    detail: "基础光源恢复，引导机器人从静默模式上线。第一章会从这里真正开始。",
                    mode: "scan"
                  },
                  awaken,
                  920
                )
              }
            />
          )}

          {state.currentScene === "hub" && (
            <ShipHubScene
              crewRoster={state.crewRoster}
              activeCrew={activeRosterCrew}
              systemsRestored={state.systemsRestored}
              firstStarLit={state.firstStarLit}
              chapterComplete={state.chapterComplete}
              chapterTwoUnlocked={state.chapterTwoUnlocked}
              chapterTwoRouteLocked={state.chapterTwoRouteLocked}
              chapterTwoComplete={state.chapterTwoComplete}
              scannedRegionLabel={state.scannedRegionLabel}
              newRegionAlert={state.newRegionAlert}
              technologyPoints={state.technologyPoints}
              aiCapabilityLevel={state.aiCapabilityLevel}
              aiCapabilityUnlocks={state.aiCapabilityUnlocks}
              repairedSignal={state.signalMission.repairedSignal}
              shipLogs={state.shipLogs}
              shipStatusNote={state.shipStatusNote}
              onOpenCrewBay={() =>
                runTransition(
                  {
                    title: "船员舱已展开",
                    detail: "主舰正在展开你的船员列表，你可以回看已有伙伴，也能继续招募新成员。",
                    mode: "scan"
                  },
                  openCrewBay,
                  680
                )
              }
              onOpenRecruitment={() =>
                runTransition(
                  {
                    title: "招募台正在展开",
                    detail: "主舰把新的空舱位接到招募系统，你可以继续创造新的伙伴。",
                    mode: "scan"
                  },
                  openRecruitment,
                  780
                )
              }
              onRestoreSystems={() =>
                runTransition(
                  {
                    title: "主舱系统正在恢复",
                    detail: "信息库、星图和船员名册正在重新联机。这艘船会明显亮起来。",
                    mode: "unlock"
                  },
                  restoreSystems,
                  1400
                )
              }
              onOpenSignalMission={() =>
                runTransition(
                  {
                    title: "信息库舱接入中",
                    detail: state.firstStarLit
                      ? "主舰正在调出你刚刚完成的第一颗星球档案。这里会显示本次体验的成果和下一步入口。"
                      : "主舰正在报告基础记忆缺失。先定义第一颗可航行星球，让导航盘重新点亮。",
                    mode: "scan"
                  },
                  openSignalMission,
                  880
                )
              }
              onOpenTaskBoard={() =>
                runTransition(
                  {
                    title: "任务台正在展开",
                    detail: "现在不只是看船员了，你要开始决定派谁去做什么。",
                    mode: "scan"
                  },
                  openTaskBoard,
                  760
                )
              }
              onOpenArchive={() =>
                runTransition(
                  {
                    title: "档案舱正在展开",
                    detail: "主舰正在按舰长代号调出本地主舰档案：船员、星球、导入图片和最近成果都会在这里回看。",
                    mode: "scan"
                  },
                  openArchive,
                  700
                )
              }
              onOpenHomePlanetHub={() =>
                runTransition(
                  {
                    title: "母星中枢正在接入",
                    detail: "主舰把第一章创造的母星转入基地视图：资源、建筑和作品中枢会在这里展开。",
                    mode: "arrival"
                  },
                  openHomePlanetHub,
                  760
                )
              }
              onOpenLogbook={() =>
                runTransition(
                  {
                    title: "日志舱正在展开",
                    detail: "主舰会把任务后留下的变化整理成真正的航海记录。",
                    mode: "scan"
                  },
                  openLogbook,
                  700
                )
              }
              onOpenChapterTwoPortal={() =>
                runTransition(
                  {
                    title: state.chapterTwoComplete ? "黑匣记录正在展开" : "远航门正在展开",
                    detail: state.chapterTwoComplete
                      ? "第二章已完成。主舰会把语言黑匣、远征记录和母星整理入口收在归档里。"
                      : "主舰正在沿着第一章留下的坐标，从母星出发前往语言与信息文明星。",
                    mode: state.chapterTwoComplete ? "scan" : "jump"
                  },
                  openChapterTwoPortal,
                  980
                )
              }
            />
          )}

          {state.currentScene === "archive" && (
            <ArchivePanel
              authUid={classroomProfile.profileName}
              loginType="CLASSROOM_LOCAL"
              accountEmail={null}
              isAnonymousAccount={false}
              saveStatus={classroomProfile.status === "saving" ? "saving" : classroomProfile.status === "error" ? "error" : "saved"}
              statusMessage={classroomProfile.message}
              lastSavedAt={null}
              didRestoreHistory
              saveSummary={null}
              crewRoster={state.crewRoster}
              recentWorks={[]}
              state={state}
              upgradeStage="idle"
              upgradeMessage=""
              upgradeError={null}
              upgradeBusy={false}
              pendingUpgradeEmail=""
              onRequestUpgradeCode={async () => null}
              onConfirmUpgrade={async () => null}
            />
          )}

          {state.currentScene === "home-planet-hub" && (
            <HomePlanetHubPanel
              state={state}
              activeCrew={activeCrew}
              onReturn={returnToHub}
              onActivateFeature={activateHomePlanetFeature}
              onBuildStructure={buildHomePlanetStructure}
              onMarkGalleryReview={markHomePlanetGalleryReview}
              onSaveCommission={saveHomePlanetCommission}
              onSaveDialogue={saveHomePlanetDialogue}
              onSaveStoryboard={saveHomePlanetStoryboard}
              onEquipRuleCard={equipHomePlanetRuleCard}
              onTuneCrewAssist={tuneHomePlanetCrewAssist}
              onSaveExpeditionPlan={saveHomePlanetExpeditionPlan}
            />
          )}

          {state.currentScene === "hub-briefing" && (
            <ShipSignalBriefing
              onComplete={() =>
                runTransition(
                  {
                    title: "同步完成",
                    detail: "本舰已经把眼下最重要的事交到你手里。先去招募第一位船员，让空着的协作位亮起来。",
                    mode: "arrival"
                  },
                  completeHubBriefing,
                  860
                )
              }
            />
          )}

          {state.currentScene === "chapter-two-portal" && (
            <ChapterTwoPortalScene
              activeCrew={activeCrew}
              planet={state.signalMission.planet.confirmedModel}
              repairedSignal={state.signalMission.repairedSignal}
              completed={state.chapterTwoComplete}
              routeLocked={state.chapterTwoRouteLocked}
              onBegin={() =>
                runTransition(
                  {
                    title: state.chapterTwoComplete ? "黑匣航迹正在回放" : "远航门进入跃迁",
                    detail: state.chapterTwoComplete
                      ? "主舰正在沿着已归档航迹重放言衡星记录。"
                      : "引擎环、星图轨道和语言星坐标正在同步，主舰即将离开母星外环。",
                    mode: "jump"
                  },
                  startChapterTwoMission,
                  state.chapterTwoComplete ? 1180 : 1480
                )
              }
              onReturn={returnToHub}
            />
          )}

          {state.currentScene === "chapter-two-mission" && (
            <ChapterTwoMissionPanel
              mission={state.chapterTwo}
              crewRoster={state.crewRoster}
              onSetSceneState={setChapterTwoSceneState}
              onFocusPlanet={focusChapterTwoPlanet}
              onFocusLocation={focusChapterTwoLocation}
              onUpdateDisorder={updateChapterTwoDisorder}
              onUseCrewAssist={useChapterTwoCrewAssist}
              onExploreLocation={exploreChapterTwoLocation}
              onAdvance={advanceChapterTwoStep}
              onComplete={() =>
                runTransition(
                  {
                    title: "黑匣知识正在归档",
                    detail: "科技点、文明记录和飞船 AI 理解能力会一起写入主舰。",
                    mode: "unlock"
                  },
                  completeChapterTwo,
                  1380
                )
              }
            />
          )}

          {state.currentScene === "chapter-two-result" && state.chapterTwo.outcome && (
            <ChapterTwoResultPanel
              outcome={state.chapterTwo.outcome}
              leadCrew={state.crewRoster.find((member) => member.id === state.chapterTwo.leadCrewId) ?? null}
              supportCrew={state.crewRoster.find((member) => member.id === state.chapterTwo.supportCrewId) ?? null}
              onReturn={() =>
                runTransition(
                  {
                    title: "语言理解 Level 1 已上线",
                    detail: "语言黑匣已写入。主舰会更努力听清你的意思，也会提醒你不要让它替你思考。",
                    mode: "arrival"
                  },
                  returnToHub,
                  880
                )
              }
            />
          )}

          {state.currentScene === "crew-bay" && (
            <CrewBayPanel
              crewRoster={state.crewRoster}
              activeCrewId={state.activeCrewId}
              onSetActiveCrew={setActiveCrew}
              onRecruit={openRecruitment}
              imageOperation={operations["crew-image"]}
              onRegeneratePortrait={regenerateCrewPortrait}
              onImportCrewImage={importCrewImageFile}
              onUpdateImagePromptHint={updateCrewImagePromptHint}
              onSelectEcho={selectCrewPortraitEcho}
              onOpenChat={openCrewChat}
            />
          )}

          {state.currentScene === "crew-chat" && (
            <CrewChatPanel
              crew={activeCrew}
              operation={operations["crew-chat"]}
              onSendMessage={sendCrewMessage}
              onReturn={returnToCrewBay}
            />
          )}

          {state.currentScene === "logbook" && <LogbookPanel shipLogs={state.shipLogs} />}

          {state.currentScene === "task-board" && (
            <TaskBoardPanel
              tasks={state.taskDesk.tasks}
              crewRoster={state.crewRoster}
              selectedTaskId={state.taskDesk.selectedTaskId}
              assignedCrewId={state.taskDesk.assignedCrewId}
              canRunTask={canRunTask}
              taskOperation={operations["task-run"]}
              onSelectTask={selectTask}
              onAssignCrew={assignTaskCrew}
              onRunTask={() =>
                runTransition(
                  {
                    title: "任务正在执行",
                    detail: "这一次的结果会随着你派出的船员和他擅长的方向发生变化。",
                    mode: "arrival"
                  },
                  runSelectedTask,
                  1200
                )
              }
              onRetryRunTask={runSelectedTask}
            />
          )}

          {state.currentScene === "recruit" && (
            <CrewRecruitPanel
              form={state.recruitForm}
              analysis={state.recruitAnalysis}
              canGenerate={canGenerateCrew}
              isGenerating={operations["crew-generate"].status === "loading"}
              analysisOperation={operations["crew-analyze"]}
              generationOperation={operations["crew-generate"]}
              onChange={updateRecruitForm}
              onAnalyze={() =>
                runTransition(
                  {
                    title: "系统正在解析招募信号",
                    detail: "主舰会先理解你的描述，再把它和你亲手选定的伙伴轮廓对齐。",
                    mode: "scan"
                  },
                  analyzeRecruitInput,
                  1400
                )
              }
              onRetryAnalyze={analyzeRecruitInput}
              onGenerate={() =>
                runTransition(
                  {
                    title: "正在拼合新的船员回声",
                    detail: "系统会根据你刚刚的描述和修正，把模糊轮廓收拢成真正能登船的伙伴。",
                    mode: "scan"
                  },
                  () => generateCrewMember(),
                  2300
                )
              }
              onRetryGenerate={() => generateCrewMember()}
            />
          )}

          {state.currentScene === "crew-result" && state.generatedCrew && (
            <CrewResultCard
              crew={state.generatedCrew}
              isGenerating={false}
              imageOperation={operations["crew-image"]}
              onRetryImage={() => regenerateCrewPortrait(state.generatedCrew!.id)}
              onImportCrewImage={importCrewImageFile}
              onUpdateImagePromptHint={updateCrewImagePromptHint}
              onBoard={() =>
                runTransition(
                  {
                    title: "登船通道已打开",
                    detail: "新的船员信号正在接入主舰。加入后你可以随时在船员舱里回看，也能继续生成更多伙伴。",
                    mode: "arrival"
                  },
                  boardCrew,
                  980
                )
              }
              onReroll={() =>
                runTransition(
                  {
                    title: "正在重组船员轮廓",
                    detail: "系统会保留你的方向，但重新拼出另一位更接近的新伙伴。",
                    mode: "scan"
                  },
                  rerollCrew,
                  2200
                )
              }
            />
          )}

          {state.currentScene === "signal-mission" && activeCrew && (
            <SignalMissionPanel
              crew={activeCrew}
              mission={state.signalMission}
              canAnalyzePlanet={canAnalyzePlanet}
              canRestorePlanet={canRestorePlanet}
              analyzeOperation={operations["signal-analyze"]}
              repairOperation={operations["signal-repair"]}
              onAcknowledgeAlert={acknowledgeSignalAlert}
              onPlanetInputChange={updatePlanetInput}
              onAnalyzePlanet={() =>
                runTransition(
                  {
                    title: "星球模型正在成形",
                    detail: "系统会先提取环境标签，再把你的想象压成一份可调用的星球草案。",
                    mode: "scan"
                  },
                  analyzePlanetModel,
                  980
                )
              }
              onRestorePlanet={() =>
                runTransition(
                  {
                    title: "第一颗星球正在写回星图",
                    detail: "导航盘、资源产出、第一个探索坐标和本次体验成果页会随着这次建模一起恢复。",
                    mode: "unlock"
                  },
                  restorePlanetModel,
                  1080
                )
              }
            />
          )}

          {state.currentScene === "experience-result" && activeCrew && state.signalMission.planet.confirmedModel && (
            <ExperienceResultPanel
              crew={activeCrew}
              planet={state.signalMission.planet.confirmedModel}
              shipLogs={state.shipLogs}
              saveStatus={classroomProfile.status === "saving" ? "saving" : classroomProfile.status === "error" ? "error" : "saved"}
              statusMessage={classroomProfile.message}
              lastSavedAt={null}
              onContinue={() =>
                runTransition(
                  {
                    title: "文明远征入口正在打开",
                    detail: "第一颗星球已经成为母星。接下来会前往语言与信息文明星，寻找第一枚科技黑匣。",
                    mode: "scan"
                  },
                  continueToFaultReview,
                  780
                )
              }
              onReturnToHub={() =>
                runTransition(
                  {
                    title: "返回主舰",
                    detail: "这次体验成果已经留在主舰档案里。你可以稍后继续第二章文明远征。",
                    mode: "arrival"
                  },
                  returnToHub,
                  680
                )
              }
              onOpenArchive={() =>
                runTransition(
                  {
                    title: "主舰存档正在展开",
                    detail: "船员、第一颗星球、日志和最近保存时间都会一起显示出来。",
                    mode: "scan"
                  },
                  openArchive,
                  680
                )
              }
              onOpenParentSummary={() =>
                runTransition(
                  {
                    title: "体验说明页正在展开",
                    detail: "这页会把本轮体验的学习价值和作品沉淀集中展示出来。",
                    mode: "arrival"
                  },
                  openParentSummary,
                  620
                )
              }
              onImportPlanetImage={importPlanetImageFile}
            />
          )}

          {state.currentScene === "trial-bridge" && activeCrew && state.signalMission.planet.confirmedModel && (
            <TrialBridgePanel
              crew={activeCrew}
              planet={state.signalMission.planet.confirmedModel}
              onEnterFaultRun={() =>
                runTransition(
                  {
                    title: "文明远征入口正在打开",
                    detail: "主舰会从母星出发，前往语言与信息文明星，开启第一枚科技黑匣。",
                    mode: "jump"
                  },
                  continueToFaultReview,
                  920
                )
              }
              onBackToFirstResult={() =>
                runTransition(
                  {
                    title: "回看第一关成果",
                    detail: "主舰正在调回第一颗星球和导航盘恢复记录。",
                    mode: "arrival"
                  },
                  openFirstExperienceResult,
                  520
                )
              }
            />
          )}

          {state.currentScene === "signal-review" && activeCrew && (
            <SignalReviewPanel
              crew={activeCrew}
              mission={state.signalMission}
              canStartFaultRun={canStartFaultRun}
              canContinueFaultRun={canContinueFaultRun}
              canFinalize={canFinalizeChapterOne}
              operation={operations["signal-repair"]}
              onBack={() =>
                runTransition(
                  {
                    title: "返回第一页",
                    detail: "你可以回到星球建模页重新查看刚刚写入的第一颗星球。",
                    mode: "arrival"
                  },
                  closeSignalReview,
                  320
                )
              }
              onStartFaultRun={() =>
                runTransition(
                  {
                    title: "可选旧档案挑战正在展开",
                    detail: "这不是第二章主线，而是一条短演算链，用来补齐早期主舰资料。",
                    mode: "jump"
                  },
                  startFaultRun,
                  980
                )
              }
              onChooseFaultOption={(choiceId) =>
                runTransition(
                  {
                    title: "回溯演算正在推进",
                    detail: "你的选择会立刻改写稳定度、证据清晰度和时间窗口，并决定这轮能留下什么。",
                    mode: "scan"
                  },
                  () => chooseFaultOption(choiceId),
                  840
                )
              }
              onRetryFaultRun={retryFaultRun}
              onFinalize={() =>
                runTransition(
                  {
                    title: "试听成果正在汇总",
                    detail: "主舰正在把船员、星球、黑匣远征和日志收成一页可展示成果。",
                    mode: "unlock"
                  },
                  finalizeChapterOne,
                  980
                )
              }
            />
          )}

          {state.currentScene === "trial-result" && (
            <TrialResultPanel
              crew={activeCrew}
              planet={state.signalMission.planet.confirmedModel}
              faultRun={state.signalMission.faultRun}
              chapterTwoOutcome={state.chapterTwo.outcome}
              technologyPoints={state.technologyPoints}
              aiCapabilityLevel={state.aiCapabilityLevel}
              aiCapabilityUnlocks={state.aiCapabilityUnlocks}
              shipLogs={state.shipLogs}
              saveStatus={classroomProfile.status === "saving" ? "saving" : classroomProfile.status === "error" ? "error" : "saved"}
              lastSavedAt={null}
              onReturnToHub={() =>
                runTransition(
                  {
                    title: "返回主舰",
                    detail: "试听成果已经留在主舰档案里，可以继续查看存档或准备下一次体验。",
                    mode: "arrival"
                  },
                  returnToHub,
                  680
                )
              }
              onRestartTrial={() =>
                runTransition(
                  {
                    title: "试听流程重新开始",
                    detail: "主舰会回到开场状态，方便重新开启一轮完整体验。",
                    mode: "arrival"
                  },
                  startTrialFromBeginning,
                  620
                )
              }
              onOpenParentSummary={() =>
                runTransition(
                  {
                    title: "体验说明页正在展开",
                    detail: "这页会把本轮体验的学习价值和作品沉淀集中展示出来。",
                    mode: "arrival"
                  },
                  openParentSummary,
                  620
                )
              }
            />
          )}

          {state.currentScene === "parent-summary" && (
            <ParentSummaryPanel
              crew={activeCrew}
              planet={state.signalMission.planet.confirmedModel}
              faultRun={state.signalMission.faultRun}
              chapterTwoOutcome={state.chapterTwo.outcome}
              technologyPoints={state.technologyPoints}
              aiCapabilityLevel={state.aiCapabilityLevel}
              aiCapabilityUnlocks={state.aiCapabilityUnlocks}
              shipLogs={state.shipLogs}
              saveStatus={classroomProfile.status === "saving" ? "saving" : classroomProfile.status === "error" ? "error" : "saved"}
              lastSavedAt={null}
              onBackToResult={() =>
                runTransition(
                  {
                    title: "返回成果页",
                    detail: "主舰正在收起说明层，回到已经完成的任务成果。",
                    mode: "arrival"
                  },
                  state.chapterTwo.outcome ? openTrialResult : openFirstExperienceResult,
                  520
                )
              }
              onReturnToHub={() =>
                runTransition(
                  {
                    title: "返回主舰",
                    detail: "说明页已归档，主舰视图重新展开。",
                    mode: "arrival"
                  },
                  returnToHub,
                  620
                )
              }
            />
          )}

          {state.currentScene === "signal-aftermath" && activeCrew && state.signalMission.repairedSignal && (
            <SignalAftermathPanel
              crew={activeCrew}
              repairedSignal={state.signalMission.repairedSignal}
              completionOperation={operations["chapter-one-complete"]}
              onContinue={() =>
                runTransition(
                  {
                    title: "章节记录正在生成",
                    detail: "主舱正在汇总这一章里真正被你推动起来的变化。",
                    mode: "unlock"
                  },
                  openChapterComplete,
                  980
                )
              }
              onRetryContinue={openChapterComplete}
            />
          )}

          {state.currentScene === "chapter-complete" && activeCrew && state.signalMission.repairedSignal && (
            <ChapterCompletePanel
              crew={activeCrew}
              repairedSignal={state.signalMission.repairedSignal}
              onReturnToBridge={() =>
                runTransition(
                  {
                    title: "返回主舱",
                    detail: "第一章已归档。主舰会把新的坐标、船员状态和下一章入口一起留在你眼前。",
                    mode: "arrival"
                  },
                  returnToHub,
                  820
                )
              }
            />
          )}

          {state.currentScene === "task-result" && state.taskDesk.latestResult && (
            <TaskResultPanel
              result={state.taskDesk.latestResult}
              crew={state.crewRoster.find((member) => member.id === state.taskDesk.latestResult?.assignedCrewId) ?? null}
              onFinish={() =>
                runTransition(
                  {
                    title: "主舰状态已更新",
                    detail: "任务记录、船员状态和主舰模块都已经写入新的结果。",
                    mode: "unlock"
                  },
                  finishTaskResult,
                  760
                )
              }
            />
          )}
        </div>
      </div>

      <TransitionOverlay visible={transition.visible} title={transition.title} detail={transition.detail} mode={transition.mode} />
    </main>
  );
}
