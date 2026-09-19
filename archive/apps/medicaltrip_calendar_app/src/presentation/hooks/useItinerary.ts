import { useState, useCallback, useEffect, useMemo } from 'react';
import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';
import { Patient } from '../../domain/entities/Patient';
import {
  ItineraryMilestone,
  MilestoneCategory,
  MilestoneFinancialType,
  MilestoneStatus,
} from '../../domain/entities/ItineraryMilestone';
import { Money } from '../../domain/values/Money';
import { OperativeTerritory } from '../../domain/values/OperativeTerritory';
import { Coordinates } from '../../domain/values/Coordinates';
import {
  loadArchetypeBundle,
  getArchetypeMetadata,
  ArchetypeMetadata,
} from '../../infrastructure/archetypes/ArchetypeRegistry';
import { DexieItineraryRepository } from '../../infrastructure/storage/DexieItineraryRepository';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

export interface MilestoneFormData {
  title: string;
  category: MilestoneCategory;
  startDateTime: string;
  endDateTime: string;
  location: string;
  providerName?: string;
  assignedDriverId?: string;
  assignedGuideId?: string;
  assignedNurseId?: string;
  financialType: MilestoneFinancialType;
  costAmountCOP: number;
  guideHours?: number;
  status: MilestoneStatus;
  notes?: string;
  requiresGpsCheckIn?: boolean;
  requiresSignature?: boolean;
  requiresReceipt?: boolean;
}

