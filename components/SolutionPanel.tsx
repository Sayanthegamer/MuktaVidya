"use client";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import type { Element } from 'hast';
import SkeletonLoader from "./SkeletonLoader";
import { SolutionErrorBoundary } from "./SolutionErrorBoundary";
import ChartRenderer from "./ChartRenderer/ChartRenderer";
import { useSolutionPanel } from "../hooks/useSolutionPanel";
import ActionBar from "./SolutionPanel/ActionBar";
import EmptyState from "./SolutionPanel/EmptyState";
import { ChatMessage } from "@/app/api/solve/route";
import Image from "next/image";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

interface SolutionPanelProps {
  isStreaming: boolean;
  isLoading: boolean;
  solution: string; // legacy prop
  messages?: ChatMessage[];
  hasStartedChat?: boolean;
  onRescan?: () => void;
}

export default function SolutionPanel({ isStreaming, isLoading, solution, messages = [], hasStartedChat, onRescan }: SolutionPanelProps) {
  const {
    handleCopy: legacyHandleCopy,
    handleShare: legacyHandleShare,
    handleFeedback: legacyHandleFeedback
  } = useSolutionPanel(solution);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, 'up' | 'down'>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async (index: number, text: string) => {
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
  };

  const handleFeedback = async (index: number, type: 'up' | 'down', text: string) => {
    if (feedbackMap[index]) return; // Locked
    setFeedbackMap(prev => ({ ...prev, [index]: type }));
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: text.substring(0, 100) }),
      });
      if (!response.ok) {
        setFeedbackMap(prev => {
          const newMap = { ...prev };
          delete newMap[index];
          return newMap;
        });
        console.error("Feedback failed, response not ok");
      }
    } catch (e) {
      setFeedbackMap(prev => {
        const newMap = { ...prev };
        delete newMap[index];
        return newMap;
      });
      console.error("Feedback failed", e);
    }
  };

  // Auto-scroll to bottom when streaming (throttled)
  useEffect(() => {
    if (isStreaming && bottomRef.current) {
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

          if (isUser) {
            return (
              <div key={index} className="flex justify-end w-full fade-up">
                <div className="flex flex-col items-end gap-2 max-w-[85%]">
                  {msg.imageBase64 && (
                    <div className="relative rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm max-w-xs sm:max-w-sm">
                       <Image
                         src={msg.imageBase64}
                         alt="Uploaded reference"
                         width={400}
                         height={300}
                         className="object-contain max-h-[300px] w-auto"
                         unoptimized
                       />
                       {index === 0 && onRescan && !isStreaming && (
                         <button
                           onClick={onRescan}
                           className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1.5 bg-[var(--surface-0)]/80 backdrop-blur-md rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors shadow-sm"
                           title="Start Over"
                         >
                           <ArrowCounterClockwise size={14} weight="bold" />
                         </button>
                       )}
                    </div>
                  )}
                  {msg.text && (
                    <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-[var(--surface-2)] text-[var(--text-primary)] text-[0.9375rem] border border-[var(--border-subtle)] shadow-sm">
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Model Message
          return (
            <div key={index} className="flex justify-start w-full fade-up">
              <div className="w-full">
                {isCurrentlyStreaming ? (
                   <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--text-secondary)] leading-relaxed streaming-cursor">
                     {msg.text}
                   </pre>
                ) : (
                  <SolutionErrorBoundary>
                    <div className="prose w-full">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({ className, children, node, ...props }: React.ComponentPropsWithoutRef<"code"> & { node?: Element }) {
                            const match = /language-(\w+(?:-\w+)?)/.exec(className || '');
                            const lang = match ? match[1] : '';
                            const isInline = !lang && (!node || node.tagName === 'code' && Object.keys(props).length === 0);

                            if (!isInline && (lang === 'json-chart' || lang === 'echarts')) {
                              return <ChartRenderer chartData={String(children)} />;
                            }

                            return !isInline ? (
                              <div className="overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.text || ""}
                      </ReactMarkdown>
                    </div>
                  </SolutionErrorBoundary>
                )}

                {/* Actions for complete model messages */}
                {!isCurrentlyStreaming && msg.text && (
                  <div className="mt-4">
                    <ActionBar
                      copied={copiedIndex === index}
                      feedback={feedbackMap[index] ?? null}
                      onCopy={() => handleCopy(index, msg.text || "")}
                      onShare={() => handleShare(index, msg.text || "")}
                      onFeedback={(type) => handleFeedback(index, type, msg.text || "")}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} id="solution-bottom-target" className="h-10 w-full shrink-0" />
    </div>
  );
}
