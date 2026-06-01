import { useState, useRef, useEffect } from "react";
import { preprocessMarkdown } from "@/lib/preprocessMarkdown";
import { ChatMessage } from "@/app/api/solve/route";

interface UseImageSolverOptions {
  onSolveComplete?: (solution: string, imageBase64: string, language: string) => void;
  language: string;
}

export function useImageSolver({ onSolveComplete, language }: UseImageSolverOptions) {
  // Legacy states for compatibility and UI components that expect them
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [solution, setSolution] = useState("");

  // New chat history state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
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

  const processRequest = async (currentMessages: ChatMessage[], isInitialCapture: boolean = false) => {
    abortCurrentRequest();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setError(null);
    setIsProcessing(true);
    setIsStreaming(true);

    // Add a placeholder message for the model's response
    setMessages([...currentMessages, { role: 'model', text: '' }]);
    if (isInitialCapture) setSolution("");

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages, language }),
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
        if (isInitialCapture) setImagePreview(null);
        // Remove the empty model message
        setMessages(currentMessages);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No reader stream");

      let streamedText = "";
      setIsProcessing(false);

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

          if (isInitialCapture) setSolution(streamedText);

          // Update the last model message in the messages array
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = streamedText;
            return newMessages;
          });
        }

        const finalChunk = decoder.decode();
        if (finalChunk) {
          streamedText += finalChunk;
          if (isInitialCapture) setSolution(streamedText);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = streamedText;
            return newMessages;
          });
        }

        if (abortController.signal.aborted) return;

        const finalSolution = preprocessMarkdown(streamedText);

        if (isInitialCapture) setSolution(finalSolution);

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = finalSolution;
          return newMessages;
        });

        setIsStreaming(false);

        if (abortController.signal.aborted) return;

        // Trigger callback to save to history if provided
        if (isInitialCapture && onSolveComplete && currentMessages[0].imageBase64) {
          onSolveComplete(finalSolution, currentMessages[0].imageBase64, language);
        }
      } finally {
        reader.releaseLock();
      }

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (abortController.signal.aborted) return;

      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred while analyzing the request.";
      console.error("Solve error", err);
      setError({
        title: "Analysis failed",
        description: errorMessage
      });
      setIsProcessing(false);
      setIsStreaming(false);
      // Remove the empty model message
      setMessages(currentMessages);
      if (isInitialCapture) setImagePreview(null);
    }
  };

  const handleCapture = async (base64Data: string) => {
    setImagePreview(base64Data);
    const newMessages: ChatMessage[] = [{ role: 'user', imageBase64: base64Data }];
    setMessages(newMessages);
    await processRequest(newMessages, true);
  };

  const handleFollowUp = async (text?: string, imageBase64?: string) => {
    if (!text && !imageBase64) return;

    // Create new message object
    const newMessage: ChatMessage = { role: 'user' };
    if (text) newMessage.text = text;
    if (imageBase64) newMessage.imageBase64 = imageBase64;

    // Add to current conversation state
    const currentMessages = [...messages, newMessage];
    setMessages(currentMessages);

    // Process request with full conversation history
    await processRequest(currentMessages, false);
  };

  const handleRescan = () => {
    abortCurrentRequest();
    setImagePreview(null);
    setSolution("");
    setMessages([]);
    setError(null);
    setIsProcessing(false);
    setIsStreaming(false);
  };

  const resetState = () => {
    abortCurrentRequest();
    setImagePreview(null);
    setSolution("");
    setMessages([]);
    setError(null);
    setIsProcessing(false);
    setIsStreaming(false);
  };

  // For history item selection to set initial messages
  const setInitialState = (imageBase64: string, solutionText: string) => {
    setImagePreview(imageBase64);
    setSolution(solutionText);
    setMessages([
      { role: 'user', imageBase64 },
      { role: 'model', text: solutionText }
    ]);
  };

  return {
    imagePreview,
    setImagePreview,
    messages,
    setInitialState,
    isProcessing,
    setIsProcessing,
    solution,
    setSolution,
    isStreaming,
    setIsStreaming,
    error,
    setError,
    handleCapture,
    handleFollowUp,
    handleRescan,
    abortCurrentRequest,
    resetState
  };
}
