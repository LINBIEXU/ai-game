import { createEmptyPlanetInput, createPlanetSignalSeed } from "@/lib/memory-vault/planet-model-system";
import { createInitialFaultRun } from "@/lib/memory-vault/fault-run-system";
import { createInitialVaultUnlocks } from "@/lib/memory-vault/unlock-system";
import type { SignalMissionState } from "@/types/game";

export function createInitialMemoryVaultState(seedHint = 0): SignalMissionState {
  return {
    currentStage: "alert",
    restoredZones: [],
    review: null,
    summary: null,
    unlocks: createInitialVaultUnlocks(),
    planet: {
      status: "input",
      seed: createPlanetSignalSeed(seedHint),
      input: createEmptyPlanetInput(),
      analysis: null,
      confirmedModel: null,
      unlockSummary: []
    },
    faultRun: createInitialFaultRun(),
    repairedSignal: null
  };
}
