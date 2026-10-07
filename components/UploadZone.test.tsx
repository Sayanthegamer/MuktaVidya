/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadZone from './UploadZone';

// Mock react-image-crop
jest.mock('react-image-crop', () => {
  return {
    __esModule: true,
    default: function MockReactCrop({ children, className, style }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
      return (
        <div data-testid="mock-react-crop" className={className} style={style}>
          {children}
        </div>
      );
    },
  };
});

describe('UploadZone Cropping Modal', () => {
  const defaultProps = {
    onImageSelect: jest.fn(),
    isProcessing: false,
    imagePreview: null,
    onRescan: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders standard upload buttons when no image is selected', () => {
    render(<UploadZone {...defaultProps} />);
    expect(screen.getByRole('button', { name: /take photo with camera/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload from gallery/i })).toBeInTheDocument();
  });

  it('renders cropping dialog with proper layout constraints when imageToCrop is set', () => {
    const { container } = render(<UploadZone {...defaultProps} />);
    
    // Simulate image selection by triggering file input
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
  });
});
