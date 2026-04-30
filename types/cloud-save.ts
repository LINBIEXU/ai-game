import type { CrewMember, GameState, PlanetModel, RepairedSignal, ShipLogEntry } from "@/types/game";

export type CloudSyncStage = "disabled" | "connecting" | "ready" | "error";
export type CloudSaveStatus = "idle" | "disabled" | "authenticating" | "restoring" | "saving" | "saved" | "error";

export interface CloudUserRecord {
  _id: string;
  authUid: string;
  loginType: string;
  email: string | null;
  isAnonymous: boolean;
  upgradedFromAuthUids: string[];
  upgradedToAuthUid?: string | null;
  boundAt?: number | null;
  createdAt: number;
  lastLoginAt: number;
}

export interface CloudWorkRecord {
  _id: string;
  userId: string;
  type: "planet-model" | "memory-vault-report" | "chapter-two-outcome" | "crew-dossier" | "fault-case";
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface CloudCrewRecord {
  _id: string;
  userId: string;
  name: string;
  profile: CrewMember;
  echoes: CrewMember["portraitEchoes"];
  bond: {
    trustLevel: number;
    trustLabel: string;
    bondStatus: string;
  };
  metadata: {
    isOnboard: boolean;
    isGenerated: boolean;
    isActive: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface CloudSaveSummary {
  activeCrewId: string | null;
  activeCrewName: string | null;
  activeScene: GameState["currentScene"];
  activeChapter: "chapter-one" | "chapter-two";
  activePlanetId: string | null;
  activePlanetName: string | null;
  activePortraitRevision: number | null;
  faultRunSeedId: string | null;
  faultRunStatus: GameState["signalMission"]["faultRun"]["status"];
  checkpointNodeId: string | null;
  checkpointStage: string | null;
  latestWorkIds: string[];
  latestLogIds: string[];
  shipStatusNote: string | null;
  lastRestorePoint: string;
  lastSavedAt: number;
}

export interface CloudProgressRecord {
  _id: string;
  userId: string;
  chapter: {
    currentScene: GameState["currentScene"];
    chapterComplete: boolean;
    chapterTwoUnlocked: boolean;
    chapterTwoComplete: boolean;
  };
  memoryVault: GameState["signalMission"];
  planetUnlocked: boolean;
  faultRunState: GameState["signalMission"]["faultRun"];
  progression: {
    activeCrewId: string | null;
    crewVariant: number;
    crewOnboard: boolean;
    systemsRestored: boolean;
    hubSignalSeen: boolean;
    firstStarLit: boolean;
    chapterTwoRouteLocked: boolean;
    chapterThreeHintUnlocked: boolean;
    scannedRegionLabel: string | null;
    newRegionAlert: boolean;
  };
  generatedCrewId: string | null;
  recruitState: {
    form: GameState["recruitForm"];
    analysis: GameState["recruitAnalysis"];
  };
  planetCatalog: PlanetModel[];
  faultCaseRecords: GameState["faultCaseRecords"];
  taskDesk: GameState["taskDesk"];
  chapterTwoState: GameState["chapterTwo"];
  shipLogs: ShipLogEntry[];
  shipStatusNote: string | null;
  summary: CloudSaveSummary;
  updatedAt: number;
}

export interface CloudSnapshot {
  user: CloudUserRecord;
  crews: CloudCrewRecord[];
  works: CloudWorkRecord[];
  progress: CloudProgressRecord | null;
}

export interface CloudSession {
  authUid: string;
  loginType: string;
  accessToken: string;
  email: string | null;
  isAnonymous: boolean;
}

export interface CloudSessionState {
  stage: CloudSyncStage;
  session: CloudSession | null;
  error: string | null;
}

export interface CloudSavePayload {
  authUid: string;
  loginType: string;
  email?: string | null;
  isAnonymous?: boolean;
  state: GameState;
}

export interface CloudSaveResponse {
  ok: boolean;
  cloudDisabled?: boolean;
  snapshot?: CloudSnapshot;
  saveMeta?: {
    updatedAt: number;
    crewCount: number;
    workCount: number;
    summary: CloudSaveSummary;
  };
  error?: string;
}

export interface CloudAccountUpgradePayload {
  previousAuthUid: string;
  nextAuthUid: string;
  loginType: string;
  email: string;
}

export interface CloudAccountUpgradeResponse {
  ok: boolean;
  user?: CloudUserRecord;
  error?: string;
}

export interface RestoreEnvelope {
  state: GameState;
  restoredAt: number;
  works: CloudWorkRecord[];
}

export interface WorkBuildContext {
  repairedSignal: RepairedSignal | null;
  chapterTwoOutcome: GameState["chapterTwo"]["outcome"];
}
