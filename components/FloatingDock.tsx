"use client";
import { PaperPlaneRight, Stop, Image as ImageIcon, X, CircleNotch } from "@phosphor-icons/react";
import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, memo } from "react";
import Image from "next/image";

interface FloatingDockProps {
  onFollowUp: (text?: string, imageBase64?: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}

// Memoize the dock to prevent it from re-rendering 50+ times per second
// during high-frequency AI streaming updates since it's a sibling of SolutionPanel.
const FloatingDock = memo(function FloatingDock({ onFollowUp, isStreaming, onStop }: FloatingDockProps) {
  const [text, setText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for visibility
  useEffect(() => {
    if (isStreaming) {
      setTimeout(() => setIsVisible(true), 0);
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }

    const target = document.getElementById('solution-bottom-target');
    if (!target) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsVisible(entry.isIntersecting);
          });
        },
        {
          root: null, // viewport or closest scroll container
          rootMargin: '100px', // trigger a bit before hitting absolute bottom
          threshold: 0,
        }
      );
    }

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const onStopRef = useRef(onStop);
  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  // Global Escape key to stop streaming
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isStreaming) {
        onStopRef.current();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isStreaming]);

  const handleSubmit = () => {
    if ((!text.trim() && !attachedImage) || isStreaming || isCompressing) return;

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

    setIsCompressing(true);
    try {
      const imageCompression = (await import("browser-image-compression")).default;
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
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image", error);
      setIsCompressing(false);
    }

    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50 transition-[transform,opacity] duration-500 ease-out flex justify-center pointer-events-none pb-safe ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="w-full max-w-3xl relative pointer-events-auto group">

        {/* Alien Glow Effect (Architecturally accurate pseudo-style) */}
        {/* react-doctor-disable-next-line react-doctor/no-large-animated-blur */}
        <div
          className="absolute -inset-[10px] -z-10 rounded-2xl pointer-events-none transition-opacity duration-1000 ease-out"
          style={{
             background: 'var(--accent)',
             filter: 'blur(20px)',
             opacity: isStreaming ? 0.25 : 0.1
          }}
          aria-hidden="true"
        />

        {/* Main Dock Container */}
        <div className="relative w-full bg-[var(--surface-0)]/80 border border-[var(--border-strong)] rounded-2xl p-2 flex flex-col gap-2 backdrop-blur-xl focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all duration-200">

          {/* Image Preview Area */}
          {attachedImage && (
            <div className="relative self-start mt-4 ml-4">
              <div className="relative rounded-lg overflow-hidden border border-[var(--border-subtle)] w-20 h-20">
                <Image src={attachedImage} alt="Attached" fill sizes="80px" className="object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 bg-[var(--surface-3)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)] border border-[var(--border-subtle)] rounded-full p-1 shadow-sm transition-colors z-10 btn-press"
                aria-label="Remove attachment"
              >
                <X size={12} weight="bold" aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 px-2 pb-1">
            {/* Attach Button */}
            <button
              type="button"
              onClick={() => {
                if (isStreaming || isCompressing) return;
                fileInputRef.current?.click();
              }}
              className={`p-2 mb-1 rounded-full text-[var(--text-muted)] transition-colors shrink-0 ${
                isStreaming || isCompressing
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] btn-press'
              }`}
              title={isCompressing ? "Compressing image..." : isStreaming ? "Wait for response to finish" : "Attach Image"}
              aria-label="Attach image"
              aria-disabled={isStreaming || isCompressing}
            >
              {isCompressing ? (
                <CircleNotch size={22} className="animate-spin" aria-hidden="true" />
              ) : (
                <ImageIcon size={22} aria-hidden="true" />
              )}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              aria-label="Upload question image"
              tabIndex={-1}
            />

            {/* Auto-resizing Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Ask a follow-up question"
              placeholder={
                isStreaming 
                  ? "Generating response..." 
                  : isCompressing 
                  ? "Compressing image..." 
                  : "Ask a follow-up question..."
              }
              className={`flex-1 max-h-[120px] min-h-[24px] bg-transparent border-none outline-none resize-none py-2.5 text-[0.9375rem] font-sans leading-relaxed scrollbar-thin placeholder-[var(--text-muted)] ${
                isStreaming || isCompressing 
                  ? 'text-[var(--text-muted)] cursor-not-allowed' 
                  : 'text-[var(--text-primary)]'
              }`}
              readOnly={isStreaming || isCompressing}
              rows={1}
            />

            {/* Submit / Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2.5 mb-1 rounded-full bg-[var(--surface-3)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors btn-press shrink-0"
                title="Stop Generating (Esc)"
                aria-label="Stop"
              >
                <Stop size={20} weight="fill" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  if ((!text.trim() && !attachedImage) || isCompressing) {
                    e.preventDefault();
                    return;
                  }
                  handleSubmit();
                }}
                aria-disabled={(!text.trim() && !attachedImage) || isCompressing}
                className={`p-2.5 mb-1 rounded-full transition-all duration-200 shrink-0 ${
                  (text.trim() || attachedImage) && !isCompressing
                    ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] btn-press'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                }`}
                title={isCompressing ? "Compressing image..." : (!text.trim() && !attachedImage) ? "Enter text or attach an image to send" : "Send Message (Enter)"}
                aria-label="Send"
              >
                <PaperPlaneRight size={20} weight="fill" aria-hidden="true" />
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
});

export default FloatingDock;