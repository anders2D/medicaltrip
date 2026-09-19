import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { IStoragePort } from '../../domain/ports/IStoragePort';
import { PatientBooking } from '../../domain/entities/PatientBooking';
import { ItineraryEvent } from '../../domain/entities/ItineraryEvent';
import { CompanionShift } from '../../domain/entities/CompanionShift';
import { DriverTransfer } from '../../domain/entities/DriverTransfer';
import { ReceiptExpense } from '../../domain/entities/ReceiptExpense';
import { SettlementLedger } from '../../domain/entities/SettlementLedger';
import { EventStatusType } from '../../domain/value-objects/EventStatus';
import { LoadArchetypeUseCase } from '../../application/use-cases/LoadArchetypeUseCase';
import { CreateEventUseCase, CreateEventCommand } from '../../application/use-cases/CreateEventUseCase';
import { RescheduleEventUseCase } from '../../application/use-cases/RescheduleEventUseCase';
import { ReconcileSettlementUseCase } from '../../application/use-cases/ReconcileSettlementUseCase';
import { CreatePatientBookingUseCase, CreatePatientBookingDTO } from '../../application/use-cases/CreatePatientBookingUseCase';
import { GenerateSmartItineraryUseCase, GenerateSmartItineraryResult } from '../../application/use-cases/GenerateSmartItineraryUseCase';
import { SettleExpenseUseCase, SettleExpenseCommand, SettleExpenseResult } from '../../application/use-cases/SettleExpenseUseCase';
import { OneTapSettlementWorkflowUseCase, OneTapSettlementWorkflowDTO, OneTapSettlementWorkflowResult } from '../../application/use-cases/OneTapSettlementWorkflowUseCase';
import { PerformDriverCheckInUseCase, PerformDriverCheckInCommand, PerformDriverCheckInResult } from '../../application/use-cases/PerformDriverCheckInUseCase';
import { JsonPdfExportAdapter } from '../../infrastructure/export/JsonPdfExportAdapter';
import { ServiceContainer } from '../../infrastructure/ServiceContainer';
import { ExpenseCategory } from '../../domain/entities/ReceiptExpense';
import { ARCHETYPES_DATA, ArchetypeBundle } from '../../infrastructure/data/archetypes.data';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';
export type ActiveModuleType = 'settlement' | 'users' | 'plan' | 'passengers';

export interface DateSlotPreset {
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

export interface AppContextType {
  // State
  activeArchetypeId: string;
  activeBundle: ArchetypeBundle | null;
  activeBooking: PatientBooking | null;
  events: ItineraryEvent[];
  shifts: CompanionShift[];
  transfers: DriverTransfer[];
  expenses: ReceiptExpense[];
  settlement: SettlementLedger | null;
  activeView: CalendarViewType;
  activeModule: ActiveModuleType;
  selectedDate: Date;
  isDrawerOpen: boolean;
  drawerMode: 'create' | 'edit';
  activeEvent: ItineraryEvent | null;
  defaultSlot: DateSlotPreset | null;
  isLoading: boolean;
  error: string | null;
  storagePort: IStoragePort;

  // Milestone 1 Flow 1 & Flow 2 Modals State & Diagnostics
  isNewPatientModalOpen: boolean;
  isSendInvitationModalOpen: boolean;
  isSmartItineraryModalOpen: boolean;
  isSwarmDiagnosticsOpen: boolean;
  isWelcomeOrientationModalOpen: boolean;
  isCompanionTurnModalOpen: boolean;

