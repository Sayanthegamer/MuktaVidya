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
  showRescanButton?: boolean;
  isCurrentlyStreaming: boolean;
  onRescan?: () => void;
  copied: boolean;
  feedback: 'up' | 'down' | null;
  onCopy: (index: number, text: string) => void;
  onShare: (index: number, text: string) => void;
  onFeedback: (index: number, type: 'up' | 'down', text: string) => void;
}

const remarkPlugins = [remarkMath];
type RehypePlugins = NonNullable<React.ComponentProps<typeof ReactMarkdown>['rehypePlugins']>;
const rehypePlugins: RehypePlugins = [
  [rehypeKatex, { throwOnError: false, errorColor: '#ef4444', strict: false }]
];


const createMarkdownComponents = (isStreaming: boolean) => ({
  pre({ children, ...props }: React.ComponentPropsWithoutRef<"pre">) {
    return (
      <pre className="overflow-x-auto rounded-lg p-4 bg-[var(--surface-2)] border border-[var(--border-subtle)]" {...props}>
        {children}
      </pre>
    );
  },
  code({ className, children, node, ...props }: React.ComponentPropsWithoutRef<"code"> & { node?: Element }) {
    const match = /language-(\w+(?:-\w+)?)/.exec(className || '');
    const lang = match ? match[1] : '';
    const isInline = !lang && (!node || (node.tagName === 'code' && Object.keys(props).length === 0));

    if (!isInline && (lang === 'json-chart' || lang === 'echarts')) {
      return <DiagramRenderer chartData={String(children)} type="chart" isStreaming={isStreaming} />;
    }

    if (!isInline && (lang === 'svg-diagram' || lang === 'svg')) {
      return <DiagramRenderer chartData={String(children)} type="svg" isStreaming={isStreaming} />;
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
});

interface ParsedSection {
  id: string;
  type: 'subject' | 'given' | 'approach' | 'solution' | 'answer' | 'general';
  rawText: string;
}

function parseSections(text: string): ParsedSection[] {
  if (!text) return [];
  if (!text.includes('### ')) {
    return [{ id: '0', type: 'general', rawText: text }];
  }

  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let currentHeader: string | null = null;
  let currentLines: string[] = [];
  let inCodeBlock = false;

  const flush = () => {
    if (currentLines.length > 0) {
      const rawText = currentLines.join('\n');
      let type: ParsedSection['type'] = 'general';
      if (currentHeader) {
        const lower = currentHeader.toLowerCase();
        if (lower.includes('subject')) type = 'subject';
        else if (lower.includes('given')) type = 'given';
        else if (lower.includes('approach')) type = 'approach';
        else if (lower.includes('solution') || lower.includes('step')) type = 'solution';
        else if (lower.includes('answer')) type = 'answer';
      }
      sections.push({
        id: String(sections.length),
        type,
        rawText,
      });
      currentLines = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }
    if (!inCodeBlock && line.startsWith('### ')) {
      flush();
      currentHeader = line.slice(4).trim();
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return sections.length > 0 ? sections : [{ id: '0', type: 'general', rawText: text }];
}


function getSectionProps(type: ParsedSection['type']) {
  switch (type) {
    case 'subject':
      return { 'data-testid': 'subject-badge', 'data-section': 'subject' };
    case 'given':
      return { 'data-testid': 'given-card', 'data-section': 'given' };
    case 'approach':
      return { 'data-testid': 'approach-card', 'data-section': 'approach' };
    case 'solution':
      return { 'data-testid': 'solution-card', 'data-section': 'solution' };
    case 'answer':
      return { 'data-testid': 'final-answer', 'data-section': 'answer' };
    default:
      return {};
  }
}

function getSectionClassName(type: ParsedSection['type']): string {
  switch (type) {
    case 'subject':
      return 'inline-block my-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--accent)]';
    case 'given':
      return 'my-4 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] transition-all';
    case 'approach':
      return 'my-4 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] transition-all';
    case 'solution':
      return 'my-4 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] transition-all';
    case 'answer':
      return 'my-4 p-5 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--accent)] text-[var(--text-primary)] shadow-md transition-all';
    default:
      return 'w-full';
  }
}

const ChatMessageItem = memo(function ChatMessageItem({
  msg,
  index,
  showRescanButton,
  isCurrentlyStreaming,
  onRescan,
  copied,
  feedback,
  onCopy,
  onShare,
  onFeedback
}: ChatMessageItemProps) {
  const isUser = msg.role === 'user';

  const processedText = React.useMemo(() => {
    if (!msg.text) return "";
    return preprocessMarkdown(msg.text, { isStreaming: isCurrentlyStreaming });
  }, [msg.text, isCurrentlyStreaming]);

  const sections = React.useMemo(() => parseSections(processedText), [processedText]);
  const markdownComponents = React.useMemo(() => createMarkdownComponents(isCurrentlyStreaming), [isCurrentlyStreaming]);


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
               {showRescanButton && (
                 <button
                   type="button"
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
        <SolutionErrorBoundary fallbackText={processedText}>
          <div className="prose w-full">
            {sections.map((section, sIndex) => {
              const isLastSection = sIndex === sections.length - 1;
              const sectionProps = getSectionProps(section.type);
              const className = getSectionClassName(section.type);

              return (
                <div key={section.id} {...sectionProps} className={className}>
                  <ReactMarkdown
                    remarkPlugins={remarkPlugins}
                    rehypePlugins={rehypePlugins}
                    components={markdownComponents}
                  >
                    {section.rawText}
                  </ReactMarkdown>
                  {isCurrentlyStreaming && isLastSection && (
                    <span
                      data-testid="streaming-cursor"
                      className="streaming-cursor inline-block w-2 h-4 bg-[var(--accent)] ml-1 animate-pulse align-middle"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
            {sections.length === 0 && isCurrentlyStreaming && (
              <span
                data-testid="streaming-cursor"
                className="streaming-cursor inline-block w-2 h-4 bg-[var(--accent)] ml-1 animate-pulse align-middle"
                aria-hidden="true"
              />
            )}
          </div>
        </SolutionErrorBoundary>

        {/* Actions for complete model messages */}
        {!isCurrentlyStreaming && msg.text && (
          <div className="mt-4">
            <ActionBar
              copied={copied}
              feedback={feedback}
              onCopy={() => onCopy(index, msg.text || "")}
              onShare={() => onShare(index, msg.text || "")}
              onFeedback={(type) => onFeedback(index, type, msg.text || "")}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessageItem;

