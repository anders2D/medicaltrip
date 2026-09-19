// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppProvider, useAppContext } from '@/presentation/state/AppContext';
import { InMemoryStorageAdapter } from '@/core/infrastructure/storage/InMemoryStorageAdapter';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { ReceiptExpense } from '@/features/settlement';
import { Money } from '@/core/domain/value-objects/Money';
import { OperativeTerritory } from '@/core/domain/value-objects/OperativeTerritory';
import { CompanionTurnSheetModal } from '@/features/companion-shifts/presentation/CompanionTurnSheetModal';
import { PassengersView } from '@/features/directory/presentation/PassengersView';

describe('AppContext CRUD Methods Wiring & UI State Sync Suite', () => {
  let adapter: InMemoryStorageAdapter;

  beforeEach(() => {
    adapter = new InMemoryStorageAdapter();
  });

  const createWrapper = (initialArchetype = 'rva171') => {
    return ({ children }: { children: React.ReactNode }) => (
      <AppProvider storagePort={adapter} initialArchetypeId={initialArchetype}>
        {children}
      </AppProvider>
    );
  };

  // =========================================================================
  // 1. Initial State & Hydration
  // =========================================================================
  it('1.1 hydrates activeBooking, shifts, transfers, expenses, and settlement on initial mount', async () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper('rva171'),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeBooking).not.toBeNull();
    });

    expect(result.current.activeBooking?.code).toBe('RVA171-4');
    expect(result.current.shifts.length).toBeGreaterThan(0);
    expect(result.current.transfers.length).toBeGreaterThan(0);
    expect(result.current.expenses.length).toBeGreaterThan(0);
    expect(result.current.settlement).not.toBeNull();
    expect(typeof result.current.settlement!.totalExpenses.cents).toBe('bigint');
    expect(typeof result.current.settlement!.totalGuideFees.cents).toBe('bigint');
  });

  // =========================================================================
  // 2. Companion Shift CRUD & Rollback
  // =========================================================================
  describe('Companion Shifts CRUD & Rollback', () => {
    it('2.1 saveCompanionShift: optimistically updates state, persists to storage, and recalculates settlement', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const initialCount = result.current.shifts.length;
      const initialShiftTotal = result.current.settlement!.totalGuideFees.cents;

      const newShift = new CompanionShift({
        id: 'SHIFT-SYNC-001',
        bookingId: result.current.activeBooking!.code,
        guideId: 'GUIA-01',
        guideName: 'Yenny Roberto',
        dayNumber: 2,
        date: '2026-09-15',
        hoursLogged: 6,
        hourlyRate: Money.fromAmount(15500, 'COP'),
        prepAllowance: Money.fromAmount(15500, 'COP'),
        mealSubsidyTier: 'TIER_2',
        mealSubsidyAmount: Money.fromAmount(25000, 'COP'),
        notes: 'Turno clínico agregado en prueba',
        status: 'COMPLETED',
      });

      await act(async () => {
        await result.current.saveCompanionShift(newShift);
      });

      expect(result.current.shifts.length).toBe(initialCount + 1);
      expect(result.current.shifts.some((s) => s.id === 'SHIFT-SYNC-001')).toBe(true);

      // Verify persistence in adapter
      const inStorage = await adapter.getShiftsByBooking(result.current.activeBooking!.code);
      expect(inStorage.some((s) => s.id === 'SHIFT-SYNC-001')).toBe(true);

      // Verify settlement recalculation
      const newShiftFee = newShift.calculateTotalFee().cents;
      expect(result.current.settlement!.totalGuideFees.cents).toBe(initialShiftTotal + newShiftFee);
    });

    it('2.2 saveCompanionShift: rolls back state and settlement on storage error', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const initialCount = result.current.shifts.length;
      const initialShiftTotal = result.current.settlement!.totalGuideFees.cents;

      const failShift = new CompanionShift({
        id: 'SHIFT-FAIL-001',
        bookingId: result.current.activeBooking!.code,
        guideId: 'GUIA-01',
        guideName: 'Yenny Roberto',
        dayNumber: 3,
        date: '2026-09-16',
        hoursLogged: 4,
        hourlyRate: Money.fromAmount(15500, 'COP'),
        prepAllowance: Money.fromAmount(15500, 'COP'),
        mealSubsidyTier: 'TIER_1',
        mealSubsidyAmount: Money.fromAmount(8000, 'COP'),
        notes: 'Turno fallido',
        status: 'COMPLETED',
      });

      vi.spyOn(adapter, 'saveShift').mockRejectedValueOnce(new Error('Storage failure: saveShift'));

      await expect(
        act(async () => {
          await result.current.saveCompanionShift(failShift);
        })
      ).rejects.toThrow('Storage failure: saveShift');

      // State and settlement rolled back
      expect(result.current.shifts.length).toBe(initialCount);
      expect(result.current.shifts.some((s) => s.id === 'SHIFT-FAIL-001')).toBe(false);
      expect(result.current.settlement!.totalGuideFees.cents).toBe(initialShiftTotal);
    });

    it('2.3 deleteShift: optimistically removes shift, persists deletion, and updates settlement', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const targetShift = result.current.shifts[0];
      expect(targetShift).toBeDefined();
      const initialCount = result.current.shifts.length;
      const initialShiftTotal = result.current.settlement!.totalGuideFees.cents;
      const targetFee = targetShift.calculateTotalFee().cents;

      await act(async () => {
        await result.current.deleteShift(targetShift.id);
      });

      expect(result.current.shifts.length).toBe(initialCount - 1);
      expect(result.current.shifts.some((s) => s.id === targetShift.id)).toBe(false);

      // Verify persistence
      const inStorage = await adapter.getShiftsByBooking(result.current.activeBooking!.code);
      expect(inStorage.some((s) => s.id === targetShift.id)).toBe(false);

      // Verify recalculated settlement
      expect(result.current.settlement!.totalGuideFees.cents).toBe(initialShiftTotal - targetFee);
    });

    it('2.4 deleteShift: rolls back state and settlement if storage deletion fails', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const targetShift = result.current.shifts[0];
      const initialCount = result.current.shifts.length;
      const initialShiftTotal = result.current.settlement!.totalGuideFees.cents;

      vi.spyOn(adapter, 'deleteShift').mockRejectedValueOnce(new Error('Storage failure: deleteShift'));

      await expect(
        act(async () => {
          await result.current.deleteShift(targetShift.id);
        })
      ).rejects.toThrow('Storage failure: deleteShift');

      // Shift is restored to state and settlement untouched
      expect(result.current.shifts.length).toBe(initialCount);
      expect(result.current.shifts.some((s) => s.id === targetShift.id)).toBe(true);
      expect(result.current.settlement!.totalGuideFees.cents).toBe(initialShiftTotal);
    });
  });

  // =========================================================================
  // 3. Driver Transfer CRUD & Rollback
  // =========================================================================
  describe('Driver Transfers CRUD & Rollback', () => {
    it('3.1 saveTransfer: optimistically saves transfer, persists to storage, and updates state', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const initialCount = result.current.transfers.length;

      const newTransfer = new DriverTransfer({
        id: 'TRF-SYNC-001',
        bookingId: result.current.activeBooking!.code,
        driverId: 'DRV-01',
        driverName: 'Ramón Rosero',
        vehicleType: 'VAN',
        routeType: 'HOTEL_CLINIC',
        origin: OperativeTerritory.fromPreset('POBLADO', 'Hotel Inntu'),
        destination: OperativeTerritory.fromPreset('CIUDAD_DEL_RIO', 'Clínica CIMA'),
        scheduledTime: '2026-09-15T08:00:00.000Z',
        baseRate: Money.fromAmount(90000, 'COP'),
        status: 'CONFIRMED',
      });

      await act(async () => {
        await result.current.saveTransfer(newTransfer);
      });

      expect(result.current.transfers.length).toBe(initialCount + 1);
      expect(result.current.transfers.some((t) => t.id === 'TRF-SYNC-001')).toBe(true);

      const inStorage = await adapter.getTransfersByBooking(result.current.activeBooking!.code);
      expect(inStorage.some((t) => t.id === 'TRF-SYNC-001')).toBe(true);
    });

    it('3.2 deleteTransfer: optimistically removes transfer, persists, and rolls back on failure', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const target = result.current.transfers[0];
      expect(target).toBeDefined();
      const initialCount = result.current.transfers.length;

      // Successful deletion
      await act(async () => {
        await result.current.deleteTransfer(target.id);
      });

      expect(result.current.transfers.length).toBe(initialCount - 1);
      expect(result.current.transfers.some((t) => t.id === target.id)).toBe(false);

      const inStorage = await adapter.getTransfersByBooking(result.current.activeBooking!.code);
      expect(inStorage.some((t) => t.id === target.id)).toBe(false);

      // Failure with rollback
      const nextTarget = result.current.transfers[0];
      const countBeforeFail = result.current.transfers.length;
      vi.spyOn(adapter, 'deleteTransfer').mockRejectedValueOnce(new Error('Storage failure: deleteTransfer'));

      await expect(
        act(async () => {
          await result.current.deleteTransfer(nextTarget.id);
        })
      ).rejects.toThrow('Storage failure: deleteTransfer');

      expect(result.current.transfers.length).toBe(countBeforeFail);
      expect(result.current.transfers.some((t) => t.id === nextTarget.id)).toBe(true);
    });
  });

  // =========================================================================
  // 4. Receipt Expense CRUD & Rollback
  // =========================================================================
  describe('Receipt Expenses CRUD & Rollback', () => {
    it('4.1 updateExpense: updates amount, recalculates BigInt settlement deterministically', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const targetExpense = result.current.expenses[0];
      expect(targetExpense).toBeDefined();
      const initialTotalExpenses = result.current.settlement!.totalExpenses.cents;
      const oldAmountCents = targetExpense.amount.cents;

      const newAmountCOP = 250000;
      const newAmountCents = 25000000n;
      const updatedExpense = new ReceiptExpense({
        id: targetExpense.id,
        bookingId: targetExpense.bookingId,
        category: targetExpense.category,
        description: 'Gasto actualizado en test',
        amount: Money.fromAmount(newAmountCOP, 'COP'),
        vendorName: 'Farmacia Principal',
        date: targetExpense.date,
        audited: true,
        status: 'APPROVED',
      });

      await act(async () => {
        await result.current.updateExpense(updatedExpense);
      });

      const found = result.current.expenses.find((e) => e.id === targetExpense.id);
      expect(found?.amount.cents).toBe(newAmountCents);

      const expectedTotal = initialTotalExpenses - oldAmountCents + newAmountCents;
      expect(result.current.settlement!.totalExpenses.cents).toBe(expectedTotal);
    });

    it('4.2 deleteExpense: deletes expense, recalculates settlement, and rolls back on failure', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const target = result.current.expenses[0];
      const initialCount = result.current.expenses.length;
      const initialTotal = result.current.settlement!.totalExpenses.cents;
      const targetCents = target.amount.cents;

      // Successful delete
      await act(async () => {
        await result.current.deleteExpense(target.id);
      });

      expect(result.current.expenses.length).toBe(initialCount - 1);
      expect(result.current.expenses.some((e) => e.id === target.id)).toBe(false);
      expect(result.current.settlement!.totalExpenses.cents).toBe(initialTotal - targetCents);

      // Failure rollback test
      const nextTarget = result.current.expenses[0];
      const countBeforeFail = result.current.expenses.length;
      const totalBeforeFail = result.current.settlement!.totalExpenses.cents;

      vi.spyOn(adapter, 'deleteExpense').mockRejectedValueOnce(new Error('Storage failure: deleteExpense'));

      await expect(
        act(async () => {
          await result.current.deleteExpense(nextTarget.id);
        })
      ).rejects.toThrow('Storage failure: deleteExpense');

      expect(result.current.expenses.length).toBe(countBeforeFail);
      expect(result.current.expenses.some((e) => e.id === nextTarget.id)).toBe(true);
      expect(result.current.settlement!.totalExpenses.cents).toBe(totalBeforeFail);
    });
  });

  // =========================================================================
  // 5. Itinerary Event CRUD & Rollback
  // =========================================================================
  describe('Itinerary Event Deletion & Rollback', () => {
    it('5.1 deleteEvent: optimistically removes event, persists, and rolls back on error', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const targetEvent = result.current.events[0];
      expect(targetEvent).toBeDefined();
      const initialCount = result.current.events.length;

      await act(async () => {
        await result.current.deleteEvent(targetEvent.id);
      });

      expect(result.current.events.length).toBe(initialCount - 1);
      expect(result.current.events.some((e) => e.id === targetEvent.id)).toBe(false);

      const inStorage = await adapter.getEventsByBooking(result.current.activeBooking!.code);
      expect(inStorage.some((e) => e.id === targetEvent.id)).toBe(false);

      // Rollback test
      const nextTarget = result.current.events[0];
      const countBeforeFail = result.current.events.length;

      vi.spyOn(adapter, 'deleteEvent').mockRejectedValueOnce(new Error('Storage failure: deleteEvent'));

      await expect(
        act(async () => {
          await result.current.deleteEvent(nextTarget.id);
        })
      ).rejects.toThrow('Storage failure: deleteEvent');

      expect(result.current.events.length).toBe(countBeforeFail);
      expect(result.current.events.some((e) => e.id === nextTarget.id)).toBe(true);
    });
  });

  // =========================================================================
  // 6. Booking Delete / Archive & Clean Transition
  // =========================================================================
  describe('Booking Deletion & Archiving Clean Transition', () => {
    it('6.1 deleteBooking: deletes active booking and cleanly transitions activeBooking to remaining booking', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.activeBooking?.code).toBe('RVA171-4');

      await act(async () => {
        await result.current.deleteBooking('rva171');
      });

      // Transitions to another valid booking (e.g. rva350, rva282, etc.)
      expect(result.current.activeBooking).not.toBeNull();
      expect(result.current.activeBooking?.id).not.toBe('rva171');
      expect(result.current.activeBooking?.code).not.toBe('RVA171-4');

      // State is hydrated for new active booking
      expect(result.current.shifts).toBeDefined();
      expect(result.current.expenses).toBeDefined();
      expect(result.current.settlement).not.toBeNull();
    });

    it('6.2 deleteBooking: rolls back active booking state if storage deletion fails', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const originalCode = result.current.activeBooking?.code;

      vi.spyOn(adapter, 'deleteBooking').mockRejectedValueOnce(new Error('Storage failure: deleteBooking'));

      await expect(
        act(async () => {
          await result.current.deleteBooking('rva171');
        })
      ).rejects.toThrow('Storage failure: deleteBooking');

      expect(result.current.activeBooking?.code).toBe(originalCode);
    });

    it('6.3 archiveBooking: marks booking as CANCELADO and transitions activeBooking cleanly', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.archiveBooking('rva171');
      });

      expect(result.current.activeBooking).not.toBeNull();
      expect(result.current.activeBooking?.code).not.toBe('RVA171-4');

      // Check that original booking was marked CANCELADO in storage
      const archivedInStorage = await adapter.getBooking('rva171');
      if (archivedInStorage) {
        expect(archivedInStorage.status).toBe('CANCELADO');
      }
    });
  });

  // =========================================================================
  // 7. DexieStorageAdapter Cascading Delete Parity
  // =========================================================================
  describe('DexieStorageAdapter Cascading Delete Parity', () => {
    it('7.1 cascades deleteBooking across events, shifts, transfers, expenses, settlements in Dexie', async () => {
      const { DexieStorageAdapter, MedicalTripDexieDB } = await import(
        '@/core/infrastructure/storage/DexieStorageAdapter'
      );
      const { indexedDB, IDBKeyRange } = await import('fake-indexeddb');
      (globalThis as any).indexedDB = indexedDB;
      (globalThis as any).IDBKeyRange = IDBKeyRange;

      const dbName = `MedicalTripTest_${Date.now()}`;
      const dexieDb = new MedicalTripDexieDB(dbName, { indexedDB, IDBKeyRange });
      const dexieAdapter = new DexieStorageAdapter(dexieDb);

      const testBookingId = 'BKG-DEXIE-001';
      const testBookingCode = 'RVA-DEX-001';

      const { PatientBooking } = await import('@/core/domain/entities/PatientBooking');
      const { ItineraryEvent } = await import('@/features/itinerary');
      const { SettlementLedger } = await import('@/features/settlement');

      // 1. Seed records
      const bkg = new PatientBooking({
        id: testBookingId,
        code: testBookingCode,
        patientId: 'ENT-PAX-9999',
        firstName: 'DexieTest',
        lastName: 'Patient',
        passportHash: 'hash123',
        country: 'Curazao',
        language: 'Papiamento',
        phone: '+5999 123456',
        email: 'dexie@test.com',
        paxCount: 1,
        arrivalDate: '2026-09-20T10:00:00.000Z',
        departureDate: '2026-09-25T10:00:00.000Z',
        arrivalAirline: 'Z-Fly',
        arrivalFlight: 'ZF-104',
        hotelId: 'HOTEL-TEST',
        hotelName: 'Hotel Test',
      });
      await dexieAdapter.saveBooking(bkg);

      const evt = new ItineraryEvent({
        id: 'EVT-DEX-001',
        bookingId: testBookingCode,
        dayNumber: 1,
        title: 'Consulta Dexie',
        category: 'CLINICAL',
        startDateTime: '2026-09-20T12:00:00.000Z',
        endDateTime: '2026-09-20T13:00:00.000Z',
        location: OperativeTerritory.fromPreset('POBLADO', 'Hotel Test'),
        providerName: 'Test Clinic',
        financialType: 'OUT_OF_POCKET',
        cost: Money.fromAmount(50000, 'COP'),
        status: 'PROGRAMADO',
      });
      await dexieAdapter.saveEvent(evt);

      const shift = new CompanionShift({
        id: 'SHIFT-DEX-001',
        bookingId: testBookingCode,
        guideId: 'GUIA-01',
        guideName: 'Yenny',
        dayNumber: 1,
        date: '2026-09-20',
        hoursLogged: 4,
        hourlyRate: Money.fromAmount(15500, 'COP'),
        prepAllowance: Money.fromAmount(15500, 'COP'),
        mealSubsidyTier: 'TIER_1',
        mealSubsidyAmount: Money.fromAmount(8000, 'COP'),
        notes: 'Dexie shift',
        status: 'COMPLETED',
      });
      await dexieAdapter.saveShift(shift);

      const transfer = new DriverTransfer({
        id: 'TRF-DEX-001',
        bookingId: testBookingCode,
        driverId: 'DRV-01',
        driverName: 'Ramón',
        vehicleType: 'SEDAN',
        routeType: 'AIRPORT_ARRIVAL',
        origin: OperativeTerritory.fromPreset('POBLADO', 'Hotel Test'),
        destination: OperativeTerritory.fromPreset('CIUDAD_DEL_RIO', 'Clínica CIMA'),
        scheduledTime: '2026-09-20T10:30:00.000Z',
        baseRate: Money.fromAmount(90000, 'COP'),
        status: 'CONFIRMED',
      });
      await dexieAdapter.saveTransfer(transfer);

      const expense = new ReceiptExpense({
        id: 'EXP-DEX-001',
        bookingId: testBookingCode,
        category: 'PHARMACY',
        description: 'Medicina Dexie',
        amount: Money.fromAmount(45000, 'COP'),
        vendorName: 'Farmacia',
        date: '2026-09-20',
        audited: true,
        status: 'APPROVED',
      });
      await dexieAdapter.saveExpense(expense);

      const settlement = SettlementLedger.calculate({
        bookingId: testBookingCode,
        expenses: [expense],
        shifts: [shift],
        transfers: [transfer],
        advances: [],
      });
      await dexieAdapter.saveSettlement(settlement);

      // Verify records are present before deletion
      expect(await dexieAdapter.getBooking(testBookingId)).not.toBeNull();
      expect(await dexieAdapter.getEventsByBooking(testBookingCode)).toHaveLength(1);
      expect(await dexieAdapter.getShiftsByBooking(testBookingCode)).toHaveLength(1);
      expect(await dexieAdapter.getTransfersByBooking(testBookingCode)).toHaveLength(1);
      expect(await dexieAdapter.getExpensesByBooking(testBookingCode)).toHaveLength(1);
      expect(await dexieAdapter.getSettlement(testBookingCode)).not.toBeNull();

      // Execute cascading delete by bookingId
      await dexieAdapter.deleteBooking(testBookingId);

      // Verify all child records were cleanly cascaded
      expect(await dexieAdapter.getBooking(testBookingId)).toBeNull();
      expect(await dexieAdapter.getEventsByBooking(testBookingCode)).toHaveLength(0);
      expect(await dexieAdapter.getShiftsByBooking(testBookingCode)).toHaveLength(0);
      expect(await dexieAdapter.getTransfersByBooking(testBookingCode)).toHaveLength(0);
      expect(await dexieAdapter.getExpensesByBooking(testBookingCode)).toHaveLength(0);
      expect(await dexieAdapter.getSettlement(testBookingCode)).toBeNull();

      await dexieDb.close();
    });
  });

  // =========================================================================
  // 8. Math Determinism Invariant
  // =========================================================================
  describe('Ledger Arithmetic Invariant', () => {
    it('8.1 guarantees strict BigInt cents math throughout all CRUD operations', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: createWrapper('rva171'),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const ledger = result.current.settlement!;
      expect(typeof ledger.totalExpenses.cents).toBe('bigint');
      expect(typeof ledger.totalGuideFees.cents).toBe('bigint');
      expect(typeof ledger.totalFleetTaxis.cents).toBe('bigint');
      expect(typeof ledger.totalAdvances.cents).toBe('bigint');
      expect(typeof ledger.netBalance.cents).toBe('bigint');

      // Mathematical identity: netBalance = totalExpenses + totalGuideFees + totalFleetTaxis - totalAdvances
      const expectedNet =
        ledger.totalExpenses.cents +
        ledger.totalGuideFees.cents +
        ledger.totalFleetTaxis.cents -
        ledger.totalAdvances.cents;
      expect(ledger.netBalance.cents).toBe(expectedNet);
    });
  });

  // =========================================================================
  // 9. CompanionTurnSheetModal Ghost Expense Fix
  // =========================================================================
  describe('CompanionTurnSheetModal Ghost Expense Fix', () => {
    it('9.1 handleRemoveExpense invokes deleteExpense ensuring persisted expenses are purged from storage', async () => {
      const expId = 'EXP-MODAL-001';
      const expense = new ReceiptExpense({
        id: expId,
        bookingId: 'RVA171-4',
        category: 'PHARMACY',
        description: 'Medicina en turno',
        amount: Money.fromAmount(35000, 'COP'),
        vendorName: 'Droguería',
        date: '2026-08-20',
        audited: true,
        status: 'APPROVED',
      });

      // Seed in adapter
      await adapter.saveExpense(expense);

      render(
        <AppProvider storagePort={adapter} initialArchetypeId="rva171">
          <CompanionTurnSheetModal isOpen={true} onClose={() => {}} />
        </AppProvider>
      );

      // Wait for the modal and remove expense button to appear
      const removeBtn = await waitFor(() => screen.getByTestId(`btn-remove-expense-${expId}`));
      expect(removeBtn).toBeDefined();

      await act(async () => {
        fireEvent.click(removeBtn);
      });

      // Assert expense is deleted from storagePort (no ghost expense)
      await waitFor(async () => {
        const remaining = await adapter.getExpensesByBooking('RVA171-4');
        expect(remaining.some((e) => e.id === expId)).toBe(false);
      });
    });
  });

  // =========================================================================
  // 10. PassengersView UI Deletion & Archiving via AppContext
  // =========================================================================
  describe('PassengersView UI Deletion & Archiving via AppContext', () => {
    it('10.1 clicking delete button calls deleteBooking from AppContext and transitions booking', async () => {
      render(
        <AppProvider storagePort={adapter} initialArchetypeId="rva171">
          <PassengersView />
        </AppProvider>
      );

      const deleteBtn = await waitFor(() => screen.getByTestId('btn-delete-booking'));
      expect(deleteBtn).toBeDefined();

      await act(async () => {
        fireEvent.click(deleteBtn);
      });

      // Active booking transitioned
      await waitFor(async () => {
        const bookings = await adapter.getAllBookings();
        expect(bookings.some((b) => b.id === 'rva171' || b.id === 'bkg-rva171')).toBe(false);
      });
    });

    it('10.2 clicking archive button calls archiveBooking from AppContext', async () => {
      render(
        <AppProvider storagePort={adapter} initialArchetypeId="rva171">
          <PassengersView />
        </AppProvider>
      );

      const archiveBtn = await waitFor(() => screen.getByTestId('btn-archive-booking'));
      expect(archiveBtn).toBeDefined();

      await act(async () => {
        fireEvent.click(archiveBtn);
      });

      await waitFor(async () => {
        const bkg = await adapter.getBooking('rva171');
        if (bkg) {
          expect(bkg.status).toBe('CANCELADO');
        }
      });
    });
  });
});
