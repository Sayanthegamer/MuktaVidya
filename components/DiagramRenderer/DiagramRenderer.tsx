"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import DOMPurify from 'dompurify';

interface DiagramRendererProps {
  chartData: string;
  type: 'chart' | 'svg';
}

export default function DiagramRenderer({ chartData, type }: DiagramRendererProps) {
  // --- SVG Rendering Pipeline ---
  const cleanedSvg = useMemo(() => {
    if (type !== 'svg') return null;
    try {
      // Strip stray code block wrappers safely
      let clean = chartData
        .replace(/```svg-diagram/g, '')
        .replace(/```xml/g, '')
        .replace(/```svg/g, '')
        .replace(/```/g, '')
        .trim();

      // Ensure the SVG string starts properly
      if (!clean.startsWith('<svg')) {
        const firstSvgIndex = clean.indexOf('<svg');
        if (firstSvgIndex !== -1) {
          clean = clean.substring(firstSvgIndex);
        } else {
          return null; // Return null if it's genuinely not an SVG
        }
      }
      return clean;
    } catch (e) {
      console.error('[DiagramRenderer] Failed to clean SVG data:', e);
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

    // Sanitize the SVG to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(cleanedSvg, {
      USE_PROFILES: { svg: true },
      FORBID_TAGS: ['script', 'foreignObject'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      ALLOWED_URI_REGEXP: /^(https?:|data:image\/)/i
    });

    return (
      <div className="my-6 w-full flex flex-col items-center justify-center bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-6 overflow-x-auto shadow-sm transition-all">
        <div
          className="w-full max-w-[500px] text-[var(--text-primary)] svg-diagram-container"
          style={{
            color: 'var(--text-primary)',
            fill: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
        <style jsx global>{`
          /* Enforce dark-theme color safety across generated vectors dynamically */
          .svg-diagram-container svg {
            width: 100% !important;
            height: auto !important;
            max-height: 350px;
          }
          .svg-diagram-container svg text {
            fill: var(--text-primary) !important;
            font-family: var(--font-sans), system-ui, sans-serif !important;
          }
          .svg-diagram-container svg [stroke] {
            /* If the stroke is intended to be visible dark line, map it to our border or text token */
            stroke: var(--text-secondary) !important;
          }
          .svg-diagram-container svg line,
          .svg-diagram-container svg path,
          .svg-diagram-container svg circle,
          .svg-diagram-container svg rect {
            /* Fallback initialization for un-styled primitives */
            stroke-width: var(--svg-stroke-width, 2px);
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
}
