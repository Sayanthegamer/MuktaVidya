"use client";

import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from "@/components/MermaidDiagram";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMarkdown } from '@/lib/preprocessMarkdown';
import { SolutionErrorBoundary } from '@/components/SolutionErrorBoundary';
import { getInitialTheme, applyTheme, Theme } from '@/lib/theme';

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn' | 'hi'>('en');
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [history, setHistory] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = getInitialTheme();
    applyTheme(t);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(t);
    try {
      const hist = JSON.parse(localStorage.getItem('muktavidya_history') || '[]');
      if (Array.isArray(hist)) {
        setHistory(hist);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const sendFeedback = async (type: 'up' | 'down') => {
    setFeedback(type);
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, solutionLength: solution?.length }),
    }).catch(() => {});
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setSolution(null);
    setLoading(true);
    setIsStreaming(false);

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);

        try {
          const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64String, language }),
          });

          if (response.status === 429) {
            setSolution(
              "⏳ Our free AI is currently overloaded with requests from other students. " +
              "Please wait 60 seconds and try again. Your education is worth the wait!"
            );
            setLoading(false);
            return;
          }

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error ${response.status}`);
          }

          const bodyReader = response.body?.getReader();
          if (!bodyReader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let fullText = "";

          setLoading(false);
          setIsStreaming(true);

          while (true) {
            const { value, done } = await bodyReader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
            setSolution(fullText);
          }

          // Stream complete — final render will switch to KaTeX
          setIsStreaming(false);

          // Track Quota
          try {
            const today = new Date().toDateString();
            const usage = JSON.parse(localStorage.getItem('muktavidya_usage') || '{}');
            const todayCount = usage[today] || 0;
            usage[today] = todayCount + 1;
            localStorage.setItem('muktavidya_usage', JSON.stringify(usage));
          } catch {}

          // Save to localStorage history (keep last 10 solutions)
          try {
            const currentHistory = JSON.parse(localStorage.getItem('muktavidya_history') || '[]');
            const newItem = {
              imageBase64: base64String,
              solution: fullText,
              timestamp: Date.now(),
              language,
              preview: fullText.slice(0, 120),
            };
            const updatedHistory = Array.isArray(currentHistory)
              ? [newItem, ...currentHistory].slice(0, 10)
              : [newItem];
            localStorage.setItem('muktavidya_history', JSON.stringify(updatedHistory));
            setHistory(updatedHistory);
          } catch {} // Silently fail if localStorage is full

        } catch (err) {
          const message = err instanceof Error ? err.message : "Network error";
          setSolution(`Error: ${message}`);
          setLoading(false);
          setIsStreaming(false);
        }
      };

      reader.onerror = () => {
        setSolution("Failed to read the image file.");
        setLoading(false);
      };

      reader.readAsDataURL(compressedFile);
    } catch {
      setSolution("Failed to compress the image.");
      setLoading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white p-6 flex flex-col items-center transition-colors duration-300">
      {/* Header Narrative */}
      <div className="w-full max-w-3xl px-4 md:px-8 text-center mt-10 mb-8">
        <h1 className="text-4xl font-extrabold text-blue-500 mb-2">MuktaVidya AI</h1>
        <p className="text-gray-400 text-sm">
          Snap a competitive exam question. Get instant conceptual breakdown.
        </p>

        {/* Language & Theme Selectors */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <div className="flex justify-center gap-2">
            {([['en', 'English'], ['bn', 'বাংলা'], ['hi', 'हिन्दी']] as const).map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  language === code
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark';
              setTheme(next);
              applyTheme(next);
            }}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm transition-all hover:scale-110 active:scale-95 shadow-sm"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm transition-all hover:scale-110 active:scale-95 shadow-sm"
            aria-label="View History"
          >
            📜
          </button>
        </div>
      </div>

      {/* The Camera Trigger Button */}
      <div className="w-full max-w-3xl px-4 md:px-8 mb-8">
        <label
          className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-500/30"
          role="button"
          aria-label="Open camera to scan a question paper"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Scan Question Paper
          {/* This is the hidden magic input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
            aria-hidden="true"
          />
        </label>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="w-full max-w-3xl px-4 md:px-8 mb-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg relative">
           {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Captured question" className="w-full h-auto" />
          {loading && <div className="scanner-line"></div>}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="w-full max-w-3xl px-4 md:px-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800" role="status">
          <p className="text-blue-400 font-semibold text-lg mb-3">Analyzing Question...</p>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      )}

      {/* Solution: Raw text while streaming, KaTeX after complete */}
      {solution && !loading && (
        <div className="w-full max-w-3xl px-4 md:px-8 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden" aria-live="polite">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            AI Solution: {isStreaming && <span className="text-blue-400 text-sm font-normal ml-2">● streaming...</span>}
          </h3>

          {isStreaming ? (
            // During streaming: show raw text (no flickering, no broken LaTeX)
            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-base font-sans leading-loose">
              {solution}
            </pre>
          ) : (
            // After streaming: render polished markdown + KaTeX
            <SolutionErrorBoundary fallbackText={solution}>
              <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 text-base leading-loose">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    div: ({node: _node, className, children, ...props}: any) => { // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                      if (className && className.includes('math-display')) {
                        return (
                          <div className="overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <div className={className} {...props}>{children}</div>
                          </div>
                        );
                      }
                      return <div className={className} {...props}>{children}</div>;
                    },
                    span: ({node: _node, className, children, ...props}: any) => { // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                      if (className && className.includes('math-display')) {
                        return (
                          <span className="overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden block">
                            <span className={className} {...props}>{children}</span>
                          </span>
                        );
                      }
                      return <span className={className} {...props}>{children}</span>;
                    },
                    code({node: _node, inline, className, children, ...props}: any) { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
                      const match = /language-(\w+)/.exec(className || '');
                      const isMermaid = match && match[1] === 'mermaid';

                      if (!inline && isMermaid) {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                      }
                      return (
                        <code className={className ? className : "bg-gray-800 rounded px-1"} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {preprocessMarkdown(solution)}
                </ReactMarkdown>
              </div>
            </SolutionErrorBoundary>
          )}

          {/* Action buttons: Copy + Share + Feedback (only after stream completes) */}
          {!isStreaming && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-3 border-t border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(solution || '');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-all"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Solution'}
                </button>
                <button
                  onClick={() => {
                    const text = `Check out this solution from MuktaVidya AI:\n\n${(solution || '').slice(0, 500)}...`;
                    if (navigator.share) {
                      navigator.share({ title: 'MuktaVidya AI Solution', text });
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-800 hover:bg-green-700 rounded-lg text-xs text-gray-200 transition-all"
                >
                  📤 Share
                </button>
              </div>

              {/* Feedback Loop */}
              <div className="flex gap-2">
                <button
                  onClick={() => sendFeedback('up')}
                  disabled={feedback !== null}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    feedback === 'up' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  }`}
                  aria-label="Helpful"
                >
                  👍
                </button>
                <button
                  onClick={() => sendFeedback('down')}
                  disabled={feedback !== null}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    feedback === 'down' ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  }`}
                  aria-label="Not Helpful"
                >
                  👎
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsHistoryOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative bg-white dark:bg-gray-900 w-full max-h-[80vh] rounded-t-2xl shadow-2xl overflow-hidden flex flex-col" role="dialog" aria-modal="true" aria-labelledby="session-history-title">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 id="session-history-title" className="text-xl font-bold text-gray-900 dark:text-white">Session History</h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close session history"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No history yet.</p>
              ) : (
                history.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setImagePreview(item.imageBase64);
                      setSolution(item.solution);
                      setLanguage(item.language);
                      setLoading(false);
                      setIsStreaming(false);
                      setIsHistoryOpen(false);
                    }}
                    className="w-full text-left flex gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {item.imageBase64 ? (
                      <div className="w-16 h-16 shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageBase64} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center text-2xl">
                        📄
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {item.language}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-300 line-clamp-2">
                        {item.preview}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
