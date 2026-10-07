/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';


// Mock ESM packages for Jest CJS environment
jest.mock('remark-math', () => {
  return function remarkMath() {};
});

jest.mock('rehype-katex', () => {
  return function rehypeKatex() {};
});

jest.mock('react-markdown', () => {
  const ReactModule = require('react');
  const katexLib = require('katex');
  const rehypeKatexPlugin = require('rehype-katex');

  return function MockReactMarkdown({
    children,
    components = {},
    rehypePlugins = [],
  }: {
    children?: string;
    components?: Record<string, React.ComponentType<any>>;
    rehypePlugins?: any[];
  }) {
    if (!children) return null;

    // Determine KaTeX options passed via rehypePlugins
    const katexConfig = rehypePlugins?.find(
      (p: any) =>
        p === rehypeKatexPlugin ||
        (Array.isArray(p) && (p[0] === rehypeKatexPlugin || p[0]?.name === 'rehypeKatex'))
    );
    const options = Array.isArray(katexConfig) ? katexConfig[1] : {};
    const throwOnError = options?.throwOnError ?? true;

    // Validate math blocks using KaTeX with the exact plugin options
    const mathMatches = children.match(/\$\$([\s\S]*?)\$\$|\$([^\$\n]+)\$/g);
    if (mathMatches) {
      for (const rawMath of mathMatches) {
        const mathContent = rawMath.startsWith('$$')
          ? rawMath.slice(2, -2).trim()
          : rawMath.slice(1, -1).trim();
        try {
          katexLib.renderToString(mathContent, {
            throwOnError,
            displayMode: rawMath.startsWith('$$'),
          });
        } catch (e) {
          if (throwOnError) {
            throw e;
          }
        }
      }
    }

    // Render basic markdown tags using provided components or defaults
    const lines = children.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          const PComponent = components.p || 'p';
          elements.push(ReactModule.createElement(PComponent, { key: elements.length }, text));
        }
        currentParagraph = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        flushParagraph();
        continue;
      }

      if (line.startsWith('### ')) {
        flushParagraph();
        const H3Component = components.h3 || 'h3';
        elements.push(ReactModule.createElement(H3Component, { key: elements.length }, line.slice(4)));
      } else if (line.startsWith('## ')) {
        flushParagraph();
        const H2Component = components.h2 || 'h2';
        elements.push(ReactModule.createElement(H2Component, { key: elements.length }, line.slice(3)));
      } else if (line.startsWith('# ')) {
        flushParagraph();
        const H1Component = components.h1 || 'h1';
        elements.push(ReactModule.createElement(H1Component, { key: elements.length }, line.slice(2)));
      } else {
        currentParagraph.push(line);
      }
    }
    flushParagraph();

    return ReactModule.createElement('div', { className: 'react-markdown' }, elements);
  };
});

// Mock dynamic DiagramRenderer to isolate ChatMessageItem tests
jest.mock('./DiagramRenderer/DiagramRenderer', () => {
  return function MockDiagramRenderer({ chartData, type }: { chartData: string; type: string }) {
    return <div data-testid="mock-diagram-renderer" data-type={type}>{chartData}</div>;
  };
});

// Mock dynamic ECharts component if loaded by DiagramRenderer
jest.mock('echarts-for-react', () => {
  return function DummyReactECharts(props: Record<string, unknown>) {
    return <div data-testid="mock-echarts">{JSON.stringify(props.option)}</div>;
  };
});

// Import component under test after hoisted mocks
import ChatMessageItem from './ChatMessageItem';
import { ChatMessage } from '@/app/api/solve/route';

