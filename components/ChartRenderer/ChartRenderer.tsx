"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface ChartRendererProps {
  chartData: string;
}

export default function ChartRenderer({ chartData }: ChartRendererProps) {
  const parsedOptions = useMemo(() => {
    try {
      // First, try to remove potential markdown wrapping just in case it leaks
      const cleanedData = chartData.replace(/```json/g, '').replace(/```/g, '').trim();
      const rawOptions = JSON.parse(cleanedData);

      // Force background transparency and Muktavidya dark theme styling
      return {
        ...rawOptions,
        backgroundColor: 'transparent',
        textStyle: {
          ...rawOptions.textStyle,
          fontFamily: 'var(--font-sans), system-ui, sans-serif',
          color: 'var(--text-secondary)'
        },
        // We ensure titles use text-primary
        title: rawOptions.title ? (Array.isArray(rawOptions.title) ? rawOptions.title.map((t: { textStyle?: object, [key: string]: unknown }) => ({
          ...t,
          textStyle: { ...t.textStyle, color: 'var(--text-primary)' }
        })) : {
          ...rawOptions.title,
          textStyle: { ...rawOptions.title.textStyle, color: 'var(--text-primary)' }
        }) : undefined,
        // Override default colors with our accent and complementary shades if not strictly provided
        color: rawOptions.color || [
          '#60a5fa', // Electric Blue-ish (accent)
          '#34d399', // Success green-ish
          '#fbbf24', // Warning yellow
          '#f87171', // Error red
          '#818cf8', // Indigo
        ],
        tooltip: {
          ...rawOptions.tooltip,
          backgroundColor: 'var(--surface-3)',
          borderColor: 'var(--border-subtle)',
          textStyle: {
            color: 'var(--text-primary)'
          }
        }
      };
    } catch (e) {
      console.error('[ChartRenderer] Failed to parse ECharts JSON:', e);
      return null;
    }
  }, [chartData]);

  if (!parsedOptions) {
    return (
      <div className="my-4">
        <div className="text-xs text-[var(--error)] mb-1 font-mono">
          Failed to render chart configuration.
        </div>
        <pre className="bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-lg p-3 overflow-x-auto text-sm text-[var(--text-secondary)] font-mono">
          <code>{chartData}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 w-full flex justify-center bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-lg p-4 overflow-x-auto">
       <div className="w-full min-w-[300px]">
         <ReactECharts
           option={parsedOptions}
           style={{ height: '400px', width: '100%' }}
           opts={{ renderer: 'svg' }} // Use SVG for crisper text scaling
         />
       </div>
    </div>
  );
}
