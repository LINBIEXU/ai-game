"use client";

import { useEffect, useState } from "react";

import { getCrewDirectiveSummary, getCrewSummary } from "@/lib/mock-generators";
import type { AIOperationState } from "@/types/ai";
import type { CrewMember } from "@/types/game";

import { CrewPortrait } from "./CrewPortrait";
import { GenerationStatus } from "./GenerationStatus";
import { SystemFeedback } from "./SystemFeedback";

interface CrewResultCardProps {
  crew: CrewMember;
  onBoard: () => void;
  onReroll: () => void;
  isGenerating: boolean;
  imageOperation: AIOperationState;
  onRetryImage: () => void;
  onUpdateImagePromptHint: (crewId: string, prompt: string) => void;
}

export function CrewResultCard({ crew, onBoard, onReroll, isGenerating, imageOperation, onRetryImage, onUpdateImagePromptHint }: CrewResultCardProps) {
  const [imageHintDraft, setImageHintDraft] = useState(crew.imagePromptHint);

  useEffect(() => {
    setImageHintDraft(crew.imagePromptHint);
  }, [crew.id, crew.imagePromptHint]);

  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="panel-surface hologram-sweep unlock-burst rounded-[32px] p-6">
        <div className="soft-label text-[11px] text-white/45">船员已回应</div>
        <div className="mt-5">
          <CrewPortrait formType={crew.formType} role={crew.role} seed={crew.portraitSeed} imageUrl={crew.portraitAsset?.imageUrl ?? null} alt={`${crew.name} 的船员形象`} />
        </div>
        <div className="mt-4">
          <GenerationStatus title="宇宙回响接收" operation={imageOperation} onRetry={onRetryImage} />
          <button
            type="button"
            onClick={onRetryImage}
            disabled={imageOperation.status === "loading"}
            className="mt-3 w-full rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            接收另一条宇宙回响
          </button>
          <p className="mt-3 text-xs leading-6 text-white/46">
            名字、职责和能力不会改变。变化的只是这个伙伴在另一条平行宇宙里的外形回声。
          </p>
          <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-xs tracking-[0.18em] text-white/38">外形提示补充</div>
            <textarea
              value={imageHintDraft}
              onChange={(event) => setImageHintDraft(event.target.value)}
              placeholder="比如：披风更轻一点，像来自雾林星球；保留猫型主体，但眼神更机警。"
              className="mt-3 min-h-[92px] w-full rounded-[18px] border border-white/8 bg-slate-950/55 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/28"
            />
            <button
              type="button"
              onClick={() => onUpdateImagePromptHint(crew.id, imageHintDraft.trim())}
              className="mt-3 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/78 transition hover:border-white/24 hover:bg-white/[0.08]"
            >
              保存到当前形象提示
            </button>
          </div>
        </div>
      </div>

      <div className="panel-surface rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-cyan-200/60">登船结果</div>
        <h2 className="mt-4 text-4xl font-semibold text-white">{crew.name}</h2>
        <p className="mt-3 text-lg text-cyan-100/78">{crew.title}</p>
        <div className="mt-6 inline-flex rounded-full border border-cyan-200/18 bg-cyan-200/10 px-4 py-2 text-sm text-cyan-100">
          能力标签 · {crew.abilityTag}
        </div>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/72">{crew.intro}</p>
        <p className="mt-4 text-sm text-white/48">{getCrewSummary(crew)}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <SystemFeedback
            eyebrow="招募回显"
            title="系统先读懂了你的描述"
            body={getCrewDirectiveSummary(crew).join("｜")}
          />
          <SystemFeedback
            eyebrow="系统回执"
            title="这位伙伴是顺着你的话长出来的"
            body={crew.signalSummary || "你刚刚给出的关键信号，已经直接影响了这位船员的轮廓、标题和开场回应。"}
            tone="success"
          />
        </div>
        {crew.portraitAsset && (
          <p className="mt-4 text-sm text-white/46">
            当前采用版本：{crew.portraitAsset.styleLabel}。已归档回响 {crew.portraitEchoes.length} 条。
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBoard}
            className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200"
          >
            加入我的船员舱
          </button>
          <button
            type="button"
            onClick={onReroll}
            disabled={isGenerating}
            className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/78 transition hover:border-white/24 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            换一个
          </button>
        </div>
        <p className="mt-3 text-sm text-white/46">加入后你可以随时回到主舰，在船员舱里再次查看 Ta，也能继续生成新的伙伴。</p>
      </div>
    </section>
  );
}
