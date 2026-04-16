import type { MemoryVaultUnlockState } from "@/types/game";

export function createInitialVaultUnlocks(): MemoryVaultUnlockState {
  return {
    navigationRestored: false,
    starMapRestored: false,
    resourceProductionOnline: false,
    explorationBeaconOnline: false,
    faultConsoleOnline: false,
    historicalArchiveOnline: false,
    caseMatchingOnline: false
  };
}

export function unlockAfterPlanet(current: MemoryVaultUnlockState): MemoryVaultUnlockState {
  return {
    ...current,
    navigationRestored: true,
    starMapRestored: true,
    resourceProductionOnline: true,
    explorationBeaconOnline: true
  };
}

export function unlockAfterFault(current: MemoryVaultUnlockState): MemoryVaultUnlockState {
  return {
    ...current,
    faultConsoleOnline: true,
    historicalArchiveOnline: true,
    caseMatchingOnline: true
  };
}
