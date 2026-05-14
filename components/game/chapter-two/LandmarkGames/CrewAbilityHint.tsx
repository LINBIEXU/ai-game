import type { ReactNode } from "react";

import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistRecord } from "@/types/game";

export function CrewAbilityHint({
  ability,
  active,
  activeNote,
  children
}: {
  ability: ChapterTwoCrewAbility | null;
  active: boolean;
  activeNote?: ReactNode;
  children?: ReactNode;
}) {
  if (!ability) {
    return null;
  }

  return (
    <div className={active ? "chapter-two-soft-success" : "chapter-two-soft-warning"}>
      <strong>当前船员介入：{ability.label}</strong>
      <p className="mt-1">{active ? activeNote ?? ability.intervention : `${ability.description} 这处地标只接收旁路提示。`}</p>
      {children}
    </div>
  );
}

export function CrewAssistHintButton({
  ability: _ability,
  crewName: _crewName,
  targetName: _targetName,
  hint: _hint,
  usedRecord: _usedRecord,
  onUse: _onUse
}: {
  ability: ChapterTwoCrewAbility | null;
  crewName: string;
  targetName: string;
  hint: string;
  usedRecord: ChapterTwoCrewAssistRecord | null;
  onUse: () => void;
}) {
  return null;
}
