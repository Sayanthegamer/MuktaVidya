"use client";
import { WarningCircle } from "@phosphor-icons/react";

interface ErrorBannerProps {
  title: string;
  description: string;
}

export default function ErrorBanner({ title, description }: ErrorBannerProps) {
  return (
    <div role="alert" className="bg-[var(--error-muted)] border border-[var(--error-border,color-mix(in_oklch,var(--error)_30%,transparent))] rounded-lg p-4 flex items-start gap-3 mx-6 mt-6 fade-up">
      <WarningCircle weight="fill" className="text-[var(--error)] shrink-0 mt-0.5" size={16} />
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
