"use client";

import { formTypeOptions, labelMap, roleOptions, talentOptions, temperamentOptions } from "@/lib/game-constants";
import { shipSecondarySceneAssets } from "@/lib/ship-secondary-scenes";
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

function ChoiceGroup<Value extends string>({
  title,
  value,
  options,
  onChange
}: {
  title: string;
  value: Value | null;
  options: Array<{ value: Value; label: string; hint: string }>;
  onChange: (value: Value) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-white/84">{title}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-[20px] border px-4 py-4 text-left transition ${
                active
                  ? "border-cyan-300/60 bg-cyan-300/12 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
                  : "border-white/10 bg-white/[0.03] hover:border-cyan-300/28 hover:bg-cyan-300/6"
              }`}
            >
              <div className="text-sm font-semibold text-white">{option.label}</div>
              <div className="mt-2 text-xs leading-5 text-white/54">{option.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
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
  const previewFormType = form.formType ?? activeAnalysis?.inferredFormType ?? null;
  const previewRole = form.role ?? activeAnalysis?.inferredRole ?? null;
  const missingSelections = [
    !form.formType ? "形态" : null,
    !form.role ? "职责" : null,
    !form.temperament ? "气质" : null,
    !form.talent ? "专长" : null
  ].filter(Boolean) as string[];

  return (
    <section className="scene-reveal ship-secondary-stage">
      <div className="ship-secondary-stage__bg ship-secondary-stage__bg--bright" style={{ backgroundImage: `url(${shipSecondarySceneAssets.recruitChamber})` }} />
      <div className="ship-secondary-stage__overlay" />
      <div className="ship-secondary-stage__content grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
      <div className="panel-surface ship-secondary-panel rounded-[32px] p-6 md:p-8">
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

        <div className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="text-sm font-semibold text-white">这次由你来定轮廓</div>
          <p className="mt-2 text-sm leading-6 text-white/56">
            系统只负责理解描述和补一点气质细节，不再默认把角色锁成能量体或侦查方向。真正生成前，先把这位伙伴的基础设定定下来。
          </p>
          <div className="mt-5 space-y-5">
            <ChoiceGroup title="伙伴形态" value={form.formType} options={formTypeOptions} onChange={(value) => onChange("formType", value)} />
            <ChoiceGroup title="主要职责" value={form.role} options={roleOptions} onChange={(value) => onChange("role", value)} />
            <ChoiceGroup title="整体气质" value={form.temperament} options={temperamentOptions} onChange={(value) => onChange("temperament", value)} />
            <ChoiceGroup title="核心专长" value={form.talent} options={talentOptions} onChange={(value) => onChange("talent", value)} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <GenerationStatus title="招募信号解析" operation={analysisOperation} onRetry={onRetryAnalyze} />
          <GenerationStatus title="船员档案创建" operation={generationOperation} onRetry={onRetryGenerate} />
        </div>

        {activeAnalysis ? (
          <div className="mt-7 space-y-5">
            <SystemFeedback eyebrow="系统已识别你的招募意图" title={activeAnalysis.summary} body={`${activeAnalysis.roleSummary} · ${activeAnalysis.styleSummary}`} tone="success" />

            <div className="rounded-[22px] border border-cyan-200/14 bg-cyan-200/8 px-4 py-3 text-sm text-cyan-50">
              当前由你锁定：
              {" "}
              {form.formType ? labelMap.formType[form.formType] : "待选形态"}
              {" · "}
              {form.role ? labelMap.role[form.role] : "待选职责"}
              {" · "}
              {form.temperament ? labelMap.temperament[form.temperament] : "待选气质"}
              {" · "}
              {form.talent ? labelMap.talent[form.talent] : "待选专长"}
              。系统理解只做辅助，最终生成以你的选择为准。
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
              创建这位伙伴
            </button>
            {missingSelections.length > 0 ? (
              <div className="text-xs text-amber-100/72">还需要你先选好：{missingSelections.join("、")}。</div>
            ) : null}
            <div className="mt-3 text-xs text-white/48">这节课会留下：角色名字、设定、档案、导入图像和登船记录。</div>
          </div>
        ) : (
          <div className="mt-7 rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-4 text-sm leading-6 text-white/46">
            先让系统读一遍你的招募信号。读完后就可以继续创建课堂档案。
          </div>
        )}
      </div>

      <aside className="panel-surface ship-secondary-panel hologram-sweep rounded-[32px] p-6">
        <div className="soft-label text-[11px] text-white/45">招募信号预览</div>
        <div className="mt-5">
          {previewFormType && previewRole ? (
            <CrewPortrait formType={previewFormType} role={previewRole} />
          ) : (
            <div className="relative flex aspect-[4/5] min-h-[29rem] w-full items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-white/12 bg-slate-950/60">
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-300/18 via-sky-300/8 to-transparent blur-3xl" />
              <div className="relative max-w-xs text-center">
                <div className="text-lg font-semibold text-white">轮廓还没完全锁定</div>
                <div className="mt-3 text-sm leading-6 text-white/52">先在左侧选好伙伴形态和职责，预览才会按你的决定收拢，不再默认跳到系统推断。</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-lg font-semibold text-white">伙伴轮廓预览</div>
          <div className="mt-3 text-sm leading-6 text-white/58">
            {form.description.trim() ? "主舰已收到你的招募描述，生成后会写入船员档案。" : "先在左侧说说这位伙伴是谁、像什么、会做什么。"}
          </div>
        </div>
      </aside>
      </div>
    </section>
  );
}
