import { createPortal } from "react-dom";
import ReactCrop, { type Crop } from "react-image-crop";
import { RefObject } from "react";
import "react-image-crop/dist/ReactCrop.css";

interface CropDialogProps {
  imageToCrop: string | null;
  imagePreview: string | null;
  crop: Crop | undefined;
  setCrop: (crop: Crop) => void;
  imageRef: RefObject<HTMLImageElement | null>;
  onCancel: () => void;
  onComplete: () => void;
}

export function CropDialog({
  imageToCrop,
  imagePreview,
  crop,
  setCrop,
  imageRef,
  onCancel,
  onComplete
}: CropDialogProps) {
  if (typeof document === "undefined" || !document.body) return null;
  if (!imageToCrop || imagePreview) return null;

  return createPortal(
    // react-doctor-disable-next-line react-doctor/prefer-tag-over-role, react-doctor/prefer-html-dialog
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--surface-0)] sm:bg-[var(--surface-0)]/95 sm:backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="crop-dialog-title">
      {/* Header/Title area (optional, helps with spacing) */}
      <div className="shrink-0 p-4 flex justify-center items-center border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <span id="crop-dialog-title" className="text-sm font-medium text-[var(--text-primary)]">Crop Image</span>
      </div>

      {/* Image container */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-4 min-h-0">
         <ReactCrop crop={crop} onChange={c => setCrop(c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* react-doctor-disable-next-line react-doctor/nextjs-no-img-element */}
            <img
              ref={imageRef as RefObject<HTMLImageElement>}
              src={imageToCrop}
              alt="Crop preview"
              className="max-w-full max-h-[70vh] object-contain"
            />
         </ReactCrop>
      </div>

      {/* Footer with buttons - Fixed at bottom */}
      <div className="shrink-0 flex items-center justify-center gap-4 p-4 pb-safe border-t border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="px-6 py-3 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          Crop & Solve
        </button>
      </div>
    </div>,
    document.body
  );
}
