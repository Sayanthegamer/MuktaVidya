import { useLanguage } from "./useLanguage";
import { useHistory } from "./useHistory";
import { useImageSolver } from "./useImageSolver";
import { HistoryItem } from "../types/history";

export function useMainWorkspace() {
  const { language, handleLanguageChange } = useLanguage("EN");
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
    language
  });

  const handleSelectHistory = (item: HistoryItem) => {
    resetState();
    setInitialState(item.imageBase64, item.solution);
  };

  return {
    language,
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
    handleSelectHistory,
    handleCapture,
    handleFollowUp,
    handleRescan,
    abortCurrentRequest,
    resetState
  };
}
