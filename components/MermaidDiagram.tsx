"use client";

import React, { useEffect, useState, useId, useRef } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

interface MermaidDiagramProps {
  chart: string;
}

// Initialize mermaid once outside the component
mermaid.initialize({
  theme: 'dark',
  startOnLoad: false,
  securityLevel: 'loose', // Let Mermaid keep the text
  flowchart: { htmlLabels: false }, // Force standard SVG text
  sequence: { showSequenceNumbers: false },
});

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const id = useId().replace(/:/g, ''); // Generate a valid DOM id
  const latestRenderIdRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        // Strip any embedded %%{init}%% directives from the raw diagram input
        const sanitizedChart = chart.replace(/%%\{init.*?\}%%/g, '');

        // Increment and capture the render ID to prevent stale renders
        latestRenderIdRef.current += 1;
        const localRenderId = latestRenderIdRef.current;

        // We use mermaid.render to get the SVG string instead of rendering it into the DOM directly.
        // It requires a unique ID for each render call.
        const { svg } = await mermaid.render(`mermaid-${id}`, sanitizedChart);

        // Sanitize SVG content before rendering
        const sanitizedSvg = DOMPurify.sanitize(svg, { 
          SAFE_FOR_TEMPLATES: true,
          ADD_TAGS: ['foreignObject', 'style', 'div', 'span', 'p'],
          ADD_ATTR: ['xmlns:xhtml', 'style', 'class'] 
        });

        if (isMounted && localRenderId === latestRenderIdRef.current) {
          setSvgContent(sanitizedSvg);
          setIsError(false);
        }
      } catch {
        // Catch parsing errors (e.g., when the syntax is incomplete during streaming)
        latestRenderIdRef.current += 1;
        const localRenderId = latestRenderIdRef.current;

        if (isMounted && localRenderId === latestRenderIdRef.current) {
          setIsError(true);
        }
      }
    };

    if (chart) {
      renderChart();
    }

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  if (isError || !svgContent) {
    // Graceful fallback for incomplete/invalid mermaid syntax during streaming
    return (
      <div className="my-4">
        <div className="text-xs text-blue-400 animate-pulse mb-1 font-mono">
          Generating diagram...
        </div>
        <pre className="bg-gray-800 rounded p-2 overflow-x-auto text-sm text-gray-300 font-mono">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  // Render the successfully generated SVG safely
  return (
    <div
      className="mermaid-diagram my-4 flex justify-center w-full overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
