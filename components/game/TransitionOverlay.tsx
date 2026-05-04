"use client";

interface TransitionOverlayProps {
  visible: boolean;
  title: string;
  detail: string;
  mode?: "scan" | "unlock" | "arrival" | "jump";
}

const accentMap = {
  scan: "from-cyan-300/70 via-sky-200/20 to-transparent",
  unlock: "from-amber-200/80 via-amber-100/20 to-transparent",
  arrival: "from-emerald-200/70 via-cyan-200/20 to-transparent",
  jump: "from-fuchsia-200/70 via-sky-300/25 to-transparent"
};

const cameraModeMap = {
  scan: "push",
  unlock: "archive",
  arrival: "archive",
  jump: "dive"
} as const;

export function TransitionOverlay({ visible, title, detail, mode = "scan" }: TransitionOverlayProps) {
  if (!visible) {
    return null;
  }

  const cameraMode = cameraModeMap[mode];

  return (
    <div className={`transition-overlay transition-overlay--${cameraMode} fixed inset-0 z-30 flex items-center justify-center bg-[#01040a]/76 px-6 backdrop-blur-md`}>
      {cameraMode === "dive" ? (
        <div className="transition-warp-tunnel" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
          <i />
          <i />
          <i />
        </div>
      ) : null}

      <div className="particle-column">
        {Array.from({ length: 16 }).map((_, index) => (
          <span
            key={index}
            style={{
              left: `${8 + index * 6}%`,
              animationDelay: `${index * 110}ms`
            }}
          />
        ))}
      </div>

      <div className={`transition-overlay__panel panel-surface hologram-sweep ${mode === "unlock" ? "unlock-burst" : "scene-reveal"} relative w-full max-w-xl overflow-hidden rounded-[34px] px-8 py-10 text-center shadow-glow`}>
        <div className={`transition-overlay__beam absolute inset-x-10 top-0 h-20 bg-gradient-to-b ${accentMap[mode]} blur-2xl`} />
        <div className="soft-label text-[11px] text-white/45">
          {cameraMode === "archive" ? "收束归档" : cameraMode === "dive" ? "下潜回溯" : "推进接入"}
        </div>
        <div className="mt-4 text-3xl font-semibold text-white">{title}</div>
        <div className="mt-4 text-sm leading-7 text-white/68">{detail}</div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-200/80 system-pulse" />
          <span className="h-2 w-10 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/20 system-pulse" style={{ animationDelay: "240ms" }} />
          <span className="h-2 w-10 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/20 system-pulse" style={{ animationDelay: "420ms" }} />
        </div>
      </div>
    </div>
  );
}
