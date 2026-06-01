/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartRenderer from './ChartRenderer';

// Mock the ReactECharts component since we're using JSDOM for testing this
jest.mock('echarts-for-react', () => {
  return function DummyReactECharts(props: Record<string, unknown>) {
    return <div data-testid="mock-echarts">{JSON.stringify(props.option)}</div>;
  };
});

describe('ChartRenderer', () => {
  it('renders a valid echarts JSON option', () => {
    const chartData = `
    {
      "title": { "text": "Test Chart" },
      "series": [{ "data": [1, 2, 3], "type": "line" }]
    }`;

    const { getByTestId, queryByText } = render(<ChartRenderer chartData={chartData} />);

    expect(getByTestId('mock-echarts')).toBeInTheDocument();
    // It should have injected the default colors and themes
    const renderedOption = JSON.parse(getByTestId('mock-echarts').textContent!);
    expect(renderedOption.backgroundColor).toBe('transparent');
    expect(renderedOption.title.textStyle.color).toBe('var(--text-primary)');
    expect(queryByText('Failed to render chart configuration.')).not.toBeInTheDocument();
  });

  it('handles invalid JSON gracefully', () => {
    const invalidData = '{ "broken: json';
    const { getByText } = render(<ChartRenderer chartData={invalidData} />);

    expect(getByText('Failed to render chart configuration.')).toBeInTheDocument();
    expect(getByText(invalidData)).toBeInTheDocument();
  });

  it('handles markdown fences in the JSON gracefully', () => {
    const fencedData = `\`\`\`json
    {
      "title": { "text": "Fenced Chart" }
    }
    \`\`\``;

    const { getByTestId } = render(<ChartRenderer chartData={fencedData} />);
    expect(getByTestId('mock-echarts')).toBeInTheDocument();
    const renderedOption = JSON.parse(getByTestId('mock-echarts').textContent!);
    expect(renderedOption.title.text).toBe('Fenced Chart');
  });
});
