"use client";

import { useState } from "react";

import type { AIOperationState } from "@/types/ai";
import type { CrewMember } from "@/types/game";

import { CrewPortrait } from "@/components/game/CrewPortrait";
import { GenerationStatus } from "@/components/game/GenerationStatus";

interface CrewChatPanelProps {
  crew: CrewMember | null;
  operation: AIOperationState;
  onSendMessage: (crewId: string, message: string) => void;
  onReturn: () => void;
}

const starterHints = [
  "你觉得这次异常最该先查哪一层？",
  "你以前是在哪一段航路值守的？",
  "如果下一次还遇到假门，你会先怎么判断？"
];

export function CrewChatPanel({ crew, operation, onSendMessage, onReturn }: CrewChatPanelProps) {
  const [draft, setDraft] = useState("");

  if (!crew) {
    return (
      <section className="scene-reveal panel-surface rounded-[32px] p-6 text-white/62">
        当前没有可接入频道的船员。
      </section>
    );
  }

  return (
    <section className="scene-reveal grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="panel-surface rounded-[32px] p-5">
        <div className="soft-label text-[11px] text-white/42">私人频道</div>
        <div className="mt-4">
          <CrewPortrait
            formType={crew.formType}
            role={crew.role}
            seed={crew.portraitSeed}
            imageUrl={crew.portraitAsset?.imageUrl ?? null}
            alt={`${crew.name} 的私人频道形象`}
          />
        </div>
        <div className="mt-4 text-xl font-semibold text-white">{crew.name}</div>
        <div className="mt-1 text-sm text-cyan-100/72">{crew.title}</div>
        <div className="mt-4 text-sm leading-6 text-white/58">
          {crew.backstory.speakingStyle}
          <br />
          平时回答会比较短。只有你真的问到来历、过去和为什么上船时，Ta 才会慢慢说深一层。
        </div>
        <button
          type="button"
          onClick={onReturn}
          className="mt-5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/76 transition hover:border-white/24 hover:bg-white/[0.08]"
        >
          返回船员档案
        </button>
      </aside>

      <div className="panel-surface rounded-[32px] p-6 md:p-8">
        <div className="fleet-broadcast rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
          <div className="fleet-broadcast-track">
            {[`${crew.name} 私人频道已建立`, "频道只会保留真正重要的回声", `${crew.name} 的私人频道已建立`, "主动追问过去时，关系才会推进"].map((item, index) => (
              <span key={`${item}-${index}`} className="fleet-broadcast-item">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/8 bg-slate-950/55 p-5">
          <div className="space-y-3">
            {crew.conversationLog.length > 0 ? (
              crew.conversationLog.slice(-10).map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[18px] px-4 py-3 text-sm leading-6 ${
                    message.role === "player"
                      ? "ml-auto max-w-[82%] border border-cyan-300/20 bg-cyan-300/10 text-white"
                      : message.role === "system"
                        ? "border border-amber-200/16 bg-amber-200/10 text-amber-50"
                        : "max-w-[86%] border border-white/8 bg-white/[0.04] text-white/78"
                  }`}
                >
                  {message.body}
                </div>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white/44">
                频道刚刚接通。先问一句现在该怎么看这段异常，或者慢慢问到 Ta 的过去。
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <GenerationStatus title="频道回应" operation={operation} onRetry={() => onSendMessage(crew.id, draft)} />
        </div>

        {operation.usedFallback && operation.status === "success" && (
          <div className="mt-4 rounded-[18px] border border-amber-200/18 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-50">
            这次私人频道没有稳定接通外部文本回路，下面这句是主舰本地应急回应，所以会比真实对话更保守一点。
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {starterHints.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => setDraft(hint)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/72 transition hover:border-cyan-200/24 hover:bg-cyan-200/10 hover:text-white"
            >
              {hint}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="发一句话给 Ta，比如：你觉得我刚才是不是判断错了？"
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-cyan-300/40"
          />
          <button
            type="button"
            disabled={!draft.trim() || operation.status === "loading"}
            onClick={() => {
              const next = draft.trim();
              if (!next) return;
              onSendMessage(crew.id, next);
              setDraft("");
            }}
            className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/40"
          >
            发到频道
          </button>
        </div>
      </div>
    </section>
  );
}
