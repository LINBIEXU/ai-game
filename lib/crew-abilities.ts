import type { ChapterTwoCrewAbility, CrewMember } from "@/types/game";

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function resolveChapterTwoCrewAbility(crew: CrewMember | null): ChapterTwoCrewAbility | null {
  if (!crew) {
    return null;
  }

  const signal = [
    crew.role,
    crew.talent,
    crew.abilityTag,
    crew.title,
    crew.specialFocus,
    crew.notes,
    ...crew.styleTags
  ].join(" ");

  const scores: Record<ChapterTwoCrewAbility["kind"], number> = {
    record: (crew.role === "record" ? 4 : 0) + (crew.talent === "decode" ? 3 : 0) + (hasAny(signal, ["记录", "档案", "整理", "破译", "拆解", "暗码", "碎讯"]) ? 2 : 0),
    repair: (crew.role === "repair" ? 4 : 0) + (crew.talent === "mend" ? 3 : 0) + (hasAny(signal, ["修复", "修补", "稳定", "缝合", "复位", "回路", "补回"]) ? 2 : 0),
    scout: (crew.role === "scout" ? 4 : 0) + (crew.talent === "track" ? 3 : 0) + (hasAny(signal, ["侦察", "追踪", "扫描", "探路", "寻路", "尾迹", "锁定"]) ? 2 : 0),
    expression: (crew.role === "pilot" ? 2 : 0) + (crew.talent === "invent" ? 4 : 0) + (hasAny(signal, ["表达", "构想", "灵感", "奇想", "拼接", "设计", "语言", "改写"]) ? 2 : 0)
  };

  const fallbackKind: ChapterTwoCrewAbility["kind"] =
    crew.role === "record"
      ? "record"
      : crew.role === "repair"
        ? "repair"
        : crew.role === "scout"
          ? "scout"
          : crew.talent === "invent"
            ? "expression"
            : crew.talent === "mend"
              ? "repair"
              : crew.talent === "track"
                ? "scout"
                : "record";

  const kind = (Object.entries(scores) as Array<[ChapterTwoCrewAbility["kind"], number]>)
    .sort((left, right) => right[1] - left[1])[0]?.[1] > 0
    ? (Object.entries(scores) as Array<[ChapterTwoCrewAbility["kind"], number]>).sort((left, right) => right[1] - left[1])[0][0]
    : fallbackKind;

  const commonNote = "这是一次轻辅助，只改变提示、容错或可见线索，不替小舰长完成判断。";

  if (kind === "record") {
    return {
      kind,
      label: "记录型介入",
      triggerLabel: "标出来源",
      description: "船员会把一条可复查来源钉在记录旁，帮助判断哪句话真有依据。",
      intervention: `${crew.name} 标出一条来源：第七档案塔底层观测条 07-B。${commonNote}`,
      sourceMarker: "来源：第七档案塔底层观测条 07-B"
    };
  }

  if (kind === "repair") {
    return {
      kind,
      label: "修复型介入",
      triggerLabel: "稳定污染",
      description: "第一次误触后，船员会压低一格污染读数，让地标回路还有修复余量。",
      intervention: `${crew.name} 稳住地标回路，第一次误触的污染被压低一格。${commonNote}`,
      repairAmount: 1
    };
  }

  if (kind === "scout") {
    return {
      kind,
      label: "侦察型介入",
      triggerLabel: "展开暗纹",
      description: "船员会扫出暗纹，露出一条隐藏提示或地表回波。",
      intervention: `${crew.name} 扫到一处暗纹：缺少证据的身份或原因不能写死。${commonNote}`,
      hiddenHint: "隐藏暗纹：缺少印章、来源或确认记录时，只能标未知或推测。"
    };
  }

  return {
    kind,
    label: "表达型介入",
    triggerLabel: "给出模板",
    description: "船员会多开放一条稳定模板，方便把任务、依据、边界和输出方式说清楚。",
    intervention: `${crew.name} 送来一条稳定模板：请只根据残片整理；先列依据；未知标注未知；最后分栏输出。${commonNote}`,
    stableTemplate: "请只根据残片整理；先列依据；缺失处写未知；最后按“事实 / 推测 / 未知”分栏输出。"
  };
}
