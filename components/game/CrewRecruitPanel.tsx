"use client";

import { crewRefinementOptions, labelMap } from "@/lib/game-constants";
import type { AIOperationState } from "@/types/ai";
import type { RecruitForm, RecruitSignalAnalysis } from "@/types/game";

import { CrewPortrait } from "./CrewPortrait";
import { GenerationStatus } from "./GenerationStatus";
import { SystemFeedback } from "./SystemFeedback";

interface CrewRecruitPanelProps {
  form: RecruitForm;
  analysis: RecruitSignalAnalysis | null;
  canGenerate: boolean;
  isGenerating: boolean;
  analysisOperation: AIOperationState;
  generationOperation: AIOperationState;
  onChange: <Key extends keyof RecruitForm>(field: Key, value: RecruitForm[Key]) => void;
  onAnalyze: () => void;
  onGenerate: () => void;
  onRetryAnalyze?: () => void;
  onRetryGenerate?: () => void;
}

const starterPrompts = [
  "我想要一个会先找灯、再悄悄把坏东西修好的伙伴。",
  "我想招募一位安静但很会找线索的伙伴。",
  "我想要一个像森林里来的旅伴，平时话不多，但很可靠。"
] as const;

function buildSourceKey(form: RecruitForm) {
  return [form.description.trim(), form.notes.trim()].filter(Boolean).join("｜");
}

export function CrewRecruitPanel({
  form,
  analysis,
  canGenerate,
  isGenerating,
  analysisOperation,
  generationOperation,
  onChange,
  onAnalyze,
  onGenerate,
  onRetryAnalyze,
  onRetryGenerate
}: CrewRecruitPanelProps) {
  const analysisFresh = analysis?.sourceText === buildSourceKey(form);
  const activeAnalysis = analysisFresh ? analysis : null;
  const previewFormType = form.formType ?? activeAnalysis?.inferredFormType ?? "hybrid";
  const previewRole = form.role ?? activeAnalysis?.inferredRole ?? "scout";

  const applyRefinement = (option: (typeof crewRefinementOptions)[number]) => {
    if (option.formType) onChange("formType", option.formType);
    if (option.role) onChange("role", option.role);
    if (option.temperament) onChange("temperament", option.temperament);
    if (option.talent) onChange("talent", option.talent);
    if (option.styleTag) {
      const nextTags = form.styleTags.includes(option.styleTag)
        ? form.styleTags
        : [...form.styleTags, option.styleTag].slice(-3);
      onChange("styleTags", nextTags);
    }
    if (option.specialFocus) {
      onChange("specialFocus", option.specialFocus);
    }
  };

  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
      <div className="panel-surface rounded-[32px] p-6 md:p-8">
        <div className="soft-label text-[11px] text-white/45">船员招募台</div>
        <h2 className="mt-4 text-3xl font-semibold text-white">先说一句，你的伙伴就会开始成形。</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
          先说 Ta 像什么、会做什么，或者为什么想让 Ta 来。一句话就够，系统会先理解，再帮你收拢轮廓。
        </p>

        <div className="mt-7 rounded-[30px] border border-cyan-200/16 bg-slate-950/58 p-5 md:p-6">
          <div className="text-sm font-semibold text-white">你想招募一个什么样的伙伴？</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onChange("description", form.description.trim().length === 0 ? prompt : `${form.description.trim()} ${prompt}`)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/72 transition hover:border-cyan-300/28 hover:bg-cyan-300/10 hover:text-white"
              >
                借一句开始
              </button>
            ))}
          </div>
          <textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="比如：我想要一个在黑暗里会先找灯、平时话不多、遇到坏掉的东西会先修好的伙伴。"
            rows={6}
            className="mt-4 w-full resize-none rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base leading-7 text-white outline-none transition placeholder:text-white/24 focus:border-cyan-300/45"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={form.description.trim().length === 0}
              className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
            >
              让系统理解这段描述
            </button>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/48">
              先说清楚一点点，就能很快看到一个真正的结果。
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <GenerationStatus title="招募信号解析" operation={analysisOperation} onRetry={onRetryAnalyze} />
          <GenerationStatus title="船员回声生成" operation={generationOperation} onRetry={onRetryGenerate} />
        </div>

        {activeAnalysis ? (
          <div className="mt-7 space-y-5">
            <SystemFeedback eyebrow="系统已识别你的招募意图" title={activeAnalysis.summary} body={`${activeAnalysis.roleSummary} · ${activeAnalysis.styleSummary}`} tone="success" />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-xs tracking-[0.2em] text-white/35">关键词</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeAnalysis.extractedKeywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-cyan-200/14 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-100">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-xs tracking-[0.2em] text-white/35">倾向判断</div>
                <div className="mt-3 space-y-2 text-sm text-white/72">
                  <div>{labelMap.role[activeAnalysis.inferredRole]}</div>
                  <div>{labelMap.talent[activeAnalysis.inferredTalent]}</div>
                  <div>{labelMap.temperament[activeAnalysis.inferredTemperament]}</div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-xs tracking-[0.2em] text-white/35">推荐偏向</div>
                <div className="mt-3 space-y-2 text-sm text-white/72">
                  {activeAnalysis.suggestedFocuses.slice(0, 3).map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-cyan-50">
              当前锁定：{labelMap.formType[previewFormType]} · {labelMap.role[previewRole]}。系统会先按这个轮廓生成，再由你微调。
            </div>

            <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">最后微调一下</div>
              <div className="mt-2 text-xs text-white/46">这些只是修饰器，不会盖过你刚刚写下的描述。</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {crewRefinementOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyRefinement(option)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/72 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-white/84">可选补充</div>
              <textarea
                value={form.notes}
                onChange={(event) => onChange("notes", event.target.value)}
                placeholder="比如：希望 Ta 有一点旧船舱留下来的味道，或者像已经认识这艘船很久。"
                rows={3}
                className="w-full rounded-[22px] border border-white/10 bg-slate-950/55 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/45"
              />
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate || isGenerating}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
            >
              生成这位伙伴
            </button>
            <div className="mt-3 text-xs text-white/48">这节课会留下：角色名字、形象、档案和登船记录。</div>
          </div>
        ) : (
          <div className="mt-7 rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-4 text-sm leading-6 text-white/46">
            先让系统读一遍你的招募信号。读完就会给出关键词、倾向判断，然后很快生成结果。
          </div>
        )}
      </div>

      <aside className="panel-surface hologram-sweep rounded-[32px] p-6">
        <div className="soft-label text-[11px] text-white/45">招募信号预览</div>
        <div className="mt-5">
          <CrewPortrait formType={previewFormType} role={previewRole} />
        </div>

        <div className="mt-5 space-y-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">系统会先抓这些</div>
          {form.description.trim() ? (
            <div className="rounded-[22px] border border-white/8 bg-slate-950/45 px-4 py-4 text-sm leading-6 text-white/68">
              “{form.description.trim()}”
            </div>
          ) : (
            <div className="text-sm leading-6 text-white/48">还没有收到主描述。先说说这位伙伴是谁、像什么、会做什么。</div>
          )}

          {activeAnalysis ? (
            <>
              <div className="flex flex-wrap gap-2">
                {activeAnalysis.extractedKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/72">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="text-sm leading-6 text-white/62">{activeAnalysis.summary}</div>
            </>
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-slate-950/45 px-4 py-4 text-sm leading-6 text-white/58">
              系统理解后，这里会很快浮现关键词、能力倾向和角色风格。
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
