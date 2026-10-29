import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { translations, type Language, type TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('shop_language') as Language;
    return saved === 'tg' || saved === 'ru' || saved === 'en' ? saved : 'ru';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('shop_language', newLang);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[lang] || translations.ru;
    return (dict as any)[key] || (translations.ru as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, setLanguage: setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
