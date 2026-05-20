"use client";
import { CameraPlus, ArrowCounterClockwise } from "@phosphor-icons/react";
import Image from "next/image";
import { useUploadZone } from "../hooks/useUploadZone";

interface UploadZoneProps {
  onImageSelect: (base64: string) => void;
  isProcessing: boolean;
  imagePreview: string | null;
  onRescan: () => void;
}

export default function UploadZone({ onImageSelect, isProcessing, imagePreview, onRescan }: UploadZoneProps) {
  const {
    isDragging,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    handleUploadZoneKeyDown
  } = useUploadZone(onImageSelect);

  if (imagePreview) {
    return (
      <div className={`relative w-full h-full min-h-[400px] md:min-h-full rounded-lg overflow-hidden ${isProcessing ? "scanner-active" : ""}`}>
        <Image src={imagePreview} alt="Question preview" fill className="w-full h-full object-cover" unoptimized />

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
        onKeyDown={handleUploadZoneKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Upload or capture question image"
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