export function useItinerary(initialArchetypeId: string = 'rva171') {
  const [activeArchetypeId, setActiveArchetypeId] = useState<string>(initialArchetypeId);
  const [itinerary, setItinerary] = useState<MedicalItinerary>(() => {
    const bundle = loadArchetypeBundle(initialArchetypeId);
    return bundle.itinerary;
  });
  const [patient, setPatient] = useState<Patient>(() => {
    const bundle = loadArchetypeBundle(initialArchetypeId);
    return bundle.patient;
  });

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Default to the arrival date of the booking
    return new Date('2026-08-20T10:00:00.000Z');
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const repo = useMemo(() => new DexieItineraryRepository(), []);

  // Hydrate initial archetype or change
  const switchArchetype = useCallback(
    async (archetypeId: string) => {
      setIsLoading(true);
      setDomainError(null);
      try {
        const bundle = loadArchetypeBundle(archetypeId);
        setActiveArchetypeId(archetypeId);
        setPatient(bundle.patient);
        setItinerary(bundle.itinerary);
        setSelectedMilestoneId(null);
        setCurrentDate(new Date(bundle.booking.arrivalDate));

        // Save to Dexie in background
        repo.save(bundle.itinerary).catch((err) => {
          console.warn('[useItinerary]: Could not persist to IndexedDB:', err);
        });
      } catch (err: any) {
        setDomainError(err.message || 'Error al cargar el arquetipo');
      } finally {
        setIsLoading(false);
      }
    },
    [repo]
  );

  // Initial persist
  useEffect(() => {
    repo.save(itinerary).catch(() => {});
  }, [itinerary, repo]);

  const activeMetadata: ArchetypeMetadata | undefined = useMemo(() => {
    return getArchetypeMetadata(activeArchetypeId);
  }, [activeArchetypeId]);

  const selectedMilestone = useMemo(() => {
    if (!selectedMilestoneId) return null;
    return itinerary.milestones.find((m) => m.id === selectedMilestoneId) || null;
  }, [itinerary.milestones, selectedMilestoneId]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return itinerary.milestones.filter((m) => {
      if (categoryFilter && m.category !== categoryFilter) {
        return false;
      }
      if (statusFilter && m.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesLoc = m.location.rawName.toLowerCase().includes(q);
        const matchesProv = (m.providerName || '').toLowerCase().includes(q);
        const matchesNotes = (m.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc && !matchesProv && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [itinerary.milestones, categoryFilter, statusFilter, searchQuery]);

  // Mutations
  const addMilestone = useCallback(
    (formData: MilestoneFormData) => {
      try {
        setDomainError(null);
        const territory = new OperativeTerritory(formData.location);
        const costMoney = Money.fromUnits(formData.costAmountCOP, 'COP');

        const newMilestone = new ItineraryMilestone({
          id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          reservaId: itinerary.booking.code,
          dayNumber: 1,
          title: formData.title,
          category: formData.category,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime,
          location: territory,
          providerName: formData.providerName,
          assignedDriverId: formData.assignedDriverId,
          assignedGuideId: formData.assignedGuideId,
          assignedNurseId: formData.assignedNurseId,
          financialType: formData.financialType,
          cost: costMoney,
          guideHours: formData.guideHours,
          status: formData.status,
          notes: formData.notes,
          requiresGpsCheckIn: formData.requiresGpsCheckIn,
          requiresSignature: formData.requiresSignature,
          requiresReceipt: formData.requiresReceipt,
        });

        itinerary.addMilestone(newMilestone);
        setItinerary(new MedicalItinerary({
          booking: itinerary.booking,
          milestones: [...itinerary.milestones],
          transactions: [...itinerary.transactions],
          defaultCurrency: itinerary.defaultCurrency,
        }));
        setSelectedMilestoneId(newMilestone.id);
        repo.save(itinerary).catch(() => {});
        return newMilestone;
      } catch (err: any) {
        setDomainError(err.message || 'Error al validar el evento de itinerario');
        throw err;
      }
    },
    [itinerary, repo]
  );

  const updateMilestone = useCallback(
    (milestoneId: string, formData: Partial<MilestoneFormData>) => {
      try {
        setDomainError(null);
        const target = itinerary.milestones.find((m) => m.id === milestoneId);
        if (!target) return;

        let territory = target.location;
        if (formData.location) {
          territory = new OperativeTerritory(formData.location);
        }

        let cost = target.cost;
        if (formData.costAmountCOP !== undefined) {
          cost = Money.fromUnits(formData.costAmountCOP, 'COP');
        }

        const updated = new ItineraryMilestone({
          id: target.id,
          reservaId: target.reservaId,
          dayNumber: target.dayNumber,
          title: formData.title ?? target.title,
          category: formData.category ?? target.category,
          startDateTime: formData.startDateTime ?? target.startDateTime.toISOString(),
          endDateTime: formData.endDateTime ?? target.endDateTime.toISOString(),
          location: territory,
          coordinates: target.coordinates,
          providerId: target.providerId,
          providerName: formData.providerName ?? target.providerName,
          assignedDriverId: formData.assignedDriverId ?? target.assignedDriverId,
          assignedGuideId: formData.assignedGuideId ?? target.assignedGuideId,
          assignedNurseId: formData.assignedNurseId ?? target.assignedNurseId,
          financialType: formData.financialType ?? target.financialType,
          cost,
          guideHours: formData.guideHours ?? target.guideHours,
          status: formData.status ?? target.status,
          notes: formData.notes ?? target.notes,
          requiresGpsCheckIn: formData.requiresGpsCheckIn ?? target.requiresGpsCheckIn,
          requiresSignature: formData.requiresSignature ?? target.requiresSignature,
          requiresReceipt: formData.requiresReceipt ?? target.requiresReceipt,
          gpsChecked: target.gpsChecked,
          gpsCheckInTime: target.gpsCheckInTime,
          signatureUuid: target.signatureUuid,
          receiptUuid: target.receiptUuid,
        });

        const newMilestones = itinerary.milestones.map((m) => (m.id === milestoneId ? updated : m));
        setItinerary(new MedicalItinerary({
          booking: itinerary.booking,
          milestones: newMilestones,
          transactions: [...itinerary.transactions],
          defaultCurrency: itinerary.defaultCurrency,
        }));
        repo.save(itinerary).catch(() => {});
      } catch (err: any) {
        setDomainError(err.message || 'Error al actualizar el evento');
        throw err;
      }
    },
    [itinerary, repo]
  );

  const deleteMilestone = useCallback(
    (milestoneId: string) => {
      const newMilestones = itinerary.milestones.filter((m) => m.id !== milestoneId);
      setItinerary(new MedicalItinerary({
        booking: itinerary.booking,
        milestones: newMilestones,
        transactions: [...itinerary.transactions],
        defaultCurrency: itinerary.defaultCurrency,
      }));
      if (selectedMilestoneId === milestoneId) {
        setSelectedMilestoneId(null);
      }
      repo.save(itinerary).catch(() => {});
    },
    [itinerary, selectedMilestoneId, repo]
  );

  const rescheduleMilestone = useCallback(
    (milestoneId: string, newStart: Date | string, newEnd: Date | string) => {
      try {
        setDomainError(null);
        itinerary.rescheduleMilestone(milestoneId, newStart, newEnd);
        setItinerary(new MedicalItinerary({
          booking: itinerary.booking,
          milestones: [...itinerary.milestones],
          transactions: [...itinerary.transactions],
          defaultCurrency: itinerary.defaultCurrency,
        }));
        repo.save(itinerary).catch(() => {});
      } catch (err: any) {
        setDomainError(err.message || 'Error al reagendar hito');
      }
    },
    [itinerary, repo]
  );

  const recordExpense = useCallback(
    (description: string, amount: Money, receiptUuid?: string) => {
      itinerary.recordOutOfPocketExpense(description, amount, { receiptUuid });
      setItinerary(new MedicalItinerary({
        booking: itinerary.booking,
        milestones: [...itinerary.milestones],
        transactions: [...itinerary.transactions],
        defaultCurrency: itinerary.defaultCurrency,
      }));
      repo.save(itinerary).catch(() => {});
    },
    [itinerary, repo]
  );

  const recordAdvance = useCallback(
    (amount: Money, description: string) => {
      itinerary.recordCashAdvance(amount, description);
      setItinerary(new MedicalItinerary({
        booking: itinerary.booking,
        milestones: [...itinerary.milestones],
        transactions: [...itinerary.transactions],
        defaultCurrency: itinerary.defaultCurrency,
      }));
      repo.save(itinerary).catch(() => {});
    },
    [itinerary, repo]
  );

  const checkInMilestoneGps = useCallback(
    (milestoneId: string, coords: { lat: number; lng: number }) => {
      try {
        setDomainError(null);
        itinerary.updateMilestoneStatus(milestoneId, 'EN_SITIO', {
          coords: new Coordinates(coords.lat, coords.lng),
        });
        setItinerary(new MedicalItinerary({
          booking: itinerary.booking,
          milestones: [...itinerary.milestones],
          transactions: [...itinerary.transactions],
          defaultCurrency: itinerary.defaultCurrency,
        }));
        repo.save(itinerary).catch(() => {});
      } catch (err: any) {
        setDomainError(err.message || 'Error en validación GPS de territorio');
      }
    },
    [itinerary, repo]
  );

  const signOffMilestone = useCallback(
    (milestoneId: string, signatureUuid: string) => {
      itinerary.updateMilestoneStatus(milestoneId, 'COMPLETADO', { signatureUuid });
      setItinerary(new MedicalItinerary({
        booking: itinerary.booking,
        milestones: [...itinerary.milestones],
        transactions: [...itinerary.transactions],
        defaultCurrency: itinerary.defaultCurrency,
      }));
      repo.save(itinerary).catch(() => {});
    },
    [itinerary, repo]
  );

  return {
    itinerary,
    patient,
    activeArchetypeId,
    activeMetadata,
    selectedMilestoneId,
    selectedMilestone,
    viewMode,
    currentDate,
    searchQuery,
    categoryFilter,
    statusFilter,
    domainError,
    isLoading,
    filteredMilestones,
    // Setters
    setSelectedMilestoneId,
    setViewMode,
    setCurrentDate,
    setSearchQuery,
    setCategoryFilter,
    setStatusFilter,
    setDomainError,
    // Actions
    switchArchetype,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    rescheduleMilestone,
    recordExpense,
    recordAdvance,
    checkInMilestoneGps,
    signOffMilestone,
  };
}
