export interface CompressImageOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Compresses an image file in the browser and converts it to a base64 Data URL.
 * Uses dynamic import for `browser-image-compression` to keep initial bundle size lean.
 */
export async function compressImageToDataUrl(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = false,
  } = options;


  const imageCompression = (await import('browser-image-compression')).default;
  let compressedFile: File | Blob;
  try {
    compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
    });
  } catch (workerError) {
    if (useWebWorker) {
      compressedFile = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: false,
      });
    } else {
      throw workerError;
    }
  }

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read compressed file'));
    };

    reader.onloadend = () => {
      if (reader.error) {
        reject(reader.error);
        return;
      }
      if (reader.result && typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is empty or not a string'));
      }
    };

    reader.readAsDataURL(compressedFile);
  });
}
