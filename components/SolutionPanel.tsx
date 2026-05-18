"use client";
import { FileText, CopySimple, Check, ShareNetwork, ThumbsUp, ThumbsDown } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import SkeletonLoader from "./SkeletonLoader";
import { SolutionErrorBoundary } from "./SolutionErrorBoundary";
import MermaidDiagram from "./MermaidDiagram";

interface SolutionPanelProps {
  isStreaming: boolean;
  isLoading: boolean;
  solution: string;
}

export default function SolutionPanel({ isStreaming, isLoading, solution }: SolutionPanelProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // Reset feedback and copied state when solution changes
  useEffect(() => {
    setFeedback(null);
    setCopied(false);
  }, [solution]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MuktaVidya AI Solution',
          text: solution,
        });
      } else {
        handleCopy();
      }
    } catch (err) {
      console.error('Failed to share', err);
    }
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    if (feedback) return; // Locked
    setFeedback(type);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: solution.substring(0, 100) }),
      });
    } catch (e) {
      console.error("Feedback failed", e);
    }
  };

  // 1. Empty State
  if (!isLoading && !isStreaming && !solution) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <FileText size={48} weight="light" className="text-[var(--text-muted)] mb-6" />
        <h2 className="text-base font-medium tracking-tight text-[var(--text-primary)] mb-2">
          Scan a question to get started
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-[36ch] leading-relaxed mb-8">
          Point your camera at any WBJEE, JEE, or NEET question.
        </p>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {["Physics", "Chemistry", "Mathematics", "Biology"].map((subject, idx, arr) => (
            <div key={subject} className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-2 py-0.5">
                {subject}
              </span>
              {idx < arr.length - 1 && <span className="text-[var(--text-muted)]">·</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Loading / Streaming State
  if (isLoading && !solution) {
    return <SkeletonLoader />;
  }

  // 3. Render Solution (Streaming or Complete)
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 md:px-8 flex flex-col min-h-full">
      <div className="flex-1">
        {isStreaming ? (
          <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--text-secondary)] leading-relaxed streaming-cursor">
            {solution}
          </pre>
        ) : (
          <div className="fade-up">
            <SolutionErrorBoundary>
              <div className="prose w-full">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const lang = match ? match[1] : '';

                      if (!inline && lang === 'mermaid') {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                      }

                      return !inline ? (
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
                  {solution}
                </ReactMarkdown>
              </div>
            </SolutionErrorBoundary>
          </div>
        )}
      </div>

      {/* Action Bar (Only when complete) */}
      {!isStreaming && solution && (
        <div className="mt-12 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between fade-up">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors btn-press"
              aria-label="Copy solution"
            >
              {copied ? <Check size={15} weight="bold" className="text-[var(--success)]" /> : <CopySimple size={15} />}
              <span className="text-xs font-medium">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors btn-press"
              aria-label="Share solution"
            >
              <ShareNetwork size={15} />
              <span className="text-xs font-medium">Share</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">Was this helpful?</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFeedback('up')}
                disabled={feedback !== null}
                className={`p-1.5 rounded transition-colors ${
                  feedback === 'up'
                    ? "text-[var(--accent)]"
                    : feedback === 'down'
                      ? "text-[var(--text-disabled)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                }`}
                aria-label="Helpful"
              >
                <ThumbsUp size={16} weight={feedback === 'up' ? "fill" : "regular"} />
              </button>
              <button
                onClick={() => handleFeedback('down')}
                disabled={feedback !== null}
                className={`p-1.5 rounded transition-colors ${
                  feedback === 'down'
                    ? "text-[var(--error)]"
                    : feedback === 'up'
                      ? "text-[var(--text-disabled)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                }`}
                aria-label="Not helpful"
              >
                <ThumbsDown size={16} weight={feedback === 'down' ? "fill" : "regular"} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
