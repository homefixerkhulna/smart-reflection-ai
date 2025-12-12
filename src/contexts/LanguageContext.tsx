// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "bn";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Static translation keys (expandable)
const translations: Record<string, { en: string; bn: string }> = {
  recommendations: { en: "Personalized Recommendations", bn: "ব্যক্তিগত স্কিন রিকমেন্ডেশন" },
  subtitle: { en: "AI-powered skincare guidance based on your progress", bn: "আপনার স্কিন বিশ্লেষণের অগ্রগতির ভিত্তিতে AI রিকমেন্ডেশন" },
  overview: { en: "Your Skin Health Journey", bn: "আপনার স্কিন হেলথ জার্নি" },
  strengths: { en: "Strengths", bn: "দক্ষতা / ভালো দিক" },
  improvement: { en: "Areas for Improvement", bn: "যেসব জায়গায় উন্নতি প্রয়োজন" },
  productSuggestions: { en: "Product Suggestions", bn: "প্রোডাক্ট সাজেশন" },
  usage: { en: "Usage", bn: "ব্যবহার" },
  noDataTitle: { en: "No Analysis Data", bn: "কোনো বিশ্লেষণ ডেটা নেই" },
  noDataDescription: { en: "Complete at least one skin analysis to get personalized recommendations.", bn: "কমপক্ষে একটি স্কিন অ্যানালাইসিস সম্পন্ন করুন রিকমেন্ডেশন পেতে।" },
  error: { en: "Error loading data", bn: "ডেটা লোড করতে সমস্যা হয়েছে" }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("appLanguage") as Language | null;
    if (saved) setLanguage(saved);
  }, []);

  const setLanguageWrapper = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("appLanguage", lang);
  };

  const t = (key: string) => translations[key]?.[language] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageWrapper, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
};
