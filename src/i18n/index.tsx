import React, { createContext, useContext, useState } from 'react';
import { fr } from './fr';
import { en } from './en';
import { de } from './de';
import { it } from './it';

export type Lang = 'fr' | 'en' | 'de' | 'it';

export const LANGUAGES: { code: Lang; label: string; flag: string; flagUrl: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', flagUrl: 'https://flagcdn.com/fr.svg' },
  { code: 'en', label: 'English',  flag: '🇬🇧', flagUrl: 'https://flagcdn.com/gb.svg' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪', flagUrl: 'https://flagcdn.com/de.svg' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', flagUrl: 'https://flagcdn.com/it.svg' },
];

const TRANSLATIONS = { fr, en, de, it };

export type Translations = typeof fr;

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  t: fr,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const stored = (localStorage.getItem('scanup_lang') as Lang) || 'fr';
  const [lang, setLangState] = useState<Lang>(stored);

  function setLang(l: Lang) {
    localStorage.setItem('scanup_lang', l);
    setLangState(l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
