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

  const handleCopy = async (customText?: string) => {
    try {
      await navigator.clipboard.writeText(customText || solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async (customText?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MuktaVidya AI Solution',
          text: customText || solution,
        });
      } else {
        handleCopy(customText);
      }
    } catch (err) {
      console.error('Failed to share', err);
    }
  };

  const handleFeedback = async (type: 'up' | 'down', customText?: string) => {
    if (feedback) return; // Locked
    setFeedback(type);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: (customText || solution).substring(0, 100) }),
      });
      if (!response.ok) {
        setFeedback(null);
        console.error("Feedback failed, response not ok");
      }
    } catch (e) {
      setFeedback(null);
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
