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
  ability,
  crewName,
  targetName,
  hint,
  usedRecord,
  onUse
}: {
  ability: ChapterTwoCrewAbility | null;
  crewName: string;
  targetName: string;
  hint: string;
  usedRecord: ChapterTwoCrewAssistRecord | null;
  onUse: () => void;
}) {
  const used = Boolean(usedRecord);

  return (
    <div
      className={`chapter-two-crew-assist ${ability ? `chapter-two-crew-assist--${ability.kind}` : "chapter-two-crew-assist--idle"} ${used ? "chapter-two-crew-assist--used" : ""}`}
      data-hint-ready={hint ? "true" : "false"}
    >
      <span>船员协助提示 / {targetName}</span>
      <strong>{crewName} · {ability?.label ?? "同行提醒"}</strong>
      <p>{usedRecord?.hint ?? "每处地点只接收一次同行提示，用来检查方向。"}</p>
      <button type="button" onClick={onUse} disabled={used}>
        {used ? "提示已记录" : ability?.triggerLabel ?? "请求提示"}
      </button>
      {!used ? <em>提示会写入本次远征记录，只提醒检查线索，不直接给答案。</em> : null}
    </div>
  );
}
