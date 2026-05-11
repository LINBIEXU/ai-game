import type { ChapterTwoCrewAbility, ChapterTwoCrewAssistTargetId, CrewMember } from "@/types/game";

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

  const commonNote = "这是同行者的轻提醒，只检查方向。";

  if (kind === "record") {
    return {
      kind,
      label: "记录型介入",
      triggerLabel: "请求记录提示",
      description: "船员会提醒你先找可复查来源。",
      intervention: `${crew.name} 低声提醒：先问“这句话的来源在哪里”。${commonNote}`,
      sourceMarker: "来源提示：先找可复查出处。"
    };
  }

  if (kind === "repair") {
    return {
      kind,
      label: "修复型介入",
      triggerLabel: "请求修复提示",
      description: "船员会提醒你先稳住步骤。",
      intervention: `${crew.name} 提醒你先停一拍：看清这一步真正要修什么。${commonNote}`,
      repairAmount: 1
    };
  }

  if (kind === "scout") {
    return {
      kind,
      label: "侦察型介入",
      triggerLabel: "请求侦察提示",
      description: "船员会提醒你留意过度确定的词。",
      intervention: `${crew.name} 扫到一处暗纹：越是说得很确定，越要放慢。${commonNote}`,
      hiddenHint: "侦察提示：缺少印章、来源或确认记录时，先保留缺口。"
    };
  }

  return {
    kind,
    label: "表达型介入",
    triggerLabel: "请求表达提示",
    description: "船员会提醒你检查指令四个刻度。",
    intervention: `${crew.name} 指了指提示板：对象、任务、范围、格式都要说清。${commonNote}`,
    stableTemplate: "表达提示：对象 / 任务 / 范围 / 格式。"
  };
}

const locationAssistHints: Record<ChapterTwoCrewAssistTargetId, string> = {
  "semantic-dispatch": "先看它在分流什么。别把“自动给答案”当成这座庭院的职责。",
  "evidence-well": "这段记录里有些话很确定。先问它有没有来源。",
  "boundary-beacon": "把“可以协助”与“必须自定”分开。",
  "archive-tower": "档案塔只问一件事：哪句话能替事实作证？",
  "letter-port": "信件可以残缺，但缺失栏位必须留在未知轨道。",
  "engraved-valley": "山谷看四个刻度：目标、语境、边界、格式。",
  "paper-corridor": "纸光写得顺，不代表它可靠。先找顺滑背后的不稳点。",
  "blackbox-vault": "黑匣不是宝箱。进入前确认四束碎片已经汇聚。",
  "blackbox-trial": "失序回声会替你回答。最后要把判断权拿回来。"
};

const blackboxPhaseAssistHints: Record<string, string> = {
  intro: "先别急着让它替你回答。黑匣试炼考的是你能不能保留判断权。",
  archive: "归档之门先分来源层级。",
  delivery: "传递之门要补齐对象、任务、限制和输出方式。",
  verification: "求证之门会出现很顺的结论，先拆开它。",
  expression: "表达之门不是背答案，先说清协助范围。",
  "final-reflection": "最终问题要用自己的话回答，不要复制套话。"
};

export function createChapterTwoCrewAssistHint({
  targetId,
  ability,
  crewName,
  phase
}: {
  targetId: ChapterTwoCrewAssistTargetId;
  ability: ChapterTwoCrewAbility | null;
  crewName: string;
  phase?: string;
}) {
  const baseHint = targetId === "blackbox-trial" && phase ? blackboxPhaseAssistHints[phase] ?? locationAssistHints[targetId] : locationAssistHints[targetId];
  const abilityNudge =
    ability?.kind === "record"
      ? "我会帮你盯来源，但最后归类要你自己定。"
      : ability?.kind === "repair"
        ? "我会帮你稳住节奏，但不替你修成答案。"
        : ability?.kind === "scout"
          ? "我会提醒哪里可疑，但不直接圈出选项。"
          : ability?.kind === "expression"
            ? "我会帮你检查表达结构，但内容判断仍在你手里。"
            : "我只给同行提醒，不接管判断。";

  return `${crewName}：${baseHint} ${abilityNudge}`;
}
