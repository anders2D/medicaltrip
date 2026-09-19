/**
 * Medical Trip Colombia S.A.S. - GenerateSmartItineraryUseCase
 * CQRS Command Use Case for 1-Click Surgical/Clinical Smart Itinerary Generator (Flow 2).
 * Implements 4 specialized presets:
 *   1. PLASTIC_SURGERY_12D: 12-Day Surgical Journey (HPTU, Fasting Lab 05:30, Quirófano, Post-Op Care, Fit-to-Fly)
 *   2. CARDIOLOGY_5D: 5-Day Comprehensive Cardiology (Cardio VID, Echo Doppler, Stress Test, Holter, Fit-to-Fly)
 *   3. OPHTHALMOLOGY_3D: 3-Day Precision Ophthalmology (Clofán, Pentacam, Laser Refractive Surgery, Fit-to-Fly)
 *   4. UROLOGY_4D: 4-Day Urological Diagnostics & Procedure (CES Oviedo, Echavarría 05:30 AM Lab, Fit-to-Fly)
 *
 * Enforces non-overlapping intervals, 15-minute slot snapping, geocoded coordinates, actor model assignments,
 * rate cards, and financial ledger recalculation.
 */

import { IStoragePort } from '@/core/ports';
import { IActorEventBusPort } from '@/features/swarm';
import { PatientBooking } from '@/core/domain';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { ReceiptExpense } from '@/features/settlement';
import { SettlementLedger } from '@/features/settlement';
import { OperativeTerritory } from '@/core/domain';
import { Money } from '@/core/domain';
import { InvalidBookingError, InvariantViolationError } from '@/core/domain';
import {
  CLINICAL_PROVIDERS,
  FLEET_DRIVERS,
  FIELD_STAFF,
} from '@/features/directory';
import {
  FLEET_RATES,
  STANDARD_DISBURSEMENTS,
} from '@/core/infrastructure';

export type SmartPresetType =
  | 'PLASTIC_SURGERY_12D'
  | 'CARDIOLOGY_5D'
  | 'OPHTHALMOLOGY_3D'
  | 'UROLOGY_4D'
  | 'CIRUGIA_PLASTICA_12D'
  | 'CARDIOLOGIA_5D'
  | 'OFTALMOLOGIA_3D'
  | 'UROLOGIA_4D';

export interface GenerateSmartItineraryCommand {
  bookingId?: string;
  bookingCode?: string;
  presetType: SmartPresetType | string;
  startDate?: string;
  arrivalDateTimeISO?: string;
  baseDate?: Date;
  assignedGuideId?: string;
  assignedDriverId?: string;
}

export type GenerateSmartItineraryDTO = GenerateSmartItineraryCommand;

export interface GenerateSmartItineraryResult {
  booking: PatientBooking;
  presetType: string;
  events: ItineraryEvent[];
  shifts: CompanionShift[];
  transfers: DriverTransfer[];
  expenses: ReceiptExpense[];
  settlement: SettlementLedger;
}

export function normalizePresetKey(key: string): 'PLASTIC_SURGERY_12D' | 'CARDIOLOGY_5D' | 'OPHTHALMOLOGY_3D' | 'UROLOGY_4D' {
  const upper = key.toUpperCase().replace(/-/g, '_');
  if (upper.includes('PLAST') || upper.includes('SURGERY')) return 'PLASTIC_SURGERY_12D';
  if (upper.includes('CARDIO')) return 'CARDIOLOGY_5D';
  if (upper.includes('OFTAL') || upper.includes('OPHTHAL')) return 'OPHTHALMOLOGY_3D';
  if (upper.includes('URO')) return 'UROLOGY_4D';
  return 'PLASTIC_SURGERY_12D';
}

