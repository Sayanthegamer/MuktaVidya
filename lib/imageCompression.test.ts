/**
 * @jest-environment jsdom
 */
import { compressImageToDataUrl } from './imageCompression';

jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((file) => Promise.resolve(file)),
}));

interface MockFileReader {
  readAsDataURL: jest.Mock<void, [Blob]>;
  onloadend: (() => void) | null;
  onerror: (() => void) | null;
  result: string | null;
  error: Error | DOMException | null;
}

describe('compressImageToDataUrl', () => {
  it('compresses a File and converts it to a data URL string', async () => {
    const file = new File(['mock content'], 'test.png', { type: 'image/png' });
    
    const originalFileReader = window.FileReader;
    const mockFileReaderInstance: MockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      onerror: null,
      result: null,
      error: null,
    };
    mockFileReaderInstance.readAsDataURL.mockImplementation(() => {
      mockFileReaderInstance.result = 'data:image/jpeg;base64,mockbase64data';
      mockFileReaderInstance.onloadend?.();
    });

    window.FileReader = jest.fn(() => mockFileReaderInstance) as unknown as typeof FileReader;

    try {
      const result = await compressImageToDataUrl(file);
      expect(result).toBe('data:image/jpeg;base64,mockbase64data');
      expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalled();
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it('rejects if FileReader encounters an error', async () => {
    const file = new File(['mock content'], 'test.png', { type: 'image/png' });
    
    const originalFileReader = window.FileReader;
    const mockFileReaderInstance: MockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      onerror: null,
      result: null,
      error: null,
    };
    mockFileReaderInstance.readAsDataURL.mockImplementation(() => {
      mockFileReaderInstance.error = new Error('File read failure');
      mockFileReaderInstance.onerror?.();
    });

    window.FileReader = jest.fn(() => mockFileReaderInstance) as unknown as typeof FileReader;

    try {
      await expect(compressImageToDataUrl(file)).rejects.toThrow('File read failure');
    } finally {
      window.FileReader = originalFileReader;
    }
  });
});
