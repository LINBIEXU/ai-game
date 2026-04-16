"use client";

import { useEffect, useMemo, useState } from "react";

import { AwakeningScene } from "@/components/game/AwakeningScene";
import { CrewRecruitPanel } from "@/components/game/CrewRecruitPanel";
import { CrewResultCard } from "@/components/game/CrewResultCard";
import { ChapterCompletePanel } from "@/components/game/chapter-one/ChapterCompletePanel";
import { ChapterTwoMissionPanel } from "@/components/game/chapter-two/ChapterTwoMissionPanel";
import { ChapterTwoPortalScene } from "@/components/game/chapter-two/ChapterTwoPortalScene";
import { ChapterTwoResultPanel } from "@/components/game/chapter-two/ChapterTwoResultPanel";
import { SignalAftermathPanel } from "@/components/game/chapter-one/SignalAftermathPanel";
import { SignalMissionPanel } from "@/components/game/chapter-one/SignalMissionPanel";
import { SignalReviewPanel } from "@/components/game/chapter-one/SignalReviewPanel";
import { CrewBayPanel } from "@/components/game/hub/CrewBayPanel";
import { CrewChatPanel } from "@/components/game/hub/CrewChatPanel";
import { LogbookPanel } from "@/components/game/hub/LogbookPanel";
import { ShipSignalBriefing } from "@/components/game/hub/ShipSignalBriefing";
import { ShipHubScene } from "@/components/game/hub/ShipHubScene";
import { ShipReturnButton } from "@/components/game/hub/ShipReturnButton";
import { TaskBoardPanel, TaskResultPanel } from "@/components/game/hub/TaskBoardPanel";
import { TransitionOverlay } from "@/components/game/TransitionOverlay";
import { useGameState } from "@/hooks/useGameState";

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
    canGenerateCrew,
    canAnalyzePlanet,
    canRestorePlanet,
    canStartFaultRun,
    canContinueFaultRun,
    canFinalizeChapterOne,
    canRunTask,
    canRunChapterTwoRoundOne,
    canRunChapterTwoRoundTwo,
    canCompleteChapterTwo,
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
    restartMission
  } = useGameState();
  const [transition, setTransition] = useState<TransitionState>({
    visible: false,
    title: "",
    detail: "",
    mode: "scan"
  });
  const [sceneKey, setSceneKey] = useState(0);

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
  const showReturnButton =
    state.currentScene !== "awakening" &&
    state.currentScene !== "hub" &&
    state.currentScene !== "hub-briefing" &&
    state.currentScene !== "signal-review";

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
          <div className="soft-label text-[11px] text-white/45">主舱同步</div>
          <div className="mt-4 text-lg text-white/70">正在接入第一章本地进度...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="starfield relative min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="soft-label text-[11px] text-white/42">主舰控制台</div>
            <div className="mt-1 text-xl font-semibold text-white">{state.currentScene === "hub" ? "失落航星" : "主舰内操作"}</div>
          </div>
          <div className="flex items-center gap-3">
            {showReturnButton && <ShipReturnButton onClick={returnToHub} />}
            <button
              type="button"
              onClick={restartMission}
              className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition hover:border-white/22 hover:bg-white/[0.06]"
            >
              重开这一轮
            </button>
          </div>
        </div>

        <div key={sceneKey} className="mt-6">
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
                    detail: "主舰正在报告基础记忆缺失。接下来要抢救航行、故障和船员协作三块记忆。",
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
                    title: "远航门正在展开",
                    detail: "主舰正在沿着第一章留下的坐标，把视野推向更远的未知区域。",
                    mode: "jump"
                  },
                  openChapterTwoPortal,
                  980
                )
              }
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
              repairedSignal={state.signalMission.repairedSignal}
              completed={state.chapterTwoComplete}
              routeLocked={state.chapterTwoRouteLocked}
              onBegin={() =>
                runTransition(
                  {
                    title: "沉默坐标正在展开",
                    detail: "主舰正在沿着第一章留下的回声，把你们送进真正可调查的新区域。",
                    mode: "jump"
                  },
                  startChapterTwoMission,
                  1320
                )
              }
              onReturn={returnToHub}
            />
          )}

          {state.currentScene === "chapter-two-mission" && (
            <ChapterTwoMissionPanel
              mission={state.chapterTwo}
              crewRoster={state.crewRoster}
              canRunRoundOne={canRunChapterTwoRoundOne}
              canRunRoundTwo={canRunChapterTwoRoundTwo}
              canComplete={canCompleteChapterTwo}
              responseOperation={operations["chapter-two-response"]}
              assignmentOperation={operations["chapter-two-assignment"]}
              roundOneOperation={operations["chapter-two-round-one"]}
              roundTwoOperation={operations["chapter-two-round-two"]}
              completionOperation={operations["chapter-two-complete"]}
              onAdvance={advanceChapterTwoStep}
              onSetResponsePrompt={setChapterTwoResponsePrompt}
              onAnalyzeResponse={() =>
                runTransition(
                  {
                    title: "系统正在理解你的判断",
                    detail: "主舰会先抓你最在意的那条线，再决定这段回应该从哪一面被拆开。",
                    mode: "scan"
                  },
                  analyzeChapterTwoResponse,
                  1180
                )
              }
              onRetryAnalyzeResponse={analyzeChapterTwoResponse}
              onSetCrew={setChapterTwoCrew}
              onSetDuty={setChapterTwoDuty}
              onSetAssignmentPrompt={setChapterTwoAssignmentPrompt}
              onAnalyzeAssignment={() =>
                runTransition(
                  {
                    title: "双船员协作正在排布",
                    detail: "系统会先读懂你想让谁怎样介入，再把这次协作收拢成可执行的推进方式。",
                    mode: "arrival"
                  },
                  analyzeChapterTwoAssignment,
                  1180
                )
              }
              onRetryAnalyzeAssignment={analyzeChapterTwoAssignment}
              onSetRoundOneFocus={setChapterTwoRoundOneFocus}
              onSetRoundOnePrompt={setChapterTwoRoundOnePrompt}
              onAnalyzeRoundOne={() =>
                runTransition(
                  {
                    title: "第一轮意图正在校准",
                    detail: "系统会先理解你现在最想查的那一层，再开始第一次不完全恢复。",
                    mode: "scan"
                  },
                  analyzeChapterTwoRoundOne,
                  1180
                )
              }
              onRunRoundOne={() =>
                runTransition(
                  {
                    title: "第一轮协作正在校准",
                    detail: "系统会先按你选的重点和分工，做一次不完全但有方向的恢复。",
                    mode: "scan"
                  },
                  runChapterTwoFirstPass,
                  1280
                )
              }
              onRetryRoundOne={runChapterTwoFirstPass}
              onSetRefinement={setChapterTwoRefinement}
              onSetSupportMode={setChapterTwoSupportMode}
              onSetRoundTwoPrompt={setChapterTwoRoundTwoPrompt}
              onAnalyzeRoundTwo={() =>
                runTransition(
                  {
                    title: "第二轮修正意图正在校准",
                    detail: "主舰会先消化你的补充和协作调整，再把第二轮结果压得更准。",
                    mode: "arrival"
                  },
                  analyzeChapterTwoRoundTwo,
                  1180
                )
              }
              onRunRoundTwo={() =>
                runTransition(
                  {
                    title: "第二轮修正正在进行",
                    detail: "你们正在用新的补充和分工调整，把系统一步步调到更接近真相的位置。",
                    mode: "arrival"
                  },
                  runChapterTwoSecondPass,
                  1480
                )
              }
              onRetryRoundTwo={runChapterTwoSecondPass}
              onSetFinalChoice={setChapterTwoFinalChoice}
              onComplete={() =>
                runTransition(
                  {
                    title: "第二章正在归档",
                    detail: "最终判断已经生效，主舰、船员档案和新区域扫描图都会一起更新。",
                    mode: "unlock"
                  },
                  completeChapterTwo,
                  1380
                )
              }
              onRetryComplete={completeChapterTwo}
              onRecoverBySwap={() =>
                runTransition(
                  {
                    title: "误判已归档",
                    detail: "主舰把这次失败记了下来。你可以回去换一位更适合的船员，再重新靠近这段回应。",
                    mode: "arrival"
                  },
                  () => resolveChapterTwoSetback("swap-crew"),
                  980
                )
              }
              onRecoverByStrategy={() =>
                runTransition(
                  {
                    title: "回响回路重新打开",
                    detail: "主舰保留了这次失败留下的线索。你们可以不换人，直接改写判断和调查方向。",
                    mode: "scan"
                  },
                  () => resolveChapterTwoSetback("retry-strategy"),
                  980
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
                    title: "主舰状态已回写",
                    detail: "第二章的结果已经留在星图、日志和船员档案里。你可以回主舰继续准备下一次远征。",
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
                    detail: "主舰会先从你的描述里提取伙伴倾向，再把少量微调权交还给你。",
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
                    detail: "导航盘、资源产出和第一个探索坐标会随着这次建模一起恢复。",
                    mode: "unlock"
                  },
                  restorePlanetModel,
                  1080
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
                    title: "故障回溯链正在展开",
                    detail: "过去的信息世界已经打开，这一轮会围绕随机故障种子生成一条新的短回溯链。",
                    mode: "scan"
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
                    title: "信息库前两层已归档",
                    detail: "主舰正在汇总星球建模与故障回溯真正带来的恢复结果。",
                    mode: "unlock"
                  },
                  finalizeChapterOne,
                  980
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
