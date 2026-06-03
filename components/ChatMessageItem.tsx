import type { Element } from "hast";
import { ChatMessage } from "@/app/api/solve/route";
import Image from "next/image";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import DiagramRenderer from "./DiagramRenderer/DiagramRenderer";
import ActionBar from "./SolutionPanel/ActionBar";
import { SolutionErrorBoundary } from "./SolutionErrorBoundary";
import { preprocessMarkdown } from "@/lib/preprocessMarkdown";
import React, { memo } from "react";

interface ChatMessageItemProps {
  msg: ChatMessage;
  index: number;
  isStreaming: boolean;
  isCurrentlyStreaming: boolean;
  onRescan?: () => void;
  copied: boolean;
  feedback: 'up' | 'down' | null;
  onCopy: () => void;
  onShare: () => void;
  onFeedback: (type: 'up' | 'down') => void;
}

const ChatMessageItem = memo(function ChatMessageItem({
  msg,
  index,
  isStreaming,
  isCurrentlyStreaming,
  onRescan,
  copied,
  feedback,
  onCopy,
  onShare,
  onFeedback
}: ChatMessageItemProps) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end w-full fade-up">
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
                   aria-label="Start over"
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
    <div className="flex justify-start w-full fade-up">
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
                        return <DiagramRenderer chartData={String(children)} type="chart" />;
                      }

                      if (!isInline && (lang === 'svg-diagram' || lang === 'svg')) {
                        return <DiagramRenderer chartData={String(children)} type="svg" />;
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
                {preprocessMarkdown(msg.text || "")}
              </ReactMarkdown>
            </div>
          </SolutionErrorBoundary>
        )}

        {/* Actions for complete model messages */}
        {!isCurrentlyStreaming && msg.text && (
          <div className="mt-4">
            <ActionBar
              copied={copied}
              feedback={feedback}
              onCopy={onCopy}
              onShare={onShare}
              onFeedback={onFeedback}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessageItem;
