"use client";

interface ProgressStepperProps {
  awakened: boolean;
  crewOnboard: boolean;
  signalRepaired: boolean;
  firstStarLit: boolean;
}

const steps = [
  { id: "awake", label: "苏醒" },
  { id: "crew", label: "船员" },
  { id: "signal", label: "信号" },
  { id: "star", label: "航星" }
];

export function ProgressStepper({
  awakened,
  crewOnboard,
  signalRepaired,
  firstStarLit
}: ProgressStepperProps) {
  const stepState = [awakened, crewOnboard, signalRepaired, firstStarLit];

  return (
    <div className="panel-surface panel-grid flex flex-wrap gap-3 rounded-3xl px-4 py-4">
      {steps.map((step, index) => {
        const completed = stepState[index];
        const active = !completed && (index === 0 || stepState[index - 1]);

        return (
          <div
            key={step.id}
            className={`min-w-[120px] flex-1 rounded-2xl border px-4 py-3 transition ${
              completed
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                : active
                  ? "border-amber-200/30 bg-white/5 text-white"
                  : "border-white/8 bg-white/[0.03] text-slate-400"
            }`}
          >
            <div className="text-xs tracking-[0.24em] text-white/55">STEP {index + 1}</div>
            <div className="mt-1 text-sm font-semibold">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
