export type Scene =
  | "awakening"
  | "hub"
  | "archive"
  | "hub-briefing"
  | "chapter-two-portal"
  | "chapter-two-mission"
  | "chapter-two-result"
  | "home-planet-hub"
  | "recruit"
  | "crew-result"
  | "crew-bay"
  | "crew-chat"
  | "logbook"
  | "task-board"
  | "task-result"
  | "signal-mission"
  | "trial-bridge"
  | "signal-review"
  | "experience-result"
  | "trial-result"
  | "parent-summary"
  | "signal-aftermath"
  | "chapter-complete";

export type BridgeModuleId = "command" | "recruitment" | "signal-lab" | "task-board" | "star-map" | "archive" | "gate";
export type SignalMissionStep = "alert" | "navigation" | "malfunction" | "crew" | "decision";
export type MemoryZoneId = "navigation" | "malfunction" | "crew";
export type ShipTaskId = "trace-anomaly" | "repair-array" | "decode-relic";
export type ChapterTwoStep = "response" | "assign" | "round-one" | "round-two" | "decision";
export type ChapterTwoFocus = "身份线索" | "坐标结构" | "异常语气";
export type ChapterTwoRefinement = "补发讯人细节" | "切换主分析员" | "强化区域描述";
export type ChapterTwoFinalChoice = "深入追踪" | "记录后返航" | "激活隐藏模块";
export type ChapterTwoDuty = "前线解析" | "后方稳定" | "环境扫描" | "记录还原";
export type ChapterTwoSceneState =
  | "ship_bridge"
  | "launch_sequence"
  | "warp_travel"
  | "sector_view"
  | "planet_preview"
  | "planet_descent"
  | "planet_surface"
  | "location_focus"
  | "blackbox_unlock"
  | "memory_archive"
  | "boss_trial"
  | "chapter_reward";
export type ChapterTwoPlanetId = "mother" | "language";
export type ChapterTwoLocationId =
  | "semantic-dispatch"
  | "evidence-well"
  | "boundary-beacon"
  | "archive-tower"
  | "letter-port"
  | "engraved-valley"
  | "paper-corridor"
  | "blackbox-vault";

export type ChapterTwoCrewAbilityKind = "record" | "repair" | "scout" | "expression";

export interface ChapterTwoCrewAbility {
  kind: ChapterTwoCrewAbilityKind;
  label: string;
  triggerLabel: string;
  description: string;
  intervention: string;
  sourceMarker?: string;
  hiddenHint?: string;
  stableTemplate?: string;
  repairAmount?: number;
}

export type CrewFormType = "mechanical" | "biological" | "energy" | "hybrid";
export type CrewRole = "scout" | "repair" | "record" | "pilot";
export type CrewTemperament = "calm" | "warm" | "cunning" | "steady";
export type CrewTalent = "decode" | "track" | "mend" | "invent";

export type SignalNature = "distress" | "warning" | "coordinates";
export type MissingInfo = "location" | "sender" | "final-clue";
export type MalfunctionSuspicion = "偏航冲击" | "诱饵信号" | "记忆过载";

export interface SignalChoices {
  nature: SignalNature | null;
  missingInfo: MissingInfo | null;
}

export interface SignalSource {
  id: string;
  label: string;
  sector: string;
  stability: string;
  summary: string;
  fragments: string[];
}

export interface RecruitForm {
  description: string;
  formType: CrewFormType | null;
  role: CrewRole | null;
  temperament: CrewTemperament | null;
  talent: CrewTalent | null;
  styleTags: string[];
  specialFocus: string;
  customPrompt: string;
  notes: string;
}

export interface RecruitSignalAnalysis {
  sourceText: string;
  extractedKeywords: string[];
  inferredFormType: CrewFormType;
  inferredRole: CrewRole;
  inferredTemperament: CrewTemperament;
  inferredTalent: CrewTalent;
  suggestedFocuses: string[];
  roleSummary: string;
  styleSummary: string;
  summary: string;
}

export interface CrewPortraitAsset {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  providerId: string;
  styleLabel: string;
  echoNote?: string;
  updatedAt: number;
  revision: number;
}

export interface ClassroomImageAsset {
  imageUrl: string;
  fileName: string;
  kind: "crew" | "planet" | "chapter";
  ownerId: string;
  updatedAt: number;
}

export interface ClassroomArtifact {
  id: string;
  type: "crew" | "planet" | "chapter";
  ownerId: string;
  title: string;
  imageAsset: ClassroomImageAsset;
  notes?: string;
  updatedAt: number;
}

