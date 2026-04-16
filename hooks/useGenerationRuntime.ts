"use client";

import { useState } from "react";

import type { AIOperationId, AIOperationState } from "@/types/ai";

function createOperationState(): AIOperationState {
  return {
    status: "idle",
    error: null,
    canRetry: false,
    usedFallback: false,
    updatedAt: null
  };
}

const operationIds: AIOperationId[] = [
  "crew-analyze",
  "crew-generate",
  "crew-chat",
  "crew-image",
  "signal-analyze",
  "signal-repair",
  "task-run",
  "chapter-one-complete",
  "chapter-two-response",
  "chapter-two-assignment",
  "chapter-two-round-one",
  "chapter-two-round-two",
  "chapter-two-complete"
];

function createInitialOperationMap() {
  return Object.fromEntries(operationIds.map((id) => [id, createOperationState()])) as Record<AIOperationId, AIOperationState>;
}

export function useGenerationRuntime() {
  const [operations, setOperations] = useState<Record<AIOperationId, AIOperationState>>(createInitialOperationMap);

  const setOperation = (id: AIOperationId, patch: Partial<AIOperationState>) => {
    setOperations((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch,
        updatedAt: Date.now()
      }
    }));
  };

  const runOperation = async <T>(config: {
    id: AIOperationId;
    handler: () => Promise<T> | T;
    fallback?: (error: unknown) => Promise<T> | T;
  }) => {
    setOperation(config.id, {
      status: "loading",
      error: null,
      canRetry: false,
      usedFallback: false
    });

    try {
      const result = await config.handler();
      setOperation(config.id, {
        status: "success",
        error: null,
        canRetry: false,
        usedFallback: false
      });
      return result;
    } catch (error) {
      if (config.fallback) {
        const result = await config.fallback(error);
        setOperation(config.id, {
          status: "success",
          error: error instanceof Error ? error.message : "系统短暂失去回应，已切回本地回路。",
          canRetry: true,
          usedFallback: true
        });
        return result;
      }

      setOperation(config.id, {
        status: "error",
        error: error instanceof Error ? error.message : "系统短暂失去回应。",
        canRetry: true,
        usedFallback: false
      });
      throw error;
    }
  };

  const resetOperation = (id: AIOperationId) => {
    setOperations((current) => ({
      ...current,
      [id]: createOperationState()
    }));
  };

  return {
    operations,
    runOperation,
    resetOperation
  };
}
