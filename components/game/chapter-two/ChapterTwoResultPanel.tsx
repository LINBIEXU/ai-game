"use client";

import type { ChapterTwoOutcome, ChapterTwoRepairReadings, ChapterTwoSystemReadings, CrewMember } from "@/types/game";

import { SystemFeedback } from "@/components/game/SystemFeedback";
import { chapterTwoSceneAssets } from "@/lib/chapter-two-exploration";

interface ChapterTwoResultPanelProps {
  outcome: ChapterTwoOutcome;
  leadCrew: CrewMember | null;
  supportCrew: CrewMember | null;
  onReturn: () => void;
}

const emptyRepairReadings: ChapterTwoRepairReadings = {
  goalClarity: 0,
  evidenceIntegrity: 0,
  unknownMarking: 0,
  boundaryAwareness: 0
};

const emptySystemReadings: ChapterTwoSystemReadings = {
  languageStability: 0,
  evidenceChainIntegrity: 0,
  echoInterferenceResidue: 100,
  blackBoxSyncRate: 0
};

const systemReadingItems: Array<{
  key: keyof ChapterTwoSystemReadings;
  label: string;
  detail: string;
  mode: "high" | "low";
}> = [
  { key: "languageStability", label: "语言稳定度", detail: "提示、表达与回应光路的稳定读数", mode: "high" },
  { key: "evidenceChainIntegrity", label: "证据链完整度", detail: "来源分层是否闭合", mode: "high" },
  { key: "echoInterferenceResidue", label: "回声干扰残留", detail: "失序回声仍残留的噪声比例", mode: "low" },
  { key: "blackBoxSyncRate", label: "黑匣同步率", detail: "语言黑匣与主舰 AI 的接入程度", mode: "high" }
];

const repairReadingItems: Array<{
  key: keyof ChapterTwoRepairReadings;
  label: string;
  detail: string;
}> = [
  { key: "goalClarity", label: "目标清楚度", detail: "任务方向与输出目标" },
  { key: "evidenceIntegrity", label: "证据完整度", detail: "来源、事实与复查线" },
  { key: "unknownMarking", label: "未知标注", detail: "缺口是否保留" },
  { key: "boundaryAwareness", label: "边界意识", detail: "协助范围是否清楚" }
];

