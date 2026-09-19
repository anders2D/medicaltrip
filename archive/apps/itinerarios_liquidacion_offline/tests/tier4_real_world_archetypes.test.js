/**
 * TIER 4: Real-World Archetypes End-to-End Simulation Test Suite
 * Medical Trip Colombia S.A.S. - Standalone Local-First Offline PWA
 *
 * Full multi-day workflow simulations for the 4 canonical Drive archetypes:
 * 1. RVA171 Catia x5 (5 pax, Clofán/CIMA/Urología, driver & guide turns, expense ledger balance)
 * 2. RVA282 George Cardio (2 pax, Cardio VID / CES Prado, Wingo 7449, Ramón Rosero Kia Sonet, Yenny guide, lab fees)
 * 3. RVA341 Hogenboom CES (2 pax, Dr. Carlos Suárez CES Oviedo, English guide, domiciliary lab extraction, settlement)
 * 4. RVA077 Rumai Cirugía 12d (2 pax, 12-day surgical itinerary, HPTU, Hernán Ocazionez, Locatel pharmacy, multi-day balance sheet)
 */

import { describe, it, expect, beforeEach, runAllTests } from './test_harness.js';
import { Money } from '../src/domain/value-objects/money.js';
import { LocationCoordinate } from '../src/domain/value-objects/location-coordinate.js';
import { ActorEvent, sha256 } from '../src/domain/value-objects/actor-event.js';
import { ItineraryItem } from '../src/domain/entities/itinerary-item.js';
import { ExpenseItem } from '../src/domain/entities/expense-item.js';
import { CompanionShift } from '../src/domain/entities/companion-shift.js';
import { DriverTransfer } from '../src/domain/entities/driver-transfer.js';
import { PatientSignature } from '../src/domain/entities/patient-signature.js';
import { SettlementLedger } from '../src/domain/entities/settlement-ledger.js';

