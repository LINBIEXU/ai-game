export type LandmarkDisorderChange = (next: {
  disorderLevel?: number;
  mistakeCount?: number;
  pollutedRecords?: string[];
  statusNote?: string;
}) => void;

export function reportLandmarkMistake({
  disorderLevel,
  mistakeCount,
  pollutedRecords,
  recordId,
  statusNote,
  disorderIncrease = 1,
  onDisorderChange
}: {
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  recordId: string;
  statusNote: string;
  disorderIncrease?: number;
  onDisorderChange: LandmarkDisorderChange;
}) {
  const nextDisorderLevel = Math.min(6, disorderLevel + Math.max(0, disorderIncrease));
  const nextMistakeCount = mistakeCount + 1;

  onDisorderChange({
    disorderLevel: nextDisorderLevel,
    mistakeCount: nextMistakeCount,
    pollutedRecords: Array.from(new Set([...pollutedRecords, recordId])),
    statusNote
  });

  const disorderDelta = nextDisorderLevel - disorderLevel;

  return `失序强度变化 +${disorderDelta}，当前 ${nextDisorderLevel}/6；误触 ${nextMistakeCount}。`;
}
