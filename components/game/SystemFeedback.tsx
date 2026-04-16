"use client";

interface SystemFeedbackProps {
  eyebrow?: string;
  title: string;
  body: string;
  tone?: "info" | "success" | "warm";
}

const toneClasses = {
  info: "border-cyan-200/16 bg-cyan-200/8 text-cyan-100/90",
  success: "border-emerald-200/18 bg-emerald-200/10 text-emerald-50",
  warm: "border-amber-200/18 bg-amber-200/10 text-amber-50"
};

export function SystemFeedback({ eyebrow, title, body, tone = "info" }: SystemFeedbackProps) {
  return (
    <div className={`hologram-sweep rounded-[24px] border px-4 py-4 ${toneClasses[tone]}`}>
      {eyebrow && <div className="soft-label text-[10px] text-white/45">{eyebrow}</div>}
      <div className="mt-1 text-sm font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-6 text-white/72">{body}</div>
    </div>
  );
}
