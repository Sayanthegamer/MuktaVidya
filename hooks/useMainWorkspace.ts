import { useLanguage } from "./useLanguage";
import { useHistory } from "./useHistory";
import { useImageSolver } from "./useImageSolver";
import { HistoryItem } from "../types/history";

export function useMainWorkspace() {
  const { language, handleLanguageChange } = useLanguage("EN");
  const { isHistoryOpen, setIsHistoryOpen, history, saveToHistory } = useHistory();

  const {
    imagePreview,
    setImagePreview,
    isProcessing,
    solution,
    setSolution,
    isStreaming,
    error,
    handleCapture,
    handleRescan,
    resetState
  } = useImageSolver({
    onSolveComplete: saveToHistory,
    language
  });

  const handleSelectHistory = (item: HistoryItem) => {
    resetState();
    setImagePreview(item.imageBase64);
    setSolution(item.solution);
  };

  return {
    language,
    isHistoryOpen,
    setIsHistoryOpen,
    history,
    imagePreview,
    isProcessing,
    solution,
    isStreaming,
    error,
    handleLanguageChange,
    handleSelectHistory,
    handleCapture,
    handleRescan
  };
}
