"use client";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import SkeletonLoader from "./SkeletonLoader";
import { SolutionErrorBoundary } from "./SolutionErrorBoundary";
import MermaidDiagram from "./MermaidDiagram";
import { useSolutionPanel } from "../hooks/useSolutionPanel";
import ActionBar from "./SolutionPanel/ActionBar";
import EmptyState from "./SolutionPanel/EmptyState";

interface SolutionPanelProps {
  isStreaming: boolean;
  isLoading: boolean;
  solution: string;
}

export default function SolutionPanel({ isStreaming, isLoading, solution }: SolutionPanelProps) {
  const {
    copied,
    feedback,
    handleCopy,
    handleShare,
    handleFeedback
  } = useSolutionPanel(solution);

  // 1. Empty State
  if (!isLoading && !isStreaming && !solution) {
    return <EmptyState />;
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
        <ActionBar
          copied={copied}
          feedback={feedback}
          onCopy={handleCopy}
          onShare={handleShare}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}
