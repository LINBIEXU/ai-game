"use client";

import { useEffect, useMemo, useState } from "react";

import { shipSecondarySceneAssets } from "@/lib/ship-secondary-scenes";
import type { CloudSaveStatus, CloudSaveSummary, CloudWorkRecord } from "@/types/cloud-save";
import type { CrewMember, GameState } from "@/types/game";

interface ArchivePanelProps {
  authUid: string | null;
  loginType: string | null;
  accountEmail: string | null;
  isAnonymousAccount: boolean;
  saveStatus: CloudSaveStatus;
  statusMessage: string;
  lastSavedAt: number | null;
  didRestoreHistory: boolean;
  saveSummary: CloudSaveSummary | null;
  crewRoster: CrewMember[];
  recentWorks: CloudWorkRecord[];
  state: GameState;
  upgradeStage: "idle" | "sending" | "code-sent" | "verifying" | "success" | "error";
  upgradeMessage: string;
  upgradeError: string | null;
  upgradeBusy: boolean;
  pendingUpgradeEmail: string;
  onRequestUpgradeCode: (email: string) => Promise<unknown>;
  onConfirmUpgrade: (payload: { rawEmail: string; code: string }) => Promise<unknown>;
}

function sceneLabel(scene: GameState["currentScene"]) {
  return (
    {
      awakening: "主舱苏醒",
      hub: "主舰主舱",
      archive: "主舰档案舱",
      "hub-briefing": "同步简报",
      recruit: "船员招募台",
      "crew-result": "船员生成结果",
      "crew-bay": "船员舱",
      "crew-chat": "船员对话",
      logbook: "航海日志舱",
      "task-board": "任务台",
      "task-result": "任务结果",
      "signal-mission": "信息库第一关",
      "signal-review": "信息库修复界面",
      "experience-result": "首个体验成果页",
      "trial-bridge": "试听过场衔接",
      "trial-result": "试听成果总页",
      "parent-summary": "体验说明页",
      "signal-aftermath": "信息库修复后",
      "chapter-complete": "第一章总结",
      "chapter-two-portal": "第二章入口",
      "chapter-two-mission": "第二章推进中",
      "chapter-two-result": "第二章结果"
    } as Record<GameState["currentScene"], string>
  )[scene];
}

