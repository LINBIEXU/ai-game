"use client";

type HengdengGuideTone = "observe" | "operate" | "repair" | "blackbox";

interface HengdengTaskGuideProps {
  locationName: string;
  stageName: string;
  title: string;
  lines: string[];
  tone?: HengdengGuideTone;
  className?: string;
}

export function HengdengTaskGuide({
  locationName,
  stageName,
  title,
  lines,
  tone = "observe",
  className = ""
}: HengdengTaskGuideProps) {
  return (
    <aside className={`chapter-two-hengdeng-guide chapter-two-hengdeng-guide--${tone} ${className}`.trim()} aria-label={`${locationName}衡灯引导`}>
      <div className="chapter-two-hengdeng-guide__speaker" aria-hidden="true">
        <span>衡</span>
      </div>
      <div className="chapter-two-hengdeng-guide__body">
        <span>
          衡灯 · {locationName} · {stageName}
        </span>
        <strong>{title}</strong>
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </aside>
  );
}
