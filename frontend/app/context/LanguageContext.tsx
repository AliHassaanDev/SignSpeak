"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { AppLanguage, translations, Translations } from "../lib/translations";

interface LanguageContextType {
  appLang: AppLanguage;
  setAppLang: (lang: AppLanguage) => void;
  toggleAppLang: () => void;
  t: Translations;
  isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "signspeak_app_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [appLang, setAppLangState] = useState<AppLanguage>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
      if (saved === "en" || saved === "ur") {
        setAppLangState(saved);
      }
    } catch {
      // LocalStorage access may fail in private mode
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, appLang);
    } catch {}

    // Apply attribute and CSS class for beautiful Urdu rendering
    if (typeof document !== "undefined") {
      document.documentElement.lang = appLang;
      if (appLang === "ur") {
        document.body.classList.add("app-lang-urdu");
      } else {
        document.body.classList.remove("app-lang-urdu");
      }
    }
  }, [appLang, mounted]);

  const setAppLang = (lang: AppLanguage) => {
    setAppLangState(lang);
  };

  const toggleAppLang = () => {
    setAppLangState((prev) => (prev === "en" ? "ur" : "en"));
  };

  const t = useMemo(() => translations[appLang], [appLang]);
  const isUrdu = appLang === "ur";

  const value = useMemo(
    () => ({
      appLang,
      setAppLang,
      toggleAppLang,
      t,
      isUrdu,
    }),
    [appLang, t, isUrdu]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      appLang: "en",
      setAppLang: () => {},
      toggleAppLang: () => {},
      t: translations.en,
      isUrdu: false,
    };
  }
  return context;
}
