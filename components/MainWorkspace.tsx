"use client";
import AppHeader from "./AppHeader";
import UploadZone from "./UploadZone";
import SolutionPanel from "./SolutionPanel";
import HistorySidebar from "./HistorySidebar";
import ErrorBanner from "./ErrorBanner";
import FloatingDock from "./FloatingDock";
import { useMainWorkspace } from "../hooks/useMainWorkspace";

export default function MainWorkspace() {
  const {
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
    abortCurrentRequest
  } = useMainWorkspace();

  const hasStartedChat = messages.length > 0;

  return (
    <>
      <AppHeader
        onHistoryClick={() => setIsHistoryOpen(true)}
        isHistoryOpen={isHistoryOpen}
        language={language}
        setLanguage={handleLanguageChange}
        mode={mode}
        setMode={handleModeChange}
      />

      <main className={`flex-1 relative overflow-hidden transition-all duration-300 ease-out ${hasStartedChat ? 'flex flex-col' : 'grid grid-cols-1 md:grid-cols-[40fr_60fr]'}`}>
        {/* Ambient Glow Mesh */}
        <div
          className="ambient-mesh absolute -inset-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 10%, var(--accent-border) 0%, transparent 60%), radial-gradient(circle at 10% 50%, var(--surface-3) 0%, transparent 50%)',
            filter: 'blur(40px)',
            opacity: 0.6,
            willChange: 'transform'
          }}
          aria-hidden="true"
        />

        {/*
          If chat has started, hide the UploadZone entirely (display: none).
          Otherwise, show it in the left column.
        */}
        {!hasStartedChat && (
          <section className="md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-[var(--border-subtle)] bg-transparent">
            <UploadZone
              onImageSelect={handleCapture}
              isProcessing={isProcessing}
              imagePreview={imagePreview}
              onRescan={handleRescan}
            />
          </section>
        )}

        {/* Right Panel - Solution (or Full Width when chat started) */}
        <section className={`overflow-y-auto bg-transparent flex flex-col relative ${hasStartedChat ? 'flex-1 h-full max-w-4xl mx-auto w-full' : 'min-h-[60vh] md:min-h-0'}`}>
          {error && (
            <div className={`w-full ${hasStartedChat ? 'px-4 mt-4' : ''}`}>
              <ErrorBanner title={error.title} description={error.description} />
            </div>
          )}

          <SolutionPanel
            isLoading={isProcessing && messages.length === 0}
            isStreaming={isStreaming}
            solution={solution}
            messages={messages}
            hasStartedChat={hasStartedChat}
            onRescan={handleRescan}
          />

          {hasStartedChat && (
            <FloatingDock
              onFollowUp={handleFollowUp}
              isStreaming={isStreaming}
              onStop={abortCurrentRequest}
            />
          )}
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
