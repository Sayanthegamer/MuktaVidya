"use client";
import { useState, useEffect, useCallback } from "react";
import AppHeader from "./AppHeader";
import UploadZone from "./UploadZone";
import SolutionPanel from "./SolutionPanel";
import HistorySidebar, { HistoryItem } from "./HistorySidebar";
import ErrorBanner from "./ErrorBanner";
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

  // Load initial state
  useEffect(() => {
    // Load Language
    const savedLang = localStorage.getItem("muktavidya_language");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedLang) setLanguage(savedLang);

    // Load History
    try {
      const savedHistory = localStorage.getItem("muktavidya_history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          const validHistory = parsed.filter(item => item && item.solution && item.timestamp);
          setHistory(validHistory);
        }
      }
    } catch (e) {
      console.error("Failed to parse history", e);
    }
  }, []);

  // Save language changes
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("muktavidya_language", lang);
  };

  const handleSelectHistory = (item: HistoryItem) => {
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
      localStorage.setItem("muktavidya_history", JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const handleCapture = async (base64Data: string) => {
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
      });

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;
        setSolution(streamedText);
      }

      // Finish streaming
      const finalSolution = preprocessMarkdown(streamedText);
      setSolution(finalSolution);
      setIsStreaming(false);

      // Save to history
      saveToHistory(finalSolution, base64Data, language);

    } catch (err: unknown) {
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
