import { createContext, useContext, useState, useCallback } from 'react';
import { t as translate, label as lbl } from '../lib/i18n';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('msr_lang') || 'hi'; } catch { return 'hi'; }
  });
  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('msr_lang', l); } catch { /* ignore */ }
    document.documentElement.lang = l;
  }, []);
  const t = useCallback((k) => translate(k, lang), [lang]);
  const label = useCallback((g, v) => lbl(g, v, lang), [lang]);
  /** inline bilingual helper: tt('English', 'हिंदी') */
  const tt = useCallback((en, hi) => (lang === 'hi' ? hi : en), [lang]);
  return <LangContext.Provider value={{ lang, setLang, t, tt, label }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
