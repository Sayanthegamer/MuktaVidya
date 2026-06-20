import { useState, useEffect, useCallback } from "react";
import { get, set } from "idb-keyval";
import { HistoryItem } from "../types/history";

const MARKDOWN_STRIP_REGEX = /[#*`_]/g;

export function useHistory() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Load History
    let isCancelled = false;
    get("muktavidya_history").then(parsed => {
      if (isCancelled) return;
      if (Array.isArray(parsed)) {
        setHistory(currentHistory => {
          const existingIds = currentHistory.reduce((acc, item) => {
            if (item.id !== undefined) acc.add(item.id);
            return acc;
          }, new Set<string>());

          const seenIds = new Set<string>(existingIds);
          const newHydratedItems: HistoryItem[] = [];

          for (const item of parsed as HistoryItem[]) {
            if (
              item &&
              item.id &&
              !seenIds.has(item.id) &&
              item.solution &&
              item.timestamp &&
              item.imageBase64 &&
              item.language &&
              item.imageBase64.trim() !== "" &&
              item.language.trim() !== ""
            ) {
              seenIds.add(item.id);
              newHydratedItems.push(item);
            }
          }

          return [...currentHistory, ...newHydratedItems].slice(0, 50);
        });
      }
      setIsHydrated(true);
    }).catch(e => {
      if (isCancelled) return;
      console.error("Failed to load history from IndexedDB", e);
      setIsHydrated(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Persist history to IndexedDB when it changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    set("muktavidya_history", history).catch(e =>
      console.error("Failed to save history to IndexedDB", e)
    );
  }, [history, isHydrated]);

  const saveToHistory = useCallback((finalSolution: string, imgBase64: string, lang: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      imageBase64: imgBase64,
      solution: finalSolution,
      timestamp: new Date().toISOString(),
      language: lang,
      preview: finalSolution.replace(MARKDOWN_STRIP_REGEX, '').substring(0, 100).trim(),
    };

    setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  return {
    isHistoryOpen,
    setIsHistoryOpen,
    history,
    saveToHistory
  };
}
