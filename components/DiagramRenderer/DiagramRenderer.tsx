"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import DOMPurify from 'isomorphic-dompurify';

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">Loading visualization engine...</div>
});


interface DiagramRendererProps {
  chartData: string;
  type: 'chart' | 'svg';
}

const DiagramRenderer = React.memo(function DiagramRenderer({ chartData, type }: DiagramRendererProps) {
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

      // 3. Normalize stroke/fill configurations to respond to light/dark themes
      clean = clean.replace(/stroke=["']\s*(?:#(?:fff|ffffff)|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\s*["']/gi, 'stroke="currentColor"');
      clean = clean.replace(/stroke\s*:\s*(?:#(?:fff|ffffff)\b|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/gi, 'stroke: currentColor');
      clean = clean.replace(/stroke=["']\s*(?:#(?:000|000000)|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))\s*["']/gi, 'stroke="currentColor"');
      clean = clean.replace(/stroke\s*:\s*(?:#(?:000|000000)\b|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi, 'stroke: currentColor');
      clean = clean.replace(/fill=["']\s*(?:#(?:000|000000)|black)\s*["']/gi, 'fill="currentColor"');

      // 4. THE CRITICAL FIX: Isolate the root tag to fix missing namespaces
      const rootTagClose = clean.indexOf('>');
      if (rootTagClose !== -1) {
        let rootTag = clean.substring(0, rootTagClose + 1);
        const remainder = clean.substring(rootTagClose + 1);

        // FIX A: Inject the missing XML namespace so DOMPurify doesn't destroy the canvas
        if (!/xmlns/i.test(rootTag)) {
          rootTag = rootTag.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // FIX B: Force uniform viewBox casing (DOMPurify deletes lowercase 'viewbox')
        rootTag = rootTag.replace(/\bviewbox\s*=\s*/gi, 'viewBox=');

        // FIX C: If there is no viewBox, calculate it from width/height
        if (!/viewBox/i.test(rootTag)) {
          const widthMatch = rootTag.match(/width\s*=\s*["']?\s*([\d.]+)(?:px|%)?\s*["']?/i);
          const heightMatch = rootTag.match(/height\s*=\s*["']?\s*([\d.]+)(?:px|%)?\s*["']?/i);

          const w = widthMatch ? parseInt(widthMatch[1], 10) : 400;
          const h = heightMatch ? parseInt(heightMatch[1], 10) : 250;
          rootTag = rootTag.replace(/\/?\s*>$/, ` viewBox="0 0 ${w} ${h}">`);
        }

        // FIX D: Strip hardcoded width/height so CSS can scale it responsibly
        rootTag = rootTag.replace(/\b(width|height)\s*=\s*["']?[\d.+%px\s]*["']?/gi, '');
        
        clean = rootTag + remainder;
      }

      // 5. Sanitize (Using default profile which safely allows SVG+HTML without nuking it)
      return DOMPurify.sanitize(clean, {
        FORBID_TAGS: ['script', 'foreignObject', 'style'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
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

      interface AxisConfig {
        type?: string;
        axisLine?: { lineStyle?: { color?: string; [key: string]: unknown }; [key: string]: unknown };
        axisLabel?: { color?: string; [key: string]: unknown };
        nameTextStyle?: { color?: string; [key: string]: unknown };
        splitLine?: { show?: boolean; lineStyle?: { color?: string; [key: string]: unknown }; [key: string]: unknown };
        [key: string]: unknown;
      }

      const applyAxisStyles = (axis: AxisConfig) => {
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
          ? rawOptions.title.map((t: { textStyle?: { color?: string; [key: string]: unknown }; [key: string]: unknown }) => ({ ...t, textStyle: { ...t.textStyle, color: primaryColor } }))
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
          // react-doctor-disable-next-line react-doctor/no-danger
          dangerouslySetInnerHTML={{ __html: cleanedSvg }}
        />
        
        {/* Standard template block forces layout engine evaluation independent of hydration timings */}
        <style>{`
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
        `}</style>
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
});

export default DiagramRenderer;