  // Actions
  switchArchetype: (archetypeId: string) => Promise<void>;
  setActiveView: (view: CalendarViewType) => void;
  setSelectedDate: (date: Date) => void;
  navigateDate: (direction: 'prev' | 'next' | 'today') => void;
  openCreateDrawer: (slot?: DateSlotPreset) => void;
  openEditDrawer: (event: ItineraryEvent) => void;
  closeDrawer: () => void;
  openNewPatientModal: () => void;
  closeNewPatientModal: () => void;
  openSendInvitationModal: () => void;
  closeSendInvitationModal: () => void;
  openSmartItineraryModal: () => void;
  closeSmartItineraryModal: () => void;
  openSwarmDiagnosticsModal: () => void;
  closeSwarmDiagnosticsModal: () => void;
  toggleSwarmDiagnosticsModal: () => void;
  openWelcomeOrientationModal: () => void;
  closeWelcomeOrientationModal: () => void;
  openCompanionTurnModal: () => void;
  closeCompanionTurnModal: () => void;
  saveCompanionShift: (shift: CompanionShift) => Promise<void>;
  deleteShift: (shiftId: string) => Promise<void>;
  saveTransfer: (transfer: DriverTransfer) => Promise<void>;
  deleteTransfer: (transferId: string) => Promise<void>;
  updateExpense: (expense: ReceiptExpense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  archiveBooking: (bookingId: string) => Promise<void>;
  performDriverCheckIn: (command?: Partial<PerformDriverCheckInCommand>) => Promise<PerformDriverCheckInResult>;
  createPatientBooking: (command: CreatePatientBookingDTO) => Promise<PatientBooking>;
  createNewPatient: (command: CreatePatientBookingDTO) => Promise<PatientBooking>;
  generateSmartItinerary: (
    presetType: string,
    baseDate?: Date
  ) => Promise<GenerateSmartItineraryResult>;
  createEvent: (command: CreateEventCommand) => Promise<ItineraryEvent>;
  updateEvent: (event: ItineraryEvent) => Promise<void>;
  rescheduleEvent: (
    eventId: string,
    newStartDateTime: string,
    newEndDateTime: string,
    newLocation?: string
  ) => Promise<ItineraryEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  transitionEventStatus: (eventId: string, nextStatus: EventStatusType) => Promise<void>;
  settleExpense: (command: SettleExpenseCommand) => Promise<SettleExpenseResult>;
  executeOneTapSettlementWorkflow: (
    dto: OneTapSettlementWorkflowDTO
  ) => Promise<OneTapSettlementWorkflowResult>;
  logFastExpense: (preset: {
    category: ExpenseCategory;
    description: string;
    amountCOP: number;
    vendorName?: string;
  }) => Promise<ReceiptExpense>;
  refreshData: () => Promise<void>;
  recalculateSettlement: () => Promise<SettlementLedger>;
  setActiveModule: (module: ActiveModuleType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface AppProviderProps {
  children: React.ReactNode;
  storagePort?: IStoragePort;
  initialArchetypeId?: string;
  initialView?: CalendarViewType;
  initialDate?: Date;
}

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  storagePort: customStorage,
  initialArchetypeId = 'rva350',
  initialView = 'month',
  initialDate,
}) => {
  const storagePort = useMemo<IStoragePort>(() => {
    return customStorage || ServiceContainer.getStoragePort();
  }, [customStorage]);

  const [activeArchetypeId, setActiveArchetypeId] = useState<string>(initialArchetypeId);
  const [activeBooking, setActiveBooking] = useState<PatientBooking | null>(null);
  const [events, setEvents] = useState<ItineraryEvent[]>([]);
  const [shifts, setShifts] = useState<CompanionShift[]>([]);
  const [transfers, setTransfers] = useState<DriverTransfer[]>([]);
  const [expenses, setExpenses] = useState<ReceiptExpense[]>([]);
  const [settlement, setSettlement] = useState<SettlementLedger | null>(null);

  const [activeView, setActiveView] = useState<CalendarViewType>(initialView);
  const [activeModule, setActiveModule] = useState<ActiveModuleType>('settlement');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date('2026-09-14T12:00:00.000Z'));
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeEvent, setActiveEvent] = useState<ItineraryEvent | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<DateSlotPreset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Flow 1 & Flow 2 Modals State & Diagnostics
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState<boolean>(false);
  const [isSendInvitationModalOpen, setIsSendInvitationModalOpen] = useState<boolean>(false);
  const [isSmartItineraryModalOpen, setIsSmartItineraryModalOpen] = useState<boolean>(false);
  const [isSwarmDiagnosticsOpen, setIsSwarmDiagnosticsOpen] = useState<boolean>(false);
  const [isWelcomeOrientationModalOpen, setIsWelcomeOrientationModalOpen] = useState<boolean>(false);
  const [isCompanionTurnModalOpen, setIsCompanionTurnModalOpen] = useState<boolean>(false);

  const activeBundle = useMemo(() => {
    return ARCHETYPES_DATA[activeArchetypeId] || null;
  }, [activeArchetypeId]);

