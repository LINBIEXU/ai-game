"use client";

import { useEffect, useState } from "react";

import type { ChapterTwoFieldStinger } from "@/lib/chapter-two-field-cues";

interface ChapterTwoFieldAudioLayerProps {
  cueLabel: string;
  soundEnabled: boolean;
  audioReady: boolean;
  onToggleSound: () => void;
}

const fieldImpactMeta: Record<ChapterTwoFieldStinger, { label: string; tone: "stable" | "danger" | "memory" | "blackbox" | "longfire" }> = {
  archive_clue_record: { label: "塔身记下", tone: "memory" },
  archive_fragment_place: { label: "碎片入槽", tone: "stable" },
  archive_misfile: { label: "墨斑扩散", tone: "danger" },
  archive_repair: { label: "塔光闭合", tone: "stable" },
  letter_time_anchor: { label: "时间锚定", tone: "memory" },
  letter_route_connect: { label: "光轨接通", tone: "stable" },
  letter_wrong_track: { label: "航道偏移", tone: "danger" },
  letter_repair: { label: "残信送达", tone: "stable" },
  valley_memory_step: { label: "岩层回声", tone: "memory" },
  valley_block_chisel: { label: "词块凿入", tone: "stable" },
  valley_trial_fail: { label: "铭文裂开", tone: "danger" },
  valley_trial_stable: { label: "试运行稳定", tone: "stable" },
  valley_repair: { label: "可靠铭文", tone: "stable" },
  paper_route_reveal: { label: "岔路显形", tone: "memory" },
  paper_relic_claim: { label: "圣物接入", tone: "stable" },
  paper_residue_hit: { label: "残魂照散", tone: "stable" },
  paper_residue_miss: { label: "污染写入", tone: "danger" },
  paper_shield_absorb: { label: "圣盾抵挡", tone: "stable" },
  paper_sword_break: { label: "圣剑破碎", tone: "memory" },
  paper_scan_mark: { label: "暗纹标记", tone: "memory" },
  paper_scan_fail: { label: "幻光扩散", tone: "danger" },
  paper_repair: { label: "纸光除噪", tone: "stable" },
  fake_signal_mimic: { label: "声线拟态", tone: "danger" },
  fake_route_shift: { label: "路线误导", tone: "danger" },
  hengdeng_extinguish: { label: "衡灯熄灭", tone: "blackbox" },
  blackbox_counter: { label: "黑匣反制", tone: "blackbox" },
  blackbox_crew_return: { label: "船员回声", tone: "memory" },
  blackbox_crew_shield: { label: "防御展开", tone: "stable" },
  blackbox_hengdeng_override: { label: "覆写压迫", tone: "danger" },
  longfire_choice: { label: "长火回应", tone: "longfire" },
  longfire_ignite: { label: "长明火起", tone: "longfire" }
};

export function ChapterTwoFieldAudioLayer({
  cueLabel,
  soundEnabled,
  audioReady,
  onToggleSound
}: ChapterTwoFieldAudioLayerProps) {
  const [impact, setImpact] = useState<{ cue: ChapterTwoFieldStinger; label: string; tone: "stable" | "danger" | "memory" | "blackbox" | "longfire"; tick: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleFieldCue = (event: Event) => {
      const cue = (event as CustomEvent<{ cue?: ChapterTwoFieldStinger }>).detail?.cue;
      if (!cue) {
        return;
      }

      const meta = fieldImpactMeta[cue];
      setImpact({ cue, label: meta.label, tone: meta.tone, tick: Date.now() });
    };

    window.addEventListener("chapter-two-field-cue", handleFieldCue);
    return () => window.removeEventListener("chapter-two-field-cue", handleFieldCue);
  }, []);

  useEffect(() => {
    if (!impact) {
      return;
    }

    const timer = window.setTimeout(() => setImpact(null), 1050);
    return () => window.clearTimeout(timer);
  }, [impact]);

  return (
    <>
      {impact ? (
        <div key={`${impact.cue}-${impact.tick}`} className={`chapter-two-field-impact chapter-two-field-impact--${impact.tone}`} aria-hidden="true">
          <span />
          <i />
          <strong>{impact.label}</strong>
        </div>
      ) : null}
      <div className="chapter-two-field-cue" aria-live="polite">
        <span className="chapter-two-field-cue__dot" />
        <span>言衡星声场</span>
        <strong>{cueLabel}</strong>
      </div>

      <button
        type="button"
        onClick={onToggleSound}
        data-sound-toggle="true"
        className="chapter-two-field-sound-toggle"
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "关闭言衡星声场" : "开启言衡星声场"}
        title={soundEnabled ? "关闭言衡星声场" : "开启言衡星声场"}
      >
        <span>{soundEnabled ? "声场在线" : "静音巡行"}</span>
        <small>{audioReady ? "心火已接入" : "触碰点火"}</small>
      </button>
    </>
  );
}
