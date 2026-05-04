"use client";

import type { CloudSaveStatus } from "@/types/cloud-save";
import type { ClassroomImageAsset, CrewMember, PlanetModel, ShipLogEntry } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";
import { ImageImportControl } from "@/components/game/ImageImportControl";
import { StarMapPanel } from "@/components/game/StarMapPanel";
import { SystemFeedback } from "@/components/game/SystemFeedback";

interface ExperienceResultPanelProps {
  crew: CrewMember;
  planet: PlanetModel;
  shipLogs: ShipLogEntry[];
  saveStatus: CloudSaveStatus;
  statusMessage: string;
  lastSavedAt: number | null;
  onContinue: () => void;
  onReturnToHub: () => void;
  onOpenArchive: () => void;
  onOpenParentSummary: () => void;
  onImportPlanetImage: (planetId: string, file: File) => Promise<ClassroomImageAsset | void>;
}

function formatSaveTime(timestamp: number | null) {
  if (!timestamp) {
    return "本地档案会自动保存";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function saveLabel(status: CloudSaveStatus, statusMessage: string) {
  if (status === "saving") return "主舰正在保存这次探索";
  if (status === "saved") return "本次成果已写入主舰档案";
  if (status === "error") return "本地保存异常，请稍后再试";
  if (status === "disabled") return "本地记忆舱已记录本次成果";
  return statusMessage;
}

export function ExperienceResultPanel({
  crew,
  planet,
  shipLogs,
  saveStatus,
  statusMessage,
  lastSavedAt,
  onContinue,
  onReturnToHub,
  onOpenArchive,
  onOpenParentSummary,
  onImportPlanetImage
}: ExperienceResultPanelProps) {
  const latestLogs = shipLogs.slice(0, 3);

  return (
    <section className="experience-result-complete scene-reveal grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="completion-hero panel-surface hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="completion-lighting" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="soft-label text-[11px] text-cyan-200/60">首个体验闭环完成</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">第一颗星球已写入星图。</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
          你完成了星球设定，主舰恢复了导航盘、资源记录和第一处坐标。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SystemFeedback
            eyebrow="你完成的创造"
            title={planet.name}
            body={`特征：${planet.environmentTrait || "已记录"}。地标：${planet.landmarkFeature || "待补充"}。`}
            tone="success"
          />
          <SystemFeedback
            eyebrow="系统已恢复"
            title="导航盘重新点亮"
            body={`坐标 ${planet.coordinateLabel} 已写入。危险等级：${planet.dangerLabel}。`}
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="crew-memory-pulse rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="soft-label text-[10px] text-white/42">当前船员</div>
            <div className="mt-4 grid grid-cols-[64px_1fr] items-center gap-3">
              <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} size="sm" />
              <div>
                <div className="text-sm font-semibold text-white">{crew.name}</div>
                <div className="mt-1 text-xs text-cyan-100/70">{crew.title}</div>
                <div className="mt-2 text-xs leading-5 text-white/50">{crew.bondStatus}</div>
              </div>
            </div>
          </div>

          <div className="memory-zone-feedback memory-zone-feedback--nav rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="soft-label text-[10px] text-white/42">本次探索内容</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-white/62">
              <div>招募第一位船员</div>
              <div>完成第一颗星球建模</div>
              <div>恢复导航盘与航行记忆</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-cyan-200/14 bg-cyan-200/[0.06] p-4">
            <div className="soft-label text-[10px] text-cyan-100/55">保存状态</div>
            <div className="mt-3 text-sm font-semibold text-white">{saveLabel(saveStatus, statusMessage)}</div>
            <div className="mt-2 text-xs leading-5 text-white/50">最近保存：{formatSaveTime(lastSavedAt)}</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
          >
            继续进入第二章：文明远征
          </button>
          <button
            type="button"
            onClick={onOpenArchive}
            className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:bg-white/[0.08]"
          >
            查看主舰存档
          </button>
          <button
            type="button"
            onClick={onOpenParentSummary}
            className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:bg-white/[0.08]"
          >
            查看体验说明
          </button>
          <button
            type="button"
            onClick={onReturnToHub}
            className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/64 transition hover:border-white/22 hover:bg-white/[0.06]"
          >
            回到主舰
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <StarMapPanel firstStarLit coordinateLabel={planet.coordinateLabel} />
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/45">星球视觉档案</div>
          <div className="mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-slate-950/55">
            {planet.imageAsset ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={planet.imageAsset.imageUrl} alt={`${planet.name} 的星球图`} className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center px-6 text-center text-sm leading-6 text-white/48">
                这颗星球的视觉档案仍待补完。可以把外部生成好的星球图导入回来。
              </div>
            )}
          </div>
          <div className="mt-4">
            <ImageImportControl
              label="星球图"
              hasImage={Boolean(planet.imageAsset)}
              emptyLabel="已完成星球设定，等待导入星球图。"
              onImport={(file) => onImportPlanetImage(planet.id, file)}
            />
          </div>
        </div>
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/45">新增日志 / 档案</div>
          <div className="mt-4 space-y-3">
            {latestLogs.map((log) => (
              <div key={log.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-white">{log.title}</div>
                <div className="mt-2 text-xs leading-5 text-white/54">{log.body}</div>
              </div>
            ))}
            {latestLogs.length === 0 && <div className="text-sm leading-6 text-white/52">主舰正在整理这次探索日志。</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
