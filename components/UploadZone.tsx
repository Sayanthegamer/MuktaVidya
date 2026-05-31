"use client";
import { CameraPlus, Images, ArrowCounterClockwise } from "@phosphor-icons/react";
import Image from "next/image";
import { useUploadZone } from "../hooks/useUploadZone";
import { useState, useRef, ChangeEvent } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface UploadZoneProps {
  onImageSelect: (base64: string) => void;
  isProcessing: boolean;
  imagePreview: string | null;
  onRescan: () => void;
}

export default function UploadZone({ onImageSelect, isProcessing, imagePreview, onRescan }: UploadZoneProps) {
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCropComplete = async () => {
    if (!imageRef.current || !crop || !crop.width || !crop.height) {
      if (imageToCrop) onImageSelect(imageToCrop);
      setImageToCrop(null);
      return;
    }

    const canvas = document.createElement("canvas");
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);
    onImageSelect(croppedBase64);
    setImageToCrop(null);
  };

  const handleCancelCrop = () => {
    setImageToCrop(null);
    setCrop(undefined);
  };

  const handleImageLoaded = (base64: string) => {
    setImageToCrop(base64);
  };

  const {
    isDragging,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    handleUploadZoneKeyDown
  } = useUploadZone(handleImageLoaded);

  // Separate ref for the gallery input (no capture attribute)
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const onGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Reuse the same handler from the hook — just delegate to onFileChange
    onFileChange(e);
  };

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-full p-6 grid grid-cols-1 grid-rows-1">
      {/* Hidden input: camera capture */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
        ref={fileInputRef}
        aria-hidden="true"
      />

      {/* Hidden input: gallery / file picker (no capture) */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onGalleryChange}
        ref={galleryInputRef}
        aria-hidden="true"
      />

      {/* State 1: Upload Zone */}
      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onKeyDown={handleUploadZoneKeyDown}
        tabIndex={-1}
        role="presentation"
        className={`
          upload-zone relative w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed
          col-start-1 row-start-1
          transition-opacity duration-300 ease-out
          ${imagePreview || imageToCrop ? "opacity-0 pointer-events-none" : "opacity-100"}
          ${isDragging
            ? "is-dragging bg-transparent border-[var(--accent)]"
            : "border-[var(--border-subtle)] bg-transparent"
          }
        `}
      >
        <CameraPlus
          size={32}
          className={`mb-4 transition-colors ${isDragging ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
          weight={isDragging ? "fill" : "regular"}
        />

        {isDragging ? (
          <span className="text-[var(--text-muted)] text-sm font-medium">Release to analyze</span>
        ) : (
          <>
            <span className="text-[var(--text-muted)] text-sm font-medium mb-6">
              Snap or upload a question
            </span>

            {/* Two explicit action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors btn-press"
                aria-label="Take photo with camera"
              >
                <CameraPlus size={15} weight="bold" />
                Camera
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors btn-press"
                aria-label="Upload from gallery"
              >
                <Images size={15} />
                Gallery
              </button>
            </div>

            <span className="text-[var(--text-muted)] text-xs tracking-wider mt-6 font-mono uppercase">
              WBJEE · JEE · NEET
            </span>
          </>
        )}
      </label>


      {/* State 3: Cropping UI */}
      {imageToCrop && !imagePreview && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--surface-0)] p-4 col-start-1 row-start-1 h-full w-full">
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0">
             <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={imageToCrop}
                  alt="Crop preview"
                  className="max-w-full max-h-[60vh] object-contain"
                />
             </ReactCrop>
          </div>
          <div className="flex items-center gap-4 mt-6 shrink-0">
            <button
              onClick={handleCancelCrop}
              className="px-4 py-2 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCropComplete}
              className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              Crop & Solve
            </button>
          </div>
        </div>
      )}

      {/* State 2: Image Preview */}
      <div
        className={`
          relative w-full h-full rounded-lg overflow-hidden
          col-start-1 row-start-1
          transition-opacity duration-300 ease-out
          ${!imagePreview ? "opacity-0 pointer-events-none" : "opacity-100"}
          ${isProcessing ? "scanner-active" : ""}
        `}
      >
        {imagePreview && (
          <Image src={imagePreview} alt="Question preview" fill className="w-full h-full object-cover" unoptimized />
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-xs text-white/70 font-mono tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              Analyzing...
            </span>
          </div>
        )}

        {!isProcessing && imagePreview && (
          <button
            onClick={onRescan}
            className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-1)]/90 backdrop-blur-md rounded-md border border-[var(--border-subtle)] text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors btn-press shadow-sm z-10"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span className="text-xs font-medium">Rescan</span>
          </button>
        )}
      </div>

    </div>
  );
}