export type HomePlanetFeatureId =
  | "civilization-gallery"
  | "planet-workshop"
  | "commission-board"
  | "character-dialogue-room"
  | "animation-studio"
  | "civilization-archive"
  | "crew-dormitory"
  | "expedition-planning";

export type HomePlanetStructureId = "archive-hall" | "creation-house" | "observatory" | "energy-core" | "memory-garden";

export interface HomePlanetResources {
  water: number;
  minerals: number;
  energy: number;
  fragments: number;
  techPoints: number;
}

export interface HomePlanetCommissionWork {
  id: string;
  taskId: string;
  title: string;
  ability: string;
  output: string;
  createdAt: number;
}

export interface HomePlanetDialogueCard {
  id: string;
  character: string;
  theme: string;
  question: string;
  takeaway: string;
  createdAt: number;
}

export interface HomePlanetStoryboardAct {
  id: "opening" | "turn" | "ending";
  label: string;
  text: string;
  imageAsset?: ClassroomImageAsset | null;
}

export interface HomePlanetStoryboardProject {
  id: string;
  title: string;
  acts: HomePlanetStoryboardAct[];
  createdAt: number;
}

export interface HomePlanetGalleryItem {
  id: string;
  type: "commission" | "dialogue" | "storyboard";
  title: string;
  summary: string;
  sourceId: string;
  createdAt: number;
}

export interface HomePlanetArchiveRecord {
  id: string;
  title: string;
  tag: string;
  summary: string;
  evidenceLines: string[];
  locationId?: ChapterTwoLocationId;
  mistakeCount?: number;
  disorderLevel?: number;
  createdAt: number;
}

export interface HomePlanetRuleCard {
  id: string;
  title: string;
  body: string;
  source: string;
  createdAt: number;
}

export type ChapterTwoRewardKind =
  | "civilization-fragment"
  | "technology-point"
  | "crew-bond"
  | "home-resource"
  | "blackbox-rule-card"
  | "ship-log"
  | "home-archive-record";

export interface ChapterTwoLocationReward {
  id: string;
  kind: ChapterTwoRewardKind;
  label: string;
  detail: string;
}

export interface ChapterTwoLocationRewardClaim {
  locationId: ChapterTwoLocationId;
  locationName: string;
  rewards: ChapterTwoLocationReward[];
  createdAt: number;
}

export interface HomePlanetHubState {
  resources: HomePlanetResources;
  unlockedFeatures: HomePlanetFeatureId[];
  activeFeatures: HomePlanetFeatureId[];
  builtStructures: HomePlanetStructureId[];
  dialogueCards: HomePlanetDialogueCard[];
  storyboardProjects: HomePlanetStoryboardProject[];
  commissionWorks: HomePlanetCommissionWork[];
  galleryItems: HomePlanetGalleryItem[];
  archiveRecords: HomePlanetArchiveRecord[];
  ruleCards: HomePlanetRuleCard[];
}

export interface CrewBackstory {
  origin: string;
  reasonToJoin: string;
  hiddenQuestion: string;
  speakingStyle: string;
}

export type CrewBackstoryRevealKey = "origin" | "reason" | "question";

export interface CrewChatMessage {
  id: string;
  role: "player" | "crew" | "system";
  body: string;
  kind?: "message" | "bond" | "reveal";
}

export interface CrewMember {
  id: string;
  name: string;
  title: string;
  intro: string;
  abilityTag: string;
  formType: CrewFormType;
  role: CrewRole;
  temperament: CrewTemperament;
  talent: CrewTalent;
  styleTags: string[];
  specialFocus: string;
  customPrompt: string;
  notes: string;
  recruitSignal: string;
  imagePromptHint: string;
  signalKeywords: string[];
  signalSummary: string;
  suggestedFocuses: string[];
  visualSubject: string;
  visualGuardrails: string[];
  portraitSeed: number;
  bondStatus: string;
  trustLevel: number;
  trustLabel: string;
  dossierEntries: CrewDossierEntry[];
  portraitAsset: CrewPortraitAsset | null;
  portraitEchoes: CrewPortraitAsset[];
  backstory: CrewBackstory;
  revealedBackstoryKeys: CrewBackstoryRevealKey[];
  conversationLog: CrewChatMessage[];
}

export interface CrewDossierEntry {
  id: string;
  title: string;
  body: string;
  tag: string;
}

export interface RepairedSignal {
  title: string;
  summary: string;
  crewComment: string;
  coordinateLabel: string;
  sourceLabel: string;
  unlockedSector: string;
  nextLead: string;
  repairSummary: string;
  aiLine: string;
  restoredFeatures: string[];
}

