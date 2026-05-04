"use client";

import type { ChapterOnePresentationStage } from "@/hooks/useChapterOnePresentation";

interface ChapterOnePresentationLayerProps {
  stage: ChapterOnePresentationStage;
  cueLabel: string;
  soundEnabled: boolean;
  audioReady: boolean;
  onToggleSound: () => void;
}

const stageLabels: Record<ChapterOnePresentationStage, string> = {
  boot_dark: "BOOT DARK",
  core_restore: "CORE RESTORE",
  crew_recruit: "CREW BOARDING",
  vault_warning: "VAULT WARNING",
  planet_building: "PLANET MODEL",
  planet_complete: "NAV LOCKED",
  fault_dive: "FAULT DIVE",
  fault_running: "FAULT TRACE",
  fault_result: "CASE ARCHIVE",
  session_summary: "SESSION ARCHIVE"
};

export function ChapterOnePresentationLayer({
  stage,
  cueLabel,
  soundEnabled,
  audioReady,
  onToggleSound
}: ChapterOnePresentationLayerProps) {
  return (
    <>
      <div className={`chapter-one-atmosphere chapter-one-atmosphere--${stage}`} aria-hidden="true">
        <div className="chapter-one-atmosphere__noise" />
        <div className="chapter-one-atmosphere__scan" />
        <div className="chapter-one-atmosphere__core" />
      </div>

      <div className="chapter-one-cue" aria-live="polite">
        <span className="chapter-one-cue__dot" />
        <span>{stageLabels[stage]}</span>
        <strong>{cueLabel}</strong>
      </div>

      <button
        type="button"
        onClick={onToggleSound}
        data-sound-toggle="true"
        className="chapter-one-sound-toggle"
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "关闭声场" : "开启声场"}
        title={soundEnabled ? "关闭第一关音效" : "开启第一关音效"}
      >
        <span>{soundEnabled ? "声场在线" : "静音模式"}</span>
        <small>{audioReady ? "已接入" : "点击任意按钮后启动"}</small>
      </button>
    </>
  );
}
