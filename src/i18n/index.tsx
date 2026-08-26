import React, { createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fr } from './fr';
import { en } from './en';
import { de } from './de';
import { it } from './it';
import { es } from './es';
import { pt } from './pt';

export type Lang = 'fr' | 'en' | 'de' | 'it' | 'es' | 'pt';

export const LANGUAGES: { code: Lang; label: string; flag: string; flagUrl: string }[] = [
  { code: 'fr', label: 'Français',   flag: '🇫🇷', flagUrl: 'https://flagcdn.com/fr.svg' },
  { code: 'en', label: 'English',    flag: '🇬🇧', flagUrl: 'https://flagcdn.com/gb.svg' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪', flagUrl: 'https://flagcdn.com/de.svg' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹', flagUrl: 'https://flagcdn.com/it.svg' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', flagUrl: 'https://flagcdn.com/es.svg' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹', flagUrl: 'https://flagcdn.com/pt.svg' },
];

const TRANSLATIONS = { fr, en, de, it, es, pt };

/** Le francais vit a la racine, les autres langues sous leur prefixe. */
export const PREFIXED_LANGS: Lang[] = ['en', 'de', 'it', 'es', 'pt'];

/** Code de langue attendu par les moteurs de recherche, pour hreflang. */
export const HREFLANG: Record<Lang, string> = {
  fr: 'fr',
  en: 'en',
  de: 'de',
  it: 'it',
  es: 'es',
  pt: 'pt',
};

export type Translations = typeof fr;

function isPrefixed(seg: string): seg is Lang {
  return (PREFIXED_LANGS as string[]).includes(seg);
}

/** Deduit la langue d'un chemin : /es/tarifs -> es, /tarifs -> fr. */
export function langFromPath(pathname: string): Lang {
  const seg = pathname.split('/')[1] ?? '';
  return isPrefixed(seg) ? seg : 'fr';
}

/** Retire le prefixe de langue : /es/tarifs -> /tarifs, /tarifs -> /tarifs. */
export function stripLang(pathname: string): string {
  const seg = pathname.split('/')[1] ?? '';
  if (!isPrefixed(seg)) return pathname || '/';
  const rest = pathname.slice(seg.length + 1);
  return rest === '' ? '/' : rest;
}

/** Ajoute le prefixe de langue a un chemin interne. */
export function localizePath(path: string, lang: Lang): string {
  const base = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'fr') return base;
  return base === '/' ? `/${lang}` : `/${lang}${base}`;
}

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  /** Chemin de la page courante, sans prefixe de langue. */
  basePath: string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  t: fr,
  basePath: '/',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  const lang = langFromPath(pathname);
  const basePath = stripLang(pathname);

  /** Changer de langue, c'est changer d'adresse : le lien reste partageable. */
  function setLang(l: Lang) {
    try {
      localStorage.setItem('scanup_lang', l);
    } catch {
      /* navigation privee ou stockage refuse : sans consequence */
    }
    navigate(`${localizePath(basePath, l)}${search}${hash}`);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang], basePath }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
