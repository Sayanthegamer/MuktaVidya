import { useState } from "react";

export function useSolutionPanel(solution: string) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [prevSolution, setPrevSolution] = useState(solution);

  if (solution !== prevSolution) {
    setPrevSolution(solution);
    setFeedback(null);
    setCopied(false);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MuktaVidya AI Solution',
          text: solution,
        });
      } else {
        handleCopy();
      }
    } catch (err) {
      console.error('Failed to share', err);
    }
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    if (feedback) return; // Locked
    setFeedback(type);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: solution.substring(0, 100) }),
      });
    } catch (e) {
      console.error("Feedback failed", e);
    }
  };

  return {
    copied,
    feedback,
    handleCopy,
    handleShare,
    handleFeedback
  };
}