describe('ChatMessageItem - ADR-0008 Hybrid Resilient Streaming & Zero-Flash Math UI', () => {
  const defaultHandlers = {
    onRescan: jest.fn(),
    onCopy: jest.fn(),
    onShare: jest.fn(),
    onFeedback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Live Continuous Markdown Streaming (Zero <pre> Flash)', () => {
    it('does NOT render <pre> tag when isCurrentlyStreaming is true, rendering markdown elements and an inline streaming cursor instead', () => {
      const msg: ChatMessage = {
        role: 'model',
        text: '### Key Findings\n\nThe calculation gives: $v = u + at$',
      };

      const { container } = render(
        <ChatMessageItem
          msg={msg}
          index={0}
          isCurrentlyStreaming={true}
          copied={false}
          feedback={null}
          {...defaultHandlers}
        />
      );

      // 1. Must NOT render raw <pre> tag during streaming
      expect(container.querySelector('pre')).toBeNull();

      // 2. Must render parsed markdown headings and paragraphs
      expect(screen.getByRole('heading', { level: 3, name: /Key Findings/i })).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();

      // 3. Must render an inline streaming cursor
      const cursor = container.querySelector('.streaming-cursor, [data-testid="streaming-cursor"]');
      expect(cursor).toBeInTheDocument();
    });

    it('does not render ActionBar when isCurrentlyStreaming is true', () => {
      const msg: ChatMessage = {
        role: 'model',
        text: 'Incomplete streamed response...',
      };

      render(
        <ChatMessageItem
          msg={msg}
          index={0}
          isCurrentlyStreaming={true}
          copied={false}
          feedback={null}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByRole('button', { name: /Copy solution/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Mark as helpful/i })).not.toBeInTheDocument();
    });
  });

  describe('Fail-Safe KaTeX Pipeline (ADR-0008 throwOnError: false)', () => {
    it('does NOT crash into SolutionErrorBoundary when text contains invalid or malformed LaTeX', () => {
      // Suppress expected React error boundary console output when testing error boundary catch
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const malformedMsg: ChatMessage = {
        role: 'model',
        text: 'Invalid LaTeX command: $x = \\brokencommand{foo}$',
      };

      render(
        <ChatMessageItem
          msg={malformedMsg}
          index={0}
          isCurrentlyStreaming={false}
          copied={false}
          feedback={null}
          {...defaultHandlers}
        />
      );

      // Under ADR-0008, rehype-katex must be configured with { throwOnError: false }
      // The component must not catch an unhandled KaTeX error and collapse into the fallback error UI
      expect(screen.queryByText(/Render failed\. Showing raw text:/i)).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Semantic Section Mapping (Bento Layout)', () => {
    it('renders structured semantic card wrappers for Subject, Given, Approach, Solution, and Answer sections', () => {
      const structuredSolution = `### Subject
Physics

### Given
- Mass $m = 10\\text{ kg}$
- Velocity $v = 5\\text{ m/s}$

### Approach
Compute kinetic energy using $E_k = \\frac{1}{2}mv^2$.

### Solution
$$E_k = \\frac{1}{2} \\times 10 \\times 5^2 = 125\\text{ J}$$

### Answer
The kinetic energy is **125 J**.`;

      const msg: ChatMessage = {
        role: 'model',
        text: structuredSolution,
      };

      const { container } = render(
        <ChatMessageItem
          msg={msg}
          index={0}
          isCurrentlyStreaming={false}
          copied={false}
          feedback={null}
          {...defaultHandlers}
        />
      );

      // 1. Subject badge wrapper
      const subjectBadge = container.querySelector(
        '[data-testid="subject-badge"], [data-testid="section-subject"], [data-section="subject"]'
      );
      expect(subjectBadge).toBeInTheDocument();
      expect(subjectBadge).toHaveTextContent(/Physics/i);
      expect(subjectBadge?.querySelector('h3')).toBeNull();
      expect(subjectBadge?.querySelector('p')).toBeNull();

      // 2. Given section card wrapper
      const givenCard = container.querySelector(
        '[data-testid="given-card"], [data-testid="section-given"], [data-section="given"]'
      );
      expect(givenCard).toBeInTheDocument();

      // 3. Approach section card wrapper
      const approachCard = container.querySelector(
        '[data-testid="approach-card"], [data-testid="section-approach"], [data-section="approach"]'
      );
      expect(approachCard).toBeInTheDocument();

      // 4. Solution section card wrapper
      const solutionCard = container.querySelector(
        '[data-testid="solution-card"], [data-testid="section-solution"], [data-section="solution"]'
      );
      expect(solutionCard).toBeInTheDocument();

      // 5. Final Answer highlight card wrapper
      const answerHighlight = container.querySelector(
        '[data-testid="final-answer"], [data-testid="answer-highlight"], [data-testid="section-answer"], [data-section="answer"]'
      );
      expect(answerHighlight).toBeInTheDocument();
      expect(answerHighlight).toHaveTextContent(/125 J/);
    });

    it('does not fracture sections when code blocks contain ### comments', () => {
      const codeSnippetSolution = `### Approach
Here is the simulation code:
\`\`\`python
### Step 1: Initialize values
v = 10
### Step 2: Compute
\`\`\`

### Answer
The velocity is 10 m/s.`;

      const msg: ChatMessage = {
        role: 'model',
        text: codeSnippetSolution,
      };

      const { container } = render(
        <ChatMessageItem
          msg={msg}
          index={0}
          isCurrentlyStreaming={false}
          copied={false}
          feedback={null}
          {...defaultHandlers}
        />
      );

      // Should only have 2 sections: Approach and Answer
      const approachCard = container.querySelector('[data-testid="approach-card"]');
      const answerCard = container.querySelector('[data-testid="final-answer"]');
      expect(approachCard).toBeInTheDocument();
      expect(answerCard).toBeInTheDocument();
      expect(container.querySelectorAll('[data-section]')).toHaveLength(2);
    });
  });


  describe('User Message & Interaction Baseline', () => {
    it('renders user text message and image with rescan button', () => {
      const userMsg: ChatMessage = {
        role: 'user',
        text: 'Calculate the total momentum.',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      render(
        <ChatMessageItem
          msg={userMsg}
          index={0}
          showRescanButton={true}
          isCurrentlyStreaming={false}
          copied={false}
          feedback={null}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Calculate the total momentum.')).toBeInTheDocument();
      expect(screen.getByAltText('Uploaded reference')).toBeInTheDocument();

      const rescanBtn = screen.getByRole('button', { name: /start over/i });
      expect(rescanBtn).toBeInTheDocument();
      fireEvent.click(rescanBtn);
      expect(defaultHandlers.onRescan).toHaveBeenCalledTimes(1);
    });

    it('renders ActionBar and triggers copy/share/feedback callbacks for complete model messages', () => {
      const msg: ChatMessage = {
        role: 'model',
        text: 'Completed explanation.',
      };

      render(
        <ChatMessageItem
          msg={msg}
          index={1}
          isCurrentlyStreaming={false}
          copied={false}
          feedback={null}
          {...defaultHandlers}
        />
      );

      const copyBtn = screen.getByRole('button', { name: /copy solution/i });
      fireEvent.click(copyBtn);
      expect(defaultHandlers.onCopy).toHaveBeenCalledWith(1, 'Completed explanation.');

      const upBtn = screen.getByRole('button', { name: /mark as helpful/i });
      fireEvent.click(upBtn);
      expect(defaultHandlers.onFeedback).toHaveBeenCalledWith(1, 'up', 'Completed explanation.');
    });
  });
});
