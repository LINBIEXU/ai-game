function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ChapterTwoFieldStateStrip({
  tone,
  title,
  objective,
  stabilityLabel,
  stabilityValue,
  pressureLabel,
  pressureValue,
  lastEvent,
  className = ""
}: {
  tone: "archive" | "letter" | "valley" | "paper" | "blackbox";
  title: string;
  objective: string;
  stabilityLabel: string;
  stabilityValue: number;
  pressureLabel: string;
  pressureValue: number;
  lastEvent?: string | null;
  className?: string;
}) {
  const stability = clampPercent(stabilityValue);
  const pressure = clampPercent(pressureValue);

  return (
    <aside className={`chapter-two-field-state-strip chapter-two-field-state-strip--${tone} ${className}`} aria-label={`${title}场内状态`}>
      <div className="chapter-two-field-state-strip__objective">
        <span>{title}</span>
        <strong>{objective}</strong>
      </div>
      <div className="chapter-two-field-state-strip__meters">
        <div className="chapter-two-field-state-meter chapter-two-field-state-meter--stable">
          <span>{stabilityLabel}</span>
          <i aria-hidden="true">
            <b style={{ width: `${stability}%` }} />
          </i>
          <strong>{stability}%</strong>
        </div>
        <div className="chapter-two-field-state-meter chapter-two-field-state-meter--pressure">
          <span>{pressureLabel}</span>
          <i aria-hidden="true">
            <b style={{ width: `${pressure}%` }} />
          </i>
          <strong>{pressure}%</strong>
        </div>
      </div>
      {lastEvent ? <p>{lastEvent}</p> : null}
    </aside>
  );
}
