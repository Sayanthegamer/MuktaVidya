"use client";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import SkeletonLoader from "./SkeletonLoader";
import { SolutionErrorBoundary } from "./SolutionErrorBoundary";
import ChartRenderer from "./ChartRenderer/ChartRenderer";
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

  const isEmpty = !isLoading && !isStreaming && !solution;
  const showSkeleton = isLoading && !solution;
  const showContent = isStreaming || !!solution;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 md:px-8 flex flex-col min-h-full">
      <div className="flex-1 grid grid-cols-1 grid-rows-1 relative">

        {/* 1. Empty State */}
        <div
          className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${isEmpty ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <EmptyState />
        </div>

        {/* 2. Loading / Skeleton State */}
        <div
          className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${showSkeleton ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <SkeletonLoader />
        </div>

        {/* 3. Render Solution (Streaming or Complete) */}
        <div
          className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${showContent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
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
                      code({ className, children, inline, ...props }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {

                        const match = /language-(\w+(?:-\w+)?)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        const isInline = inline;

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
                    {solution}
                  </ReactMarkdown>
                </div>
              </SolutionErrorBoundary>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar (Only when complete) */}
      <div className={`transition-opacity duration-300 ease-out ${(!isStreaming && solution) ? "opacity-100 mt-8" : "opacity-0 pointer-events-none"}`}>
        <ActionBar
          copied={copied}
          feedback={feedback}
          onCopy={handleCopy}
          onShare={handleShare}
          onFeedback={handleFeedback}
        />
      </div>
    </div>
  );
}
