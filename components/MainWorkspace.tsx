"use client";
import AppHeader from "./AppHeader";
import UploadZone from "./UploadZone";
import SolutionPanel from "./SolutionPanel";
import HistorySidebar from "./HistorySidebar";
import ErrorBanner from "./ErrorBanner";
import { useMainWorkspace } from "../hooks/useMainWorkspace";

export default function MainWorkspace() {
  const {
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
  } = useMainWorkspace();

  return (
    <>
      <AppHeader
        onHistoryClick={() => setIsHistoryOpen(true)}
        isHistoryOpen={isHistoryOpen}
        language={language}
        setLanguage={handleLanguageChange}
      />

      <main className="flex-1 grid grid-cols-1 md:grid-cols-[40fr_60fr] overflow-hidden">
        {/* Left Panel - Upload Zone */}
        <section className="md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--surface-0)] z-10">
          <UploadZone
            onImageSelect={handleCapture}
            isProcessing={isProcessing}
            imagePreview={imagePreview}
            onRescan={handleRescan}
          />
        </section>

        {/* Right Panel - Solution */}
        <section className="overflow-y-auto min-h-[60vh] md:min-h-0 bg-[var(--surface-0)] flex flex-col">
          {error && <ErrorBanner title={error.title} description={error.description} />}
          <SolutionPanel
            isLoading={isProcessing && solution.length === 0}
            isStreaming={isStreaming}
            solution={solution}
          />
        </section>
      </main>

      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleSelectHistory}
      />
    </>
  );
}
