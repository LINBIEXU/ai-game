"use client";

interface ChapterTwoFieldAudioLayerProps {
  cueLabel: string;
  soundEnabled: boolean;
  audioReady: boolean;
  onToggleSound: () => void;
}

export function ChapterTwoFieldAudioLayer({
  cueLabel,
  soundEnabled,
  audioReady,
  onToggleSound
}: ChapterTwoFieldAudioLayerProps) {
  return (
    <>
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
