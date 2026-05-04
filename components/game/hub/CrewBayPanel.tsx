"use client";

import { useEffect, useState } from "react";

import { getCrewDirectiveSummary } from "@/lib/mock-generators";
import { shipSecondarySceneAssets } from "@/lib/ship-secondary-scenes";
import type { AIOperationState } from "@/types/ai";
import type { ClassroomImageAsset, CrewMember } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";
import { GenerationStatus } from "@/components/game/GenerationStatus";
import { ImageImportControl } from "@/components/game/ImageImportControl";

interface CrewBayPanelProps {
  crewRoster: CrewMember[];
  activeCrewId: string | null;
  onSetActiveCrew: (crewId: string) => void;
  onRecruit: () => void;
  imageOperation: AIOperationState;
  onRegeneratePortrait: (crewId: string) => void;
  onImportCrewImage: (crewId: string, file: File) => Promise<ClassroomImageAsset | void>;
  onUpdateImagePromptHint: (crewId: string, prompt: string) => void;
  onSelectEcho: (crewId: string, revision: number) => void;
  onOpenChat: (crewId: string) => void;
}

export function CrewBayPanel({
  crewRoster,
  activeCrewId,
  onSetActiveCrew,
  onRecruit,
  imageOperation,
  onRegeneratePortrait,
  onImportCrewImage,
  onUpdateImagePromptHint,
  onSelectEcho,
  onOpenChat
}: CrewBayPanelProps) {
  const activeCrew = crewRoster.find((crew) => crew.id === activeCrewId) ?? crewRoster[0] ?? null;
  const [imageHintDraft, setImageHintDraft] = useState(activeCrew?.imagePromptHint ?? "");

  useEffect(() => {
    setImageHintDraft(activeCrew?.imagePromptHint ?? "");
  }, [activeCrew?.id, activeCrew?.imagePromptHint]);

  return (
    <section className="scene-reveal ship-secondary-stage">
      <div className="ship-secondary-stage__bg" style={{ backgroundImage: `url(${shipSecondarySceneAssets.vaultGallery})` }} />
      <div className="ship-secondary-stage__overlay" />
      <div className="ship-secondary-stage__content space-y-5">
      <div className="fleet-broadcast panel-surface rounded-full px-4 py-2">
        <div className="fleet-broadcast-track">
          {[
            `船员名册在线 ${crewRoster.length}`,
            activeCrew ? `${activeCrew.name} 档案已展开` : "等待船员接入",
            activeCrew?.portraitEchoes.length ? `${activeCrew.name} 已归档 ${activeCrew.portraitEchoes.length} 条宇宙回响` : "档案会随着任务继续变化",
            `船员名册在线 ${crewRoster.length}`,
            activeCrew ? `${activeCrew.name} 档案已展开` : "等待船员接入"
          ].map((item, index) => (
            <span key={`${item}-${index}`} className="fleet-broadcast-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <aside className="panel-surface ship-secondary-panel rounded-[32px] p-5">
        <div className="soft-label text-[11px] text-white/42">船员名册</div>
        <div className="mt-4 space-y-3">
          {crewRoster.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-white/14 bg-white/[0.03] p-5 text-sm text-white/58">
              这里还没有船员。先去生成第一位伙伴。
            </div>
          )}
          {crewRoster.map((crew) => {
            const active = crew.id === activeCrewId;
            return (
              <button
                key={crew.id}
                type="button"
                onClick={() => onSetActiveCrew(crew.id)}
                className={`w-full rounded-[22px] border p-4 text-left transition ${
                  active ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="text-sm font-semibold text-white">{crew.name}</div>
                <div className="mt-1 text-xs text-white/50">{crew.title}</div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-white/46">
                  <span>{crew.trustLabel}</span>
                  <span>默契 {crew.trustLevel}</span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRecruit}
          className="mt-5 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          再生成一位船员
        </button>
      </aside>

      <div className="panel-surface ship-secondary-panel rounded-[32px] p-6 md:p-8">
        {activeCrew ? (
          <>
            <div className="soft-label text-[11px] text-white/42">船员档案</div>
            <div className="mt-5 grid gap-6 md:grid-cols-[260px_1fr]">
              <div className="space-y-4">
                <CrewPortrait
                  formType={activeCrew.formType}
                  role={activeCrew.role}
                  seed={activeCrew.portraitSeed}
                  imageUrl={activeCrew.portraitAsset?.imageUrl ?? null}
                  alt={`${activeCrew.name} 的档案形象`}
                />
                <GenerationStatus title="宇宙回响接收" operation={imageOperation} onRetry={() => onRegeneratePortrait(activeCrew.id)} />
                <ImageImportControl
                  label="角色图"
                  hasImage={Boolean(activeCrew.portraitAsset)}
                  emptyLabel="已完成角色设定，等待导入角色图。"
                  onImport={(file) => onImportCrewImage(activeCrew.id, file)}
                />
                <p className="text-xs leading-6 text-white/46">
                  可用外部工具生成高质量角色图，再导入这里；名字、职责和能力倾向都不会被改写。
                </p>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs tracking-[0.18em] text-white/38">外形提示补充</div>
                  <textarea
                    value={imageHintDraft}
                    onChange={(event) => setImageHintDraft(event.target.value)}
                    placeholder="比如：保留狐型主体，但衣摆更像风沙星域的旅伴；颜色更冷一点。"
                    className="mt-3 min-h-[96px] w-full rounded-[18px] border border-white/8 bg-slate-950/55 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/28"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateImagePromptHint(activeCrew.id, imageHintDraft.trim())}
                    className="mt-3 w-full rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white/78 transition hover:border-white/24 hover:bg-white/[0.08]"
                  >
                    保存到当前回响提示
                  </button>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-white">{activeCrew.name}</h2>
                <div className="mt-2 text-lg text-cyan-100/76">{activeCrew.title}</div>
                <div className="mt-4 text-sm leading-7 text-white/62">{activeCrew.intro}</div>
                <div className="mt-4 text-sm text-white/50">
                  主体锁定：{activeCrew.visualSubject}
                  {activeCrew.portraitAsset ? ` · 当前回响：${activeCrew.portraitAsset.styleLabel}` : ""}
                </div>
                <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">平行宇宙回响</div>
                    <div className="text-[11px] text-white/42">已归档 {activeCrew.portraitEchoes.length}</div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-white/48">
                    高维坐标或异常信号经过主舰时，系统偶尔会锁定同一名船员在别的宇宙中的外形投影。
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeCrew.portraitEchoes.length > 0 ? (
                      activeCrew.portraitEchoes.map((echo) => {
                        const selected = activeCrew.portraitAsset?.revision === echo.revision;
                        return (
                          <button
                            key={`${activeCrew.id}-echo-${echo.revision}`}
                            type="button"
                            onClick={() => onSelectEcho(activeCrew.id, echo.revision)}
                            className={`rounded-full border px-3 py-2 text-left text-xs transition ${
                              selected ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/[0.03] text-white/72"
                            }`}
                          >
                            <div>{echo.styleLabel}</div>
                            {echo.echoNote && <div className="mt-1 max-w-[13rem] text-[10px] leading-5 text-white/42">{echo.echoNote}</div>}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-white/42">尚未锁定新的回响版本。</div>
                    )}
                  </div>
                </div>
                <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{activeCrew.trustLabel}</div>
                    <div className="text-xs text-white/46">默契 {activeCrew.trustLevel}</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${Math.min(100, activeCrew.trustLevel * 18)}%` }} />
                  </div>
                  <div className="mt-3 text-sm text-white/46">{activeCrew.bondStatus}</div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {getCrewDirectiveSummary(activeCrew).map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/72">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="text-sm font-semibold text-white">最近经历</div>
                  <div className="mt-3 space-y-3">
                    {activeCrew.dossierEntries.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">{entry.title}</div>
                          <span className="text-[10px] text-white/40">{entry.tag}</span>
                        </div>
                        <div className="mt-2 text-xs leading-6 text-white/56">{entry.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">私人频道</div>
                    <div className="text-[11px] text-white/42">{activeCrew.backstory.speakingStyle}</div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-white/46">
                    Ta 平时话不多。真正的频道会单独展开，你可以慢慢问，Ta 也会慢慢答。
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChat(activeCrew.id)}
                    className="mt-4 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    接入私人频道
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-white/58">还没有可查看的船员。</div>
        )}
      </div>
      </div>
      </div>
    </section>
  );
}
