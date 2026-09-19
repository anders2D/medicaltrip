import { useMemo } from 'react';
import { useAppContext } from '../state/AppContext';
import { ACTIVE_ARCHETYPES_DATA, ArchetypeBundle } from '../../infrastructure/data/archetypes.data';
import { resolveTerritory, resolveLanguage, LanguageCode } from '../i18n';

export interface ArchetypeItem {
  id: string;
  code: string;
  name: string;
  patientName: string;
  country: string;
  countryFlag: string;
  countryCode: string;
  language: string;
  languageCode: LanguageCode;
  paxCount: number;
  hotelName: string;
  description: string;
  badgeColor: string;
  procedureTag: string;
  isActive: boolean;
}

export function useArchetypes() {
  const { activeArchetypeId, activeBooking, switchArchetype, isLoading } = useAppContext();

  const archetypesList: ArchetypeItem[] = useMemo(() => {
    return Object.entries(ACTIVE_ARCHETYPES_DATA).map(([id, bundle]: [string, ArchetypeBundle]) => {
      const territory = resolveTerritory(bundle.booking.country);
      const languageCode = resolveLanguage(bundle.booking.language);

      let procedureTag = 'Consulta';
      if (id === 'rva171') procedureTag = 'Oftalmo + Eco (5 Pax)';
      else if (id === 'rva282') procedureTag = 'Cardio VID + CES (2 Pax)';
      else if (id === 'rva341') procedureTag = 'Urología CES + Domicilio (2 Pax)';
      else if (id === 'rva077') procedureTag = 'Cirugía HPTU 12d (4 Pax)';
      else if (id === 'rva350') procedureTag = 'Oftalmo Glaucornea + Hotel (2 Pax)';

      return {
        id,
        code: bundle.code,
        name: bundle.name,
        patientName: bundle.booking.fullName,
        country: bundle.booking.country,
        countryFlag: territory.flagEmoji,
        countryCode: territory.countryCode,
        language: bundle.booking.language,
        languageCode,
        paxCount: bundle.booking.paxCount,
        hotelName: bundle.booking.hotelName,
        description: bundle.description,
        badgeColor: bundle.badgeColor,
        procedureTag,
        isActive: id === activeArchetypeId,
      };
    });
  }, [activeArchetypeId]);

  const activeArchetype = useMemo(() => {
    return archetypesList.find((a) => a.id === activeArchetypeId) || archetypesList[0];
  }, [archetypesList, activeArchetypeId]);

  return {
    activeArchetypeId,
    activeArchetype,
    activeBooking,
    archetypesList,
    switchArchetype,
    isLoading,
  };
}