export interface NavigationMemoryAnalysis {
  sourceText: string;
  extractedKeywords: string[];
  sectorGuess: string;
  routeTone: string;
  riskHint: string;
  summary: string;
}

export interface NavigationMemoryRestore {
  summary: string;
  unlockedFeature: string;
  coordinateLabel: string;
  restoredChart: string;
}

export interface MalfunctionMemoryAnalysis {
  sourceText: string;
  extractedKeywords: string[];
  inferredCause: MalfunctionSuspicion;
  clueSummary: string;
  crewAngle: string;
  riskHint: string;
}

export interface MalfunctionMemoryRestore {
  status: "stable" | "partial";
  summary: string;
  restoredLog: string[];
  unlockedFeature: string;
  setbackHint: string | null;
}

export interface CrewMemoryRestore {
  reply: string;
  summary: string;
  unlockedFeature: string;
  anchorTitle: string;
}

export interface SignalMissionTruth {
  malfunctionCause: MalfunctionSuspicion;
  bestNavigationTone: string;
}

export interface SignalMissionReview {
  zone: MemoryZoneId;
  phase: "analysis" | "restore";
  title: string;
  eyebrow: string;
  summary: string;
  detail: string;
  systemRead: string;
  worldChange: string;
  responseNote: string;
  causalNote: string;
  coreStateLabel: string;
  highlights: string[];
  tone: "info" | "success" | "warm";
}

export type VaultStage = "alert" | "planet" | "fault" | "restored";
export type VaultZoneId = "planet" | "fault";
export type PlanetMood = "安静" | "危险" | "神秘" | "遗迹活跃";
export type PlanetModelStatus = "input" | "analyzed" | "restored";
export type FaultRunStatus = "locked" | "ready" | "running" | "resolved";
export type FaultOutcomeGrade = "success" | "partial" | "fail";
export type FaultSeedType = "撞击小行星" | "外部信号干扰" | "核心过载" | "权限误操作" | "未知污染侵入";
export type FaultStageLabel = "事件触发" | "初步判断" | "异常升级" | "关键决策" | "结果结算";

export interface PlanetSignalSeed {
  id: string;
  title: string;
  silhouette: string;
  teaser: string;
  promptLook: string;
  promptEnvironment: string;
  promptTone: string;
}

export interface PlanetInputState {
  name: string;
  appearance: string;
  environment: string;
  mood: PlanetMood | null;
  notes: string;
}

export interface PlanetResourceProfile {
  water: number;
  mineral: number;
  energy: number;
  ecology: number;
  relicData: number;
}

export interface PlanetModelAnalysis {
  sourceText: string;
  extractedKeywords: string[];
  suggestedName: string;
  environmentTrait: string;
  tags: string[];
  resourceProfile: PlanetResourceProfile;
  dangerLevel: number;
  dangerLabel: string;
  summary: string;
}

export interface PlanetProductionProfile {
  water: number;
  mineral: number;
  energy: number;
  ecology: number;
  relicData: number;
}

export interface PlanetModel {
  id: string;
  name: string;
  coordinateLabel: string;
  summary: string;
  environmentTrait: string;
  landmarkFeature: string;
  mood: PlanetMood;
  tags: string[];
  dangerLevel: number;
  dangerLabel: string;
  resourceProfile: PlanetResourceProfile;
  production: PlanetProductionProfile;
  explorationHooks: string[];
  recordNote: string;
  imageAsset?: ClassroomImageAsset | null;
}

export interface PlanetModelState {
  status: PlanetModelStatus;
  seed: PlanetSignalSeed;
  input: PlanetInputState;
  analysis: PlanetModelAnalysis | null;
  confirmedModel: PlanetModel | null;
  unlockSummary: string[];
}

export interface FaultSeed {
  id: string;
  type: FaultSeedType;
  title: string;
  summary: string;
  threat: string;
  anomaly: string;
  hiddenTruth: string;
}

export interface FaultChoiceEffect {
  stability: number;
  evidence: number;
  time: number;
}

export interface FaultRunChoice {
  id: string;
  label: string;
  summary: string;
  effect: FaultChoiceEffect;
  principle: string;
  recommendedRoles: CrewRole[];
  requiresEvidence?: number;
  rescueWhenLowStability?: boolean;
}

export interface FaultRunNode {
  id: string;
  stage: FaultStageLabel;
  title: string;
  body: string;
  guidance: string;
  choices: FaultRunChoice[];
}

