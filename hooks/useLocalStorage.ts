"use client";

import { useEffect, useMemo, useState } from "react";

function resolveInitialValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function getLocalStorageUpdatedAtKey(key: string) {
  return `${key}:updatedAt`;
}

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const stableInitialValue = useMemo(() => resolveInitialValue(initialValue), [initialValue]);
  const [value, setValue] = useState<T>(stableInitialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);

      if (raw) {
        setValue(JSON.parse(raw) as T);
      }
    } catch (error) {
      console.warn("Failed to read local storage", error);
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem(getLocalStorageUpdatedAtKey(key), String(Date.now()));
    } catch (error) {
      console.warn("Failed to write local storage", error);
    }
  }, [isHydrated, key, value]);

  const remove = () => {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(getLocalStorageUpdatedAtKey(key));
    setValue(stableInitialValue);
  };

  return {
    value,
    setValue,
    isHydrated,
    remove
  };
}
