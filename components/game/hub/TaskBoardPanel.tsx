"use client";

import { shipSecondarySceneAssets } from "@/lib/ship-secondary-scenes";
import type { AIOperationState } from "@/types/ai";
import type { CrewMember, ShipTask, ShipTaskId, TaskResult } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";
import { GenerationStatus } from "@/components/game/GenerationStatus";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface TaskBoardPanelProps {
  tasks: ShipTask[];
  crewRoster: CrewMember[];
  selectedTaskId: ShipTaskId | null;
  assignedCrewId: string | null;
  canRunTask: boolean;
  taskOperation: AIOperationState;
  onSelectTask: (taskId: ShipTaskId) => void;
  onAssignCrew: (crewId: string) => void;
  onRunTask: () => void;
  onRetryRunTask?: () => void;
}

export function TaskBoardPanel({
  tasks,
  crewRoster,
  selectedTaskId,
  assignedCrewId,
  canRunTask,
  taskOperation,
  onSelectTask,
  onAssignCrew,
  onRunTask,
  onRetryRunTask
}: TaskBoardPanelProps) {
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  return (
    <section className="scene-reveal ship-secondary-stage">
      <div className="ship-secondary-stage__bg" style={{ backgroundImage: `url(${shipSecondarySceneAssets.fabricationBay})` }} />
      <div className="ship-secondary-stage__overlay" />
      <div className="ship-secondary-stage__content grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <aside className="panel-surface ship-secondary-panel rounded-[32px] p-5">
        <div className="soft-label text-[11px] text-white/42">任务台</div>
        <div className="mt-4 space-y-3">
          {tasks.map((task) => {
            const selected = task.id === selectedTaskId;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelectTask(task.id)}
                className={`w-full rounded-[22px] border p-4 text-left transition ${
                  selected ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{task.title}</div>
                  <div className="text-[10px] text-white/40">完成 {task.completionCount}</div>
                </div>
                <div className="mt-2 text-xs leading-5 text-white/52">{task.summary}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-6">
        {selectedTask ? (
          <>
            <div className="panel-surface ship-secondary-panel rounded-[32px] p-6 md:p-8">
              <div className="soft-label text-[11px] text-white/42">任务概况</div>
              <h2 className="mt-3 text-3xl font-semibold text-white">{selectedTask.title}</h2>
              <p className="mt-3 text-base leading-7 text-white/64">{selectedTask.summary}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SystemFeedback eyebrow="推荐能力" title="更适合的分工" body={selectedTask.recommended} />
                <SystemFeedback eyebrow="风险 / 未知" title="这次不完全确定" body={selectedTask.risk} tone="warm" />
              </div>
            </div>

            <div className="panel-surface ship-secondary-panel rounded-[32px] p-6 md:p-8">
              <div className="soft-label text-[11px] text-white/42">派谁去</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {crewRoster.map((crew) => {
                  const assigned = crew.id === assignedCrewId;
                  const matched = crew.role === selectedTask.recommendedRole || crew.talent === selectedTask.recommendedTalent;

                  return (
                    <button
                      key={crew.id}
                      type="button"
                      onClick={() => onAssignCrew(crew.id)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        assigned ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <div className="grid gap-4 md:grid-cols-[72px_1fr]">
                        <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" />
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-base font-semibold text-white">{crew.name}</div>
                            <span className={`text-xs ${matched ? "text-cyan-100" : "text-white/40"}`}>{matched ? "更合适" : "可尝试"}</span>
                          </div>
                          <div className="mt-2 text-sm text-white/58">{crew.title}</div>
                          <div className="mt-3 text-xs leading-6 text-white/48">{crew.bondStatus}</div>
                          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/42">
                            <span>{crew.trustLabel}</span>
                            <span>默契 {crew.trustLevel}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onRunTask}
                disabled={!canRunTask}
                className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
              >
                执行这次任务
              </button>
              <div className="mt-5">
                <GenerationStatus title="任务执行" operation={taskOperation} onRetry={onRetryRunTask} />
              </div>
            </div>
          </>
        ) : (
          <div className="panel-surface ship-secondary-panel rounded-[32px] p-6 text-sm text-white/58">先选一个任务，再决定派谁去。</div>
        )}
      </div>
      </div>
    </section>
  );
}

interface TaskResultPanelProps {
  result: TaskResult;
  crew: CrewMember | null;
  onFinish: () => void;
}

export function TaskResultPanel({ result, crew, onFinish }: TaskResultPanelProps) {
  return (
    <section className="scene-reveal ship-secondary-stage">
      <div className="ship-secondary-stage__bg" style={{ backgroundImage: `url(${shipSecondarySceneAssets.fabricationBay})` }} />
      <div className="ship-secondary-stage__overlay" />
      <div className="ship-secondary-stage__content grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <div className="panel-surface ship-secondary-panel hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-white/42">任务结果</div>
        <h2 className="mt-3 text-3xl font-semibold text-white">{result.outcomeTitle}</h2>
        <p className="mt-4 text-base leading-7 text-white/66">{result.outcomeSummary}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SystemFeedback eyebrow="主舰变化" title={result.shipChange} body={result.discoveredHint} tone="success" />
          <SystemFeedback eyebrow="任务日志" title={result.title} body={result.logLine} tone={result.resultTone === "risky" ? "warm" : "info"} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SystemFeedback eyebrow="关系变化" title={`默契 +${result.trustGain}`} body={result.trustNote} tone="success" />
          <SystemFeedback eyebrow="档案更新" title={result.dossierEntry.title} body={result.dossierEntry.body} />
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          返回主舰
        </button>
      </div>

      <div className="panel-surface ship-secondary-panel rounded-[32px] p-6">
        <div className="soft-label text-[11px] text-white/42">执行船员</div>
        {crew ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[88px_1fr]">
            <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" />
            <div>
              <div className="text-lg font-semibold text-white">{crew.name}</div>
              <div className="mt-2 text-sm text-cyan-100/72">{crew.title}</div>
              <div className="mt-3 text-sm leading-6 text-white/62">{crew.bondStatus}</div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/46">
                <span>{crew.trustLabel}</span>
                <span>默契 {crew.trustLevel}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-white/58">未找到执行船员。</div>
        )}
      </div>
      </div>
    </section>
  );
}
