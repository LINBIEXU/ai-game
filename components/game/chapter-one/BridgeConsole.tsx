"use client";

import { bridgeModuleCatalog, labelMap } from "@/lib/game-constants";
import { getCrewSummary } from "@/lib/mock-generators";
import type { CrewMember, RepairedSignal } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";
import { StarMapPanel } from "@/components/game/StarMapPanel";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface BridgeConsoleProps {
  crew: CrewMember | null;
  crewOnboard: boolean;
  systemsRestored: boolean;
  firstStarLit: boolean;
  chapterComplete: boolean;
  repairedSignal: RepairedSignal | null;
  onRecruit: () => void;
  onRestoreSystems: () => void;
  onOpenSignalMission: () => void;
}

export function BridgeConsole({
  crew,
  crewOnboard,
  systemsRestored,
  firstStarLit,
  chapterComplete,
  repairedSignal,
  onRecruit,
  onRestoreSystems,
  onOpenSignalMission
}: BridgeConsoleProps) {
  const primaryAction = !crewOnboard
    ? {
        label: "招募第一位船员",
        action: onRecruit
      }
    : !systemsRestored
      ? {
          label: "恢复主舱系统",
          action: onRestoreSystems
        }
      : !firstStarLit
        ? {
            label: "前往信息库",
            action: onOpenSignalMission
          }
        : null;

  const robotTitle = !crewOnboard
    ? "第一位船员仍未上线"
    : !systemsRestored
      ? "飞船系统等待恢复"
      : !firstStarLit
        ? "信息库已可进入"
        : chapterComplete
          ? "下一章入口正在闪烁"
          : "世界已经因为你的任务推进";

  const robotBody = !crewOnboard
    ? "引导机器人：先把协作位点亮。没有伙伴，主舱恢复会卡在最前面的断点。"
    : !systemsRestored
      ? "引导机器人：船员已经登船。现在可以一起恢复信息库、星图和第一颗星球档案。"
      : !firstStarLit
        ? "引导机器人：主舱恢复完成。信息库正在等待第一颗可调用星球模型。"
        : chapterComplete
          ? "引导机器人：第一章记录完毕。远航门仍然关闭，但新的坐标已经在门外闪光。"
          : "引导机器人：第一颗航星在线，新坐标已记录，回声异常也正在主舱边缘聚集。";

  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div className={`panel-surface panel-grid rounded-[32px] p-6 md:p-8 ${systemsRestored ? "hologram-sweep" : ""}`}>
          <div className="soft-label text-[11px] text-white/45">第一章 · 星球建模的起点</div>
          <h2 className="mt-4 text-3xl font-semibold text-white">飞船正在被一点点重新点亮。</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
            {!crewOnboard && "你已经苏醒，主舱基础回路恢复，但真正的协作仍未开始。"}
            {crewOnboard && !systemsRestored && "船员已加入，主舱开始恢复更多功能位。你会明显看见这艘船正在回到工作状态。"}
            {systemsRestored && !firstStarLit && "信息库、星图和档案舱重新联机。现在该把第一颗星球建成可调用模型。"}
            {firstStarLit && "第一颗航星亮起后，飞船不再只是被修好一点，而是真的朝前走了一步。"}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <SystemFeedback eyebrow="引导机器人" title={robotTitle} body={robotBody} tone={systemsRestored ? "success" : "info"} />
            <div className="rounded-[24px] border border-white/8 bg-slate-950/50 p-4">
              <div className="soft-label text-[10px] text-white/45">任务推进</div>
              <div className="mt-2 text-sm leading-6 text-white/72">
                {!crewOnboard && "先把第一位船员带上船，主舱才会开始向前恢复。"}
                {crewOnboard && !systemsRestored && "你和船员的第一次合作不是战斗，而是把失灵的系统重新唤醒。"}
                {systemsRestored && !firstStarLit && "下一步不是盲修，而是先选信号源、读碎片、做判断，再让系统补全。"}
                {firstStarLit && "世界已经推进：星图亮起、船员档案更新、下一段异常露出轮廓。"}
              </div>
            </div>
          </div>

          {primaryAction && (
            <div className="mt-8">
              <button
                type="button"
                onClick={primaryAction.action}
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
              >
                {primaryAction.label}
              </button>
            </div>
          )}
        </div>

        <div className="panel-surface rounded-[32px] p-6">
          <div className="soft-label text-[11px] text-white/45">主舱模块</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bridgeModuleCatalog.map((module) => {
              const status =
                module.id === "command"
                  ? "online"
                  : module.id === "recruitment"
                    ? "online"
                    : module.id === "gate"
                      ? chapterComplete
                        ? "new"
                        : "locked"
                      : module.id === "star-map"
                        ? firstStarLit
                          ? "new"
                          : systemsRestored
                            ? "online"
                            : "locked"
                        : systemsRestored
                          ? "online"
                          : "locked";

              return (
                <div
                  key={module.id}
                  className={`rounded-[22px] border px-4 py-4 ${
                    status === "new"
                      ? "border-amber-200/25 bg-amber-200/10"
                      : status === "online"
                        ? "border-cyan-300/18 bg-cyan-300/8"
                        : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{module.label}</div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] tracking-[0.18em] ${
                        status === "new"
                          ? "bg-amber-200/20 text-amber-50"
                          : status === "online"
                            ? "bg-cyan-300/18 text-cyan-50"
                            : "bg-white/6 text-white/40"
                      }`}
                    >
                      {status === "new" ? "NEW" : status === "online" ? "ONLINE" : "LOCKED"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/58">{module.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`panel-surface rounded-[28px] p-5 ${crewOnboard ? "unlock-burst" : "panel-reveal"}`}>
          <div className="soft-label text-[11px] text-white/45">协作位</div>
          {!crewOnboard || !crew ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-white/14 bg-white/[0.03] p-6 text-white/55">
              <div className="text-lg font-semibold text-white/72">空着的船员位</div>
              <p className="mt-2 text-sm leading-6">主舱正在等待第一位愿意与你一起修船、解信号的伙伴。</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 md:grid-cols-[96px_1fr]">
              <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" />
              <div>
                <div className="text-lg font-semibold text-white">{crew.name}</div>
                <div className="mt-1 text-sm text-cyan-100/75">{crew.title}</div>
                <div className="mt-3 text-sm leading-6 text-white/68">{crew.intro}</div>
                <div className="mt-3 inline-flex rounded-full border border-cyan-200/18 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-100">
                  {getCrewSummary(crew)}
                </div>
                <div className="mt-3 text-xs leading-6 text-white/48">
                  你先决定了{labelMap.role[crew.role]}、{labelMap.temperament[crew.temperament]}和{labelMap.talent[crew.talent]}，系统才把这个伙伴带到协作位。
                </div>
              </div>
            </div>
          )}
        </div>

        <StarMapPanel firstStarLit={firstStarLit} coordinateLabel={repairedSignal?.coordinateLabel ?? "星图正在等待第一处被你亲手点亮的记录"} />

        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/45">下一步</div>
          <div className="mt-3 text-lg font-semibold text-white">
            {!firstStarLit ? "让主舱恢复，再完成第一颗星球建模" : "新的航线已被主舱记住"}
          </div>
          <div className="mt-3 text-sm leading-6 text-white/64">
            {!firstStarLit
              ? "这一章里，你会先招募伙伴，再恢复系统，然后把第一颗星球建成真正能继续调用的世界对象。"
              : repairedSignal?.nextLead ?? "新的回声异常正在主舱边缘闪烁。"}
          </div>
        </div>
      </div>
    </section>
  );
}
