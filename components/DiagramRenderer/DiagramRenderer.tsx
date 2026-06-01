"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import DOMPurify from 'isomorphic-dompurify';

interface DiagramRendererProps {
  chartData: string;
  type: 'chart' | 'svg';
}

export default function DiagramRenderer({ chartData, type }: DiagramRendererProps) {
  // --- SVG Rendering Pipeline ---
  const cleanedSvg = useMemo(() => {
    if (type !== 'svg') return null;
    try {
      let clean = chartData
        .replace(/```svg-diagram/g, '')
        .replace(/```xml/g, '')
        .replace(/```svg/g, '')
        .replace(/```/g, '')
        .trim();

      // 1. Isolate the front boundary case-insensitively
      const firstSvgIndex = clean.search(/<svg/i);
      if (firstSvgIndex === -1) return null;
      clean = clean.substring(firstSvgIndex);

      // 2. Truncate trailing markdown clutter safely
      const lastSvgIndex = clean.search(/<\/svg>/i);
      if (lastSvgIndex !== -1) {
        clean = clean.substring(0, lastSvgIndex + 6);
      }

      // 3. Force uniform camelCase viewBox casing so DOMPurify doesn't strip it out
      clean = clean.replace(/\bviewbox\s*=\s*/gi, 'viewBox=');

      // 4. Normalize white/light configurations to currentColor (responsive lines)
      clean = clean.replace(/stroke=["']\s*(?:#(?:fff|ffffff)|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\s*["']/gi, 'stroke="currentColor"');
      clean = clean.replace(/stroke\s*:\s*(?:#(?:fff|ffffff)\b|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/gi, 'stroke: currentColor');

      // 4b. Normalize black/dark configurations to currentColor (prevents dark-mode invisibility)
      clean = clean.replace(/stroke=["']\s*(?:#(?:000|000000)|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))\s*["']/gi, 'stroke="currentColor"');
      clean = clean.replace(/stroke\s*:\s*(?:#(?:000|000000)\b|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi, 'stroke: currentColor');
      
      // 4c. Adjust text and canvas fills to scale cleanly across dark themes
      clean = clean.replace(/fill=["']\s*(?:#(?:000|000000)|black)\s*["']/gi, 'fill="currentColor"');

      // 5. Safely isolate the root tag to update dimensions without breaking child primitives
      const rootTagClose = clean.indexOf('>');
      if (rootTagClose !== -1) {
        let rootTag = clean.substring(0, rootTagClose + 1);
        const remainder = clean.substring(rootTagClose + 1);

        if (!/viewBox/.test(rootTag)) {
          // Support optional quotes and spaces around width and height elements
          const widthMatch = rootTag.match(/width\s*=\s*["']?\s*([\d.]+)(?:px|%)?\s*["']?/i);
          const heightMatch = rootTag.match(/height\s*=\s*["']?\s*([\d.]+)(?:px|%)?\s*["']?/i);

          const w = widthMatch ? parseInt(widthMatch[1], 10) : 400;
          const h = heightMatch ? parseInt(heightMatch[1], 10) : 250;

          // Safely handle trailing spaces or self-closing slashes at the end of the root tag
          rootTag = rootTag.replace(/\/?\s*>$/, ` viewBox="0 0 ${w} ${h}">`);
        }

        // Space-resilient removal pattern protecting internal child element attributes cleanly
        rootTag = rootTag.replace(/\b(width|height)\s*=\s*["']?[\d.+%px\s]*["']?/gi, '');
        clean = rootTag + remainder;
      }

      // Sanitize output while preserving internal reference targets (# URLs for gradients/masks)
      return DOMPurify.sanitize(clean, {
        USE_PROFILES: { svg: true },
        FORBID_TAGS: ['script', 'foreignObject'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
        ALLOWED_URI_REGEXP: /^(https?:|data:image\/|#)/i
      });
    } catch (e) {
      console.error('[DiagramRenderer] Failed to process SVG pipeline data:', e);
      return null;
    }
  }, [chartData, type]);

  // --- ECharts Layout Pipeline (Fallback for functions & data plotting) ---
  const parsedOptions = useMemo(() => {
    if (type !== 'chart') return null;
    try {
      const cleanedData = chartData.replace(/```json-chart/g, '').replace(/```json/g, '').replace(/```/g, '').trim();
      const rawOptions = JSON.parse(cleanedData);

      const primaryColor = 'var(--text-primary)';
      const secondaryColor = 'var(--text-secondary)';
      const borderColor = 'var(--border-subtle)';
      const splitLineColor = 'rgba(255, 255, 255, 0.05)';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const applyAxisStyles = (axis: any) => {
        if (!axis) return { type: 'value', axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: secondaryColor }, splitLine: { lineStyle: { color: splitLineColor } } };
        return {
          ...axis,
          axisLine: { ...axis.axisLine, lineStyle: { ...axis?.axisLine?.lineStyle, color: borderColor } },
          axisLabel: { ...axis.axisLabel, color: secondaryColor },
          nameTextStyle: { ...axis.nameTextStyle, color: primaryColor },
          splitLine: {
            ...axis.splitLine,
            show: axis.splitLine?.show !== false,
            lineStyle: { ...axis?.splitLine?.lineStyle, color: splitLineColor }
          }
        };
      };

      return {
        ...rawOptions,
        backgroundColor: 'transparent',
        textStyle: { ...rawOptions.textStyle, fontFamily: 'system-ui, sans-serif', color: secondaryColor },
        title: rawOptions.title ? (Array.isArray(rawOptions.title)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? rawOptions.title.map((t: any) => ({ ...t, textStyle: { ...t.textStyle, color: primaryColor } }))
          : { ...rawOptions.title, textStyle: { ...rawOptions.title?.textStyle, color: primaryColor } }
        ) : undefined,
        xAxis: Array.isArray(rawOptions.xAxis) ? rawOptions.xAxis.map(applyAxisStyles) : applyAxisStyles(rawOptions.xAxis),
        yAxis: Array.isArray(rawOptions.yAxis) ? rawOptions.yAxis.map(applyAxisStyles) : applyAxisStyles(rawOptions.yAxis),
        legend: rawOptions.legend ? { ...rawOptions.legend, textStyle: { ...rawOptions.legend?.textStyle, color: secondaryColor } } : undefined,
        color: rawOptions.color || ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#818cf8'],
        tooltip: { ...rawOptions.tooltip, backgroundColor: 'var(--surface-3)', borderColor: borderColor, textStyle: { color: primaryColor } }
      };
    } catch (e) {
      console.error('[DiagramRenderer] Failed to parse ECharts JSON:', e);
      return null;
    }
  }, [chartData, type]);

  if (type === 'svg') {
    if (!cleanedSvg) return <p className="text-xs text-[var(--error)] font-mono">Invalid diagram vector data.</p>;

    return (
      <div className="my-6 w-full flex flex-col items-center justify-center bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-6 overflow-x-auto shadow-sm transition-all">
        <div
          className="w-full max-w-[500px] text-[var(--text-primary)] svg-diagram-container"
          style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: cleanedSvg }}
        />
        
        {/* Standard template block forces layout engine evaluation independent of hydration timings */}
        <style dangerouslySetInnerHTML={{ __html: `
          .svg-diagram-container svg {
            width: 100% !important;
            height: auto !important;
            max-height: 350px;
            display: block;
          }
          .svg-diagram-container svg text {
            fill: var(--text-primary) !important;
            font-family: var(--font-sans), system-ui, sans-serif !important;
          }
          
          /* 1. Ensure baseline visibility for structural tracks lacking strict thickness declarations */
          .svg-diagram-container svg line:not([stroke-width]),
          .svg-diagram-container svg circle:not([stroke-width]),
          .svg-diagram-container svg ellipse:not([stroke-width]),
          .svg-diagram-container svg rect:not([stroke-width]),
          .svg-diagram-container svg polyline:not([stroke-width]),
          .svg-diagram-container svg polygon:not([stroke-width]),
          .svg-diagram-container svg path:not([stroke-width]) {
            stroke-width: var(--svg-stroke-width, 2px);
          }

          /* 2. Map responsive theme lines across un-styled structural geometric nodes safely */
          .svg-diagram-container svg line:not([stroke]),
          .svg-diagram-container svg circle:not([stroke]):not([fill]),
          .svg-diagram-container svg circle:not([stroke])[fill="none"],
          .svg-diagram-container svg ellipse:not([stroke]):not([fill]),
          .svg-diagram-container svg ellipse:not([stroke])[fill="none"],
          .svg-diagram-container svg rect:not([stroke]):not([fill]),
          .svg-diagram-container svg rect:not([stroke])[fill="none"],
          .svg-diagram-container svg polyline:not([stroke]):not([fill]),
          .svg-diagram-container svg polyline:not([stroke])[fill="none"],
          .svg-diagram-container svg polygon:not([stroke]):not([fill]),
          .svg-diagram-container svg polygon:not([stroke])[fill="none"],
          .svg-diagram-container svg path:not([stroke]):not([fill]),
          .svg-diagram-container svg path:not([stroke])[fill="none"] {
            stroke: var(--text-secondary);
          }
        ` }} />
      </div>
    );
  }

  if (type === 'chart') {
    if (!parsedOptions) {
      return (
        <div className="my-4 p-3 bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg text-xs font-mono text-[var(--text-secondary)]">
          <code>{chartData}</code>
        </div>
      );
    }

    return (
      <div className="my-6 w-full flex justify-center bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-4">
         <div className="w-full min-w-[300px]">
           <ReactECharts option={parsedOptions} style={{ height: '350px', width: '100%' }} opts={{ renderer: 'svg' }} />
         </div>
      </div>
    );
  }

  return null;
}
