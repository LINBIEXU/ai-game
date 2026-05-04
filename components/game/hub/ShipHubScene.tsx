"use client";

import { useEffect, useMemo, useState } from "react";

import { bridgeModuleCatalog, shipBootMessages, shipBootOrder } from "@/lib/game-constants";
import { chapterTwoSceneAssets } from "@/lib/chapter-two-exploration";
import type { BridgeModuleId, CrewMember, RepairedSignal } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";

interface ShipHubSceneProps {
  crewRoster: CrewMember[];
  activeCrew: CrewMember | null;
  systemsRestored: boolean;
  firstStarLit: boolean;
  chapterComplete: boolean;
  chapterTwoUnlocked: boolean;
  chapterTwoRouteLocked: boolean;
  chapterTwoComplete: boolean;
  scannedRegionLabel: string | null;
  newRegionAlert: boolean;
  technologyPoints: number;
  aiCapabilityLevel: number;
  aiCapabilityUnlocks: string[];
  repairedSignal: RepairedSignal | null;
  shipLogs: Array<{ id: string; title: string; body: string; tag: string }>;
  shipStatusNote: string | null;
  onOpenCrewBay: () => void;
  onOpenRecruitment: () => void;
  onRestoreSystems: () => void;
  onOpenSignalMission: () => void;
  onOpenTaskBoard: () => void;
  onOpenArchive: () => void;
  onOpenHomePlanetHub: () => void;
  onOpenLogbook: () => void;
  onOpenChapterTwoPortal: () => void;
}

