"use client";
import { CameraPlus, Images, ArrowCounterClockwise, CircleNotch, MagnifyingGlassPlus, MagnifyingGlassMinus } from "@phosphor-icons/react";
import Image from "next/image";
import { useUploadZone } from "../hooks/useUploadZone";
import { useState, useRef, ChangeEvent } from "react";
import { createPortal } from "react-dom";
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
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCropComplete = async () => {
    if (!imageRef.current || !crop || !crop.width || !crop.height) {
      if (imageToCrop) onImageSelect(imageToCrop);
      setImageToCrop(null);
      return;
    }

    const img = imageRef.current;
    const isPercent = crop.unit === '%';
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropX = isPercent ? (crop.x / 100) * img.naturalWidth : crop.x * scaleX;
    const cropY = isPercent ? (crop.y / 100) * img.naturalHeight : crop.y * scaleY;
    const cropWidth = isPercent ? (crop.width / 100) * img.naturalWidth : crop.width * scaleX;
    const cropHeight = isPercent ? (crop.height / 100) * img.naturalHeight : crop.height * scaleY;

    if (cropWidth <= 0 || cropHeight <= 0) {
      if (imageToCrop) onImageSelect(imageToCrop);
      setImageToCrop(null);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);
    onImageSelect(croppedBase64);
    setImageToCrop(null);
    setCrop(undefined);
    setZoom(1);
  };

  const handleCancelCrop = () => {
    setImageToCrop(null);
    setCrop(undefined);
    setZoom(1);
  };

  const handleImageLoaded = (base64: string) => {
    setImageToCrop(base64);
    setCrop(undefined);
    setZoom(1);
  };

  const {
    isDragging,
    isCompressing,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange
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
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Hidden input: gallery / file picker (no capture) */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onGalleryChange}
        ref={galleryInputRef}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* State 1: Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
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
          <div aria-live="polite" aria-busy={isCompressing} className="flex flex-col items-center">
            <span className="text-[var(--text-muted)] text-sm font-medium mb-6">
              {isCompressing ? "Processing..." : "Snap or upload a question"}
            </span>

            {/* Two explicit action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isCompressing) return;
                  fileInputRef.current?.click();
                }}
                aria-disabled={isCompressing}
                className={`flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-white text-xs font-medium transition-colors btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isCompressing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--accent-hover)]'}`}
                aria-label="Take photo with camera"
                title={isCompressing ? "Processing..." : "Take photo with camera"}
              >
                {isCompressing ? <CircleNotch size={15} className="animate-spin" aria-hidden="true" /> : <CameraPlus size={15} weight="bold" aria-hidden="true" />}
                {isCompressing ? "Processing..." : "Camera"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isCompressing) return;
                  galleryInputRef.current?.click();
                }}
                aria-disabled={isCompressing}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-medium transition-colors btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isCompressing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'}`}
                aria-label="Upload from gallery"
                title={isCompressing ? "Processing..." : "Upload from gallery"}
              >
                {isCompressing ? <CircleNotch size={15} className="animate-spin" aria-hidden="true" /> : <Images size={15} aria-hidden="true" />}
                {isCompressing ? "Processing..." : "Gallery"}
              </button>
            </div>

            <span className="text-[var(--text-muted)] text-xs tracking-wider mt-6 font-mono uppercase">
              WBJEE · JEE · NEET
            </span>
          </div>
        )}
      </div>


      {/* State 3: Cropping UI */}
      {typeof document !== "undefined" && document.body && imageToCrop && !imagePreview && (
        createPortal(
          // react-doctor-disable-next-line react-doctor/prefer-tag-over-role, react-doctor/prefer-html-dialog
          <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--surface-0)] sm:bg-[var(--surface-0)]/95 sm:backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="crop-dialog-title">
            {/* Header/Title area */}
            <div className="shrink-0 px-4 py-3 flex justify-between items-center border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
              <div className="flex items-center gap-2">
                <span id="crop-dialog-title" className="text-sm font-semibold text-[var(--text-primary)]">Crop Question</span>
                <span className="hidden md:inline-block text-xs text-[var(--text-muted)]">
                  · Drag across the image to select the question you want solved
                </span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(1, Number((prev - 0.25).toFixed(2))))}
                  disabled={zoom <= 1}
                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <MagnifyingGlassMinus size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-2 py-0.5 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Reset zoom"
                  title="Reset zoom to fit screen"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(2.5, Number((prev + 0.25).toFixed(2))))}
                  disabled={zoom >= 2.5}
                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <MagnifyingGlassPlus size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Image container */}
            <div className="flex-1 w-full flex items-center justify-center overflow-auto p-4 min-h-0 crop-modal-viewport select-none">
               <ReactCrop
                 crop={crop}
                 onChange={c => setCrop(c)}
                 className="max-h-full max-w-full"
                 style={{
                   maxHeight: zoom > 1 ? `calc((100dvh - 160px) * ${zoom})` : 'calc(100dvh - 160px)',
                   maxWidth: zoom > 1 ? `${zoom * 100}%` : '100%',
                 }}
               >
                  {/* react-doctor-disable-next-line react-doctor/nextjs-no-img-element */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={imageToCrop}
                    alt="Crop preview"
                    style={{
                      maxHeight: zoom > 1 ? `calc((100dvh - 160px) * ${zoom})` : 'calc(100dvh - 160px)',
                      maxWidth: zoom > 1 ? `${zoom * 100}%` : '100%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                    className="w-auto h-auto object-contain block select-none"
                  />
               </ReactCrop>
            </div>

            {/* Footer with buttons - Fixed at bottom */}
            <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 pb-safe border-t border-[var(--border-subtle)] bg-[var(--surface-1)]">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="px-4 py-2 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (imageToCrop) onImageSelect(imageToCrop);
                    setImageToCrop(null);
                    setCrop(undefined);
                    setZoom(1);
                  }}
                  className="px-4 py-2 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Use Full Image
                </button>
                <button
                  type="button"
                  onClick={handleCropComplete}
                  className="px-5 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm btn-press"
                >
                  {crop && crop.width && crop.height ? "Crop & Solve" : "Solve"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}

      {/* State 2: Image Preview */}
      <div
        aria-live="polite"
        aria-busy={isProcessing}
        className={`
          relative w-full h-full rounded-lg overflow-hidden
          col-start-1 row-start-1
          transition-opacity duration-300 ease-out
          ${!imagePreview ? "opacity-0 pointer-events-none" : "opacity-100"}
          ${isProcessing ? "scanner-active" : ""}
        `}
      >
        {imagePreview && (
          <Image src={imagePreview} alt="Question preview" fill sizes="(max-width: 768px) 100vw, 600px" className="w-full h-full object-cover" unoptimized />
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
            type="button"
            onClick={onRescan}
            className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-1)]/90 backdrop-blur-md rounded-md border border-[var(--border-subtle)] text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors btn-press shadow-sm z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span className="text-xs font-medium">Rescan</span>
          </button>
        )}
      </div>

    </div>
  );
}
