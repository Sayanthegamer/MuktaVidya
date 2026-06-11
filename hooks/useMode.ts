import React, { useState } from "react";

export type SolveMode = "NORMAL" | "FASTEST";

export function useMode(defaultMode: SolveMode = "NORMAL") {
  const [mode, setMode] = useState<SolveMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedMode = localStorage.getItem("muktavidya_mode");
        if (savedMode === "NORMAL" || savedMode === "FASTEST") {
          return savedMode as SolveMode;
        }
      } catch (e) {
        console.error("Failed to read mode from localStorage", e);
        return defaultMode;
      }
    }
    return defaultMode;
  });

  // Memoized to maintain referential equality, allowing AppHeader to safely use React.memo
  // and prevent unnecessary re-renders during high-frequency streaming events.
  const handleModeChange = React.useCallback((newMode: SolveMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("muktavidya_mode", newMode);
      } catch (e) {
        console.error("Failed to save mode to localStorage", e);
      }
    }
  }, []);

  return {
    mode,
    handleModeChange,
  };
}
