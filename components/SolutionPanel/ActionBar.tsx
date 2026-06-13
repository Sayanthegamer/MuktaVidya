import { CopySimple, Check, ShareNetwork, ThumbsUp, ThumbsDown } from "@phosphor-icons/react";

interface ActionBarProps {
  copied: boolean;
  feedback: 'up' | 'down' | null;
  onCopy: () => void;
  onShare: () => void;
  onFeedback: (type: 'up' | 'down') => void;
}

export default function ActionBar({ copied, feedback, onCopy, onShare, onFeedback }: ActionBarProps) {
  return (
    <div className="mt-12 flex items-center justify-between fade-up sticky bottom-4 z-10 px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/70 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors btn-press"
          aria-label={copied ? "Copied solution" : "Copy solution"}
          title={copied ? "Copied" : "Copy solution"}
        >
          {copied ? <Check size={15} weight="bold" className="text-[var(--success)]" aria-hidden="true" /> : <CopySimple size={15} aria-hidden="true" />}
          <span className="text-xs font-medium">{copied ? "Copied" : "Copy"}</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors btn-press"
          aria-label="Share solution"
          title="Share solution"
        >
          <ShareNetwork size={15} aria-hidden="true" />
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--text-muted)]">Was this helpful?</span>
        <div className="flex items-center gap-1">
          <span title={feedback !== null ? "Feedback already provided" : "Mark as helpful"} className="inline-flex">
            <button
              onClick={() => onFeedback('up')}
              disabled={feedback !== null}
              aria-pressed={feedback === 'up'}
              className={`p-1.5 rounded transition-colors disabled:cursor-not-allowed ${
                feedback === 'up'
                  ? "text-[var(--accent)]"
                  : feedback === 'down'
                    ? "text-[var(--text-disabled)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              }`}
              aria-label={feedback === 'up' ? "Marked as helpful" : "Mark as helpful"}
              aria-disabled={feedback !== null}
            >
              <ThumbsUp size={16} weight={feedback === 'up' ? "fill" : "regular"} aria-hidden="true" />
            </button>
          </span>
          <span title={feedback !== null ? "Feedback already provided" : "Mark as not helpful"} className="inline-flex">
            <button
              onClick={() => onFeedback('down')}
              disabled={feedback !== null}
              aria-pressed={feedback === 'down'}
              className={`p-1.5 rounded transition-colors disabled:cursor-not-allowed ${
                feedback === 'down'
                  ? "text-[var(--error)]"
                  : feedback === 'up'
                    ? "text-[var(--text-disabled)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              }`}
              aria-label={feedback === 'down' ? "Marked as not helpful" : "Mark as not helpful"}
              aria-disabled={feedback !== null}
            >
              <ThumbsDown size={16} weight={feedback === 'down' ? "fill" : "regular"} aria-hidden="true" />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
