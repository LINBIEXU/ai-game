"use client";

import type { ChapterTwoOutcome, CrewMember } from "@/types/game";

import { KidLearningCard } from "@/components/game/KidLearningCard";
import { SystemFeedback } from "@/components/game/SystemFeedback";
import { chapterTwoSceneAssets } from "@/lib/chapter-two-exploration";

interface ChapterTwoResultPanelProps {
  outcome: ChapterTwoOutcome;
  leadCrew: CrewMember | null;
  supportCrew: CrewMember | null;
  onReturn: () => void;
}

export function ChapterTwoResultPanel({ outcome, leadCrew, supportCrew, onReturn }: ChapterTwoResultPanelProps) {
  const knowledge = outcome.blackBoxKnowledge ?? [];
  const fragments = outcome.fragments ?? ["归档碎片", "传递碎片", "求证碎片", "表达碎片"];
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
          <div className="text-lg font-semibold text-white">获得奖励</div>
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

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">船员协作记录</div>
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
        </div>

        <button
          type="button"
          onClick={onReturn}
          className="mt-8 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
        >
          返回主舰整理归档
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
          <div className="soft-label text-[11px] text-white/42">学到的能力</div>
          <div className="mt-4 space-y-3">
            {knowledge.length > 0 ? (
              knowledge.map((item) => (
                <div key={item} className="rounded-[20px] border border-cyan-200/16 bg-cyan-200/10 px-4 py-4 text-sm leading-6 text-white">
                  {item}
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-cyan-200/16 bg-cyan-200/10 px-4 py-4 text-sm leading-6 text-white">
                语言模型需要清楚目标、上下文和不能编造的边界。
              </div>
            )}
          </div>
        </div>

        <KidLearningCard />

        <div className="panel-surface rounded-[28px] p-5">
          <div className="soft-label text-[11px] text-white/42">主舰 AI 回写</div>
          <p className="mt-3 text-sm leading-7 text-white/62">
            {outcome.aiUpgrade ?? "语言黑匣已写入。以后，我会更努力听清你的意思。但我也会提醒你：不要让我替你思考。"}
          </p>
          <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/50">
            归档提示：第二章已经完成。现在可以回看黑匣记录，或返回母星整理作品。
          </div>
        </div>
      </div>
    </section>
  );
}
