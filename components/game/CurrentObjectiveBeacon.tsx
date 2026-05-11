import type { CurrentObjective } from "@/lib/current-objective";

interface CurrentObjectiveBeaconProps {
  objective: CurrentObjective;
}

const toneClasses: Record<NonNullable<CurrentObjective["tone"]>, string> = {
  default: "border-cyan-200/18 bg-slate-950/68 text-cyan-50 shadow-[0_16px_48px_rgba(8,47,73,0.28)]",
  urgent: "border-amber-200/24 bg-slate-950/72 text-amber-50 shadow-[0_16px_48px_rgba(120,53,15,0.26)]",
  complete: "border-emerald-200/20 bg-slate-950/68 text-emerald-50 shadow-[0_16px_48px_rgba(6,78,59,0.24)]"
};

const dotClasses: Record<NonNullable<CurrentObjective["tone"]>, string> = {
  default: "bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.72)]",
  urgent: "bg-amber-200 shadow-[0_0_16px_rgba(253,230,138,0.72)]",
  complete: "bg-emerald-200 shadow-[0_0_16px_rgba(167,243,208,0.72)]"
};

export function CurrentObjectiveBeacon({ objective }: CurrentObjectiveBeaconProps) {
  const tone = objective.tone ?? "default";

  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-40 w-[min(calc(100vw-1.5rem),30rem)] -translate-x-1/2 md:top-5" aria-live="polite">
      <div className={`mx-auto flex min-h-10 items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-md ${toneClasses[tone]}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[tone]}`} aria-hidden="true" />
        <span className="shrink-0 text-[10px] font-semibold tracking-[0.18em] text-white/42">主舰导航</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{objective.label}</span>
      </div>
    </div>
  );
}
