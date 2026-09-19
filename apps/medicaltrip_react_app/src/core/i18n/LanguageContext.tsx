import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { LanguageCode, LanguageContextType, TranslationDictionary } from './types';
import { TRANSLATIONS, resolveLanguage, resolveTerritory } from './index';

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: LanguageCode;
  patientLanguage?: string | null;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage = 'es',
  patientLanguage,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);

  // Synchronize preferred language from patient profile when patientLanguage prop updates
  useEffect(() => {
    if (patientLanguage) {
      const resolved = resolveLanguage(patientLanguage);
      setLanguageState(resolved);
    }
  }, [patientLanguage]);

  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLanguageState(newLang);
  }, []);

  const t: TranslationDictionary = useMemo(() => {
    return TRANSLATIONS[language] || TRANSLATIONS.es;
  }, [language]);

  const contextValue: LanguageContextType = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      resolveLanguage,
      resolveTerritory,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback safe context if used outside provider
    return {
      language: 'es',
      setLanguage: () => {},
      t: TRANSLATIONS.es,
      resolveLanguage,
      resolveTerritory,
    };
  }
  return context;
};

export const useTranslation = useLanguage;
