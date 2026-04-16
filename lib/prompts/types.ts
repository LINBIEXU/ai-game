export interface PromptSection {
  title: string;
  body: string | string[];
}

export interface PromptBlueprint<TInput = Record<string, unknown>> {
  id: string;
  label: string;
  goal: string;
  inputGuide: string[];
  outputGuide: string[];
  system: string;
  developer: string;
  buildUserPrompt: (input: TInput) => string;
}
