"use client";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { SolveMode } from "../hooks/useMode";
import { memo } from "react";

interface AppHeaderProps {
  onHistoryClick: () => void;
  isHistoryOpen: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  mode: SolveMode;
  setMode: (mode: SolveMode) => void;
}

const LANGUAGES = [
  { id: "EN", label: "EN" },
  { id: "BN", label: "BN" },
  { id: "HI", label: "HI" },
];

const AppHeader = memo(function AppHeader(props: AppHeaderProps) {
  const { onHistoryClick, isHistoryOpen, language, setLanguage, mode, setMode } = props;
  return (
    <header className="sticky top-0 h-14 bg-[var(--surface-0)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center justify-between px-6 z-30 transition-colors duration-200">
      {/* Logo */}
      <h1 className="flex items-center gap-1.5 select-none cursor-pointer group">
        <span className="font-mono text-sm tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors uppercase">
          MuktaVidya
        </span>
        <span className="font-sans font-semibold text-[var(--accent)] text-xs tracking-tight px-1.5 py-0.5 rounded-md bg-[var(--accent-muted)] border border-[var(--accent-border)] transition-transform duration-200 group-hover:scale-105">
          AI
        </span>
      </h1>

      <div className="flex items-center gap-3">
        {/* Mode Selector */}
        {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role */}
        <div className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/60 backdrop-blur-sm p-0.5" role="group" aria-label="Solve mode">
          <button
            type="button"
            onClick={() => setMode("NORMAL")}
            aria-pressed={mode === "NORMAL"}
            className={`
              px-2.5 py-1 text-xs font-mono rounded-md transition-all duration-200
              ${
                mode === "NORMAL"
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/50"
              }
            `}
          >
            NORMAL
          </button>
          <button
            type="button"
            onClick={() => setMode("FASTEST")}
            aria-pressed={mode === "FASTEST"}
            className={`
              px-2.5 py-1 text-xs font-mono rounded-md transition-all duration-200
              ${
                mode === "FASTEST"
                  ? "bg-[var(--surface-3)] text-[var(--accent)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/50"
              }
            `}
            title="Fastest and Shortest approach with Best Solvability"
          >
            FASTEST
          </button>
        </div>

        {/* Language Selector */}
        {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role */}
        <div className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/60 backdrop-blur-sm p-0.5" role="group" aria-label="Response language">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => setLanguage(lang.id)}
            aria-pressed={language === lang.id}
            className={`
              px-2.5 py-1 text-xs font-mono rounded-md transition-all duration-200
              ${
                language === lang.id
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/50"
              }
            `}
          >
            {lang.label}
          </button>
        ))}
        </div>
      </div>

      {/* History Toggle */}
      <button
        type="button"
        onClick={onHistoryClick}
        aria-label="Recent scans"
        aria-expanded={isHistoryOpen}
        aria-controls="history-sidebar"
        title="Recent scans"
        className={`
          p-2 rounded-lg transition-all duration-200 btn-press border border-transparent
          ${
            isHistoryOpen
              ? "text-[var(--accent)] bg-[var(--accent-muted)] border-[var(--accent-border)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-subtle)]"
          }
        `}
      >
        <ClockCounterClockwise size={20} weight={isHistoryOpen ? "fill" : "regular"} />
      </button>
    </header>
  );

});

export default AppHeader;
