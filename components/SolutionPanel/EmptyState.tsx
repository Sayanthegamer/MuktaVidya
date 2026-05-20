import { FileText } from "@phosphor-icons/react";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];

export default function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <FileText size={48} weight="light" className="text-[var(--text-muted)] mb-6" />
      <h2 className="text-base font-medium tracking-tight text-[var(--text-primary)] mb-2">
        Scan a question to get started
      </h2>
      <p className="text-sm text-[var(--text-muted)] max-w-[36ch] leading-relaxed mb-8">
        Point your camera at any WBJEE, JEE, or NEET question.
      </p>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {SUBJECTS.map((subject, idx, arr) => (
          <div key={subject} className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-2 py-0.5">
              {subject}
            </span>
            {idx < arr.length - 1 && <span className="text-[var(--text-muted)]">|</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
