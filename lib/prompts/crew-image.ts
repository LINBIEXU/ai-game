import type { PromptBlueprint } from "@/lib/prompts/types";

export interface CrewImagePromptInput {
  playerDescription: string;
  crewName: string;
  crewTitle: string;
  abilityTag: string;
  roleSummary: string;
  visualSubject: string;
  guardrails: string[];
  styleKeywords: string[];
  styleDirection: string;
  wardrobeDirection: string;
  portraitDirection?: string;
  portraitAestheticSystem?: string;
  portraitTemperamentFrame?: string;
  portraitFacialStructure?: string;
  portraitWorldWardrobeSpec?: string;
  portraitNegativeConstraints?: string[];
  portraitGenerationPlan?: string;
  parallelEchoNote: string;
  revision: number;
}

function compactRawText(items: Array<string | null | undefined>) {
  return items
    .map((item) => item?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}

export function buildFinalImagePrompt(input: CrewImagePromptInput) {
  return compactRawText([input.playerDescription, input.visualSubject]) || "single character";
}

export function buildCrewImageNegativePrompt() {
  return "";
}

export const crewImagePrompt: PromptBlueprint<CrewImagePromptInput> = {
  id: "crew-image-raw-test",
  label: "船员形象生成提示词 Raw Test",
  goal: "临时关闭角色生图提示词工程，只把玩家原始描述交给图像模型。",
  inputGuide: [],
  outputGuide: [],
  system: "",
  developer: "",
  buildUserPrompt: buildFinalImagePrompt
};