export class GenerateSmartItineraryUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly eventBusPort?: IActorEventBusPort
  ) {}

  public async execute(command: GenerateSmartItineraryCommand): Promise<GenerateSmartItineraryResult> {
    // 1. Retrieve Booking by bookingId or bookingCode
    const idOrCode = command.bookingId || command.bookingCode || '';
    let booking: PatientBooking | null = null;

    if (idOrCode) {
      booking = await this.storagePort.getBooking(idOrCode);
    }

    if (!booking) {
      const allBookings = await this.storagePort.getAllBookings();
      if (idOrCode) {
        booking = allBookings.find(
          (b) => b.id === idOrCode || b.code.toUpperCase() === idOrCode.toUpperCase()
        ) || null;
      } else if (allBookings.length > 0) {
        booking = allBookings[0];
      }
    }

    if (!booking) {
      throw new InvalidBookingError(`Booking '${idOrCode}' was not found in storage`);
    }

    // 2. Parse Base Arrival Date & Time
    let rawDateStr = command.startDate || command.arrivalDateTimeISO || booking.arrivalDate;
    if (command.baseDate) {
      rawDateStr = command.baseDate.toISOString();
    }
    // If only YYYY-MM-DD was provided, append standard morning time
    if (rawDateStr && rawDateStr.length === 10) {
      rawDateStr = `${rawDateStr}T10:00:00.000Z`;
    }

    const baseArrival = new Date(rawDateStr);
    if (isNaN(baseArrival.getTime())) {
      throw new InvariantViolationError(`Invalid arrival date: ${rawDateStr}`);
    }

    // 3. Resolve Actors & Logistics
    const guide = this.resolveGuide(booking, command.assignedGuideId);
    const { driver, vehicleClass, airportRate } = this.resolveFleet(booking, command.assignedDriverId);
    const hotelTerritory = this.resolveHotelTerritory(booking);

    // 4. Normalize Preset & Generate Preset-Specific Blueprint
    const normalizedPreset = normalizePresetKey(command.presetType);
    const generated = this.buildPresetTimeline({
      presetType: normalizedPreset,
      booking,
      baseArrival,
      guide,
      driver,
      vehicleClass,
      airportRate,
      hotelTerritory,
    });

    // 5. Persist Generated Entities into Storage
    for (const evt of generated.events) {
      await this.storagePort.saveEvent(evt);
    }
    for (const shift of generated.shifts) {
      await this.storagePort.saveShift(shift);
    }
    for (const transfer of generated.transfers) {
      await this.storagePort.saveTransfer(transfer);
    }
    for (const expense of generated.expenses) {
      await this.storagePort.saveExpense(expense);
    }

    // 6. Calculate and Persist Settlement Ledger
    const existingSettlement = await this.storagePort.getSettlement(booking.code);
    const advances = existingSettlement ? existingSettlement.advances : [];
    const settlement = SettlementLedger.calculate({
      bookingId: booking.code,
      expenses: generated.expenses,
      shifts: generated.shifts,
      transfers: generated.transfers,
      advances,
    });
    await this.storagePort.saveSettlement(settlement);

    // 7. Append to CQRS Event Stream
    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: booking.code,
      type: 'SMART_ITINERARY_GENERATED',
      payload: {
        bookingId: booking.id,
        bookingCode: booking.code,
        presetType: command.presetType,
        totalEvents: generated.events.length,
        totalShifts: generated.shifts.length,
        totalTransfers: generated.transfers.length,
        totalExpenses: generated.expenses.length,
        netBalance: settlement.netBalance.toJSON(),
      },
      timestamp: Date.now(),
    });

    // 8. Broadcast to Actor Event Bus
    if (this.eventBusPort) {
      await this.eventBusPort.broadcast('SMART_ITINERARY_GENERATED', {
        bookingCode: booking.code,
        presetType: command.presetType,
        eventsCount: generated.events.length,
      });
    }

    return {
      booking,
      presetType: command.presetType,
      events: generated.events,
      shifts: generated.shifts,
      transfers: generated.transfers,
      expenses: generated.expenses,
      settlement,
    };
  }

  // =========================================================================
  // Helper Methods: Slot Snapping & Relative Dates
  // =========================================================================

  private computeTime(baseDate: Date, dayOffset: number, hour: number, minute: number): string {
    const target = new Date(baseDate.getTime());
    target.setUTCDate(target.getUTCDate() + dayOffset);
    target.setUTCHours(hour, minute, 0, 0);

    const rawMinutes = target.getUTCMinutes();
    const snappedMinutes = Math.floor(rawMinutes / 15) * 15;
    target.setUTCMinutes(snappedMinutes, 0, 0);
    target.setUTCMilliseconds(0);

    return target.toISOString();
  }

  private resolveGuide(booking: PatientBooking, requestedGuideId?: string) {
    if (requestedGuideId && FIELD_STAFF[requestedGuideId]) {
      return FIELD_STAFF[requestedGuideId];
    }
    const lang = (booking.language || '').toLowerCase();
    if (lang.includes('holand') || lang.includes('dutch') || lang.includes('neerland')) {
      return FIELD_STAFF['GUIA-02'] || { id: 'GUIA-02', name: 'Alejandro Restrepo' };
    }
    return FIELD_STAFF['GUIA-01'] || { id: 'GUIA-01', name: 'Yenny Roberto' };
  }

  private resolveFleet(booking: PatientBooking, requestedDriverId?: string) {
    if (requestedDriverId && FLEET_DRIVERS[requestedDriverId]) {
      const drv = FLEET_DRIVERS[requestedDriverId];
      const airportRate = drv.vehicleClass === 'VAN_XL' ? FLEET_RATES.airportJmcVanXL : FLEET_RATES.airportJmcSedan;
      return { driver: drv, vehicleClass: drv.vehicleClass, airportRate };
    }

    if (booking.paxCount >= 4) {
      const drv = FLEET_DRIVERS['DRV-06'] || FLEET_DRIVERS['DRV-03'] || { id: 'DRV-06', name: 'Uber Van XL', vehicleClass: 'VAN_XL' };
      return { driver: drv, vehicleClass: 'VAN_XL' as const, airportRate: FLEET_RATES.airportJmcVanXL };
    }

    const drv = FLEET_DRIVERS['DRV-01'] || { id: 'DRV-01', name: 'Aeroturex Sedán', vehicleClass: 'SEDAN' };
    return { driver: drv, vehicleClass: 'SEDAN' as const, airportRate: FLEET_RATES.airportJmcSedan };
  }

  private resolveHotelTerritory(booking: PatientBooking): OperativeTerritory {
    try {
      return OperativeTerritory.fromString(booking.hotelName || 'Hotel Inntu Laureles');
    } catch {
      return OperativeTerritory.fromString('Hotel Inntu Laureles');
    }
  }

  // =========================================================================
  // Preset Builders
  // =========================================================================

  private buildPresetTimeline(params: {
    presetType: 'PLASTIC_SURGERY_12D' | 'CARDIOLOGY_5D' | 'OPHTHALMOLOGY_3D' | 'UROLOGY_4D';
    booking: PatientBooking;
    baseArrival: Date;
    guide: { id: string; name: string };
    driver: { id: string; name: string; vehicleClass: 'SEDAN' | 'VAN_XL' | 'DUSTER' };
    vehicleClass: 'SEDAN' | 'VAN_XL' | 'DUSTER';
    airportRate: Money;
    hotelTerritory: OperativeTerritory;
  }) {
    switch (params.presetType) {
      case 'PLASTIC_SURGERY_12D':
        return this.buildPlasticSurgery12D(params);
      case 'CARDIOLOGY_5D':
        return this.buildCardiology5D(params);
      case 'OPHTHALMOLOGY_3D':
        return this.buildOphthalmology3D(params);
      case 'UROLOGY_4D':
        return this.buildUrology4D(params);
    }
  }

  // --- 1. PLASTIC SURGERY 12D ---
  private buildPlasticSurgery12D(p: {
    booking: PatientBooking;
    baseArrival: Date;
    guide: { id: string; name: string };
    driver: { id: string; name: string };
    vehicleClass: 'SEDAN' | 'VAN_XL' | 'DUSTER';
    airportRate: Money;
    hotelTerritory: OperativeTerritory;
  }) {
    const bookingId = p.booking.code;
    const events: ItineraryEvent[] = [];
    const shifts: CompanionShift[] = [];
    const transfers: DriverTransfer[] = [];
    const expenses: ReceiptExpense[] = [];

    const clinic = CLINICAL_PROVIDERS['CLINIC-HPTU'] || {
      id: 'CLINIC-HPTU',
      name: 'Hospital Pablo Tobón Uribe (HPTU)',
      address: 'Hospital Pablo Tobon Uribe Robledo',
      defaultCoordinates: { lat: 6.2758, lng: -75.5894 },
    };
    const clinicTerritory = OperativeTerritory.fromString(clinic.address, clinic.defaultCoordinates);
    const airportTerritory = OperativeTerritory.fromString('Aeropuerto JMC Rionegro');

    // Day 1: Arrival Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d1-arr`,
      bookingId,
      dayNumber: 1,
      title: `Llegada & Traslado Aeroturex Vuelo ${p.booking.arrivalAirline || 'Z-Fly'}`,
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 0, 10, 0),
      endDateTime: this.computeTime(p.baseArrival, 0, 12, 0),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
      requiresGpsCheckIn: true,
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d1-in`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_ARRIVAL',
      origin: airportTerritory,
      destination: p.hotelTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 0, 10, 0),
      baseRate: p.airportRate,
    }));

    // Day 2 (05:30 AM): Fasting Blood Lab at Hotel
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-lab`,
      bookingId,
      dayNumber: 2,
      title: 'Laboratorio Clínico Domiciliario en Habitación Hotel (Ayunas 05:30 AM)',
      category: 'LAB',
      startDateTime: this.computeTime(p.baseArrival, 1, 5, 30),
      endDateTime: this.computeTime(p.baseArrival, 1, 6, 30),
      location: p.hotelTerritory,
      providerId: 'LAB-ECHAVARRIA',
      providerName: 'Laboratorio Echavarría',
      assignedNurseId: 'NURSE-01',
      financialType: 'OUT_OF_POCKET',
      cost: STANDARD_DISBURSEMENTS.labEchavarriaHomeVisit,
      status: 'PROGRAMADO',
      requiresReceipt: true,
      notes: 'Ayuno estricto 8h. Hemograma IV, TP, TPT, Creatinina, Glicemia en ayunas.',
    }));
    expenses.push(new ReceiptExpense({
      id: `exp-${bookingId}-d2-lab`,
      bookingId,
      eventId: `evt-${bookingId}-d2-lab`,
      category: 'MEDICAL_LAB',
      description: 'Toma Domiciliaria Laboratorio Echavarría',
      amount: STANDARD_DISBURSEMENTS.labEchavarriaHomeVisit,
      date: this.computeTime(p.baseArrival, 1, 5, 30),
      audited: true,
      status: 'APPROVED',
    }));

    // Day 2: Specialist Consultation
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-cons`,
      bookingId,
      dayNumber: 2,
      title: `Valoración Quirúrgica Previa ${clinic.name}`,
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 1, 14, 0),
      endDateTime: this.computeTime(p.baseArrival, 1, 18, 0),
      location: clinicTerritory,
      providerId: clinic.id,
      providerName: clinic.name,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 4.0,
      cost: Money.fromAmount(62000, 'COP'),
      status: 'PROGRAMADO',
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d2`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 2,
      date: this.computeTime(p.baseArrival, 1, 0, 0).substring(0, 10),
      hoursLogged: 4.0,
    }));

    // Day 3: Pre-Anesthetic & Cardiology Clearance
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d3-clearance`,
      bookingId,
      dayNumber: 3,
      title: 'Valoración Pre-Anestésica y Electrocardiograma en HPTU',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 2, 9, 0),
      endDateTime: this.computeTime(p.baseArrival, 2, 12, 0),
      location: clinicTerritory,
      providerId: clinic.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 3.0,
      cost: Money.fromAmount(46500, 'COP'),
      status: 'PROGRAMADO',
    }));

    // Day 4: Plastic Surgery & Clinic Stay
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d4-surg`,
      bookingId,
      dayNumber: 4,
      title: 'Procedimiento Quirúrgico & Estancia Clínica HPTU',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 3, 6, 0),
      endDateTime: this.computeTime(p.baseArrival, 3, 18, 0),
      location: clinicTerritory,
      providerId: clinic.id,
      providerName: 'HPTU Quirófanos',
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 12.0,
      cost: Money.fromAmount(231000, 'COP'),
      status: 'PROGRAMADO',
      requiresSignature: true,
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d4`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 4,
      date: this.computeTime(p.baseArrival, 3, 0, 0).substring(0, 10),
      hoursLogged: 12.0,
      mealSubsidyTier: 'TIER_4',
    }));

    // Days 5-10: Post-Op Care
    for (let day = 5; day <= 10; day++) {
      const offset = day - 1;
      events.push(new ItineraryEvent({
        id: `evt-${bookingId}-d${day}-nurse`,
        bookingId,
        dayNumber: day,
        title: `Control Postoperatorio y Curación en Hotel (Día ${day})`,
        category: 'HOTEL',
        startDateTime: this.computeTime(p.baseArrival, offset, 9, 0),
        endDateTime: this.computeTime(p.baseArrival, offset, 11, 0),
        location: p.hotelTerritory,
        assignedNurseId: 'NURSE-01',
        financialType: 'NONE',
        status: 'PROGRAMADO',
      }));
    }

    // Day 11 (Penultimate): Fit-to-Fly Certification
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d11-fit2fly`,
      bookingId,
      dayNumber: 11,
      title: 'Consulta de Alta & Certificación Fit-to-Fly',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 10, 10, 0),
      endDateTime: this.computeTime(p.baseArrival, 10, 12, 0),
      location: clinicTerritory,
      providerId: clinic.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 2.0,
      cost: Money.fromAmount(31000, 'COP'),
      status: 'PROGRAMADO',
      requiresSignature: true,
    }));

    // Day 12 (Final): Departure Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d12-dept`,
      bookingId,
      dayNumber: 12,
      title: 'Traslado al Aeropuerto JMC Vuelo de Retorno',
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 11, 7, 0),
      endDateTime: this.computeTime(p.baseArrival, 11, 9, 0),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d12-out`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_DEPARTURE',
      origin: p.hotelTerritory,
      destination: airportTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 11, 7, 0),
      baseRate: p.airportRate,
    }));

    return { events, shifts, transfers, expenses };
  }

  // --- 2. CARDIOLOGY 5D ---
  private buildCardiology5D(p: {
    booking: PatientBooking;
    baseArrival: Date;
    guide: { id: string; name: string };
    driver: { id: string; name: string };
    vehicleClass: 'SEDAN' | 'VAN_XL' | 'DUSTER';
    airportRate: Money;
    hotelTerritory: OperativeTerritory;
  }) {
    const bookingId = p.booking.code;
    const events: ItineraryEvent[] = [];
    const shifts: CompanionShift[] = [];
    const transfers: DriverTransfer[] = [];
    const expenses: ReceiptExpense[] = [];

    const cardioClinic = CLINICAL_PROVIDERS['CLINIC-CARDIO-VID'] || {
      id: 'CLINIC-CARDIO-VID',
      name: 'Clínica Cardio VID Robledo',
      address: 'Cardio VID Robledo',
      defaultCoordinates: { lat: 6.2758, lng: -75.5894 },
    };
    const cardioTerritory = OperativeTerritory.fromString(cardioClinic.address, cardioClinic.defaultCoordinates);
    const cesOviedo = CLINICAL_PROVIDERS['CLINIC-CES-OVIEDO'] || {
      id: 'CLINIC-CES-OVIEDO',
      name: 'Clínica CES Sede Oviedo',
      address: 'Torre Medica Oviedo CES',
      defaultCoordinates: { lat: 6.2008, lng: -75.5768 },
    };
    const cesTerritory = OperativeTerritory.fromString(cesOviedo.address, cesOviedo.defaultCoordinates);
    const airportTerritory = OperativeTerritory.fromString('Aeropuerto JMC Rionegro');

    // Day 1: Arrival Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d1-arr`,
      bookingId,
      dayNumber: 1,
      title: `Llegada & Traslado Aeropuerto JMC Vuelo ${p.booking.arrivalAirline || 'Avianca'}`,
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 0, 14, 0),
      endDateTime: this.computeTime(p.baseArrival, 0, 16, 0),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d1-in`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_ARRIVAL',
      origin: airportTerritory,
      destination: p.hotelTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 0, 14, 0),
      baseRate: p.airportRate,
    }));

    // Day 2 (05:30 AM): Fasting Lab
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-lab`,
      bookingId,
      dayNumber: 2,
      title: 'Laboratorio Clínico Domiciliario (Perfil Lipídico, Troponina en Ayunas 05:30 AM)',
      category: 'LAB',
      startDateTime: this.computeTime(p.baseArrival, 1, 5, 30),
      endDateTime: this.computeTime(p.baseArrival, 1, 6, 30),
      location: p.hotelTerritory,
      providerId: 'LAB-ECHAVARRIA',
      financialType: 'OUT_OF_POCKET',
      cost: STANDARD_DISBURSEMENTS.labEchavarriaUroanalysisUroculture,
      status: 'PROGRAMADO',
    }));
    expenses.push(new ReceiptExpense({
      id: `exp-${bookingId}-d2-lab`,
      bookingId,
      eventId: `evt-${bookingId}-d2-lab`,
      category: 'MEDICAL_LAB',
      description: 'Laboratorio Echavarría Perfil Lipídico y Renal',
      amount: STANDARD_DISBURSEMENTS.labEchavarriaUroanalysisUroculture,
      date: this.computeTime(p.baseArrival, 1, 5, 30),
      audited: true,
      status: 'APPROVED',
    }));

    // Day 2: Cardiology Consultation
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-cons`,
      bookingId,
      dayNumber: 2,
      title: 'Consulta Cardiología y Electrocardiograma Dr. Marcos Yepes',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 1, 9, 0),
      endDateTime: this.computeTime(p.baseArrival, 1, 12, 0),
      location: cesTerritory,
      providerId: cesOviedo.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 3.0,
      cost: Money.fromAmount(46500, 'COP'),
      status: 'PROGRAMADO',
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d2`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 2,
      date: this.computeTime(p.baseArrival, 1, 0, 0).substring(0, 10),
      hoursLogged: 3.0,
    }));

    // Day 3: Cardio VID Comprehensive Checkup
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d3-cardiovid`,
      bookingId,
      dayNumber: 3,
      title: 'Chequeo Cardiovascular Integral & Doppler en Clínica Cardio VID',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 2, 8, 0),
      endDateTime: this.computeTime(p.baseArrival, 2, 13, 0),
      location: cardioTerritory,
      providerId: cardioClinic.id,
      providerName: cardioClinic.name,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 5.0,
      cost: Money.fromAmount(77500, 'COP'),
      status: 'PROGRAMADO',
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d3`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 3,
      date: this.computeTime(p.baseArrival, 2, 0, 0).substring(0, 10),
      hoursLogged: 5.0,
    }));

    // Day 4: Fit-to-Fly Certification
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d4-fit2fly`,
      bookingId,
      dayNumber: 4,
      title: 'Retiro de Holter 24h & Certificación Fit-to-Fly Cardio VID',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 3, 10, 0),
      endDateTime: this.computeTime(p.baseArrival, 3, 12, 0),
      location: cardioTerritory,
      providerId: cardioClinic.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 2.0,
      cost: Money.fromAmount(31000, 'COP'),
      status: 'PROGRAMADO',
      requiresSignature: true,
    }));

    // Day 5: Departure Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d5-dept`,
      bookingId,
      dayNumber: 5,
      title: 'Hotel Check-out ➔ Traslado al Aeropuerto JMC Vuelo de Salida',
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 4, 15, 0),
      endDateTime: this.computeTime(p.baseArrival, 4, 17, 0),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d5-out`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_DEPARTURE',
      origin: p.hotelTerritory,
      destination: airportTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 4, 15, 0),
      baseRate: p.airportRate,
    }));

    return { events, shifts, transfers, expenses };
  }

  // --- 3. OPHTHALMOLOGY 3D ---
  private buildOphthalmology3D(p: {
    booking: PatientBooking;
    baseArrival: Date;
    guide: { id: string; name: string };
    driver: { id: string; name: string };
    vehicleClass: 'SEDAN' | 'VAN_XL' | 'DUSTER';
    airportRate: Money;
    hotelTerritory: OperativeTerritory;
  }) {
    const bookingId = p.booking.code;
    const events: ItineraryEvent[] = [];
    const shifts: CompanionShift[] = [];
    const transfers: DriverTransfer[] = [];
    const expenses: ReceiptExpense[] = [];

    const clofan = CLINICAL_PROVIDERS['CLINIC-CLOFAN'] || {
      id: 'CLINIC-CLOFAN',
      name: 'Clínica Clofán Ciudad del Río',
      address: 'Torre Medica Ciudad del Rio Clofan',
      defaultCoordinates: { lat: 6.2235, lng: -75.5746 },
    };
    const clofanTerritory = OperativeTerritory.fromString(clofan.address, clofan.defaultCoordinates);
    const airportTerritory = OperativeTerritory.fromString('Aeropuerto JMC Rionegro');

    // Day 1: Arrival Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d1-arr`,
      bookingId,
      dayNumber: 1,
      title: `Llegada & Traslado Aeropuerto JMC Vuelo ${p.booking.arrivalAirline || 'Z-Fly'}`,
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 0, 9, 30),
      endDateTime: this.computeTime(p.baseArrival, 0, 11, 30),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d1-in`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_ARRIVAL',
      origin: airportTerritory,
      destination: p.hotelTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 0, 9, 30),
      baseRate: p.airportRate,
    }));

    // Day 1: Pentacam at Clofán
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d1-clofan`,
      bookingId,
      dayNumber: 1,
      title: 'Topografía Corneal Pentacam & Dilatación de Pupila Clofán',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 0, 15, 0),
      endDateTime: this.computeTime(p.baseArrival, 0, 17, 30),
      location: clofanTerritory,
      providerId: clofan.id,
      providerName: clofan.name,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 2.5,
      cost: Money.fromAmount(38750, 'COP'),
      status: 'PROGRAMADO',
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d1`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 1,
      date: this.computeTime(p.baseArrival, 0, 0, 0).substring(0, 10),
      hoursLogged: 2.5,
    }));

    // Day 2 (05:30 AM): Fasting Lab
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-lab`,
      bookingId,
      dayNumber: 2,
      title: 'Laboratorio Clínico Domiciliario en Ayunas (05:30 AM)',
      category: 'LAB',
      startDateTime: this.computeTime(p.baseArrival, 1, 5, 30),
      endDateTime: this.computeTime(p.baseArrival, 1, 6, 30),
      location: p.hotelTerritory,
      providerId: 'LAB-ECHAVARRIA',
      financialType: 'OUT_OF_POCKET',
      cost: STANDARD_DISBURSEMENTS.labEchavarriaHomeVisit,
      status: 'PROGRAMADO',
    }));
    expenses.push(new ReceiptExpense({
      id: `exp-${bookingId}-d2-lab`,
      bookingId,
      eventId: `evt-${bookingId}-d2-lab`,
      category: 'MEDICAL_LAB',
      description: 'Laboratorio Echavarría Coagulación y Glicemia',
      amount: STANDARD_DISBURSEMENTS.labEchavarriaHomeVisit,
      date: this.computeTime(p.baseArrival, 1, 5, 30),
      audited: true,
      status: 'APPROVED',
    }));

    // Day 2: Laser Refractive Surgery
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-surg`,
      bookingId,
      dayNumber: 2,
      title: 'Cirugía Refractiva Láser Clofán Dr. Jorge Peláez',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 1, 8, 30),
      endDateTime: this.computeTime(p.baseArrival, 1, 12, 0),
      location: clofanTerritory,
      providerId: clofan.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 3.5,
      cost: Money.fromAmount(54250, 'COP'),
      status: 'PROGRAMADO',
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d2`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 2,
      date: this.computeTime(p.baseArrival, 1, 0, 0).substring(0, 10),
      hoursLogged: 3.5,
    }));

    // Day 2: Pharmacy
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-pharm`,
      bookingId,
      dayNumber: 2,
      title: 'Compra Gotas Antibióticas y Lágrimas Artificiales Cruz Verde',
      category: 'PHARMACY',
      startDateTime: this.computeTime(p.baseArrival, 1, 12, 30),
      endDateTime: this.computeTime(p.baseArrival, 1, 13, 15),
      location: clofanTerritory,
      financialType: 'OUT_OF_POCKET',
      cost: Money.fromAmount(85000, 'COP'),
      status: 'PROGRAMADO',
      requiresReceipt: true,
    }));
    expenses.push(new ReceiptExpense({
      id: `exp-${bookingId}-d2-pharm`,
      bookingId,
      eventId: `evt-${bookingId}-d2-pharm`,
      category: 'PHARMACY',
      description: 'Gotas oftálmicas post-op Cruz Verde',
      amount: Money.fromAmount(85000, 'COP'),
      date: this.computeTime(p.baseArrival, 1, 12, 30),
      audited: true,
      status: 'APPROVED',
    }));

    // Day 3: Control & Fit-to-Fly
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d3-check`,
      bookingId,
      dayNumber: 3,
      title: 'Control Post-Op Lámpara de Hendidura y Certificado Fit-to-Fly Clofán',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 2, 8, 30),
      endDateTime: this.computeTime(p.baseArrival, 2, 10, 0),
      location: clofanTerritory,
      providerId: clofan.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 1.5,
      cost: Money.fromAmount(23250, 'COP'),
      status: 'PROGRAMADO',
      requiresSignature: true,
    }));

    // Day 3: Departure Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d3-dept`,
      bookingId,
      dayNumber: 3,
      title: 'Hotel Check-out ➔ Traslado al Aeropuerto JMC',
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 2, 13, 0),
      endDateTime: this.computeTime(p.baseArrival, 2, 15, 0),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d3-out`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_DEPARTURE',
      origin: p.hotelTerritory,
      destination: airportTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 2, 13, 0),
      baseRate: p.airportRate,
    }));

    return { events, shifts, transfers, expenses };
  }

  // --- 4. UROLOGY 4D ---
  private buildUrology4D(p: {
    booking: PatientBooking;
    baseArrival: Date;
    guide: { id: string; name: string };
    driver: { id: string; name: string };
    vehicleClass: 'SEDAN' | 'VAN_XL' | 'DUSTER';
    airportRate: Money;
    hotelTerritory: OperativeTerritory;
  }) {
    const bookingId = p.booking.code;
    const events: ItineraryEvent[] = [];
    const shifts: CompanionShift[] = [];
    const transfers: DriverTransfer[] = [];
    const expenses: ReceiptExpense[] = [];

    const cesOviedo = CLINICAL_PROVIDERS['CLINIC-CES-OVIEDO'] || {
      id: 'CLINIC-CES-OVIEDO',
      name: 'Clínica CES Sede Oviedo',
      address: 'Torre Medica Oviedo CES',
      defaultCoordinates: { lat: 6.2008, lng: -75.5768 },
    };
    const cesTerritory = OperativeTerritory.fromString(cesOviedo.address, cesOviedo.defaultCoordinates);
    const airportTerritory = OperativeTerritory.fromString('Aeropuerto JMC Rionegro');

    // Day 1: Arrival Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d1-arr`,
      bookingId,
      dayNumber: 1,
      title: `Llegada & Traslado Aeropuerto JMC Vuelo ${p.booking.arrivalAirline || 'Z-Fly'}`,
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 0, 15, 0),
      endDateTime: this.computeTime(p.baseArrival, 0, 17, 0),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d1-in`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_ARRIVAL',
      origin: airportTerritory,
      destination: p.hotelTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 0, 15, 0),
      baseRate: p.airportRate,
    }));

    // Day 2 (05:30 AM): Fasting Lab
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-lab`,
      bookingId,
      dayNumber: 2,
      title: 'Laboratorio Clínico Domiciliario en Habitación Hotel (Uroanálisis, Creatinina 05:30 AM)',
      category: 'LAB',
      startDateTime: this.computeTime(p.baseArrival, 1, 5, 30),
      endDateTime: this.computeTime(p.baseArrival, 1, 6, 30),
      location: p.hotelTerritory,
      providerId: 'LAB-ECHAVARRIA',
      assignedNurseId: 'NURSE-01',
      financialType: 'OUT_OF_POCKET',
      cost: STANDARD_DISBURSEMENTS.labEchavarriaHomeVisit,
      status: 'PROGRAMADO',
    }));
    expenses.push(new ReceiptExpense({
      id: `exp-${bookingId}-d2-lab`,
      bookingId,
      eventId: `evt-${bookingId}-d2-lab`,
      category: 'MEDICAL_LAB',
      description: 'Toma Domiciliaria Laboratorio Echavarría Habitación Hotel',
      amount: STANDARD_DISBURSEMENTS.labEchavarriaHomeVisit,
      date: this.computeTime(p.baseArrival, 1, 5, 30),
      audited: true,
      status: 'APPROVED',
    }));

    // Day 2: Urology Consultation
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d2-cons`,
      bookingId,
      dayNumber: 2,
      title: 'Consulta Urología en Inglés Dr. Carlos Suárez en CES Oviedo',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 1, 12, 0),
      endDateTime: this.computeTime(p.baseArrival, 1, 17, 0),
      location: cesTerritory,
      providerId: cesOviedo.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 5.0,
      cost: Money.fromAmount(77500, 'COP'),
      status: 'PROGRAMADO',
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d2`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 2,
      date: this.computeTime(p.baseArrival, 1, 0, 0).substring(0, 10),
      hoursLogged: 5.0,
    }));

    // Day 3: Urological Procedure
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d3-proc`,
      bookingId,
      dayNumber: 3,
      title: 'Procedimiento Quirúrgico / Diagnóstico Ambulatorio Clínica CES',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 2, 7, 30),
      endDateTime: this.computeTime(p.baseArrival, 2, 13, 30),
      location: cesTerritory,
      providerId: cesOviedo.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 6.0,
      cost: Money.fromAmount(93000, 'COP'),
      status: 'PROGRAMADO',
    }));
    shifts.push(new CompanionShift({
      id: `shf-${bookingId}-d3`,
      bookingId,
      guideId: p.guide.id,
      guideName: p.guide.name,
      dayNumber: 3,
      date: this.computeTime(p.baseArrival, 2, 0, 0).substring(0, 10),
      hoursLogged: 6.0,
    }));

    // Day 4: Fit-to-Fly Certification
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d4-fit2fly`,
      bookingId,
      dayNumber: 4,
      title: 'Control Post-Procedimiento & Certificación Fit-to-Fly CES Oviedo',
      category: 'CLINICAL',
      startDateTime: this.computeTime(p.baseArrival, 3, 9, 0),
      endDateTime: this.computeTime(p.baseArrival, 3, 11, 0),
      location: cesTerritory,
      providerId: cesOviedo.id,
      assignedGuideId: p.guide.id,
      financialType: 'GUIDE_FEE',
      guideHours: 2.0,
      cost: Money.fromAmount(31000, 'COP'),
      status: 'PROGRAMADO',
      requiresSignature: true,
    }));

    // Day 4: Departure Transfer
    events.push(new ItineraryEvent({
      id: `evt-${bookingId}-d4-dept`,
      bookingId,
      dayNumber: 4,
      title: 'Hotel Check-out ➔ Traslado al Aeropuerto JMC Retorno',
      category: 'FLIGHT',
      startDateTime: this.computeTime(p.baseArrival, 3, 14, 0),
      endDateTime: this.computeTime(p.baseArrival, 3, 16, 0),
      location: airportTerritory,
      assignedDriverId: p.driver.id,
      financialType: 'FLEET_TAXI',
      cost: p.airportRate,
      status: 'PROGRAMADO',
    }));
    transfers.push(new DriverTransfer({
      id: `trf-${bookingId}-d4-out`,
      bookingId,
      driverId: p.driver.id,
      driverName: p.driver.name,
      vehicleType: p.vehicleClass,
      routeType: 'AIRPORT_DEPARTURE',
      origin: p.hotelTerritory,
      destination: airportTerritory,
      scheduledTime: this.computeTime(p.baseArrival, 3, 14, 0),
      baseRate: p.airportRate,
    }));

    return { events, shifts, transfers, expenses };
  }
}