describe('Tier 4: Canonical Real-World Archetypes Multi-Day Workflows', () => {

  // ==========================================================================
  // ARQUETIPO 1: RVA171 Catia x5 (Family / Cosmetic, Dental, Pediatric 5 Pax)
  // ==========================================================================
  describe('Archetype 1: RVA171 Catia x5 (5 Pax Multi-Specialty Itinerary)', () => {
    let rva171Ledger;
    let rva171Itinerary;
    let rva171Blobs;
    let rva171EventChain;

    beforeEach(() => {
      rva171Ledger = new SettlementLedger({
        reservationCode: 'RVA171-4',
        patientUuid: 'ENT-PAX-0171',
        currency: 'COP'
      });
      rva171Itinerary = [];
      rva171Blobs = new Map();
      rva171EventChain = [];
    });

    it('T4.1: Executes complete 5-day workflow for RVA171 Catia x5 with 0 float error', () => {
      // 1. Initial Advances ($1,000,000 initial + $1,098,100 complement = $2,098,100 COP)
      rva171Ledger.addAdvance(Money.fromAmount(1000000, 'COP'));
      rva171Ledger.addAdvance(Money.fromAmount(1098100, 'COP'));
      expect(rva171Ledger.totalAdvances.amount).toBe(2098100);

      // --- DÍA 1 (Lunes 10-Ago) ---
      // Stop 1: Llegada Vuelo Z-Fly JMC y Traslado a Laureles
      const stopD1_1 = new ItineraryItem({
        id: 'RVA171-D1-S1',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '10:00 - 12:00',
        title: 'Llegada Vuelo Z-Fly y Traslado a Hotel Inntu Laureles',
        location: { lat: 6.1645, lng: -75.4231, name: 'Aeropuerto JMC' },
        assignedActorIds: ['ACT-DRV-ANDRES']
      });
      stopD1_1.startTransit('2026-08-10T10:30:00-05:00');
      stopD1_1.arriveOnSite({ timestamp: '2026-08-10T12:00:00-05:00' });
      stopD1_1.complete({ timestamp: '2026-08-10T12:15:00-05:00' });
      rva171Itinerary.push(stopD1_1);

      const trD1_1 = new DriverTransfer({
        id: 'TR-RVA171-01',
        driverActorId: 'ACT-DRV-ANDRES',
        origin: { lat: 6.1645, lng: -75.4231, name: 'Aeropuerto JMC' },
        destination: { lat: 6.2442, lng: -75.5812, name: 'Hotel Inntu Laureles' },
        flatRate: Money.fromAmount(160000, 'COP')
      });
      rva171Ledger.addDriverTransfer(trD1_1);

      // Stop 2: Consulta Oftalmología Clofán con Dr. Peláez para María
      const stopD1_2 = new ItineraryItem({
        id: 'RVA171-D1-S2',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '15:00 - 18:30',
        title: 'Consulta y Exámenes Oftalmología Dr. Peláez (María)',
        clinicName: 'Clínica Clofán',
        specialty: 'Oftalmología',
        location: { lat: 6.2206, lng: -75.5714, name: 'Clínica Clofán', geofenceRadiusMeters: 300 },
        assignedActorIds: ['ACT-GUIA-YENNY', 'ACT-DRV-ANDRES'],
        requiresSignature: true
      });
      stopD1_2.startTransit('2026-08-10T14:00:00-05:00');
      stopD1_2.arriveOnSite({ coords: { lat: 6.2206, lng: -75.5714 }, timestamp: '2026-08-10T14:45:00-05:00' });

      // Yenny guide turn 3.5h = $54,250 COP
      const shiftD1 = new CompanionShift({
        id: 'SH-RVA171-01',
        guideActorId: 'ACT-GUIA-YENNY',
        dayNumber: 1,
        startTime: '2026-08-10T15:00:00-05:00',
        endTime: '2026-08-10T18:30:00-05:00',
        totalHours: 3.5,
        hourlyRate: Money.fromAmount(15500, 'COP')
      });
      rva171Ledger.addCompanionShift(shiftD1);

      // Uber transfer to Clofán ($38,000) and return ($49,138) + Parking ($12,000)
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-01', category: 'TAXI', description: 'Uber XL Hotel -> Clofán', amount: Money.fromAmount(38000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-02', category: 'OTHER', description: 'Ticket Parqueadero Sótano Clofán', amount: Money.fromAmount(12000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-03', category: 'TAXI', description: 'Uber XL Clofán -> Hotel Inntu', amount: Money.fromAmount(49138, 'COP'), actorId: 'ACT-GUIA-YENNY' }));

      // Patient signature captured
      const sigD1 = new PatientSignature({
        id: 'SIG-171-D1',
        itineraryItemId: stopD1_2.id,
        patientUuid: 'ENT-PAX-0171',
        signerName: 'Catia Rodrigues',
        blobId: 'blob-sig-catia-d1',
        format: 'png'
      });
      rva171Blobs.set(sigD1.blobId, sigD1.toJSON());
      stopD1_2.complete({ signatureBlobId: sigD1.blobId, timestamp: '2026-08-10T18:30:00-05:00' });
      rva171Itinerary.push(stopD1_2);

      // --- DÍA 2 (Martes 11-Ago) ---
      // Tatiana/Mariana CIMA ultrasounds (8h Yenny = $124,000) + Meal subsidy ($35,000) + Cruz Verde meds ($85,000)
      rva171Ledger.addCompanionShift(new CompanionShift({
        id: 'SH-RVA171-02',
        guideActorId: 'ACT-GUIA-YENNY',
        dayNumber: 2,
        startTime: '2026-08-11T06:30:00-05:00',
        endTime: '2026-08-11T14:30:00-05:00',
        totalHours: 8.0,
        hourlyRate: Money.fromAmount(15500, 'COP'),
        mealSubsidy: Money.fromAmount(35000, 'COP')
      }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-04', category: 'TAXI', description: 'Traslado Hotel -> CIMA Cra 44', amount: Money.fromAmount(40000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-05', category: 'TAXI', description: 'Uber CC Santa Fé -> Clofán Cirugía', amount: Money.fromAmount(49300, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-06', category: 'PHARMACY', description: 'Cruz Verde Colirios Postoperatorios', amount: Money.fromAmount(85000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-07', category: 'TAXI', description: 'Uber Clofán -> Hotel Inntu', amount: Money.fromAmount(54886, 'COP'), actorId: 'ACT-GUIA-YENNY' }));

      // --- DÍA 3 (Miércoles 12-Ago) ---
      // Clofán Post-op control ($41,482 + Yenny 2.5h = $38,750 + El Tesoro Uber $83,931 + Return $73,719)
      rva171Ledger.addCompanionShift(new CompanionShift({
        id: 'SH-RVA171-03',
        guideActorId: 'ACT-GUIA-YENNY',
        dayNumber: 3,
        startTime: '2026-08-12T11:30:00-05:00',
        totalHours: 2.5,
        hourlyRate: Money.fromAmount(15500, 'COP')
      }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-08', category: 'TAXI', description: 'Hotel -> Control Clofán', amount: Money.fromAmount(41482, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-09', category: 'TAXI', description: 'Clofán -> CC El Tesoro', amount: Money.fromAmount(83931, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-10', category: 'TAXI', description: 'El Tesoro -> Hotel Inntu', amount: Money.fromAmount(73719, 'COP'), actorId: 'ACT-GUIA-YENNY' }));

      // --- DÍA 4 (Jueves 13-Ago) ---
      // Pediatric Urology Dr. Londoño (Alejandro 3.5h = $54,250 + Uber $55,836) + Hair Clinic (Yenny 2.5h = $38,750 + Uber $33,712)
      rva171Ledger.addCompanionShift(new CompanionShift({
        id: 'SH-RVA171-04',
        guideActorId: 'ACT-GUIA-ALEJANDRO',
        dayNumber: 4,
        startTime: '2026-08-13T09:00:00-05:00',
        totalHours: 3.5,
        hourlyRate: Money.fromAmount(15500, 'COP')
      }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-11', category: 'TAXI', description: 'Uber Hotel -> Urología Dr. Londoño', amount: Money.fromAmount(55836, 'COP'), actorId: 'ACT-GUIA-ALEJANDRO' }));
      rva171Ledger.addCompanionShift(new CompanionShift({
        id: 'SH-RVA171-05',
        guideActorId: 'ACT-GUIA-YENNY',
        dayNumber: 4,
        startTime: '2026-08-13T11:00:00-05:00',
        totalHours: 2.5,
        hourlyRate: Money.fromAmount(15500, 'COP')
      }));
      rva171Ledger.addExpense(new ExpenseItem({ id: 'EXP-171-12', category: 'TAXI', description: 'Uber Hotel -> Cita Capilar Lisandra', amount: Money.fromAmount(33712, 'COP'), actorId: 'ACT-GUIA-YENNY' }));

      // --- DÍA 5 (Lunes 17-Ago) ---
      // Salida JMC en Van Especial ($160,000)
      rva171Ledger.addDriverTransfer(new DriverTransfer({
        id: 'TR-RVA171-02',
        driverActorId: 'ACT-DRV-ANDRES',
        origin: { lat: 6.2442, lng: -75.5812, name: 'Hotel Inntu' },
        destination: { lat: 6.1645, lng: -75.4231, name: 'Aeropuerto JMC' },
        flatRate: Money.fromAmount(160000, 'COP')
      }));

      // VERIFICACIÓN CONTABLE EXACTA (BigInt):
      const summary = rva171Ledger.getAuditSummary();
      const advancesCents = BigInt(summary.totalAdvances.amountInCents);
      const expensesCents = BigInt(summary.totalExpenses.amountInCents);
      const netCents = BigInt(summary.netBalance.amountInCents);

      expect(advancesCents).toBe(209810000n); // $2,098,100 COP
      expect(netCents).toBe(advancesCents - expensesCents);
      expect(summary.counts.advancesCount).toBe(2);
      expect(summary.counts.shiftsCount).toBe(5);
      expect(summary.counts.transfersCount).toBe(2);
      expect(summary.counts.expensesCount).toBe(12);
    });
  });

  // ==========================================================================
  // ARQUETIPO 2: RVA282 George Cardio (Chequeo Cardiovascular Integral & Urología)
  // ==========================================================================
  describe('Archetype 2: RVA282 George Cardio (2 Pax Cardio & Uro)', () => {
    let rva282Ledger;

    beforeEach(() => {
      rva282Ledger = new SettlementLedger({
        reservationCode: 'RVA282-5',
        patientUuid: 'ENT-PAX-0282',
        currency: 'COP'
      });
    });

    it('T4.2: Executes complete multi-day workflow for RVA282 George Cardio with Ramon Rosero & Yenny', () => {
      // 1. Advance: $1,200,000 COP
      rva282Ledger.addAdvance(Money.fromAmount(1200000, 'COP'));

      // 2. Day 1: Wingo 7449 pickup by Ramón Rosero (Kia Sonet NLX666) + eSIM ($90,909) + JMC Transfer ($145,000)
      rva282Ledger.addExpense(new ExpenseItem({ id: 'EXP-282-01', category: 'OTHER', description: 'Claro eSIM 80GB Datos', amount: Money.fromAmount(90909, 'COP'), actorId: 'ACT-COORD' }));
      rva282Ledger.addDriverTransfer(new DriverTransfer({
        id: 'TR-282-01',
        driverActorId: 'ACT-DRV-RAMON',
        origin: { lat: 6.1645, lng: -75.4231, name: 'JMC Airport' },
        destination: { lat: 6.2102, lng: -75.5689, name: 'Edificio Park 42' },
        flatRate: Money.fromAmount(145000, 'COP')
      }));

      // 3. Day 2: Lab sample in Park 42 (Yenny 1h = $15,500) + Transfer to Torre Oviedo ($30,000) + Echavarría Labs ($125,000) + CES Oviedo (Yenny 4h = $62,000) + Meal ($25,000) + Parking ($14,000) + Return ($30,000)
      rva282Ledger.addCompanionShift(new CompanionShift({ id: 'SH-282-01', guideActorId: 'ACT-GUIA-YENNY', dayNumber: 2, startTime: '07:00', totalHours: 1.0, hourlyRate: Money.fromAmount(15500, 'COP') }));
      rva282Ledger.addExpense(new ExpenseItem({ id: 'EXP-282-02', category: 'TAXI', description: 'Traslado Park 42 -> Torre Oviedo', amount: Money.fromAmount(30000, 'COP'), actorId: 'ACT-DRV-RAMON' }));
      rva282Ledger.addExpense(new ExpenseItem({ id: 'EXP-282-03', category: 'MEDICAL_LAB', description: 'Laboratorio Echavarría Uroanálisis y Cultivo', amount: Money.fromAmount(125000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva282Ledger.addCompanionShift(new CompanionShift({ id: 'SH-282-02', guideActorId: 'ACT-GUIA-YENNY', dayNumber: 2, startTime: '09:00', totalHours: 4.0, hourlyRate: Money.fromAmount(15500, 'COP'), mealSubsidy: Money.fromAmount(25000, 'COP') }));
      rva282Ledger.addExpense(new ExpenseItem({ id: 'EXP-282-04', category: 'OTHER', description: 'Parqueadero Torre Oviedo', amount: Money.fromAmount(14000, 'COP'), actorId: 'ACT-DRV-RAMON' }));
      rva282Ledger.addExpense(new ExpenseItem({ id: 'EXP-282-05', category: 'TAXI', description: 'Retorno a Park 42', amount: Money.fromAmount(30000, 'COP'), actorId: 'ACT-DRV-RAMON' }));

      // 4. Day 3: Cardio VID checkup (Yenny 5h = $77,500 + Traslado largo ida $55,000 + Retorno $55,000)
      rva282Ledger.addCompanionShift(new CompanionShift({ id: 'SH-282-03', guideActorId: 'ACT-GUIA-YENNY', dayNumber: 3, startTime: '09:00', totalHours: 5.0, hourlyRate: Money.fromAmount(15500, 'COP') }));
      rva282Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-282-02', driverActorId: 'ACT-DRV-RAMON', origin: { lat: 6.2102, lng: -75.5689 }, destination: { lat: 6.2764, lng: -75.5962 }, flatRate: Money.fromAmount(55000, 'COP') }));
      rva282Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-282-03', driverActorId: 'ACT-DRV-RAMON', origin: { lat: 6.2764, lng: -75.5962 }, destination: { lat: 6.2102, lng: -75.5689 }, flatRate: Money.fromAmount(55000, 'COP') }));

      // 5. Day 4: Dr. Marcos Yepes Fit-to-Fly certificate ($200,000) + Departure transfer JMC ($110,000)
      rva282Ledger.addExpense(new ExpenseItem({ id: 'EXP-282-06', category: 'OTHER', description: 'Consulta y Certificado Fit-to-Fly Dr. Marcos Yepes', amount: Money.fromAmount(200000, 'COP'), actorId: 'ACT-MED' }));
      rva282Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-282-04', driverActorId: 'ACT-DRV-RAMON', origin: { lat: 6.2102, lng: -75.5689 }, destination: { lat: 6.1645, lng: -75.4231 }, flatRate: Money.fromAmount(110000, 'COP') }));

      const audit = rva282Ledger.getAuditSummary();
      expect(audit.totalAdvances.amount).toBe(1200000);
      expect(rva282Ledger.totalExpenses.isPositive()).toBe(true);
      expect(audit.netBalance.amount).toBe(1200000 - rva282Ledger.totalExpenses.amount);
    });
  });

  // ==========================================================================
  // ARQUETIPO 3: RVA341 Hogenboom CES (Dr. Carlos Suárez & Domiciliary Labs)
  // ==========================================================================
  describe('Archetype 3: RVA341 Hogenboom CES (Urology & Domiciliary Nurse)', () => {
    let rva341Ledger;

    beforeEach(() => {
      rva341Ledger = new SettlementLedger({
        reservationCode: 'RVA341-1',
        patientUuid: 'ENT-PAX-1126',
        currency: 'COP'
      });
    });

    it('T4.3: Executes complete workflow for RVA341 with Nurse Emi Echavarría and Dr. Carlos Suárez', () => {
      // 1. Advance: $950,000 COP
      rva341Ledger.addAdvance(Money.fromAmount(950000, 'COP'));

      // 2. Day 1: Wingo arrival, transfer to Hotel Inntu Room 1004 ($110,000), eSIM ($90,909)
      rva341Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-341-01', driverActorId: 'ACT-DRV-ANDRES', origin: { lat: 6.1645, lng: -75.4231 }, destination: { lat: 6.2442, lng: -75.5812 }, flatRate: Money.fromAmount(110000, 'COP') }));
      rva341Ledger.addExpense(new ExpenseItem({ id: 'EXP-341-01', category: 'OTHER', description: 'eSIM Internacional 80GB', amount: Money.fromAmount(90909, 'COP'), actorId: 'ACT-COORD' }));

      // 3. Day 2: CES Sede Oviedo urology with Dr. Carlos Suárez (Alejandro English guide 5h = $77,500 + Meal $25,000 + Transfers 2x$35,000 = $70,000)
      rva341Ledger.addCompanionShift(new CompanionShift({ id: 'SH-341-01', guideActorId: 'ACT-GUIA-ALEJANDRO', dayNumber: 2, startTime: '12:00', totalHours: 5.0, hourlyRate: Money.fromAmount(15500, 'COP'), mealSubsidy: Money.fromAmount(25000, 'COP') }));
      rva341Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-341-02', driverActorId: 'ACT-DRV-ANDRES', origin: { lat: 6.2442, lng: -75.5812 }, destination: { lat: 6.1969, lng: -75.5742 }, flatRate: Money.fromAmount(35000, 'COP') }));
      rva341Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-341-03', driverActorId: 'ACT-DRV-ANDRES', origin: { lat: 6.1969, lng: -75.5742 }, destination: { lat: 6.2442, lng: -75.5812 }, flatRate: Money.fromAmount(35000, 'COP') }));

      // 4. Day 3: Domiciliary blood lab extraction in Room 1004 by Nurse Emi Echavarría ($65,000 + $32,350 early arrival fee) + CES Prado Pre-anesthesia (Alejandro 4h = $62,000 + Transfers $70,000)
      rva341Ledger.addExpense(new ExpenseItem({ id: 'EXP-341-02', category: 'MEDICAL_LAB', description: 'Toma Domiciliaria Laboratorio Echavarría Habitación 1004', amount: Money.fromAmount(65000, 'COP'), actorId: 'ACT-NURSE-EMI' }));
      rva341Ledger.addExpense(new ExpenseItem({ id: 'EXP-341-03', category: 'OTHER', description: 'Recargo Llegada Temprana 05:30 AM Enfermera', amount: Money.fromAmount(32350, 'COP'), actorId: 'ACT-NURSE-EMI' }));
      rva341Ledger.addCompanionShift(new CompanionShift({ id: 'SH-341-02', guideActorId: 'ACT-GUIA-ALEJANDRO', dayNumber: 3, startTime: '09:00', totalHours: 4.0, hourlyRate: Money.fromAmount(15500, 'COP') }));
      rva341Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-341-04', driverActorId: 'ACT-DRV-ANDRES', origin: { lat: 6.2442, lng: -75.5812 }, destination: { lat: 6.2577, lng: -75.5684 }, flatRate: Money.fromAmount(35000, 'COP') }));
      rva341Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-341-05', driverActorId: 'ACT-DRV-ANDRES', origin: { lat: 6.2577, lng: -75.5684 }, destination: { lat: 6.2442, lng: -75.5812 }, flatRate: Money.fromAmount(35000, 'COP') }));

      // 5. Day 6: Departure JMC ($110,000)
      rva341Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-341-06', driverActorId: 'ACT-DRV-ANDRES', origin: { lat: 6.2442, lng: -75.5812 }, destination: { lat: 6.1645, lng: -75.4231 }, flatRate: Money.fromAmount(110000, 'COP') }));

      const audit = rva341Ledger.getAuditSummary();
      expect(audit.reservationCode).toBe('RVA341-1');
      expect(audit.breakdown.medicalLabs.amount).toBe(65000);
      expect(audit.totalAdvances.amount).toBe(950000);
    });
  });

  // ==========================================================================
  // ARQUETIPO 4: RVA077 Rumai Cirugía 12d (12-Day Extended Surgical Workflow)
  // ==========================================================================
  describe('Archetype 4: RVA077 Rumai Cirugía 12d (12-Day Surgery & Recovery)', () => {
    let rva077Ledger;

    beforeEach(() => {
      rva077Ledger = new SettlementLedger({
        reservationCode: 'RVA077-5',
        patientUuid: 'ENT-PAX-1143',
        currency: 'COP'
      });
    });

    it('T4.4: Executes complete 12-day surgical workflow for RVA077 Rumai with Ocazionez, Bolivariana & Locatel', () => {
      // 1. Advance: $1,850,000 COP
      rva077Ledger.addAdvance(Money.fromAmount(1850000, 'COP'));

      // 2. Day 1: Arrival JMC ($145,000), Transfer Novelty -> HPTU ($55,000), Dr. Mosquera Gastro (Yenny 4h = $62,000), Locatel pre-op ($145,000), Return ($30,000)
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-01', driverActorId: 'ACT-DRV-MONTOYA', origin: { lat: 6.1645, lng: -75.4231 }, destination: { lat: 6.2102, lng: -75.5689 }, flatRate: Money.fromAmount(145000, 'COP') }));
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-02', driverActorId: 'ACT-DRV-MONTOYA', origin: { lat: 6.2102, lng: -75.5689 }, destination: { lat: 6.2758, lng: -75.5898 }, flatRate: Money.fromAmount(55000, 'COP') }));
      rva077Ledger.addCompanionShift(new CompanionShift({ id: 'SH-077-01', guideActorId: 'ACT-GUIA-YENNY', dayNumber: 1, startTime: '15:45', totalHours: 4.0, hourlyRate: Money.fromAmount(15500, 'COP') }));
      rva077Ledger.addExpense(new ExpenseItem({ id: 'EXP-077-01', category: 'PHARMACY', description: 'Locatel Insumos Preoperatorios', amount: Money.fromAmount(145000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-03', driverActorId: 'ACT-DRV-MONTOYA', origin: { lat: 6.2758, lng: -75.5898 }, destination: { lat: 6.2102, lng: -75.5689 }, flatRate: Money.fromAmount(30000, 'COP') }));

      // 3. Day 2: Apartment transfer ($30,000)
      rva077Ledger.addExpense(new ExpenseItem({ id: 'EXP-077-02', category: 'TAXI', description: 'Traslado Equipajes Apartamento Poblado', amount: Money.fromAmount(30000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));

      // 4. Day 3: Hernán Ocazionez diagnostic images ($170,755 + Yenny 4h = $62,000 + Transfers 2x$35,000 = $70,000)
      rva077Ledger.addExpense(new ExpenseItem({ id: 'EXP-077-03', category: 'MEDICAL_LAB', description: 'Hernán Ocazionez Rayos X + Ecografía Abdomen + Mama', amount: Money.fromAmount(170755, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva077Ledger.addCompanionShift(new CompanionShift({ id: 'SH-077-02', guideActorId: 'ACT-GUIA-YENNY', dayNumber: 3, startTime: '09:00', totalHours: 4.0, hourlyRate: Money.fromAmount(15500, 'COP') }));
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-04', driverActorId: 'ACT-DRV-MONTOYA', origin: { lat: 6.2102, lng: -75.5689 }, destination: { lat: 6.2442, lng: -75.5812 }, flatRate: Money.fromAmount(35000, 'COP') }));
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-05', driverActorId: 'ACT-DRV-MONTOYA', origin: { lat: 6.2442, lng: -75.5812 }, destination: { lat: 6.2102, lng: -75.5689 }, flatRate: Money.fromAmount(35000, 'COP') }));

      // 5. Day 4: Gynaecology Clínica Bolivariana ($135,000) + Cardio VID clearance (Yenny 5h = $77,500 + Transfers $70,000)
      rva077Ledger.addExpense(new ExpenseItem({ id: 'EXP-077-04', category: 'OTHER', description: 'Consulta Ginecología Clínica Bolivariana', amount: Money.fromAmount(135000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));
      rva077Ledger.addCompanionShift(new CompanionShift({ id: 'SH-077-03', guideActorId: 'ACT-GUIA-YENNY', dayNumber: 4, startTime: '08:30', totalHours: 5.0, hourlyRate: Money.fromAmount(15500, 'COP') }));
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-06', driverActorId: 'ACT-DRV-MONTOYA', origin: { lat: 6.2102, lng: -75.5689 }, destination: { lat: 6.2709, lng: -75.5886 }, flatRate: Money.fromAmount(35000, 'COP') }));
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-07', driverActorId: 'ACT-DRV-MONTOYA', origin: { lat: 6.2709, lng: -75.5886 }, destination: { lat: 6.2102, lng: -75.5689 }, flatRate: Money.fromAmount(35000, 'COP') }));

      // 6. Day 5: Surgery Day (Yenny 12h = $186,000 + Meal subsidy $35,000)
      rva077Ledger.addCompanionShift(new CompanionShift({ id: 'SH-077-04', guideActorId: 'ACT-GUIA-YENNY', dayNumber: 5, startTime: '06:00', totalHours: 12.0, hourlyRate: Money.fromAmount(15500, 'COP'), mealSubsidy: Money.fromAmount(35000, 'COP') }));

      // 7. Days 6-10: Recovery in Apartment, Nurse visits (5 days x $65,000 = $325,000) + Locatel meds ($220,000)
      rva077Ledger.addExpense(new ExpenseItem({ id: 'EXP-077-05', category: 'OTHER', description: 'Visitas Domiciliarias Enfermería Curaciones y Drenajes (5 días)', amount: Money.fromAmount(325000, 'COP'), actorId: 'ACT-NURSE' }));
      rva077Ledger.addExpense(new ExpenseItem({ id: 'EXP-077-06', category: 'PHARMACY', description: 'Locatel Apósitos Fajas y Analgésicos Postoperatorios', amount: Money.fromAmount(220000, 'COP'), actorId: 'ACT-GUIA-YENNY' }));

      // 8. Day 11: Stitch removal & Fit-to-Fly certificate ($150,000)
      rva077Ledger.addExpense(new ExpenseItem({ id: 'EXP-077-07', category: 'OTHER', description: 'Control Postoperatorio Retiro de Puntos y Fit-to-Fly', amount: Money.fromAmount(150000, 'COP'), actorId: 'ACT-MED' }));

      // 9. Day 12: Departure transfer JMC with Gustavo Mora Duster ($145,000)
      rva077Ledger.addDriverTransfer(new DriverTransfer({ id: 'TR-077-08', driverActorId: 'ACT-DRV-MORA', origin: { lat: 6.2102, lng: -75.5689 }, destination: { lat: 6.1645, lng: -75.4231 }, flatRate: Money.fromAmount(145000, 'COP') }));

      const audit = rva077Ledger.getAuditSummary();
      expect(audit.reservationCode).toBe('RVA077-5');
      expect(audit.counts.shiftsCount).toBe(4);
      expect(audit.counts.transfersCount).toBe(8);
      expect(audit.counts.expensesCount).toBe(7);
      expect(audit.totalAdvances.amount).toBe(1850000);
      expect(rva077Ledger.totalExpenses.isPositive()).toBe(true);
    });
  });
});

if (process.argv[1] && process.argv[1].endsWith('tier4_real_world_archetypes.test.js')) {
  runAllTests('Tier 4: Real-World Archetypes (4 Scenarios)').then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
