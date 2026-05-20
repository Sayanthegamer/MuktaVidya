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
  flowchart: { htmlLabels: true },  // ← reverted; SVG-text mode had the fill issue
  sequence:  { showSequenceNumbers: false },
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

        // ─── DOMPurify config for Mermaid SVG output ──────────────────────────
        //
        // Root causes of the "blank boxes" bug:
        //
        // 1. SAFE_FOR_TEMPLATES: true  →  escapes { } in Mermaid's embedded
        //    <style> block, destroying all theme CSS.  Removed entirely.
        //
        // 2. Missing USE_PROFILES: { svg: true }  →  DOMPurify was processing
        //    the SVG string in HTML mode, stripping SVG presentation attributes
        //    (fill, text-anchor, dominant-baseline, etc.).  Adding the SVG
        //    profile restores the full SVG attribute whitelist.
        //
        // 3. <style> tag not in ADD_TAGS  →  Mermaid embeds its theme CSS
        //    inside the SVG as a <style> element.  Without it, dark-theme
        //    colours are gone and node-label text becomes invisible (black on
        //    dark bg).  Added to ADD_TAGS.
        //
        // 4. <foreignObject> content was stripped  →  htmlLabels: true wraps
        //    node text in <foreignObject><div>…</div></foreignObject>.
        //    DOMPurify allows the tag but strips its HTML children unless you
        //    also pass html: true in USE_PROFILES.  Fixed via USE_PROFILES.
        //
        const sanitizedSvg = DOMPurify.sanitize(svg, {
          // Allow both SVG and inline HTML (needed for <foreignObject> content)
          USE_PROFILES: { svg: true, svgFilters: true, html: true },

          // Extra tags Mermaid uses that aren't in the base SVG profile
          ADD_TAGS: [
            'foreignObject',   // node label wrappers (htmlLabels: true)
            'style',           // Mermaid's embedded theme CSS
            'div', 'span',     // inside foreignObject
            'p', 'br',
          ],

          // Extra attributes not covered by the SVG profile
          ADD_ATTR: [
            // Namespace / structural
            'xmlns:xlink', 'xmlns:xhtml', 'xml:space',
            'requiredFeatures', 'requiredExtensions',
            // Layout
            'x', 'y', 'dx', 'dy', 'x1', 'y1', 'x2', 'y2',
            'cx', 'cy', 'r', 'rx', 'ry',
            'width', 'height', 'viewBox', 'preserveAspectRatio',
            'transform', 'patternTransform',
            // Presentation (critical — without these SVG text is black/invisible)
            'fill', 'fill-opacity', 'fill-rule',
            'stroke', 'stroke-width', 'stroke-dasharray',
            'stroke-linecap', 'stroke-linejoin', 'stroke-opacity',
            'opacity',
            // Text
            'text-anchor', 'dominant-baseline', 'alignment-baseline',
            'font-size', 'font-family', 'font-weight', 'font-style',
            // Markers / links
            'marker-end', 'marker-start', 'marker-mid',
            'xlink:href', 'href',
            // General
            'style', 'class', 'id', 'name',
            'd', 'points', 'clip-path', 'clip-rule',
            'mask', 'filter',
          ],

          FORCE_BODY: false,  // don't wrap in <body>, keep the raw <svg>
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
