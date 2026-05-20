"use client";

import React, { useEffect, useState, useId, useRef } from 'react';
import mermaid from 'mermaid';
// 1. We completely removed the DOMPurify import.

// 2. Initialize mermaid. 
// securityLevel: 'strict' forces Mermaid to run its OWN internal DOMPurify.
// We removed htmlLabels: false so it defaults to true (which looks much better).
mermaid.initialize({
  theme: 'dark',
  startOnLoad: false,
  securityLevel: 'strict', 
  sequence: { showSequenceNumbers: false },
});

export default function MermaidDiagram({ chart }: { chart: string }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const id = useId().replace(/:/g, '');
  const latestRenderIdRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        const sanitizedChart = chart.replace(/%%\{[\s\S]*?\}%%/g, '').trim();
        if (!sanitizedChart) return;

        latestRenderIdRef.current += 1;
        const localRenderId = latestRenderIdRef.current;

        // 3. mermaid.render returns an ALREADY SANITIZED safe SVG string.
        const { svg } = await mermaid.render(`mermaid-${id}-${localRenderId}`, sanitizedChart);

        if (isMounted && localRenderId === latestRenderIdRef.current) {
          // 4. Inject it directly. No more double-sanitizing!
          setSvgContent(svg); 
          setIsError(false);
        }
      } catch (err) {
        console.error('[MermaidDiagram] render error', err);
        latestRenderIdRef.current += 1;
        const localRenderId = latestRenderIdRef.current;
        if (isMounted && localRenderId === latestRenderIdRef.current) {
          setIsError(true);
        }
      }
    };

    if (chart) renderChart();

    return () => { isMounted = false; };
  }, [chart, id]);

  if (isError || !svgContent) {
    return (
      <div className="my-4">
        <div className="text-xs text-[var(--accent)] animate-pulse mb-1 font-mono">
          Generating diagram…
        </div>
        <pre className="bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg p-3 overflow-x-auto text-sm text-[var(--text-secondary)] font-mono">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram my-6 flex justify-center w-full overflow-x-auto rounded-lg"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