  // Load Archetype into state and storage directly from Supabase Cloud
  const loadArchetypeData = useCallback(
    async (archetypeId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Consultar primero si la reserva ya existe en Supabase Cloud REST API
        const existingBooking = await storagePort.getBooking(archetypeId);
        if (existingBooking) {
          const [bkgEvents, bkgShifts, bkgTransfers, bkgExpenses, bkgSettlement] = await Promise.all([
            storagePort.getEventsByBooking(existingBooking.code),
            storagePort.getShiftsByBooking(existingBooking.code),
            storagePort.getTransfersByBooking(existingBooking.code),
            storagePort.getExpensesByBooking(existingBooking.code),
            storagePort.getSettlement(existingBooking.code),
          ]);

          setActiveArchetypeId(archetypeId);
          setActiveBooking(existingBooking);
          setEvents(bkgEvents);
          setShifts(bkgShifts);
          setTransfers(bkgTransfers);
          setExpenses(bkgExpenses);
          if (bkgSettlement) {
            setSettlement(bkgSettlement);
          } else {
            const reconcileUseCase = new ReconcileSettlementUseCase(storagePort);
            const ledger = await reconcileUseCase.execute({ bookingId: existingBooking.code });
            setSettlement(ledger);
          }

          if (!initialDate) {
            const arrival = new Date(existingBooking.arrivalDate);
            if (!isNaN(arrival.getTime())) {
              setSelectedDate(arrival);
            }
          }
          return;
        }

        // 2. Si no existe en Supabase, hidratar mediante el caso de uso
        const loadUseCase = new LoadArchetypeUseCase(storagePort);
        const bundle = await loadUseCase.execute({ archetypeKey: archetypeId });

        setActiveArchetypeId(archetypeId);
        setActiveBooking(bundle.booking);
        setEvents([...bundle.events]);
        setShifts([...bundle.shifts]);
        setTransfers([...bundle.transfers]);
        setExpenses([...bundle.expenses]);
        setSettlement(bundle.settlement);

        // Center calendar on patient's arrival date if initialDate was not explicitly pinned
        if (!initialDate) {
          const arrival = new Date(bundle.booking.arrivalDate);
          if (!isNaN(arrival.getTime())) {
            setSelectedDate(arrival);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar el arquetipo';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [storagePort, initialDate]
  );

  // Initial load
  useEffect(() => {
    loadArchetypeData(activeArchetypeId);
  }, [loadArchetypeData, activeArchetypeId]);

  // Switch Archetype
  const switchArchetype = useCallback(
    async (archetypeId: string) => {
      if (archetypeId === activeArchetypeId && activeBooking) return;
      await loadArchetypeData(archetypeId);
    },
    [activeArchetypeId, activeBooking, loadArchetypeData]
  );

  // Modal Open/Close Handlers
  const openNewPatientModal = useCallback(() => {
    setIsNewPatientModalOpen(true);
  }, []);

  const closeNewPatientModal = useCallback(() => {
    setIsNewPatientModalOpen(false);
  }, []);

  const openSendInvitationModal = useCallback(() => {
    setIsSendInvitationModalOpen(true);
  }, []);

  const closeSendInvitationModal = useCallback(() => {
    setIsSendInvitationModalOpen(false);
  }, []);

  const openSmartItineraryModal = useCallback(() => {
    setIsSmartItineraryModalOpen(true);
  }, []);

  const closeSmartItineraryModal = useCallback(() => {
    setIsSmartItineraryModalOpen(false);
  }, []);

  const openSwarmDiagnosticsModal = useCallback(() => {
    setIsSwarmDiagnosticsOpen(true);
  }, []);

  const closeSwarmDiagnosticsModal = useCallback(() => {
    setIsSwarmDiagnosticsOpen(false);
  }, []);

  const toggleSwarmDiagnosticsModal = useCallback(() => {
    setIsSwarmDiagnosticsOpen((prev) => !prev);
  }, []);

  const openWelcomeOrientationModal = useCallback(() => {
    setIsWelcomeOrientationModalOpen(true);
  }, []);

  const closeWelcomeOrientationModal = useCallback(() => {
    setIsWelcomeOrientationModalOpen(false);
  }, []);

  const openCompanionTurnModal = useCallback(() => {
    setIsCompanionTurnModalOpen(true);
  }, []);

  const closeCompanionTurnModal = useCallback(() => {
    setIsCompanionTurnModalOpen(false);
  }, []);

  // Flow 1: Create Patient Booking
  const createPatientBooking = useCallback(
    async (command: CreatePatientBookingDTO): Promise<PatientBooking> => {
      const useCase = new CreatePatientBookingUseCase(storagePort);
      const result = await useCase.execute(command);
      const booking = result.booking || result;

      setActiveArchetypeId(booking.id);
      setActiveBooking(booking);
      setEvents([]);
      setShifts([]);
      setTransfers([]);
      setExpenses([]);
      setSettlement(result.settlement || SettlementLedger.createEmpty(booking.code));

      const arrival = new Date(booking.arrivalDate);
      if (!isNaN(arrival.getTime())) {
        setSelectedDate(arrival);
      }

      return booking;
    },
    [storagePort]
  );

  // Flow 2: Generate Smart Itinerary
  const generateSmartItinerary = useCallback(
    async (presetType: string, baseDate?: Date): Promise<GenerateSmartItineraryResult> => {
      if (!activeBooking) {
        throw new Error('No active booking to generate itinerary for');
      }
      const useCase = new GenerateSmartItineraryUseCase(storagePort);
      const result = await useCase.execute({
        bookingId: activeBooking.code,
        presetType,
        baseDate: baseDate || new Date(activeBooking.arrivalDate),
      });

      setEvents([...result.events]);
      setShifts([...result.shifts]);
      setTransfers([...result.transfers]);
      setExpenses([...result.expenses]);
      setSettlement(result.settlement);

      if (result.events.length > 0) {
        const firstEventDate = new Date(result.events[0].startDateTime);
        if (!isNaN(firstEventDate.getTime())) {
          setSelectedDate(firstEventDate);
        }
      }

      return result;
    },
    [activeBooking, storagePort]
  );

  // Refresh data from storage
  const refreshData = useCallback(async () => {
    if (!activeBooking) return;
    try {
      const bkgEvents = await storagePort.getEventsByBooking(activeBooking.code);
      const bkgShifts = await storagePort.getShiftsByBooking(activeBooking.code);
      const bkgTransfers = await storagePort.getTransfersByBooking(activeBooking.code);
      const bkgExpenses = await storagePort.getExpensesByBooking(activeBooking.code);
      const bkgSettlement = await storagePort.getSettlement(activeBooking.code);

      setEvents(bkgEvents);
      setShifts(bkgShifts);
      setTransfers(bkgTransfers);
      setExpenses(bkgExpenses);
      if (bkgSettlement) setSettlement(bkgSettlement);
    } catch (err: unknown) {
      console.error('Failed to refresh data from storage:', err);
    }
  }, [activeBooking, storagePort]);

  // Recalculate settlement
  const recalculateSettlement = useCallback(async (): Promise<SettlementLedger> => {
    if (!activeBooking) throw new Error('No active booking to reconcile');
    const reconcileUseCase = new ReconcileSettlementUseCase(storagePort);
    const updatedLedger = await reconcileUseCase.execute({ bookingId: activeBooking.code });
    setSettlement(updatedLedger);
    return updatedLedger;
  }, [activeBooking, storagePort]);

  // Companion Turn Sheet Management (Triple-Phase: Optimistic, Persist, Rollback)
  const saveCompanionShift = useCallback(
    async (shift: CompanionShift): Promise<void> => {
      const previousShifts = shifts;
      const previousSettlement = settlement;
      setShifts((prev) => {
        const idx = prev.findIndex((s) => s.id === shift.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = shift;
          return updated;
        }
        return [...prev, shift];
      });

      try {
        await storagePort.saveShift(shift);
        if (activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        setShifts(previousShifts);
        setSettlement(previousSettlement);
        const msg = err instanceof Error ? err.message : 'Error al guardar el turno';
        setError(msg);
        throw err;
      }
    },
    [shifts, settlement, activeBooking, storagePort, recalculateSettlement]
  );

  // Delete Companion Shift (Triple-Phase: Optimistic, Persist, Rollback)
  const deleteShift = useCallback(
    async (shiftId: string): Promise<void> => {
      const previousShifts = shifts;
      const previousSettlement = settlement;
      setShifts((prev) => prev.filter((s) => s.id !== shiftId));

      try {
        await storagePort.deleteShift?.(shiftId);
        if (activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        setShifts(previousShifts);
        setSettlement(previousSettlement);
        const msg = err instanceof Error ? err.message : 'Error al eliminar el turno';
        setError(msg);
        throw err;
      }
    },
    [shifts, settlement, activeBooking, storagePort, recalculateSettlement]
  );

  // Save Transfer (Triple-Phase: Optimistic, Persist, Rollback)
  const saveTransfer = useCallback(
    async (transfer: DriverTransfer): Promise<void> => {
      const previousTransfers = transfers;
      const previousSettlement = settlement;
      setTransfers((prev) => {
        const idx = prev.findIndex((t) => t.id === transfer.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = transfer;
          return updated;
        }
        return [...prev, transfer];
      });

      try {
        await storagePort.saveTransfer(transfer);
        if (activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        setTransfers(previousTransfers);
        setSettlement(previousSettlement);
        const msg = err instanceof Error ? err.message : 'Error al guardar el traslado';
        setError(msg);
        throw err;
      }
    },
    [transfers, settlement, activeBooking, storagePort, recalculateSettlement]
  );

  // Delete Transfer (Triple-Phase: Optimistic, Persist, Rollback)
  const deleteTransfer = useCallback(
    async (transferId: string): Promise<void> => {
      const previousTransfers = transfers;
      const previousSettlement = settlement;
      setTransfers((prev) => prev.filter((t) => t.id !== transferId));

      try {
        await storagePort.deleteTransfer?.(transferId);
        if (activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        setTransfers(previousTransfers);
        setSettlement(previousSettlement);
        const msg = err instanceof Error ? err.message : 'Error al eliminar el traslado';
        setError(msg);
        throw err;
      }
    },
    [transfers, settlement, activeBooking, storagePort, recalculateSettlement]
  );

  // Update Expense (Triple-Phase: Optimistic, Persist, Rollback)
  const updateExpense = useCallback(
    async (expense: ReceiptExpense): Promise<void> => {
      const previousExpenses = expenses;
      const previousSettlement = settlement;
      setExpenses((prev) => {
        const idx = prev.findIndex((e) => e.id === expense.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = expense;
          return updated;
        }
        return [...prev, expense];
      });

      try {
        await storagePort.saveExpense(expense);
        if (activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        setExpenses(previousExpenses);
        setSettlement(previousSettlement);
        const msg = err instanceof Error ? err.message : 'Error al actualizar el gasto';
        setError(msg);
        throw err;
      }
    },
    [expenses, settlement, activeBooking, storagePort, recalculateSettlement]
  );

  // Delete Expense (Triple-Phase: Optimistic, Persist, Rollback)
  const deleteExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      const previousExpenses = expenses;
      const previousSettlement = settlement;
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

      try {
        await storagePort.deleteExpense?.(expenseId);
        if (activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        setExpenses(previousExpenses);
        setSettlement(previousSettlement);
        const msg = err instanceof Error ? err.message : 'Error al eliminar el gasto';
        setError(msg);
        throw err;
      }
    },
    [expenses, settlement, activeBooking, storagePort, recalculateSettlement]
  );

  // Helper to find next valid remaining booking ID when deleting or archiving active
  const resolveRemainingBookingId = useCallback(
    async (excludeIds: string[]): Promise<string | null> => {
      const excludeSet = new Set(excludeIds.map((id) => id.toLowerCase()));

      if (storagePort.getAllBookings) {
        try {
          const all = await storagePort.getAllBookings();
          const remaining = all.find(
            (b) =>
              !excludeSet.has(b.id.toLowerCase()) &&
              !excludeSet.has(b.code.toLowerCase()) &&
              b.status !== 'CANCELADO'
          );
          if (remaining) {
            return remaining.id || remaining.code;
          }
        } catch {
          // ignore
        }
      }
      const archetypeKeys = Object.keys(ARCHETYPES_DATA);
      const remainingKey = archetypeKeys.find(
        (k) =>
          !excludeSet.has(k.toLowerCase()) &&
          !excludeSet.has(ARCHETYPES_DATA[k].id.toLowerCase()) &&
          !excludeSet.has(ARCHETYPES_DATA[k].code.toLowerCase()) &&
          !excludeSet.has(ARCHETYPES_DATA[k].booking.id.toLowerCase()) &&
          !excludeSet.has(ARCHETYPES_DATA[k].booking.code.toLowerCase())
      );
      return remainingKey || null;
    },
    [storagePort]
  );

  // Delete Booking (Triple-Phase: Optimistic transition, Cascading Persist, Rollback)
  const deleteBooking = useCallback(
    async (bookingId: string): Promise<void> => {
      const isCurrentActive =
        activeBooking &&
        (activeBooking.id === bookingId ||
          activeBooking.code === bookingId ||
          activeArchetypeId === bookingId);

      const previousActiveBooking = activeBooking;
      const previousArchetypeId = activeArchetypeId;
      const previousEvents = events;
      const previousShifts = shifts;
      const previousTransfers = transfers;
      const previousExpenses = expenses;
      const previousSettlement = settlement;

      const idsToExclude = [bookingId];
      if (isCurrentActive) {
        if (activeBooking) {
          idsToExclude.push(activeBooking.id, activeBooking.code);
        }
        if (activeArchetypeId) {
          idsToExclude.push(activeArchetypeId);
        }
      }

      let nextRemainingId: string | null = null;
      if (isCurrentActive) {
        nextRemainingId = await resolveRemainingBookingId(idsToExclude);
      }

      // Optimistic active booking transition
      if (isCurrentActive) {
        if (nextRemainingId) {
          await loadArchetypeData(nextRemainingId);
        } else {
          setActiveBooking(null);
          setEvents([]);
          setShifts([]);
          setTransfers([]);
          setExpenses([]);
          setSettlement(null);
        }
      }

      try {
        await storagePort.deleteBooking?.(bookingId);
        if (activeBooking && isCurrentActive) {
          if (activeBooking.code && activeBooking.code !== bookingId) {
            await storagePort.deleteBooking?.(activeBooking.code);
          }
          if (activeBooking.id && activeBooking.id !== bookingId) {
            await storagePort.deleteBooking?.(activeBooking.id);
          }
        }
        if (!isCurrentActive && activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        if (isCurrentActive) {
          setActiveArchetypeId(previousArchetypeId);
          setActiveBooking(previousActiveBooking);
          setEvents(previousEvents);
          setShifts(previousShifts);
          setTransfers(previousTransfers);
          setExpenses(previousExpenses);
          setSettlement(previousSettlement);
        }
        const msg = err instanceof Error ? err.message : 'Error al eliminar la reserva';
        setError(msg);
        throw err;
      }
    },
    [
      activeBooking,
      activeArchetypeId,
      events,
      shifts,
      transfers,
      expenses,
      settlement,
      resolveRemainingBookingId,
      loadArchetypeData,
      storagePort,
      recalculateSettlement,
    ]
  );

  // Archive Booking (Triple-Phase: Optimistic transition, Persist status CANCELADO, Rollback)
  const archiveBooking = useCallback(
    async (bookingId: string): Promise<void> => {
      const isCurrentActive =
        activeBooking &&
        (activeBooking.id === bookingId ||
          activeBooking.code === bookingId ||
          activeArchetypeId === bookingId);

      const previousActiveBooking = activeBooking;
      const previousArchetypeId = activeArchetypeId;
      const previousEvents = events;
      const previousShifts = shifts;
      const previousTransfers = transfers;
      const previousExpenses = expenses;
      const previousSettlement = settlement;

      const idsToExclude = [bookingId];
      if (isCurrentActive) {
        if (activeBooking) {
          idsToExclude.push(activeBooking.id, activeBooking.code);
        }
        if (activeArchetypeId) {
          idsToExclude.push(activeArchetypeId);
        }
      }

      let nextRemainingId: string | null = null;
      if (isCurrentActive) {
        nextRemainingId = await resolveRemainingBookingId(idsToExclude);
      }

      // Optimistic active booking transition
      if (isCurrentActive) {
        if (nextRemainingId) {
          await loadArchetypeData(nextRemainingId);
        } else {
          setActiveBooking(null);
          setEvents([]);
          setShifts([]);
          setTransfers([]);
          setExpenses([]);
          setSettlement(null);
        }
      }

      try {
        const bkg = await storagePort.getBooking(bookingId);
        if (bkg) {
          const archived = new PatientBooking({
            ...bkg,
            status: 'CANCELADO',
          });
          await storagePort.saveBooking(archived);
        } else {
          await storagePort.deleteBooking?.(bookingId);
        }
        if (!isCurrentActive && activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        if (isCurrentActive) {
          setActiveArchetypeId(previousArchetypeId);
          setActiveBooking(previousActiveBooking);
          setEvents(previousEvents);
          setShifts(previousShifts);
          setTransfers(previousTransfers);
          setExpenses(previousExpenses);
          setSettlement(previousSettlement);
        }
        const msg = err instanceof Error ? err.message : 'Error al archivar la reserva';
        setError(msg);
        throw err;
      }
    },
    [
      activeBooking,
      activeArchetypeId,
      events,
      shifts,
      transfers,
      expenses,
      settlement,
      resolveRemainingBookingId,
      loadArchetypeData,
      storagePort,
      recalculateSettlement,
    ]
  );

  // Calendar Navigation
  const navigateDate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      setSelectedDate((curr) => {
        const next = new Date(curr);
        if (direction === 'today') {
          return activeBooking ? new Date(activeBooking.arrivalDate) : new Date();
        }

        if (activeView === 'month') {
          next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (activeView === 'week') {
          next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
        } else if (activeView === 'day' || activeView === 'agenda') {
          next.setDate(next.getDate() + (direction === 'next' ? 1 : -1));
        }
        return next;
      });
    },
    [activeView, activeBooking]
  );

  // Drawer handlers
  const openCreateDrawer = useCallback((slot?: DateSlotPreset) => {
    setDrawerMode('create');
    setActiveEvent(null);
    setDefaultSlot(slot || null);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((event: ItineraryEvent) => {
    setDrawerMode('edit');
    setActiveEvent(event);
    setDefaultSlot(null);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setActiveEvent(null);
    setDefaultSlot(null);
  }, []);

  // Create Event
  const createEvent = useCallback(
    async (command: CreateEventCommand): Promise<ItineraryEvent> => {
      const createUseCase = new CreateEventUseCase(storagePort);
      const newEvent = await createUseCase.execute(command);
      setEvents((prev) => [...prev, newEvent]);
      await recalculateSettlement();
      return newEvent;
    },
    [storagePort, recalculateSettlement]
  );

  // Update Event
  const updateEvent = useCallback(
    async (event: ItineraryEvent): Promise<void> => {
      await storagePort.saveEvent(event);
      setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
      await recalculateSettlement();
    },
    [storagePort, recalculateSettlement]
  );

  // Reschedule Event
  const rescheduleEvent = useCallback(
    async (
      eventId: string,
      newStartDateTime: string,
      newEndDateTime: string,
      newLocation?: string
    ): Promise<ItineraryEvent> => {
      const rescheduleUseCase = new RescheduleEventUseCase(storagePort);
      const updated = await rescheduleUseCase.execute({
        eventId,
        newStartDateTime,
        newEndDateTime,
        newLocation,
      });
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
      await recalculateSettlement();
      return updated;
    },
    [storagePort, recalculateSettlement]
  );

  // Delete Event (Triple-Phase: Optimistic, Persist, Rollback)
  const deleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      const previousEvents = events;
      const previousSettlement = settlement;
      setEvents((prev) => prev.filter((e) => e.id !== eventId));

      try {
        await storagePort.deleteEvent(eventId);
        if (activeBooking) {
          await recalculateSettlement();
        }
      } catch (err: unknown) {
        setEvents(previousEvents);
        setSettlement(previousSettlement);
        const msg = err instanceof Error ? err.message : 'Error al eliminar el evento';
        setError(msg);
        throw err;
      }
    },
    [events, settlement, activeBooking, storagePort, recalculateSettlement]
  );

  // Transition Event Status
  const transitionEventStatus = useCallback(
    async (eventId: string, nextStatus: EventStatusType): Promise<void> => {
      const target = events.find((e) => e.id === eventId);
      if (!target) return;
      const updated = target.transitionStatus(nextStatus);
      await updateEvent(updated);
    },
    [events, updateEvent]
  );

  // Settle Expense
  const settleExpense = useCallback(
    async (command: SettleExpenseCommand): Promise<SettleExpenseResult> => {
      const bookingCode = command.bookingId || activeBooking?.code || 'BOOKING-DEFAULT';
      const useCase = new SettleExpenseUseCase(storagePort, storagePort);
      const result = await useCase.execute({
        ...command,
        bookingId: bookingCode,
      });
      setExpenses((prev) => [...prev, result.expense]);
      setSettlement(result.settlement);
      return result;
    },
    [activeBooking, storagePort]
  );

  // Log Fast 1-Click Out-of-Pocket Expense
  const logFastExpense = useCallback(
    async (preset: {
      category: ExpenseCategory;
      description: string;
      amountCOP: number;
      vendorName?: string;
    }): Promise<ReceiptExpense> => {
      const bookingCode = activeBooking?.code || 'BOOKING-DEFAULT';
      const useCase = new SettleExpenseUseCase(storagePort, storagePort);

      const receiptData = `RECIBO RÁPIDO - ${preset.description}\nMonto: $${preset.amountCOP.toLocaleString('es-CO')} COP\nFecha: ${new Date().toISOString()}\nReserva: ${bookingCode}`;
      const result = await useCase.execute({
        bookingId: bookingCode,
        category: preset.category,
        description: preset.description,
        amountCOP: preset.amountCOP,
        vendorName: preset.vendorName || 'Comercio Local',
        receiptBlobData: receiptData,
        mimeType: 'text/plain',
        status: 'APPROVED',
        audited: true,
      });

      setExpenses((prev) => [...prev, result.expense]);
      setSettlement(result.settlement);
      return result.expense;
    },
    [activeBooking, storagePort]
  );

  // Flow 5: Execute 1-Tap Settlement Workflow (Reconciliation, Digital Signature, Cryptographic Seal, PDF Statement)
  const executeOneTapSettlementWorkflow = useCallback(
    async (dto: OneTapSettlementWorkflowDTO): Promise<OneTapSettlementWorkflowResult> => {
      const exportAdapter = new JsonPdfExportAdapter();
      const useCase = new OneTapSettlementWorkflowUseCase(storagePort, exportAdapter, storagePort);
      const result = await useCase.execute(dto);
      setSettlement(result.ledger);
      await refreshData();
      return result;
    },
    [storagePort, refreshData]
  );

  // Milestone 2: 1-Click Driver Check-In Terminal & Logistics Handoff
  const performDriverCheckIn = useCallback(
    async (command?: Partial<PerformDriverCheckInCommand>): Promise<PerformDriverCheckInResult> => {
      const bookingCode = command?.bookingId || activeBooking?.id || activeBooking?.code || '';
      const useCase = new PerformDriverCheckInUseCase(storagePort);
      const result = await useCase.execute({
        bookingId: bookingCode,
        transferId: command?.transferId,
        eventId: command?.eventId,
        targetTransferStatus: command?.targetTransferStatus || 'IN_TRANSIT',
        targetEventStatus: command?.targetEventStatus || 'EN_SITIO',
        driverNotes: command?.driverNotes,
        gpsCoordinates: command?.gpsCoordinates,
      });

      // Update state in memory
      setTransfers((prev) =>
        prev.map((t) => (t.id === result.transfer.id ? result.transfer : t))
      );
      if (result.event) {
        setEvents((prev) =>
          prev.map((e) => (e.id === result.event?.id ? result.event! : e))
        );
      }
      await refreshData();
      await recalculateSettlement();
      return result;
    },
    [activeBooking, storagePort, refreshData, recalculateSettlement]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      // 1. Diagnostics shortcut takes top priority
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsSwarmDiagnosticsOpen((prev) => !prev);
        return;
      }

      // 2. Suppress single-key shortcuts when modifier keys are pressed (e.g. Cmd+C, Cmd+A, Cmd+W, Cmd+N)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setActiveView('month');
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setActiveView('week');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setActiveView('day');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setActiveView('agenda');
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        navigateDate('today');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        openCreateDrawer();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsNewPatientModalOpen(true);
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setIsSmartItineraryModalOpen(true);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setIsCompanionTurnModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, [navigateDate, openCreateDrawer]);

  const value: AppContextType = {
    activeArchetypeId,
    activeBundle,
    activeBooking,
    events,
    shifts,
    transfers,
    expenses,
    settlement,
    activeView,
    activeModule,
    setActiveModule,
    selectedDate,
    isDrawerOpen,
    drawerMode,
    activeEvent,
    defaultSlot,
    isLoading,
    error,
    storagePort,
    isNewPatientModalOpen,
    isSendInvitationModalOpen,
    isSmartItineraryModalOpen,
    isSwarmDiagnosticsOpen,
    isWelcomeOrientationModalOpen,
    isCompanionTurnModalOpen,
    switchArchetype,
    setActiveView,
    setSelectedDate,
    navigateDate,
    openCreateDrawer,
    openEditDrawer,
    closeDrawer,
    openNewPatientModal,
    closeNewPatientModal,
    openSendInvitationModal,
    closeSendInvitationModal,
    openSmartItineraryModal,
    closeSmartItineraryModal,
    openSwarmDiagnosticsModal,
    closeSwarmDiagnosticsModal,
    toggleSwarmDiagnosticsModal,
    openWelcomeOrientationModal,
    closeWelcomeOrientationModal,
    openCompanionTurnModal,
    closeCompanionTurnModal,
    saveCompanionShift,
    deleteShift,
    saveTransfer,
    deleteTransfer,
    updateExpense,
    deleteExpense,
    deleteBooking,
    archiveBooking,
    performDriverCheckIn,
    createPatientBooking,
    createNewPatient: createPatientBooking,
    generateSmartItinerary,
    createEvent,
    updateEvent,
    rescheduleEvent,
    deleteEvent,
    transitionEventStatus,
    settleExpense,
    executeOneTapSettlementWorkflow,
    logFastExpense,
    refreshData,
    recalculateSettlement,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const useApp = useAppContext;
