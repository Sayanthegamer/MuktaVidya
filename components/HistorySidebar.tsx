"use client";
import { X, ClockCounterClockwise } from "@phosphor-icons/react";
import { useEffect, memo, useRef } from "react";
import { HistoryItem } from "../types/history";
import HistorySidebarItem from "./HistorySidebarItem";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const HistorySidebar = memo(function HistorySidebar({ isOpen, onClose, history, onSelect }: HistorySidebarProps) {

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Sidebar Panel */}
      {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role, react-doctor/prefer-html-dialog */}
      <div
        id="history-sidebar"
        className={`fixed inset-y-0 right-0 w-[360px] max-w-[90vw] bg-[var(--surface-1)] border-l border-[var(--border-subtle)] z-50 flex flex-col shadow-2xl sidebar-panel ${isOpen ? "is-open" : ""}`}
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
            type="button"
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
                <HistorySidebarItem
                  key={item.id || index}
                  item={item}
                  onSelect={onSelect}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default HistorySidebar;
