import { useState, useRef, DragEvent, ChangeEvent } from "react";
import imageCompression from "browser-image-compression";

export function useUploadZone(onImageLoaded: (base64: string) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onerror = () => {
        console.error("FileReader error", reader.error);
      };
      reader.onloadend = () => {
        if (reader.error) {
          console.error("Error reading file", reader.error);
          return;
        }
        if (reader.result && typeof reader.result === 'string') {
          onImageLoaded(reader.result);
        } else {
          console.error("FileReader result is null or not a string");
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image", error);
    }
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUploadZoneKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return {
    isDragging,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    handleUploadZoneKeyDown
  };
}
