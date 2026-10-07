import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { compressImageToDataUrl } from "../lib/imageCompression";

export function useUploadZone(onImageLoaded: (base64: string) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (isCompressing) return;
    setIsCompressing(true);

    try {
      const base64 = await compressImageToDataUrl(file);
      onImageLoaded(base64);
    } catch (error) {
      console.error("Error compressing image", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isCompressing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isCompressing) return;
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUploadZoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isCompressing) return;
      fileInputRef.current?.click();
    }
  };

  return {
    isDragging,
    isCompressing,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    handleUploadZoneKeyDown
  };
}
