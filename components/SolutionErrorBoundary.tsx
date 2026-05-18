"use client";
import React from 'react';

export class SolutionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackText?: string | null },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-sm">
          <p className="text-red-400 mb-2">Render failed. Showing raw text:</p>
          <pre className="whitespace-pre-wrap text-gray-300 font-mono text-xs">
            {this.props.fallbackText}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
