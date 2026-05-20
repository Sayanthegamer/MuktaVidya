"use client";
import { ClockCounterClockwise } from "@phosphor-icons/react";


interface AppHeaderProps {
  onHistoryClick: () => void;
  isHistoryOpen: boolean;
  language: string;
  setLanguage: (lang: string) => void;
}

const LANGUAGES = [
  { id: "EN", label: "EN" },
  { id: "BN", label: "BN" },
  { id: "HI", label: "HI" },
];

export default function AppHeader({ onHistoryClick, isHistoryOpen, language, setLanguage }: AppHeaderProps) {
  return (
    <header className="sticky top-0 h-14 bg-[var(--surface-1)] border-b border-[var(--border-subtle)] flex items-center justify-between px-6 z-30">
      {/* Logo */}
      <div className="flex items-center gap-1.5 select-none">
        <span className="font-mono text-sm tracking-widest text-[var(--text-muted)] uppercase">
          MuktaVidya
        </span>
        <span className="font-sans font-medium text-[var(--accent)] text-sm">
          AI
        </span>
      </div>

      {/* Language Selector */}
      <div className="flex rounded-md border border-[var(--border-subtle)] overflow-hidden" role="group" aria-label="Response language">
        {LANGUAGES.map((lang, index) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            aria-pressed={language === lang.id}
            className={`
              px-3 py-1 text-xs font-mono transition-colors
              ${index < 2 ? "border-r border-[var(--border-subtle)]" : ""}
              ${
                language === lang.id
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              }
            `}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* History Toggle */}
      <button
        onClick={onHistoryClick}
        aria-label="Recent scans"
        className={`
          p-2 rounded-md transition-colors btn-press
          ${
            isHistoryOpen
              ? "text-[var(--accent)] bg-[var(--accent-muted)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
          }
        `}
      >
        <ClockCounterClockwise size={20} weight={isHistoryOpen ? "fill" : "regular"} />
      </button>
    </header>
  );
}
