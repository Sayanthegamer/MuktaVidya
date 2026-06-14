import { useState, useCallback } from "react";

export function useLanguage(defaultLanguage: string = "EN") {
  // Use lazy initialization for state to avoid setting state in effect on mount
  const [language, setLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLang = localStorage.getItem("muktavidya_language");
        if (savedLang) return savedLang;
      } catch (e) {
        console.error("Failed to read language from localStorage", e);
        return defaultLanguage;
      }
    }
    return defaultLanguage;
  });

  // Save language changes
  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("muktavidya_language", lang);
      } catch (e) {
        console.error("Failed to save language to localStorage", e);
      }
    }
  }, []);

  return {
    language,
    handleLanguageChange,
  };
}
