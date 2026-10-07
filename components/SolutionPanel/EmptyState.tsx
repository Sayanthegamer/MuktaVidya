import { FileText } from "@phosphor-icons/react";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];

export default function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="p-4 rounded-2xl bg-[var(--surface-1)]/60 border border-[var(--border-subtle)] backdrop-blur-md shadow-sm mb-6 flex items-center justify-center">
        <FileText size={40} weight="light" className="text-[var(--text-muted)]" />
      </div>
      <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)] mb-2">
        Scan a question to get started
      </h2>
      <p className="text-sm text-[var(--text-secondary)] max-w-[36ch] leading-relaxed mb-8">
        Point your camera or upload any WBJEE, JEE, or NEET question.
      </p>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {SUBJECTS.map((subject, idx, arr) => (
          <div key={subject} className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-1)]/40 border border-[var(--border-subtle)] rounded-full px-3 py-1 hover:border-[var(--accent)]/40 hover:text-[var(--text-secondary)] transition-all duration-200">
              {subject}
            </span>
            {idx < arr.length - 1 && <span className="text-[var(--text-disabled)]" aria-hidden="true">·</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
