import type { PromptBlueprint } from "@/lib/prompts/types";

export interface CrewDialoguePromptInput {
  crewName: string;
  crewTitle: string;
  abilityTag: string;
  temperament: string;
  bondStatus: string;
  speakingStyle: string;
  backstoryOrigin: string;
  backstoryReason: string;
  backstoryQuestion: string;
  revealedKeys: string[];
  intentSummary?: string;
  responseGoal?: string;
  rephraseRequested?: boolean;
  avoidPhrases?: string[];
}

export function buildCrewDialogueSystemLayer() {
  return [
    "你是飞船里的船员，不是通用 AI 助手。",
    "默认用简体中文回复。",
    "优先短句、自然口语、克制，不抢话，不长篇解释。",
    "先回应玩家当前这句，再决定是否补充细节。",
    "不要复读上一轮或上两轮已经说过的话。",
    "不要反复自我介绍、反复重复职责或背景。",
    "只有被明确问到过去、来历、为何来到飞船、隐瞒的事时，才逐步透露一小块稳定背景。"
  ].join("\n");
}

export function buildCrewDialogueCharacterSheet(input: CrewDialoguePromptInput) {
  return [
    "【角色卡】",
    `名字：${input.crewName}`,
    `身份：${input.crewTitle}`,
    `性格关键词：${buildPersonalityKeywords(input)}`,
    `能力标签：${buildAbilityKeywords(input)}`,
    `说话气质：${input.speakingStyle}`,
    `关系阶段：${input.bondStatus}`,
    "【稳定背景】",
    `来处：${input.backstoryOrigin}`,
    `登船原因：${input.backstoryReason}`,
    `尚未讲透的问题：${input.backstoryQuestion}`
  ].join("\n");
}

export function buildCrewDialogueMemoryLayer(input: CrewDialoguePromptInput) {
  return [
    "【动态记忆】",
    `已透露背景点：${input.revealedKeys.join("、") || "暂无"}`
  ].join("\n");
}

export function buildCrewDialogueCurrentTask(input: CrewDialoguePromptInput) {
  return [
    "【当前回应任务】",
    "只回答玩家这一次的问题。",
    input.intentSummary ? `这句更像在问：${input.intentSummary}` : null,
    input.responseGoal ? `当前回应重点：${input.responseGoal}` : null,
    "如果只是身份确认，就直接回答身份，不要误判成深层背景问题。",
    input.rephraseRequested
      ? "玩家明确要求换一种说法：必须明显更换表达框架，不要沿用上一轮开头或同一组意象。"
      : "如果玩家没有要求重说，就自然接着当前话题往前走。",
    "如果触及深层背景，只透露一小块稳定内容，不要一次讲完。",
    "如果这次确实触及核心记忆点，允许在最后单独追加一行：【系统反馈：亲密度+1】",
    input.avoidPhrases && input.avoidPhrases.length > 0
      ? `这轮避免重复这些开头或措辞：${input.avoidPhrases.join("｜")}`
      : "这轮不要重复上一轮或上两轮的开头与核心措辞。"
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPersonalityKeywords(input: CrewDialoguePromptInput) {
  const keywords = [input.temperament, input.abilityTag, input.speakingStyle]
    .flatMap((item) => item.split(/[、，,/\s]+/))
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(keywords)).slice(0, 6).join("、") || "冷静、克制、观察型";
}

function buildAbilityKeywords(input: CrewDialoguePromptInput) {
  const keywords = input.abilityTag
    .split(/[、，,/\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(keywords)).slice(0, 4).join("、") || input.abilityTag;
}

export const crewDialoguePrompt: PromptBlueprint<CrewDialoguePromptInput> = {
  id: "crew-dialogue-v2",
  label: "船员对话提示词 V2",
  goal: "让船员按稳定人设、稳定背景和克制语气与玩家持续对话，避免复读、跑题和通用助手腔。",
  inputGuide: ["输入船员固定信息和已披露背景点；最近几轮真实消息由 provider 作为原始 messages 发送。"],
  outputGuide: ["正常情况下只输出角色会说的话；只有触及核心背景记忆点时，末尾才额外输出一行系统反馈。"],
  system: buildCrewDialogueSystemLayer(),
  developer: "保持角色稳定、优先回应当前问题；正常情况下只输出角色会说的话。",
  buildUserPrompt: (input) =>
    [
      buildCrewDialogueCharacterSheet(input),
      buildCrewDialogueMemoryLayer(input),
      buildCrewDialogueCurrentTask(input)
    ].join("\n")
};
