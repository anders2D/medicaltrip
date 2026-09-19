import { LanguageCode, CaribbeanCountryCode, CaribbeanTerritoryProfile, TranslationDictionary } from './types';
import { esTranslations } from './translations/es';
import { enTranslations } from './translations/en';
import { nlTranslations } from './translations/nl';
import { papTranslations } from './translations/pap';

export * from './types';
export { esTranslations } from './translations/es';
export { enTranslations } from './translations/en';
export { nlTranslations } from './translations/nl';
export { papTranslations } from './translations/pap';

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  es: esTranslations,
  en: enTranslations,
  nl: nlTranslations,
  pap: papTranslations,
};

export const CARIBBEAN_TERRITORIES: Record<CaribbeanCountryCode, CaribbeanTerritoryProfile> = {
  CW: {
    countryCode: 'CW',
    countryName: 'Curazao',
    flagEmoji: '🇨🇼',
    defaultLanguages: ['pap', 'nl', 'en', 'es'],
    primaryLanguage: 'pap',
  },
  AW: {
    countryCode: 'AW',
    countryName: 'Aruba',
    flagEmoji: '🇦🇼',
    defaultLanguages: ['pap', 'nl', 'en', 'es'],
    primaryLanguage: 'pap',
  },
  BQ: {
    countryCode: 'BQ',
    countryName: 'Bonaire',
    flagEmoji: '🇧🇶',
    defaultLanguages: ['nl', 'pap', 'en', 'es'],
    primaryLanguage: 'nl',
  },
  NL: {
    countryCode: 'NL',
    countryName: 'Países Bajos',
    flagEmoji: '🇳🇱',
    defaultLanguages: ['nl', 'en'],
    primaryLanguage: 'nl',
  },
  US: {
    countryCode: 'US',
    countryName: 'EE.UU.',
    flagEmoji: '🇺🇸',
    defaultLanguages: ['en', 'es'],
    primaryLanguage: 'en',
  },
  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    flagEmoji: '🇨🇴',
    defaultLanguages: ['es'],
    primaryLanguage: 'es',
  },
};

/**
 * Deterministically resolves a freeform language string or code into a supported LanguageCode.
 */
export function resolveLanguage(langInput?: string | null): LanguageCode {
  if (!langInput) return 'es';

  const normalized = langInput.toLowerCase().trim();

  // If compound string (e.g. "Papiamento / Holandés", "Inglés / Neerlandés"), split and check first segment
  const segments = normalized.split(/[\/,|\-]+/).map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    if (seg === 'pap' || seg === 'papiamento' || seg === 'papiamentu' || seg.includes('pap')) {
      return 'pap';
    }
    if (
      seg === 'en' ||
      seg === 'eng' ||
      seg === 'english' ||
      seg === 'inglés' ||
      seg === 'ingles' ||
      seg.includes('ingl') ||
      seg.includes('engl')
    ) {
      return 'en';
    }
    if (
      seg === 'nl' ||
      seg === 'nld' ||
      seg === 'dutch' ||
      seg === 'neerlandés' ||
      seg === 'neerlandes' ||
      seg === 'holandés' ||
      seg === 'holandes' ||
      seg === 'nederlands' ||
      seg.includes('holand') ||
      seg.includes('neerland') ||
      seg.includes('dutch')
    ) {
      return 'nl';
    }
    if (
      seg === 'es' ||
      seg === 'spa' ||
      seg === 'español' ||
      seg === 'spanish' ||
      seg.includes('espa') ||
      seg.includes('span')
    ) {
      return 'es';
    }
  }

  return 'es';
}

/**
 * Deterministically resolves a country input into a standardized CaribbeanTerritoryProfile.
 */
export function resolveTerritory(countryInput?: string | null): CaribbeanTerritoryProfile {
  if (!countryInput) return CARIBBEAN_TERRITORIES.CW;

  const normalized = countryInput.toLowerCase().trim();

  if (normalized.includes('aruba') || normalized === 'aw') {
    return CARIBBEAN_TERRITORIES.AW;
  }
  if (normalized.includes('bonaire') || normalized === 'bq') {
    return CARIBBEAN_TERRITORIES.BQ;
  }
  if (normalized.includes('países bajos') || normalized.includes('paises bajos') || normalized.includes('holanda') || normalized.includes('netherlands') || normalized === 'nl') {
    return CARIBBEAN_TERRITORIES.NL;
  }
  if (normalized.includes('ee.uu') || normalized.includes('usa') || normalized.includes('estados unidos') || normalized.includes('united states') || normalized === 'us') {
    return CARIBBEAN_TERRITORIES.US;
  }
  if (normalized.includes('colombia') || normalized === 'co') {
    return CARIBBEAN_TERRITORIES.CO;
  }

  // Default to Curaçao for Caribbean operations
  return CARIBBEAN_TERRITORIES.CW;
}

/**
 * Helper to fetch translation dictionary directly
 */
export function getTranslation(lang: LanguageCode): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.es;
}

export { LanguageContext, LanguageProvider, useLanguage, useTranslation } from './LanguageContext';
