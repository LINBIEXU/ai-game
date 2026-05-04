import type { ReactNode } from "react";

import type { ChapterTwoCrewAbility } from "@/types/game";

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
      <p className="mt-1">{active ? activeNote ?? ability.intervention : `${ability.description} 这处地标只接收旁路提示，不替小舰长完成判断。`}</p>
      {children}
    </div>
  );
}
