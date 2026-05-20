"use client";

import React, { useEffect, useState, useId, useRef } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

interface MermaidDiagramProps {
  chart: string;
}

// Initialize mermaid once outside the component.
// Key change: htmlLabels: true (default) so Mermaid uses <foreignObject> + HTML
// for node labels — much more reliable than SVG <text> in a Next.js/React context.
// securityLevel: 'strict' lets Mermaid sanitize the chart source itself;
// we still DOMPurify the output SVG separately.
mermaid.initialize({
  theme: 'dark',
  startOnLoad: false,
  securityLevel: 'strict',
  flowchart: { htmlLabels: false }, // <-- CRITICAL: Force pure SVG text
  sequence: { showSequenceNumbers: false },
});

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isError,    setIsError]    = useState(false);
  // useId gives a stable, unique id per component instance
  const id               = useId().replace(/:/g, '');
  const latestRenderIdRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        // Strip any embedded %%{init}%% directives that could override our config
        const sanitizedChart = chart.replace(/%%\{[\s\S]*?\}%%/g, '').trim();
        if (!sanitizedChart) return;

        latestRenderIdRef.current += 1;
        const localRenderId = latestRenderIdRef.current;

        const { svg } = await mermaid.render(`mermaid-${id}-${localRenderId}`, sanitizedChart);

        const sanitizedSvg = DOMPurify.sanitize(svg, { 
          USE_PROFILES: { svg: true }, // Strict SVG only, no HTML mixing
          ADD_TAGS: ['style'], 
          ADD_ATTR: ['dominant-baseline', 'text-anchor', 'alignment-baseline', 'class', 'style'] 
        });

        if (isMounted && localRenderId === latestRenderIdRef.current) {
          setSvgContent(sanitizedSvg);
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

  // Graceful fallback while streaming / on parse error
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
