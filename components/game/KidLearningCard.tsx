"use client";

const kidLearningLines = [
  "我能说清楚：这次要让 AI 帮我完成什么。",
  "我知道：AI 会根据线索推测，不等于真的知道事实。",
  "我会把不知道的地方标出来，告诉 AI 不要乱补。"
];

interface KidLearningCardProps {
  className?: string;
}

export function KidLearningCard({ className = "" }: KidLearningCardProps) {
  return (
    <div className={`rounded-[26px] border border-emerald-200/14 bg-emerald-200/[0.055] p-5 ${className}`}>
      <div className="soft-label text-[10px] text-emerald-100/58">航行学习结算</div>
      <div className="mt-3 text-lg font-semibold text-white">我带走的三句话</div>
      <div className="mt-4 grid gap-3">
        {kidLearningLines.map((line, index) => (
          <div key={line} className="rounded-[18px] border border-white/8 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-white/72">
            <span className="mr-2 text-emerald-100/72">{index + 1}</span>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
