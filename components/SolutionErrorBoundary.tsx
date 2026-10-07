"use client";
import React from 'react';

export class SolutionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackText?: string | null },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidUpdate(prevProps: { fallbackText?: string | null }) {
    if (this.state.hasError && prevProps.fallbackText !== this.props.fallbackText) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-sm p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
          <p className="text-[var(--error)] mb-2 font-medium">Render failed. Showing raw text:</p>
          <pre className="whitespace-pre-wrap text-[var(--text-secondary)] font-mono text-xs overflow-x-auto">
            {this.props.fallbackText}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