export interface FaultRunHistoryEntry {
  nodeId: string;
  nodeTitle: string;
  choiceId: string;
  choiceLabel: string;
  summary: string;
  principle: string;
  delta: FaultChoiceEffect;
  crewSupport: string | null;
  seedInteraction: string | null;
  after: {
    stability: number;
    evidence: number;
    time: number;
  };
}

export interface FaultOutcome {
  grade: FaultOutcomeGrade;
  title: string;
  summary: string;
  unlockedFeature: string;
  truthFragment: string;
  systemNote: string;
  recommendedNextStep: string;
  learnedRule: string;
  recoveryPercent: number;
  broughtBack: string[];
  crewContribution: string;
  hallucinationNote: string;
}

export interface FaultCaseRecord {
  id: string;
  seedType: FaultSeedType;
  title: string;
  grade: FaultOutcomeGrade;
  summary: string;
  truthFragment: string;
  learnedRule: string;
  timelineNotes: string[];
}

export interface FaultRunState {
  status: FaultRunStatus;
  attemptCount: number;
  activeSeed: FaultSeed | null;
  currentNodeIndex: number;
  nodes: FaultRunNode[];
  stability: number;
  evidence: number;
  timeWindow: number;
  history: FaultRunHistoryEntry[];
  partialFragments: string[];
  result: FaultOutcome | null;
}

export interface MemoryVaultUnlockState {
  navigationRestored: boolean;
  starMapRestored: boolean;
  resourceProductionOnline: boolean;
  explorationBeaconOnline: boolean;
  faultConsoleOnline: boolean;
  historicalArchiveOnline: boolean;
  caseMatchingOnline: boolean;
}

export interface MemoryVaultSummary {
  title: string;
  body: string;
  unlockedFeatures: string[];
}

export interface ShipTask {
  id: ShipTaskId;
  title: string;
  summary: string;
  recommended: string;
  risk: string;
  recommendedRole: CrewRole;
  recommendedTalent: CrewTalent;
  unlocked: boolean;
  completionCount: number;
}

export interface TaskResult {
  taskId: ShipTaskId;
  title: string;
  assignedCrewId: string;
  assignedCrewName: string;
  outcomeTitle: string;
  outcomeSummary: string;
  logLine: string;
  shipChange: string;
  discoveredHint: string;
  resultTone: "matched" | "creative" | "risky";
  trustGain: number;
  trustNote: string;
  dossierEntry: CrewDossierEntry;
}

export interface TaskDeskState {
  tasks: ShipTask[];
  selectedTaskId: ShipTaskId | null;
  assignedCrewId: string | null;
  latestResult: TaskResult | null;
}

export interface ChapterTwoEcho {
  title: string;
  lines: string[];
  linkedCrewId: string | null;
  linkedClue: string;
}

export interface ChapterTwoSignalAnalysis {
  sourceText: string;
  extractedKeywords: string[];
  inferredFocus: ChapterTwoFocus;
  pathSummary: string;
  crewFit: string;
  riskHint: string;
}

export interface ChapterTwoAssignmentAnalysis extends ChapterTwoSignalAnalysis {
  inferredLeadDuty: ChapterTwoDuty;
  inferredSupportDuty: ChapterTwoDuty;
  collaborationSummary: string;
}

export interface ChapterTwoTruth {
  trueFocus: ChapterTwoFocus;
  decoyFocus: ChapterTwoFocus;
  signalKind: "求救残响" | "诱饵试探" | "坐标回声" | "记忆残片";
  recommendedLeadCrewId: string | null;
  recommendedSupportCrewId: string | null;
  recommendedLeadDuty: ChapterTwoDuty;
  recommendedSupportDuty: ChapterTwoDuty;
  preferredRefinement: ChapterTwoRefinement;
  preferredSupportMode: "维持原分工" | "让支援船员介入";
  recommendedFinalChoice: ChapterTwoFinalChoice;
  truthSummary: string;
}

export interface ChapterTwoSetback {
  title: string;
  summary: string;
  learnedClue: string;
  reasonHint: string;
  crewHint: string;
  strategyHint: string;
  statusNote: string;
}

export interface ChapterTwoRoundOneResult {
  progress: "strong" | "shaky" | "misread";
  summary: string;
  partialResponse: string[];
  newQuestion: string;
  keySignals: string[];
  unlockedClue: string;
}

export interface ChapterTwoRoundTwoResult {
  outcomeType: "breakthrough" | "partial" | "soft-fail";
  summary: string;
  resolvedResponse: string[];
  revealedLink: string;
  recommendation: string;
  keySignals: string[];
  setback: ChapterTwoSetback | null;
}

