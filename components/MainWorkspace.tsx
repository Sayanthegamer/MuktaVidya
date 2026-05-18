"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import AppHeader from "./AppHeader";
import UploadZone from "./UploadZone";
import SolutionPanel from "./SolutionPanel";
import HistorySidebar, { HistoryItem } from "./HistorySidebar";
import ErrorBanner from "./ErrorBanner";
import { get, set } from "idb-keyval";
import { preprocessMarkdown } from "@/lib/preprocessMarkdown";

export default function MainWorkspace() {
  const [language, setLanguage] = useState("EN");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [solution, setSolution] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<{ title: string; description: string } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial state
  useEffect(() => {
    // Load Language
    const savedLang = localStorage.getItem("muktavidya_language");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedLang) setLanguage(savedLang);

    // Load History
    get("muktavidya_history").then(parsed => {
      if (Array.isArray(parsed)) {
        const validHistory = parsed.filter(item => item && item.solution && item.timestamp);
        setHistory(validHistory);
      }
    }).catch(e => {
      console.error("Failed to load history from IndexedDB", e);
    });

    // Cleanup: abort any in-flight requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save language changes
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("muktavidya_language", lang);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setImagePreview(item.imageBase64);
    setSolution(item.solution);
    setIsProcessing(false);
    setIsStreaming(false);
    setError(null);
  };

  const saveToHistory = useCallback((finalSolution: string, imgBase64: string, lang: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      imageBase64: imgBase64,
      solution: finalSolution,
      timestamp: new Date().toISOString(),
      language: lang,
      preview: finalSolution.replace(/[#*`_]/g, '').substring(0, 100).trim(),
    };

    setHistory(prev => {
      const newHistory = [newItem, ...prev].slice(0, 50); // Keep last 50
      set("muktavidya_history", newHistory).catch(e => console.error("Failed to save history to IndexedDB", e));
      return newHistory;
    });
  }, []);

  const handleCapture = async (base64Data: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setImagePreview(base64Data);
    setSolution("");
    setError(null);
    setIsProcessing(true);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data, language }),
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;

      if (!response.ok) {
        if (response.status === 429) {
          setError({
            title: "Request limit reached",
            description: "Our free tier allows 5 scans per minute. Please wait 60 seconds."
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError({
            title: "Analysis failed",
            description: errorData.error || `Server error (${response.status})`
          });
        }
        setIsProcessing(false);
        setIsStreaming(false);
        setImagePreview(null); // Reset image on failure to allow retry
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No reader stream");

      let streamedText = "";

      setIsProcessing(false); // Done analyzing image, now streaming text

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (abortController.signal.aborted) {
            await reader.cancel();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          streamedText += chunk;
          setSolution(streamedText);
        }

        // Flush any remaining bytes from the decoder
        const finalChunk = decoder.decode();
        if (finalChunk) {
          streamedText += finalChunk;
        }

        if (abortController.signal.aborted) return;

        // Finish streaming
        const finalSolution = preprocessMarkdown(streamedText);
        setSolution(finalSolution);
        setIsStreaming(false);

        if (abortController.signal.aborted) return;

        // Save to history
        saveToHistory(finalSolution, base64Data, language);
      } finally {
        reader.releaseLock();
      }

    } catch (err: unknown) {
      // Don't show error if the request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      if (abortController.signal.aborted) return;

      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred while analyzing the image.";
      console.error("Solve error", err);
      setError({
        title: "Analysis failed",
        description: errorMessage
      });
      setIsProcessing(false);
      setIsStreaming(false);
      setImagePreview(null);
    }
  };

  const handleRescan = () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setImagePreview(null);
    setSolution("");
    setError(null);
    setIsProcessing(false);
    setIsStreaming(false);
  };

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
