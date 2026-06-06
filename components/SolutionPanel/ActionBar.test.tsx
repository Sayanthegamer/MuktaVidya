import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ActionBar from '../../components/SolutionPanel/ActionBar';

describe('ActionBar Accessibility', () => {
  const defaultProps = {
    copied: false,
    feedback: null as 'up' | 'down' | null,
    onCopy: jest.fn(),
    onShare: jest.fn(),
    onFeedback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders copy button with correct attributes', () => {
    const { rerender } = render(<ActionBar {...defaultProps} />);

    let copyBtn = screen.getByRole('button', { name: 'Copy solution' });
    expect(copyBtn).toBeInTheDocument();
    expect(copyBtn).toHaveAttribute('title', 'Copy solution');

    // Rerender as copied
    rerender(<ActionBar {...defaultProps} copied={true} />);
    copyBtn = screen.getByRole('button', { name: 'Copied solution' });
    expect(copyBtn).toBeInTheDocument();
    expect(copyBtn).toHaveAttribute('title', 'Copied');
  });

  it('renders thumbs up button with correct attributes based on state', () => {
    const { rerender } = render(<ActionBar {...defaultProps} />);

    let upBtn = screen.getByRole('button', { name: 'Mark as helpful' });
    expect(upBtn).toBeInTheDocument();
    expect(upBtn).toHaveAttribute('aria-pressed', 'false');
    expect(upBtn).toHaveAttribute('title', 'Mark as helpful');

    // Rerender with feedback='up'
    rerender(<ActionBar {...defaultProps} feedback="up" />);
    upBtn = screen.getByRole('button', { name: 'Marked as helpful' });
    expect(upBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders thumbs down button with correct attributes based on state', () => {
    const { rerender } = render(<ActionBar {...defaultProps} />);

    let downBtn = screen.getByRole('button', { name: 'Mark as not helpful' });
    expect(downBtn).toBeInTheDocument();
    expect(downBtn).toHaveAttribute('aria-pressed', 'false');
    expect(downBtn).toHaveAttribute('title', 'Mark as not helpful');

    // Rerender with feedback='down'
    rerender(<ActionBar {...defaultProps} feedback="down" />);
    downBtn = screen.getByRole('button', { name: 'Marked as not helpful' });
    expect(downBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
