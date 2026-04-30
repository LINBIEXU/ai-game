"use client";

import { useState } from "react";

interface TrialModeDockProps {
  onStartTrial: () => void;
  onJumpToFirst: () => void;
  onJumpToSecond: () => void;
  onOpenResult: () => void;
  onResetTrial: () => void;
}

export function TrialModeDock({
  onStartTrial,
  onJumpToFirst,
  onJumpToSecond,
  onOpenResult,
  onResetTrial
}: TrialModeDockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="trial-mode-dock">
      <button type="button" className="trial-mode-dock__toggle" onClick={() => setOpen((current) => !current)}>
        试听控制
      </button>
      {open && (
        <div className="trial-mode-dock__panel">
          <div className="soft-label text-[10px] text-white/38">Teacher Flow</div>
          <button type="button" onClick={onStartTrial}>从头开始试听</button>
          <button type="button" onClick={onJumpToFirst}>跳到第一关入口</button>
          <button type="button" onClick={onJumpToSecond}>跳到第二关</button>
          <button type="button" onClick={onOpenResult}>查看最终成果页</button>
          <button type="button" onClick={onResetTrial} className="trial-mode-dock__danger">重置当前试听流程</button>
        </div>
      )}
    </div>
  );
}
