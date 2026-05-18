"use client";
import { CameraPlus, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import imageCompression from "browser-image-compression";

interface UploadZoneProps {
  onImageSelect: (base64: string) => void;
  isProcessing: boolean;
  imagePreview: string | null;
  onRescan: () => void;
}

export default function UploadZone({ onImageSelect, isProcessing, imagePreview, onRescan }: UploadZoneProps) {
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
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
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

  if (imagePreview) {
    return (
      <div className={`relative w-full h-full min-h-[400px] md:min-h-full rounded-lg overflow-hidden ${isProcessing ? "scanner-active" : ""}`}>
        <img src={imagePreview} alt="Question preview" className="w-full h-full object-cover" />

        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-xs text-white/70 font-mono tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              Analyzing...
            </span>
          </div>
        )}

        {!isProcessing && (
          <button
            onClick={onRescan}
            className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-1)]/90 backdrop-blur-md rounded-md border border-[var(--border-subtle)] text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors btn-press shadow-sm"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span className="text-xs font-medium">Rescan</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-full p-6">
      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          upload-zone w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer
          ${isDragging
            ? "bg-[var(--accent-muted)] border-[var(--accent)]"
            : "border-[var(--border-subtle)] hover:border-[var(--accent-border)] hover:bg-[var(--surface-2)]"
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
          ref={fileInputRef}
          aria-hidden="true"
        />

        <CameraPlus
          size={32}
          className={`mb-4 transition-colors ${isDragging ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--accent)]"}`}
          weight={isDragging ? "fill" : "regular"}
        />

        <span className="text-[var(--text-muted)] text-sm font-medium">
          {isDragging ? "Release to analyze" : "Drop an image or tap to scan"}
        </span>

        {!isDragging && (
          <span className="text-[var(--text-muted)] text-xs tracking-wider mt-2 font-mono uppercase">
            WBJEE · JEE · NEET
          </span>
        )}
      </label>
    </div>
  );
}
