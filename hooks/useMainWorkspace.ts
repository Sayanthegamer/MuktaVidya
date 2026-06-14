import { useLanguage } from "./useLanguage";
import { useMode } from "./useMode";
import { useHistory } from "./useHistory";
import { useImageSolver } from "./useImageSolver";
import { HistoryItem } from "../types/history";
import { useCallback } from "react";

export function useMainWorkspace() {
  const { language, handleLanguageChange } = useLanguage("EN");
  const { mode, handleModeChange } = useMode("NORMAL");
  const { isHistoryOpen, setIsHistoryOpen, history, saveToHistory } = useHistory();

  const {
    imagePreview,
    messages,
    setInitialState,
    isProcessing,
    solution,
    isStreaming,
    error,
    handleCapture,
    handleFollowUp,
    handleRescan,
    abortCurrentRequest,
    resetState
  } = useImageSolver({
    onSolveComplete: saveToHistory,
    language,
    mode
  });

  const handleSelectHistory = useCallback((item: HistoryItem) => {
    resetState();
    setInitialState(item.imageBase64, item.solution);
  }, [resetState, setInitialState]);

  return {
    language,
    mode,
    isHistoryOpen,
    setIsHistoryOpen,
    history,
    imagePreview,
    messages,
    isProcessing,
    solution,
    isStreaming,
    error,
    handleLanguageChange,
    handleModeChange,
    handleSelectHistory,
    handleCapture,
    handleFollowUp,
    handleRescan,
    abortCurrentRequest,
    resetState
  };
}
