/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiagramRenderer from './DiagramRenderer';
import { sanitize } from 'isomorphic-dompurify';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((str) => str)
}));

// Mock the ReactECharts component since we're using JSDOM for testing this
jest.mock('echarts-for-react', () => {
  return function DummyReactECharts(props: Record<string, unknown>) {
    return <div data-testid="mock-echarts">{JSON.stringify(props.option)}</div>;
  };
});

describe('DiagramRenderer', () => {
  describe('ECharts rendering (type="chart")', () => {
    it('renders a valid echarts JSON option', async () => {
      const chartData = `
      {
        "title": { "text": "Test Chart" },
        "series": [{ "data": [1, 2, 3], "type": "line" }]
      }`;

      const { findByTestId, queryByText } = render(<DiagramRenderer chartData={chartData} type="chart" />);

      const mockEcharts = await findByTestId('mock-echarts');
      expect(mockEcharts).toBeInTheDocument();
      // It should have injected the default colors and themes
      const renderedOption = JSON.parse(mockEcharts.textContent!);
      expect(renderedOption.backgroundColor).toBe('transparent');
      expect(renderedOption.title.textStyle.color).toBe('var(--text-primary)');
      expect(queryByText('Failed to render chart configuration.')).not.toBeInTheDocument();
    });

    it('handles invalid JSON gracefully', () => {
      const invalidData = '{ "broken: json';
      const { getByText } = render(<DiagramRenderer chartData={invalidData} type="chart" />);

      expect(getByText(invalidData)).toBeInTheDocument();
    });

    it('handles markdown fences in the JSON gracefully', async () => {
      const fencedData = `\`\`\`json
      {
        "title": { "text": "Fenced Chart" }
      }
      \`\`\``;

      const { findByTestId } = render(<DiagramRenderer chartData={fencedData} type="chart" />);
      const mockEcharts = await findByTestId('mock-echarts');
      expect(mockEcharts).toBeInTheDocument();
      const renderedOption = JSON.parse(mockEcharts.textContent!);
      expect(renderedOption.title.text).toBe('Fenced Chart');
    });
  });

  describe('SVG rendering (type="svg")', () => {
    beforeEach(() => {
      (sanitize as jest.Mock).mockClear();
    });

    it('renders a valid SVG', () => {
      const svgData = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>`;
      const { container } = render(<DiagramRenderer chartData={svgData} type="svg" />);

      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement?.innerHTML).toContain('<circle cx="50" cy="50" r="40"');
    });

    it('calls sanitize with security options', () => {
      const svgData = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>`;
      render(<DiagramRenderer chartData={svgData} type="svg" />);

      expect(sanitize).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          FORBID_TAGS: ['script', 'foreignObject', 'style'],
          FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
        })
      );
    });

    it('handles markdown fences in the SVG gracefully', () => {
      const fencedData = `\`\`\`svg-diagram\n<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>\n\`\`\``;
      const { container } = render(<DiagramRenderer chartData={fencedData} type="svg" />);

      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });

    it('handles invalid SVG gracefully', () => {
      const invalidData = `not an svg`;
      const { getByText } = render(<DiagramRenderer chartData={invalidData} type="svg" />);

      expect(getByText('Invalid diagram vector data.')).toBeInTheDocument();
    });
  });
});