function formatTime(timestamp: number | null) {
  if (!timestamp) {
    return "尚未写入";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function resolveProgressAnchor(state: GameState) {
  if (!state.crewOnboard) return "船员招募台";
  if (state.chapterTwo.outcome) return "语言模型黑匣已归档";
  if (state.chapterTwo.currentStep !== "response" || state.chapterTwo.echo) return "第二章科技黑匣";
  if (state.signalMission.planet.status === "restored" && !state.chapterTwoUnlocked) return "第二章文明远征入口";
  if (state.signalMission.planet.status === "analyzed") return "第一关星球建模确认";
  if (state.signalMission.planet.status === "input" && state.firstStarLit) return "信息库第一关";
  return sceneLabel(state.currentScene === "archive" || state.currentScene === "logbook" ? "hub" : state.currentScene);
}

export function ArchivePanel({
  authUid,
  loginType,
  accountEmail,
  isAnonymousAccount,
  saveStatus,
  statusMessage,
  lastSavedAt,
  didRestoreHistory,
  saveSummary,
  crewRoster,
  recentWorks,
  state,
  upgradeStage,
  upgradeMessage,
  upgradeError,
  upgradeBusy,
  pendingUpgradeEmail,
  onRequestUpgradeCode,
  onConfirmUpgrade
}: ArchivePanelProps) {
  const [email, setEmail] = useState(accountEmail ?? "");
  const [code, setCode] = useState("");
  const isClassroomLocal = loginType === "CLASSROOM_LOCAL";
  const latestLogs = state.shipLogs.slice(0, 3);
  const progressNotes = [
    `当前停留：${saveSummary?.lastRestorePoint ?? resolveProgressAnchor(state)}`,
    saveSummary?.activePlanetName
      ? `已建模星球：${saveSummary.activePlanetName}`
      : state.signalMission.planet.confirmedModel
        ? `已建模星球：${state.signalMission.planet.confirmedModel.name}`
        : "第一颗星球仍待写回星图",
    state.chapterTwo.outcome
      ? `黑匣已开启：${state.chapterTwo.outcome.blackBoxTitle ?? state.chapterTwo.outcome.title}`
      : state.chapterTwo.echo
        ? `第二章进度：${state.chapterTwo.currentStep === "response" ? "星球表层扫描" : saveSummary?.checkpointStage ?? "黑匣学习流程"}`
        : "科技黑匣尚未开启",
    `科技点：${state.technologyPoints} · AI 等级 ${state.aiCapabilityLevel}`
  ];
  const canShowUpgrade =
    !isClassroomLocal &&
    isAnonymousAccount &&
    (crewRoster.length > 0 || recentWorks.length > 0 || Boolean(lastSavedAt) || state.shipLogs.length > 0 || state.crewOnboard);
  const upgradeHint = useMemo(() => {
    if (upgradeError) {
      return upgradeError;
    }

    if (upgradeMessage) {
      return upgradeMessage;
    }

    return "绑定家长邮箱后，这艘船会把当前船员、作品、日志和关卡进度一起升级为正式存档。";
  }, [upgradeError, upgradeMessage]);

  useEffect(() => {
    if (accountEmail) {
      setEmail(accountEmail);
    } else if (pendingUpgradeEmail) {
      setEmail(pendingUpgradeEmail);
    }
  }, [accountEmail, pendingUpgradeEmail]);

  return (
    <section className="scene-reveal ship-secondary-stage">
      <div className="ship-secondary-stage__bg" style={{ backgroundImage: `url(${shipSecondarySceneAssets.archiveHall})` }} />
      <div className="ship-secondary-stage__overlay" />
      <div className="ship-secondary-stage__content space-y-5">
      <div className="fleet-broadcast panel-surface rounded-full px-4 py-2">
        <div className="fleet-broadcast-track">
          {[
            didRestoreHistory ? "已接续上次课堂档案" : isClassroomLocal ? "新的课堂档案已建立" : "新的探索航线已建立",
            statusMessage,
            `最近保存 ${formatTime(lastSavedAt)}`,
            isClassroomLocal ? "当前使用本地课堂档案" : isAnonymousAccount ? "当前仍是匿名航线" : "主舰存档已升级为正式账号",
            didRestoreHistory ? "主舰记得你来过这里" : "本次课堂会从这里开始",
            didRestoreHistory ? "已接续上次课堂档案" : isClassroomLocal ? "新的课堂档案已建立" : "新的探索航线已建立",
            statusMessage
          ].map((item, index) => (
            <span key={`${item}-${index}`} className="fleet-broadcast-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="panel-surface ship-secondary-panel rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-white/42">主舰存档页</div>
        <h2 className="mt-3 text-3xl font-semibold text-white">这艘船已经开始记住你。</h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
              <div className="text-sm font-semibold text-white">当前身份</div>
              <div className="mt-3 text-sm leading-6 text-white/64">
                {loginType === "CLASSROOM_LOCAL"
                  ? "身份类型：课堂本地档案"
                  : isAnonymousAccount
                    ? "身份类型：匿名探索者"
                    : `身份类型：${loginType === "EMAIL" ? "已绑定家长邮箱" : loginType ?? "正式账号"}`}
              </div>
              <div className="mt-2 text-sm leading-6 text-white/64">
                {authUid ? `${isClassroomLocal ? "学员姓名" : isAnonymousAccount ? "匿名编号" : "主舰编号"}：${authUid}` : "尚未接入课堂档案"}
              </div>
              <div className="mt-2 text-sm leading-6 text-white/64">
                {isClassroomLocal ? "保存方式：本地文件夹" : accountEmail ? `已绑定邮箱：${accountEmail}` : "尚未绑定家长邮箱"}
              </div>
              {saveSummary?.activeCrewName && (
                <div className="mt-2 text-sm leading-6 text-white/64">当前活跃船员：{saveSummary.activeCrewName}</div>
              )}
              <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/68">
                {saveStatus === "saving"
                  ? isClassroomLocal
                    ? "主舰正在写入本地课堂档案"
                    : "主舰正在同步"
                  : saveStatus === "error"
                    ? isClassroomLocal
                      ? "本地档案写入异常，请确认本地服务仍在运行"
                      : "同步异常，已保留本地记忆"
                    : statusMessage}
              </div>
            </div>

            {canShowUpgrade ? (
              <div className="rounded-[24px] border border-amber-200/16 bg-amber-200/[0.05] p-5">
                <div className="text-sm font-semibold text-white">绑定家长邮箱，永久保存作品</div>
                <div className="mt-3 text-sm leading-6 text-white/62">{upgradeHint}</div>
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="家长邮箱"
                    className="w-full rounded-[16px] border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/35"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="邮箱验证码"
                      className="min-w-0 flex-1 rounded-[16px] border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/35"
                    />
                    <button
                      type="button"
                      disabled={upgradeBusy || !email.trim()}
                      onClick={() => void onRequestUpgradeCode(email)}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm text-white/78 transition hover:border-white/22 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {upgradeStage === "sending" ? "发送中" : upgradeStage === "code-sent" ? "重新发送" : "获取验证码"}
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={upgradeBusy || !email.trim() || !code.trim()}
                    onClick={() => void onConfirmUpgrade({ rawEmail: email, code })}
                    className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {upgradeStage === "verifying" ? "正在升级主舰存档" : "完成绑定并升级正式账号"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-emerald-200/14 bg-emerald-200/[0.05] p-5">
                <div className="text-sm font-semibold text-white">{loginType === "CLASSROOM_LOCAL" ? "课堂本地档案已启用" : "正式存档已启用"}</div>
                <div className="mt-3 text-sm leading-6 text-white/62">
                  {loginType === "CLASSROOM_LOCAL"
                    ? "船员、星球、日志、导入图片和课堂成果会按学员姓名保存到本地文件夹。下次输入同一个姓名即可接回记录。"
                    : "船员档案、作品、日志和关卡进度已经绑定到家长邮箱。后续即使换设备，只要继续用这条邮箱接回账号，主舰也会认得你。"}
                </div>
              </div>
            )}

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">当前主线停留</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-white/62">
                {progressNotes.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
              <div className="mt-4 text-xs text-white/45">
                最近一次保存：{formatTime(lastSavedAt)} · {didRestoreHistory ? "本次进入已恢复历史进度" : "本次是新的课堂起点"}
                {saveSummary?.checkpointStage ? ` · 当前检查点 ${saveSummary.checkpointStage}` : ""}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">当前拥有的船员</div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.18em] text-white/46">
                  {crewRoster.length} 位在线
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {crewRoster.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-white/14 bg-white/[0.02] p-4 text-sm leading-6 text-white/56">
                    主舰还在等第一位伙伴登船。
                  </div>
                )}
                {crewRoster.map((crew) => (
                  <div key={crew.id} className="rounded-[18px] border border-white/8 bg-slate-950/35 p-4">
                    {crew.portraitAsset ? (
                      <div className="mb-3 overflow-hidden rounded-[16px] border border-white/8 bg-slate-950/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={crew.portraitAsset.imageUrl} alt={`${crew.name} 的角色图`} className="h-32 w-full object-cover" />
                      </div>
                    ) : (
                      <div className="mb-3 rounded-[16px] border border-dashed border-white/12 bg-white/[0.02] px-3 py-4 text-xs leading-5 text-white/46">
                        角色图待导入
                      </div>
                    )}
                    <div className="text-sm font-semibold text-white">{crew.name}</div>
                    <div className="mt-1 text-xs text-cyan-100/72">{crew.title}</div>
                    <div className="mt-2 text-xs leading-6 text-white/56">{crew.bondStatus}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">课堂成果图</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {state.classroomArtifacts.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-white/14 bg-white/[0.02] p-4 text-sm leading-6 text-white/56">
                    还没有导入成果图。完成角色或星球设定后，老师可以把外部生成好的图片导入回来。
                  </div>
                )}
                {state.classroomArtifacts.slice(0, 8).map((artifact) => (
                  <article key={artifact.id} className="overflow-hidden rounded-[18px] border border-white/8 bg-slate-950/35">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={artifact.imageAsset.imageUrl} alt={artifact.title} className="h-36 w-full object-cover" />
                    <div className="p-4">
                      <div className="text-sm font-semibold text-white">{artifact.title}</div>
                      <div className="mt-2 text-xs leading-5 text-white/50">{artifact.notes ?? "课堂导入成果图"}</div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">文明档案 / 黑匣记录</div>
              {state.chapterTwo.outcome ? (
                <div className="mt-4 rounded-[20px] border border-cyan-200/14 bg-cyan-200/[0.06] p-4">
                  <div className="soft-label text-[10px] text-cyan-100/55">语言与信息文明星复苏记录</div>
                  <div className="mt-2 text-lg font-semibold text-white">{state.chapterTwo.outcome.titleEarned ?? "第一位黑匣解读者"}</div>
                  <div className="mt-2 text-sm leading-6 text-white/62">
                    {state.chapterTwo.outcome.planetName ?? "言衡星"} · {state.chapterTwo.outcome.blackBoxTitle ?? "语言黑匣"} · 科技点 +{state.chapterTwo.outcome.technologyPointsAwarded ?? 1}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(state.chapterTwo.outcome.fragments ?? ["归档碎片", "传递碎片", "求证碎片", "表达碎片"]).map((fragment) => (
                      <span key={fragment} className="rounded-full border border-cyan-200/16 bg-cyan-200/[0.08] px-3 py-1.5 text-[11px] text-cyan-50">
                        {fragment}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/54">
                    {state.chapterTwo.outcome.finalLetter?.join(" ") ?? "让 AI 帮助你，而不是替代你。"}
                  </div>
                  <div className="mt-3 text-xs leading-6 text-white/48">
                    飞船 AI 模块：{state.chapterTwo.outcome.unlockedModule ?? "语言理解 Level 1"}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[18px] border border-dashed border-white/14 bg-white/[0.02] p-4 text-sm leading-6 text-white/56">
                  第二章黑匣记录尚未完成。开启语言黑匣后，这里会保留复苏记录、碎片、称号和科技点。
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">最近作品</div>
              <div className="mt-4 space-y-3">
                {recentWorks.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-white/14 bg-white/[0.02] p-4 text-sm leading-6 text-white/56">
                    还没有可归档的作品。完成星球建模、黑匣学习或第二章结果后，这里会开始留下作品。
                  </div>
                )}
                {recentWorks.map((work) => (
                  <article key={work._id} className="rounded-[18px] border border-white/8 bg-slate-950/35 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{work.title}</div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.14em] text-white/46">
                        {work.type}
                      </span>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/62">{work.content}</div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">最近主舰日志</div>
              <div className="mt-4 space-y-3">
                {latestLogs.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-white/14 bg-white/[0.02] p-4 text-sm leading-6 text-white/56">
                    日志舱还没写入新的航海记录。
                  </div>
                )}
                {latestLogs.map((entry) => (
                  <div key={entry.id} className="rounded-[18px] border border-white/8 bg-slate-950/35 p-4">
                    <div className="text-sm font-semibold text-white">{entry.title}</div>
                    <div className="mt-2 text-sm leading-6 text-white/60">{entry.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