export interface ChapterTwoOutcome {
  title: string;
  summary: string;
  worldChange: string;
  chapterThreeHook: string;
  scannedZone: string;
  logSummary: string;
  leadDossierNote: string;
  supportDossierNote: string;
  planetName?: string;
  blackBoxTitle?: string;
  technologyPointsAwarded?: number;
  aiUpgrade?: string;
  civilizationRecord?: string;
  blackBoxKnowledge?: string[];
  defeatedEcho?: boolean;
  fragments?: string[];
  unlockedModule?: string;
  titleEarned?: string;
  finalLetter?: string[];
  completedAt?: number;
}

export interface ChapterTwoState {
  currentStep: ChapterTwoStep;
  sceneState: ChapterTwoSceneState;
  focusedPlanetId: ChapterTwoPlanetId | null;
  focusedLocationId: ChapterTwoLocationId | null;
  exploredLocationIds: ChapterTwoLocationId[];
  disorderLevel: number;
  mistakeCount: number;
  pollutedRecords: string[];
  baseEffectNotes: string[];
  baseScanHints: string[];
  locationRewardClaims: ChapterTwoLocationRewardClaim[];
  blackBoxUnlocked: boolean;
  echo: ChapterTwoEcho | null;
  truth: ChapterTwoTruth | null;
  attemptCount: number;
  responsePrompt: string;
  responseAnalysis: ChapterTwoSignalAnalysis | null;
  leadCrewId: string | null;
  supportCrewId: string | null;
  leadDuty: ChapterTwoDuty | null;
  supportDuty: ChapterTwoDuty | null;
  assignmentPrompt: string;
  assignmentAnalysis: ChapterTwoAssignmentAnalysis | null;
  roundOneFocus: ChapterTwoFocus | null;
  roundOnePrompt: string;
  roundOneAnalysis: ChapterTwoSignalAnalysis | null;
  roundOneResult: ChapterTwoRoundOneResult | null;
  roundTwoRefinement: ChapterTwoRefinement | null;
  roundTwoPrompt: string;
  roundTwoSupportMode: "维持原分工" | "让支援船员介入" | null;
  roundTwoAnalysis: ChapterTwoSignalAnalysis | null;
  roundTwoResult: ChapterTwoRoundTwoResult | null;
  lastSetback: ChapterTwoSetback | null;
  finalChoice: ChapterTwoFinalChoice | null;
  outcome: ChapterTwoOutcome | null;
}

export interface ChapterTwoLocationCompletionPayload {
  finalDisorderLevel?: number;
  mistakeCount?: number;
  pollutedRecords?: string[];
  crewAbilityKind?: ChapterTwoCrewAbilityKind;
  crewIntervention?: string;
  evidenceLines?: string[];
}

export interface ShipLogEntry {
  id: string;
  title: string;
  body: string;
  tag: string;
  rewardSummary?: string;
  rewards?: string[];
}

export interface SignalMissionState {
  currentStage: VaultStage;
  restoredZones: VaultZoneId[];
  review: SignalMissionReview | null;
  summary: MemoryVaultSummary | null;
  unlocks: MemoryVaultUnlockState;
  planet: PlanetModelState;
  faultRun: FaultRunState;
  repairedSignal: RepairedSignal | null;
}

export interface GameState {
  currentScene: Scene;
  recruitForm: RecruitForm;
  recruitAnalysis: RecruitSignalAnalysis | null;
  crewVariant: number;
  generatedCrew: CrewMember | null;
  crewRoster: CrewMember[];
  activeCrewId: string | null;
  crewOnboard: boolean;
  systemsRestored: boolean;
  hubSignalSeen: boolean;
  firstStarLit: boolean;
  chapterComplete: boolean;
  chapterTwoUnlocked: boolean;
  chapterTwoRouteLocked: boolean;
  chapterTwoComplete: boolean;
  chapterThreeHintUnlocked: boolean;
  scannedRegionLabel: string | null;
  newRegionAlert: boolean;
  technologyPoints: number;
  aiCapabilityLevel: number;
  aiCapabilityUnlocks: string[];
  planetCatalog: PlanetModel[];
  faultCaseRecords: FaultCaseRecord[];
  signalMission: SignalMissionState;
  taskDesk: TaskDeskState;
  chapterTwo: ChapterTwoState;
  homePlanetHub: HomePlanetHubState;
  shipLogs: ShipLogEntry[];
  shipStatusNote: string | null;
  classroomArtifacts: ClassroomArtifact[];
}
