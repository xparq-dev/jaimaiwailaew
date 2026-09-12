"use client";

import { useSyncExternalStore } from "react";

import { useCalculatorStore } from "@/calculator/store";

export function useCalculatorHydrated() {
  return useSyncExternalStore(
    (callback) => useCalculatorStore.persist.onFinishHydration(callback),
    () => useCalculatorStore.persist.hasHydrated(),
    () => false,
  );
}

export function CalculatorHydrationGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hydrated = useCalculatorHydrated();

  if (!hydrated) {
    return fallback;
  }

  return children;
}
