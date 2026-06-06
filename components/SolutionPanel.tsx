import SkeletonLoader from "./SkeletonLoader";
import EmptyState from "./SolutionPanel/EmptyState";
import { ChatMessage } from "@/app/api/solve/route";
import { useEffect, useRef, useState, useCallback } from "react";
import ChatMessageItem from "./ChatMessageItem";

interface SolutionPanelProps {
  isStreaming: boolean;
  isLoading: boolean;
  solution: string; // legacy prop
  messages?: ChatMessage[];
  hasStartedChat?: boolean;
  onRescan?: () => void;
}

export default function SolutionPanel({ isStreaming, isLoading, solution, messages = [], hasStartedChat, onRescan }: SolutionPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, 'up' | 'down'>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackInProgressRef = useRef<Set<number>>(new Set());

  const handleCopy = useCallback(async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }, []);

  const handleShare = useCallback(async (index: number, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MuktaVidya AI Solution',
          text: text,
        });
      } else {
        await handleCopy(index, text);
      }
    } catch (err) {
      console.error('Failed to share', err);
    }
  }, [handleCopy]);

  const handleFeedback = useCallback(async (index: number, type: 'up' | 'down', text: string) => {
    if (feedbackInProgressRef.current.has(index)) return;
    feedbackInProgressRef.current.add(index);

    setFeedbackMap(prev => ({ ...prev, [index]: type }));

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: text.substring(0, 100) }),
      });
      if (!response.ok) {
        feedbackInProgressRef.current.delete(index);
        setFeedbackMap(prev => {
          const newMap = { ...prev };
          delete newMap[index];
          return newMap;
        });
        console.error("Feedback failed, response not ok");
      }
    } catch (e) {
      feedbackInProgressRef.current.delete(index);
      setFeedbackMap(prev => {
        const newMap = { ...prev };
        delete newMap[index];
        return newMap;
      });
      console.error("Feedback failed", e);
    }
  }, []);

  // Auto-scroll to bottom when streaming (throttled)
  useEffect(() => {

      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTimeRef.current;

      if (timeSinceLastScroll >= 100) {
        // Immediate scroll if enough time has passed
        bottomRef.current.scrollIntoView({ behavior: "instant" });
        lastScrollTimeRef.current = now;
      } else {
        // Schedule a scroll after the remaining time
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "instant" });
            lastScrollTimeRef.current = Date.now();
          }
        }, 100 - timeSinceLastScroll);
      }
    } else if (!isStreaming && bottomRef.current) {
      // Final smooth scroll when streaming completes
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isStreaming, messages]);

  // Support legacy behavior if messages are not provided or empty and it's not a chat
  if (!hasStartedChat) {
    const isEmpty = !isLoading && !isStreaming && !solution;
    const showSkeleton = isLoading && !solution;

    return (
      <div className="w-full max-w-3xl mx-auto px-6 py-8 md:px-8 flex flex-col min-h-full">
        <div className="flex-1 grid grid-cols-1 grid-rows-1 relative">
          <div className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${isEmpty ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <EmptyState />
          </div>
          <div className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${showSkeleton ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <SkeletonLoader />
          </div>
        </div>
      </div>
    );
  }

  // Conversation Mode
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-8 flex flex-col pb-32" id="solution-scroll-container">
      <div className="flex flex-col gap-8 w-full">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isLastMessage = index === messages.length - 1;
          const isCurrentlyStreaming = isLastMessage && !isUser && isStreaming;

          return (
            <ChatMessageItem
              key={index}
              msg={msg}
              index={index}
              isStreaming={isStreaming}
              isCurrentlyStreaming={isCurrentlyStreaming}
              onRescan={onRescan}
              copied={copiedIndex === index}
              feedback={feedbackMap[index] ?? null}
              onCopy={handleCopy}
              onShare={handleShare}
              onFeedback={handleFeedback}
            />
          );
        })}
      </div>
      <div ref={bottomRef} id="solution-bottom-target" className="h-10 w-full shrink-0" />
    </div>
  );
}