export function ChapterTwoResultPanel({ outcome, leadCrew, supportCrew, onReturn }: ChapterTwoResultPanelProps) {
  const knowledge = outcome.blackBoxKnowledge ?? [];
  const fragments = outcome.fragments ?? ["归档碎片", "传递碎片", "求证碎片", "表达碎片"];
  const repairReadings = outcome.repairReadings ?? emptyRepairReadings;
  const systemReadings = outcome.systemReadings ?? emptySystemReadings;
  const settlementLines = outcome.settlementLogs?.[0]?.reportLines ?? [];
  const crewAssistRecords = outcome.crewAssistRecords ?? [];
  const finalLetter = outcome.finalLetter ?? [
    "我们曾经拥有无数答案。",
    "却忘了怎样提出问题。",
    "后来者，不要复制我们的失败。",
    "让 AI 帮助你，而不是替代你。"
  ];

  return (
    <section className="scene-reveal chapter-two-settlement grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="panel-surface hologram-sweep unlock-burst rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-cyan-100/60">第二章完成 · 文明远征归档</div>
        <h2 className="mt-3 text-4xl font-semibold text-white">言衡星基础运转恢复</h2>
        <p className="mt-4 text-base leading-7 text-white/68">{outcome.summary}</p>

        <div
          className="chapter-two-restoration-vision"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(4, 8, 14, 0.04), rgba(4, 8, 14, 0.28)), url(${chapterTwoSceneAssets.languageOrbitRestored.imageUrl})`
          }}
        >
          <div className="chapter-two-restoration-vision__beam" />
          <div className="chapter-two-restoration-vision__copy">
            <span>语言与信息文明星</span>
            <strong>基础运转恢复 · 文明碎片 4/4 · 科技点 +{outcome.technologyPointsAwarded ?? 1}</strong>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SystemFeedback eyebrow="修复星球" title={outcome.planetName ?? "语言与信息文明星"} body={outcome.worldChange} tone="success" />
          <SystemFeedback eyebrow="开启黑匣" title={outcome.blackBoxTitle ?? "语言黑匣"} body={outcome.defeatedEcho ? "失序回声已被击退，最后一封信已回收。" : outcome.civilizationRecord ?? outcome.logSummary} tone="warm" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SystemFeedback eyebrow="获得称号" title={outcome.titleEarned ?? "第一位黑匣解读者"} body="这枚称号会写入主舰远征档案。" tone="success" />
          <SystemFeedback eyebrow="飞船 AI 模块" title={outcome.unlockedModule ?? "语言理解 Level 1"} body="飞船 AI 已获得第一层语言黑匣校准。" />
        </div>

        <div className="mt-6 rounded-[28px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
          <div className="text-lg font-semibold text-white">回收之物</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-white/72">科技点 +{outcome.technologyPointsAwarded ?? 1}</div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-white/72">称号：{outcome.titleEarned ?? "第一位黑匣解读者"}</div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-white/72">飞船 AI：{outcome.unlockedModule ?? "语言理解 Level 1"}</div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-white/72">文明碎片：{fragments.length}/4</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {fragments.map((fragment) => (
              <span key={fragment} className="rounded-full border border-cyan-200/18 bg-cyan-200/[0.08] px-3 py-2 text-xs text-cyan-50">
                {fragment}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-cyan-200/14 bg-cyan-200/[0.06] p-5">
          <div className="text-lg font-semibold text-white">主舰回声读数</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {systemReadingItems.map((item) => {
              const value = Math.max(0, Math.min(100, systemReadings[item.key]));
              const tone = item.mode === "low" ? (value <= 25 ? "text-emerald-100" : "text-amber-100") : value >= 75 ? "text-emerald-100" : "text-cyan-50";
              return (
                <div key={item.key} className="rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <strong className={`text-xs ${tone}`}>{value}%</strong>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-cyan-200" style={{ width: `${value}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/52">{item.detail}</p>
                </div>
              );
            })}
          </div>
          {settlementLines.length > 0 ? (
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/56">
              {settlementLines.slice(0, 4).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">黑匣共鸣明细</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {repairReadingItems.map((item) => {
              const value = Math.max(0, Math.min(4, repairReadings[item.key]));
              return (
                <div key={item.key} className="rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <strong className="text-xs text-cyan-50">{value}/4</strong>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-cyan-200" style={{ width: `${(value / 4) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/52">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">失联与回收记录</div>
          <div className="mt-2 text-xs leading-6 text-white/52">
            {outcome.crewAssistSummary ?? "坠毁后通讯失联，地标修复没有接入船员提示。"}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{leadCrew?.name ?? "同行船员"}</div>
              <div className="mt-2 text-xs leading-6 text-white/54">{outcome.leadDossierNote}</div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{supportCrew?.name ?? "记录支援"}</div>
              <div className="mt-2 text-xs leading-6 text-white/54">{outcome.supportDossierNote}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {crewAssistRecords.length > 0 ? (
              crewAssistRecords.slice().reverse().map((record) => (
                <div key={record.id} className="rounded-[18px] border border-cyan-200/12 bg-cyan-200/[0.05] px-4 py-3">
                  <div className="text-xs font-semibold text-cyan-50">{record.targetName} · {record.crewName}</div>
                  <p className="mt-1 text-xs leading-6 text-white/56">{record.hint}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] border border-white/8 bg-white/[0.025] px-4 py-3 text-xs leading-6 text-white/50">
                本次远征没有使用船员提示。坠毁前的同行记录已保留，后续信号等待复查。
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onReturn}
          className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          带着长明火返航
        </button>
      </div>

      <div className="space-y-6">
        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/42">最后一封信</div>
          <div className="mt-4 rounded-[22px] border border-amber-200/14 bg-amber-200/[0.06] p-5 text-sm leading-7 text-amber-50/86">
            {finalLetter.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/42">黑匣铭文</div>
          <div className="mt-4 space-y-3">
            {knowledge.length > 0 ? (
              knowledge.map((item) => (
                <div key={item} className="rounded-[20px] border border-cyan-200/16 bg-cyan-200/10 px-4 py-4 text-sm leading-6 text-white">
                  {item}
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-cyan-200/16 bg-cyan-200/10 px-4 py-4 text-sm leading-6 text-white">
                语言黑匣的第一层铭文已经刻进主舰深处。
              </div>
            )}
          </div>
        </div>

        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/42">主舰深处的回写</div>
          <p className="mt-3 text-sm leading-7 text-white/62">
            {outcome.aiUpgrade ?? "语言黑匣已写入。主舰语言回路更稳定。"}
          </p>
          <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/50">
            黑匣已经闭合。现在能回看它留下的信，也能把长明火带回母星。
          </div>
        </div>
      </div>
    </section>
  );
}
