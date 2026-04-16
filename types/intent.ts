import type {
  ChapterTwoDuty,
  ChapterTwoFocus,
  CrewFormType,
  CrewRole,
  CrewTalent,
  CrewTemperament
} from "@/types/game";

export interface InterpretedIntent<TSpec extends object> {
  rawInput: string;
  extractedKeywords: string[];
  confirmationTitle: string;
  confirmationBody: string;
  adjustmentHints: string[];
  finalizedSpec: TSpec;
}

export interface CrewCreationSpec {
  formType: CrewFormType;
  role: CrewRole;
  temperament: CrewTemperament;
  talent: CrewTalent;
  suggestedFocuses: string[];
  visualSubject: string;
  visualGuardrails: string[];
  styleKeywords: string[];
}

export interface MissionIntentSpec {
  focus: ChapterTwoFocus;
  riskDirection: string;
  crewApproach: string;
  reasoningPath: string;
  preferredLeadDuty?: ChapterTwoDuty;
  preferredSupportDuty?: ChapterTwoDuty;
}

export type CrewDialogueIntentKind =
  | "greeting"
  | "capability"
  | "task"
  | "background"
  | "casual"
  | "rephrase"
  | "emotion";

export interface CrewDialogueIntentSpec {
  kind: CrewDialogueIntentKind;
  focusSummary: string;
  responseGoal: string;
  shouldRevealBackground: boolean;
  rephraseRequested: boolean;
  avoidOpenings: string[];
}

export interface CrewImageIntentSpec {
  visualSubject: string;
  visualGuardrails: string[];
  styleKeywords: string[];
  styleDirection: string;
  wardrobeDirection: string;
  roleAura: string;
  echoVariance: string;
  negativeHints: string[];
}
