import { useState } from "react";

export function useLanguage(defaultLanguage: string = "EN") {
  // Use lazy initialization for state to avoid setting state in effect on mount
  const [language, setLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("muktavidya_language");
      if (savedLang) return savedLang;
    }
    return defaultLanguage;
  });

  // Save language changes
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("muktavidya_language", lang);
  };

  return {
    language,
    handleLanguageChange,
  };
}
