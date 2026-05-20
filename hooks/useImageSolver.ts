import { useState, useRef, useEffect } from "react";
import { preprocessMarkdown } from "@/lib/preprocessMarkdown";

interface UseImageSolverOptions {
  onSolveComplete?: (solution: string, imageBase64: string, language: string) => void;
  language: string;
}

export function useImageSolver({ onSolveComplete, language }: UseImageSolverOptions) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [solution, setSolution] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<{ title: string; description: string } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const abortCurrentRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCapture = async (base64Data: string) => {
    // Cancel any in-flight request
    abortCurrentRequest();

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

        // Trigger callback to save to history if provided
        if (onSolveComplete) {
          onSolveComplete(finalSolution, base64Data, language);
        }
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
    abortCurrentRequest();
    setImagePreview(null);
    setSolution("");
    setError(null);
    setIsProcessing(false);
    setIsStreaming(false);
  };

  const resetState = () => {
    abortCurrentRequest();
    setImagePreview(null);
    setSolution("");
    setError(null);
    setIsProcessing(false);
    setIsStreaming(false);
  };

  return {
    imagePreview,
    setImagePreview,
    isProcessing,
    setIsProcessing,
    solution,
    setSolution,
    isStreaming,
    setIsStreaming,
    error,
    setError,
    handleCapture,
    handleRescan,
    abortCurrentRequest,
    resetState
  };
}
