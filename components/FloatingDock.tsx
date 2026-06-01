"use client";
import { PaperPlaneRight, Stop, Image as ImageIcon, X } from "@phosphor-icons/react";
import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";

interface FloatingDockProps {
  onFollowUp: (text?: string, imageBase64?: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}

export default function FloatingDock({ onFollowUp, isStreaming, onStop }: FloatingDockProps) {
  const [text, setText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll detection to hide/show dock based on rules:
  // Visible if streaming OR if user has scrolled to absolute bottom.
  useEffect(() => {
    const handleScroll = () => {
      // If streaming, always visible
      if (isStreaming) {
        setIsVisible(true);
        return;
      }

      // Check if at the bottom of the scroll container
      // Since it's a layout with overflow, we need to check the main container
      const container = document.querySelector('section.overflow-y-auto');
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50; // 50px threshold
        setIsVisible(isAtBottom);
      }
    };

    const container = document.querySelector('section.overflow-y-auto');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Trigger once on mount
      handleScroll();
    }

    // Also listen to window resize to recalculate
    window.addEventListener('resize', handleScroll);

    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = () => {
    if ((!text.trim() && !attachedImage) || isStreaming) return;

    onFollowUp(text.trim(), attachedImage || undefined);
    setText("");
    setAttachedImage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          setAttachedImage(reader.result);
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image", error);
    }

    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50 transition-transform duration-500 ease-out flex justify-center pointer-events-none ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="w-full max-w-3xl relative pointer-events-auto group">

        {/* Alien Glow Effect (CSS only, behind the dock) */}
        <div className="absolute -inset-1 bg-black rounded-2xl opacity-0" />
        <div className={`absolute -inset-1 rounded-2xl bg-[var(--accent)] filter blur-md opacity-20 transition-opacity duration-1000 ${isStreaming ? 'animate-alien-breathe' : 'group-hover:opacity-30'}`} />

        {/* Main Dock Container */}
        <div className="relative w-full bg-black border border-[var(--border-strong)] rounded-2xl p-2 flex flex-col gap-2 shadow-2xl backdrop-blur-md">

          {/* Image Preview Area */}
          {attachedImage && (
            <div className="relative self-start mt-2 ml-2 rounded-lg overflow-hidden border border-[var(--border-subtle)] w-20 h-20 group/preview">
              <Image src={attachedImage} alt="Attached" fill className="object-cover" unoptimized />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 px-2 pb-1">
            {/* Attach Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 mb-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors btn-press shrink-0"
              title="Attach Image"
              disabled={isStreaming}
            >
              <ImageIcon size={22} />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {/* Auto-resizing Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              className="flex-1 max-h-[120px] min-h-[24px] bg-transparent border-none outline-none resize-none py-2.5 text-[0.9375rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans leading-relaxed scrollbar-thin"
              disabled={isStreaming}
              rows={1}
            />

            {/* Submit / Stop Button */}
            {isStreaming ? (
              <button
                onClick={onStop}
                className="p-2.5 mb-1 rounded-full bg-[var(--surface-3)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors btn-press shrink-0"
                title="Stop Generating"
              >
                <Stop size={20} weight="fill" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim() && !attachedImage}
                className={`p-2.5 mb-1 rounded-full transition-all duration-200 btn-press shrink-0 ${
                  (text.trim() || attachedImage)
                    ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(var(--accent),0.5)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <PaperPlaneRight size={20} weight="fill" />
              </button>
            )}
          </div>
        </div>

        {/* Disclaimer Text */}
        <div className="absolute -bottom-6 left-0 right-0 text-center pointer-events-none">
           <span className="text-[10px] text-[var(--text-muted)] tracking-wide">
             AI can make mistakes. Verify important information.
           </span>
        </div>
      </div>
    </div>
  );
}
