"use client";

interface StarMapPanelProps {
  firstStarLit: boolean;
  coordinateLabel?: string | null;
}

export function StarMapPanel({ firstStarLit, coordinateLabel }: StarMapPanelProps) {
  return (
    <div className={`panel-surface rounded-[28px] p-5 ${firstStarLit ? "hologram-sweep unlock-burst" : "panel-reveal"}`}>
      <div className="soft-label text-[11px] text-white/45">航星图</div>
      <div className="mt-4 rounded-[24px] border border-white/8 bg-slate-950/50 p-5">
        <div className="relative h-36">
          <div className="absolute left-8 top-16 h-px w-40 bg-gradient-to-r from-cyan-300/50 to-white/0" />
          <div className="absolute left-24 top-10 h-px w-32 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
          <div
            className={`absolute left-5 top-12 h-6 w-6 rounded-full border ${
              firstStarLit
                ? "animate-pulse-glow border-amber-200/70 bg-amber-200 shadow-glow"
                : "border-white/15 bg-white/10"
            }`}
          />
          <div className="absolute left-28 top-6 h-4 w-4 rounded-full border border-white/10 bg-white/10" />
          <div className="absolute right-4 top-20 h-5 w-5 rounded-full border border-white/10 bg-white/10" />
          <div className="absolute bottom-2 left-0 text-xs text-white/45">
            {firstStarLit ? "第一颗航星已点亮" : "第一颗航星尚未点亮"}
          </div>
          {firstStarLit && (
            <>
              <div className="absolute left-2 top-9 h-12 w-12 rounded-full bg-amber-200/20 blur-2xl" />
              <div className="absolute left-1 top-8 h-14 w-14 rounded-full border border-amber-100/25" />
            </>
          )}
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
          {coordinateLabel ?? "新坐标尚未记录"}
        </div>
      </div>
    </div>
  );
}