function useBootSequence(systemsRestored: boolean) {
  const [revealedModules, setRevealedModules] = useState<BridgeModuleId[]>(systemsRestored ? shipBootOrder : ["command"]);
  const [feedbackCue, setFeedbackCue] = useState<string>(systemsRestored ? shipBootMessages.command : "主舱核心待唤醒");

  useEffect(() => {
    if (!systemsRestored) {
      setRevealedModules(["command"]);
      setFeedbackCue("主舱核心待唤醒");
      return;
    }

    setRevealedModules(["command"]);
    setFeedbackCue(shipBootMessages.command);

    const timers = shipBootOrder.slice(1).map((moduleId, index) =>
      window.setTimeout(() => {
        setRevealedModules((current) => (current.includes(moduleId) ? current : [...current, moduleId]));
        setFeedbackCue(shipBootMessages[moduleId]);
      }, 220 * (index + 1))
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [systemsRestored]);

  return { revealedModules, feedbackCue };
}

export function ShipHubScene({
  crewRoster,
  activeCrew,
  systemsRestored,
  firstStarLit,
  chapterComplete,
  chapterTwoUnlocked,
  chapterTwoRouteLocked,
  chapterTwoComplete,
  scannedRegionLabel,
  newRegionAlert,
  technologyPoints,
  aiCapabilityLevel,
  aiCapabilityUnlocks,
  repairedSignal,
  shipLogs,
  shipStatusNote,
  onOpenCrewBay,
  onOpenRecruitment,
  onRestoreSystems,
  onOpenSignalMission,
  onOpenTaskBoard,
  onOpenArchive,
  onOpenHomePlanetHub,
  onOpenLogbook,
  onOpenChapterTwoPortal
}: ShipHubSceneProps) {
  const { revealedModules, feedbackCue } = useBootSequence(systemsRestored);

  const primaryModuleId: BridgeModuleId =
    chapterTwoUnlocked
      ? "gate"
      : crewRoster.length === 0
        ? "recruitment"
        : !firstStarLit
          ? "signal-lab"
          : crewRoster.length < 2
            ? "recruitment"
            : "task-board";

  const broadcastItems = useMemo(
    () => [
      systemsRestored ? "主舰照明在线" : "主舰仍在低能耗",
      feedbackCue,
      crewRoster.length > 0 ? `船员名册 ${crewRoster.length} 已同步` : "船员名册待写入",
      chapterTwoComplete ? "语言黑匣已归档" : chapterTwoUnlocked ? "远航门锁定言衡星" : firstStarLit ? "智脑推测能力已恢复" : "信息库仍缺少基础记忆",
      shipStatusNote ?? "主舰状态稳定"
    ],
    [systemsRestored, feedbackCue, crewRoster.length, chapterTwoComplete, chapterTwoUnlocked, firstStarLit, shipStatusNote]
  );

  if (!systemsRestored) {
    return (
      <section className="scene-reveal camera-boot-pull relative min-h-[72vh] overflow-hidden rounded-[38px] bridge-shell bridge-shell--dark bridge-structure px-6 py-10 md:px-10 md:py-12">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-[12%] top-[18%] h-28 w-28 rounded-full border border-cyan-200/8 bg-cyan-200/[0.03]" />
          <div className="absolute right-[14%] top-[24%] h-20 w-20 rounded-full border border-white/6" />
          <div className="absolute bottom-[18%] left-[18%] h-24 w-24 rounded-full border border-cyan-200/8 bg-white/[0.02]" />
          <div className="absolute bottom-[16%] right-[18%] h-32 w-32 rounded-full border border-white/6" />
        </div>

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
        <div className="absolute inset-y-12 left-10 w-px bg-gradient-to-b from-transparent via-cyan-200/12 to-transparent" />
        <div className="absolute inset-y-12 right-10 w-px bg-gradient-to-b from-transparent via-cyan-200/12 to-transparent" />
        <span className="core-light-strip core-light-strip--left" />
        <span className="core-light-strip core-light-strip--right" />
        <span className="core-light-strip core-light-strip--bottom" />

        <div className="relative flex min-h-[58vh] flex-col items-center justify-center text-center">
          <div className="soft-label text-[11px] text-white/34">低能耗主舰</div>
          <h2 className="mt-4 text-[clamp(2.2rem,4vw,4.5rem)] font-semibold tracking-[0.02em] text-white">主舱核心</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/44">其余模块仍在黑暗里。先把唯一亮着的核心重新点亮。</p>

          <button
            type="button"
            onClick={onRestoreSystems}
            className="core-node core-restore-trigger group mt-10 flex h-48 w-48 items-center justify-center rounded-full border border-cyan-200/25 bg-cyan-200/[0.05] text-center transition hover:scale-[1.02]"
          >
            <div className="core-ring" />
            <div className="core-ring delay-150" />
            <div className="relative z-10">
              <div className="soft-label text-[10px] text-cyan-100/55">唯一在线节点</div>
              <div className="mt-2 text-xl font-semibold text-white">修复主舱核心</div>
              <div className="mt-2 text-xs text-cyan-100/60">启动整艘船</div>
            </div>
          </button>
        </div>
      </section>
    );
  }

  const moduleState = (moduleId: BridgeModuleId) => {
    const visible = revealedModules.includes(moduleId);

    if (moduleId === "command") {
      return { label: "主舰在线", disabled: false, action: onRestoreSystems, priority: "secondary" as const, visible };
    }
    if (moduleId === "recruitment") {
      return {
        label: crewRoster.length === 0 ? "优先恢复" : `${crewRoster.length} 位在线`,
        disabled: false,
        action: onOpenCrewBay,
        priority: crewRoster.length === 0 ? "primary" as const : "secondary" as const,
        visible
      };
    }
    if (moduleId === "signal-lab") {
      return {
        label: firstStarLit ? "记忆已恢复" : "现在最该处理",
        disabled: false,
        action: onOpenSignalMission,
        priority: !firstStarLit ? "primary" as const : "secondary" as const,
        visible
      };
    }
    if (moduleId === "task-board") {
      const available = chapterComplete && crewRoster.length >= 2;
      return {
        label: available ? "分工可用" : "稍后开放",
        disabled: !available,
        action: onOpenTaskBoard,
        priority: available && !chapterTwoUnlocked ? "primary" as const : "secondary" as const,
        visible
      };
    }
    if (moduleId === "star-map") {
      return {
        label: scannedRegionLabel ?? (firstStarLit ? "星图已更新" : "待记录"),
        disabled: false,
        action: onOpenSignalMission,
        priority: chapterTwoComplete ? "secondary" as const : "muted" as const,
        visible
      };
    }
    if (moduleId === "archive") {
      return {
        label: shipLogs.length > 0 ? `${shipLogs.length} 条记录` : "静默",
        disabled: false,
        action: onOpenArchive,
        priority: shipLogs.length > 0 ? "secondary" as const : "muted" as const,
        visible
      };
    }

    return {
      label: chapterTwoUnlocked ? (chapterTwoComplete ? "黑匣归档" : chapterTwoRouteLocked ? "远征进行中" : "文明星入口") : "锁定",
      disabled: !chapterTwoUnlocked,
      action: chapterTwoComplete ? onOpenArchive : onOpenChapterTwoPortal,
      priority: chapterTwoUnlocked && !chapterTwoComplete ? "primary" as const : chapterTwoUnlocked ? "secondary" as const : "locked" as const,
      visible
    };
  };

  const primaryModule = bridgeModuleCatalog.find((module) => module.id === primaryModuleId) ?? bridgeModuleCatalog[0];
  const primaryState = moduleState(primaryModule.id);
  const primaryDescription =
    primaryModule.id === "gate"
      ? chapterTwoComplete
        ? "语言黑匣和言衡星远征已经完成。现在适合回看记录、查看归档，或回母星整理作品。"
        : "从母星出发，前往语言与信息文明星，开启第一枚科技黑匣。"
      : primaryModule.description;
  const sideModules = bridgeModuleCatalog
    .filter((module) => module.id !== primaryModuleId)
    .filter((module) => {
      if (module.id === "gate" && !chapterTwoUnlocked) return false;
      if (module.id === "task-board" && !(chapterComplete && crewRoster.length >= 2)) return false;
      if (module.id === "archive" && shipLogs.length === 0 && !chapterComplete) return false;
      return true;
    })
    .slice(0, 4);

  return (
    <section className="scene-reveal ship-hub-immersive relative min-h-screen overflow-hidden">
      <div
        className="bridge-command-backdrop"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${chapterTwoSceneAssets.shipBridge.imageUrl})`
        }}
      >
        <div className="bridge-command-backdrop__scan" />
      </div>
      <div className="fleet-broadcast panel-surface absolute left-6 right-6 top-24 z-20 rounded-full px-4 py-2 md:left-10 md:right-10 md:top-28">
        <div className="fleet-broadcast-track">
          {[...broadcastItems, ...broadcastItems].map((item, index) => (
            <span key={`${item}-${index}`} className="fleet-broadcast-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="ship-hub-bridge-view relative z-10 min-h-screen overflow-hidden px-6 pb-8 pt-40 md:px-10 md:pb-10 md:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,226,255,0.05),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(244,114,182,0.035),transparent_18%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-5">
            {chapterTwoComplete && (
              <div className="ship-ai-upgrade-card rounded-[28px] p-5">
                <div className="soft-label text-[10px] text-cyan-100/60">主控台新模块上线</div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-2xl font-semibold text-white">语言理解 Level 1</div>
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-200/[0.08] px-3 py-2 text-xs text-cyan-50">
                    AI 升级完成
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
                  语言黑匣已写入。以后，我会更努力听清你的意思。但我也会提醒你：不要让我替你思考。
                </p>
              </div>
            )}

            {firstStarLit && (
              <div className="panel-surface rounded-[28px] border border-cyan-200/16 bg-cyan-200/[0.055] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="soft-label text-[10px] text-cyan-100/55">第二主阵地</div>
                    <div className="mt-2 text-2xl font-semibold text-white">母星功能中枢</div>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/56">
                      第一章创造的母星已可作为 AI 创造基地：建设建筑、接作品委托、保存分镜和对话收获。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenHomePlanetHub}
                    className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
                  >
                    登陆母星
                  </button>
                </div>
              </div>
            )}

            <div className={`bridge-primary module-card module-card--primary rounded-[34px] p-6 md:p-8 ${primaryState.visible ? "module-awake" : "module-dim"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="soft-label text-[11px] text-cyan-100/52">当前焦点</div>
                  <h2 className="mt-3 text-[clamp(2rem,3vw,3.6rem)] font-semibold text-white">{primaryModule.label}</h2>
                </div>
                <span className="status-chip">{primaryState.label}</span>
              </div>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/56">{primaryDescription}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/12 bg-cyan-200/[0.06] px-3 py-2 text-[11px] tracking-[0.14em] text-cyan-100/68">
                <span className="h-2 w-2 rounded-full bg-cyan-200/80 system-pulse" />
                FEEDBACK CUE ONLINE
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={primaryModule.id === "gate" && chapterTwoComplete ? onOpenChapterTwoPortal : primaryState.action}
                  disabled={primaryState.disabled}
                  className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
                >
                  {primaryModule.id === "recruitment"
                    ? crewRoster.length === 0
                      ? "开始招募第一位船员"
                      : "打开船员舱"
                    : primaryModule.id === "signal-lab"
                      ? "进入信息库"
                      : primaryModule.id === "gate"
                        ? chapterTwoComplete
                          ? "回看黑匣记录"
                          : "进入第二章远征"
                        : "打开模块"}
                </button>
                {primaryModule.id === "gate" && chapterTwoComplete && (
                  <>
                    <button
                      type="button"
                      onClick={onOpenArchive}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:bg-white/[0.08]"
                    >
                      查看远征归档
                    </button>
                    <button
                      type="button"
                      onClick={onOpenHomePlanetHub}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:bg-white/[0.08]"
                    >
                      返回母星整理作品
                    </button>
                  </>
                )}
                {primaryModule.id !== "recruitment" && crewRoster.length < 2 && (
                  <button
                    type="button"
                    onClick={onOpenRecruitment}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:bg-white/[0.08]"
                  >
                    再招募一位
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="panel-surface rounded-[24px] p-4">
                <div className="soft-label text-[10px] text-white/36">值班船员</div>
                {activeCrew ? (
                  <div className="mt-3 grid grid-cols-[68px_1fr] gap-3">
                    <CrewPortrait formType={activeCrew.formType} role={activeCrew.role} seed={activeCrew.portraitSeed} size="sm" />
                    <div>
                      <div className="text-sm font-semibold text-white">{activeCrew.name}</div>
                      <div className="mt-1 text-xs text-white/46">{activeCrew.trustLabel}</div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, activeCrew.trustLevel * 18)}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-white/42">暂无值班船员</div>
                )}
              </div>
              <div className="panel-surface rounded-[24px] p-4">
                <div className="soft-label text-[10px] text-white/36">舰内状态</div>
                <div className="mt-3 text-sm leading-6 text-white/56">
                  {shipStatusNote ??
                    (chapterTwoComplete
                      ? "第二章已归档，等待整理作品"
                      : chapterTwoUnlocked
                        ? "远航门等待靠近"
                        : !firstStarLit
                          ? "先完成第一颗星球建模"
                          : "系统稳定")}
                </div>
              </div>
              <div className="panel-surface rounded-[24px] p-4">
                <div className="soft-label text-[10px] text-white/36">AI 成长</div>
                <div className="mt-3 text-sm leading-6 text-white/56">
                  {technologyPoints > 0
                    ? `科技点 ${technologyPoints} · AI Lv.${aiCapabilityLevel} · ${aiCapabilityUnlocks.slice(-1)[0] ?? "能力更新"}`
                    : shipLogs[0]?.title ?? (crewRoster.length > 0 ? "船员档案已开始写入" : "完成第一个动作后会留下记录")}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {chapterTwoUnlocked && (
              <button
                type="button"
                onClick={chapterTwoComplete ? onOpenArchive : onOpenChapterTwoPortal}
                className={`module-card rounded-[26px] p-5 text-left transition ${newRegionAlert ? "module-card--spotlight unlock-burst" : "module-card--signal"} w-full`}
              >
                <div className="soft-label text-[10px] text-fuchsia-100/58">远航门</div>
                <div className="mt-2 text-lg font-semibold text-white">{chapterTwoComplete ? "查看远征归档" : "语言文明星航线已解锁"}</div>
                <div className="mt-2 text-sm leading-6 text-white/58">{chapterTwoComplete ? scannedRegionLabel ?? "言衡星 / 黑匣记录" : "前往第一颗外部工具文明星"}</div>
              </button>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {sideModules.map((module) => {
                const state = moduleState(module.id);

                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={state.action}
                    disabled={state.disabled || !state.visible}
                    className={`module-card rounded-[24px] p-4 text-left transition ${
                      state.priority === "primary"
                        ? "module-card--spotlight"
                        : state.priority === "secondary"
                          ? "module-card--secondary"
                          : state.priority === "locked"
                            ? "module-card--locked"
                            : "module-card--muted"
                    } ${state.visible ? "module-awake" : "module-dim"} disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{module.label}</div>
                      <span className="text-[10px] text-white/38">{state.label}</span>
                    </div>
                    <div className="mt-3 text-xs leading-6 text-white/48">{module.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
