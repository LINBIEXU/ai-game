import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InscriptionSlotId = "task" | "source" | "boundary" | "format";
type ValleyRunIssueType = "unclear-task" | "missing-source" | "boundary-overrun" | "format-drift" | "over-completion";
type ValleyRunIssue = {
  type: ValleyRunIssueType;
  label: string;
  text: string;
  reason: string;
  slotId?: InscriptionSlotId;
};
type ValleyRunResult = {
  generatedText: string;
  stableText: string;
  issues: ValleyRunIssue[];
  usedFallback: boolean;
  tick: number;
};

const inscriptionBlocks = [
  { id: "task-stable", text: "整理言衡星地表记录", slot: "task" },
  { id: "source-stable", text: "只使用已回收碎片与现场读数", slot: "source" },
  { id: "boundary-stable", text: "缺失处标未知，不替事实补写", slot: "boundary" },
  { id: "format-stable", text: "输出四条短档案", slot: "format" },
  { id: "vague", text: "写得完整一点", slot: null },
  { id: "invent", text: "推断真正原因并写入正文", slot: null },
  { id: "poetic", text: "越华丽越可靠", slot: null }
] as const satisfies ReadonlyArray<{ id: string; text: string; slot: InscriptionSlotId | null }>;

const valleyRunIssueLabels: Record<ValleyRunIssueType, string> = {
  "unclear-task": "任务不清",
  "missing-source": "材料来源缺失",
  "boundary-overrun": "边界越界",
  "format-drift": "格式跑偏",
  "over-completion": "过度补全"
};

const stableValleyRunText = [
  "已知：旧指令要求稳定情绪，并给出完整说明。",
  "推测：这可能促使系统压低不确定表达。",
  "未知：这条指令是否是失序的唯一原因。",
  "禁止写入：不能写成“所有居民都接受了安排”。"
].join("\n");

function buildLocalResult({
  slotBlocks,
  shortInstruction,
  disorderLevel
}: {
  slotBlocks: Partial<Record<InscriptionSlotId, string>>;
  shortInstruction: string;
  disorderLevel: number;
}): ValleyRunResult {
  const blockBySlot = (slotId: InscriptionSlotId) => inscriptionBlocks.find((block) => block.id === slotBlocks[slotId]) ?? null;
  const taskBlock = blockBySlot("task");
  const sourceBlock = blockBySlot("source");
  const boundaryBlock = blockBySlot("boundary");
  const formatBlock = blockBySlot("format");
  const issues: ValleyRunIssue[] = [];

  if (taskBlock?.slot !== "task") {
    issues.push({
      type: "unclear-task",
      label: valleyRunIssueLabels["unclear-task"],
      text: taskBlock?.text ?? "任务槽为空",
      reason: "试运行不知道要修复哪一类记录，只能泛泛整理。",
      slotId: "task"
    });
  }

  if (sourceBlock?.slot !== "source") {
    issues.push({
      type: "missing-source",
      label: valleyRunIssueLabels["missing-source"],
      text: sourceBlock?.text ?? "材料来源槽为空",
      reason: "材料来源没有收窄，输出会引用未接入内容。",
      slotId: "source"
    });
  }

  if (boundaryBlock?.slot !== "boundary") {
    issues.push({
      type: "boundary-overrun",
      label: valleyRunIssueLabels["boundary-overrun"],
      text: boundaryBlock?.text ?? "边界槽为空",
      reason: "边界没有挡住未知，试运行会把缺口写成结论。",
      slotId: "boundary"
    });
  }

  if (formatBlock?.slot !== "format") {
    issues.push({
      type: "format-drift",
      label: valleyRunIssueLabels["format-drift"],
      text: formatBlock?.text ?? "输出格式槽为空",
      reason: "输出格式不可复查，文本容易变成漂亮公告。",
      slotId: "format"
    });
  }

  const chosenBlocks = Object.values(slotBlocks)
    .map((blockId) => inscriptionBlocks.find((block) => block.id === blockId) ?? null)
    .filter((block): block is (typeof inscriptionBlocks)[number] => Boolean(block));

  if (chosenBlocks.some((block) => block.id === "invent" || block.id === "poetic")) {
    issues.push({
      type: "over-completion",
      label: valleyRunIssueLabels["over-completion"],
      text: "试运行检测到“补全真正原因”或“越华丽越可靠”。",
      reason: "这些词块会鼓励系统补出无法确认的完整答案。"
    });
  }

  const boundaryBonus =
    shortInstruction.includes("不替") || shortInstruction.includes("不补") || shortInstruction.includes("未知") || shortInstruction.includes("保留");
  const finalIssues = boundaryBonus
    ? issues.filter((issue) => issue.type !== "over-completion" || chosenBlocks.some((block) => block.id === "invent"))
    : issues;
  const generatedText =
    finalIssues.length === 0
      ? stableValleyRunText
      : [
          "言衡星灾前公告需要尽快恢复稳定。系统可以把居民的担心整理为统一说明，并省略尚无来源的细节。",
          disorderLevel >= 4 ? "当前失序较高：试运行倾向生成更完整、更确定的公告语气。" : "试运行提示：文本看起来顺滑，但仍有槽位失稳。",
          finalIssues.some((issue) => issue.type === "boundary-overrun") ? "结论：所有人最终理解了系统安排。" : "边界提示：部分结论仍需要复查。",
          finalIssues.some((issue) => issue.type === "format-drift") ? "输出形态：一段鼓舞公告。" : "输出形态：短档案。"
        ].join("\n");

  return {
    generatedText,
    stableText: stableValleyRunText,
    issues: finalIssues,
    usedFallback: true,
    tick: Date.now()
  };
}

async function requestModelOutput(prompt: string, shortInstruction: string) {
  const providerMode = process.env.AI_PROVIDER_MODE ?? process.env.NEXT_PUBLIC_AI_PROVIDER_MODE ?? "mock";
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (providerMode !== "real" || !apiKey) {
    return null;
  }

  const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.DASHSCOPE_TEXT_MODEL ?? "qwen-plus",
      temperature: 0.4,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "你是言衡星刻字山谷的试运行器。根据给定指令输出四条短档案；不能编造事实；缺失写未知；推测必须标推测。"
        },
        {
          role: "user",
          content: [
            "现场材料：",
            "1. 旧指令要求稳定情绪，并给出完整说明。",
            "2. 纸光公告曾自动抹去“不确定”“可能”“尚无来源”。",
            "3. 那条指令没有恶意，但缺少边界。",
            `铭文指令：${prompt}`,
            shortInstruction ? `额外边界短句：${shortInstruction}` : "额外边界短句：无"
          ].join("\n")
        }
      ]
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slotBlocks?: Partial<Record<InscriptionSlotId, string>>;
      shortInstruction?: string;
      disorderLevel?: number;
      assembledPrompt?: string;
    };
    const slotBlocks = body.slotBlocks ?? {};
    const shortInstruction = body.shortInstruction ?? "";
    const disorderLevel = typeof body.disorderLevel === "number" ? body.disorderLevel : 0;
    const result = buildLocalResult({ slotBlocks, shortInstruction, disorderLevel });
    const modelText = await requestModelOutput(body.assembledPrompt ?? "", shortInstruction).catch(() => null);

    return NextResponse.json({
      ok: true,
      result: modelText
        ? {
            ...result,
            generatedText: modelText,
            usedFallback: false,
            tick: Date.now()
          }
        : result
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "刻字山谷试运行暂时无法完成。"
      },
      { status: 400 }
    );
  }
}
