import { crewDossierPrompt } from "@/lib/prompts/crew-dossier";
import { crewDialoguePrompt } from "@/lib/prompts/crew-dialogue";
import { crewGenerationPrompt } from "@/lib/prompts/crew-generation";
import { crewImagePrompt } from "@/lib/prompts/crew-image";
import { missionAnalysisPrompt } from "@/lib/prompts/mission-analysis";
import { missionRefinementPrompt } from "@/lib/prompts/mission-refinement";
import { providerPromptBindings } from "@/lib/prompts/provider-bindings";
import { shipLogPrompt } from "@/lib/prompts/ship-log";
import { worldRulesPrompt } from "@/lib/prompts/world-rules";

export const promptRegistry = {
  worldRules: worldRulesPrompt,
  crewGeneration: crewGenerationPrompt,
  crewDialogue: crewDialoguePrompt,
  crewImage: crewImagePrompt,
  missionAnalysis: missionAnalysisPrompt,
  missionRefinement: missionRefinementPrompt,
  shipLog: shipLogPrompt,
  crewDossier: crewDossierPrompt,
  providerBindings: providerPromptBindings
} as const;

export {
  worldRulesPrompt,
  crewGenerationPrompt,
  crewDialoguePrompt,
  crewImagePrompt,
  missionAnalysisPrompt,
  missionRefinementPrompt,
  shipLogPrompt,
  crewDossierPrompt,
  providerPromptBindings
};
