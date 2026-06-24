import { useState, useRef } from "react";
import type { Crop } from "react-image-crop";

export function useImageCrop(onImageSelect: (base64: string) => void) {
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

  return {
    imageToCrop,
    crop,
    setCrop,
    imageRef,
    handleCropComplete,
    handleCancelCrop,
    handleImageLoaded
  };
}
