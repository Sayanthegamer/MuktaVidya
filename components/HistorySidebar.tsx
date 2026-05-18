"use client";
import { X, ClockCounterClockwise, FileText } from "@phosphor-icons/react";
import { useEffect } from "react";

export interface HistoryItem {
  id?: string;
  imageBase64: string;
  solution: string;
  timestamp: string;
  language: string;
  preview?: string;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export default function HistorySidebar({ isOpen, onClose, history, onSelect }: HistorySidebarProps) {

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      {isOpen && (
      <div
        className={`fixed inset-y-0 right-0 w-[360px] max-w-[90vw] bg-[var(--surface-1)] border-l border-[var(--border-subtle)] z-50 flex flex-col shadow-2xl sidebar-panel is-open`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] shrink-0">
          <h2 id="history-title" className="text-sm font-medium text-[var(--text-primary)]">
            Recent Scans
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded transition-colors btn-press"
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ClockCounterClockwise size={32} className="text-[var(--text-muted)] mb-4" />
              <p className="text-[var(--text-muted)] text-sm font-medium mb-1">No scans yet</p>
              <p className="text-[var(--text-muted)] text-xs">Questions you analyze will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {history.map((item, index) => (
                <button
                  key={item.id || index}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="flex gap-3 p-3 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border-subtle)] last:border-0 text-left items-start"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-[var(--surface-3)] flex items-center justify-center border border-[var(--border-subtle)]">
                    {item.imageBase64 ? (
                      <img src={item.imageBase64} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={24} className="text-[var(--text-muted)]" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 bg-[var(--surface-1)]">
                        {item.language === 'BN' ? 'BN' : item.language === 'HI' ? 'HI' : 'EN'}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {item.preview || item.solution.replace(/[#*`_]/g, '').substring(0, 100) + '...'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
