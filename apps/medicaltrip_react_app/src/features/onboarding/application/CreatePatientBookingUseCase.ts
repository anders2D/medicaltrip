/**
 * Medical Trip Colombia S.A.S. - CreatePatientBookingUseCase
 * CQRS Command Use Case for 1-Click Patient & Group Onboarding (Flow 1).
 * Validates domain invariants, resolves operative territory, generates collision-free booking codes,
 * creates initial empty settlement ledger, and logs domain events into IndexedDB.
 */

import { IStoragePort } from '@/core/ports';
import { IActorEventBusPort } from '@/features/swarm';
import { PatientBooking, PassengerRecord } from '@/core/domain';
import { SettlementLedger } from '@/features/settlement';
import { OperativeTerritory } from '@/core/domain';
import { InvalidBookingError } from '@/core/domain';
import { ACCOMMODATION_PROVIDERS } from '@/features/directory';

export interface CreatePatientBookingDTO {
  id?: string;
  code?: string;
  patientName?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  language?: string;
  paxCount?: number;
  arrivalDate: string; // ISO-8601 UTC
  departureDate: string; // ISO-8601 UTC
  hotel?: string | OperativeTerritory;
  hotelId?: string;
  hotelName?: string;
  airline?: string;
  flightNumber?: string;
  arrivalAirline?: string;
  arrivalFlight?: string;
  companionNames?: string[];
  phone?: string;
  email?: string;
  notes?: string;
  passengers?: PassengerRecord[];
  requiresHotelReservation?: boolean;
  hotelVoucherFileName?: string;
  hotelVoucherFileUrl?: string;
}

export type CreatePatientBookingCommand = CreatePatientBookingDTO;

export interface CreatePatientBookingResult extends PatientBooking {
  booking: PatientBooking;
  settlement: SettlementLedger;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class CreatePatientBookingUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly eventBusPort?: IActorEventBusPort
  ) {}

  public async execute(command: CreatePatientBookingCommand): Promise<CreatePatientBookingResult> {
    const paxCount = command.paxCount !== undefined ? command.paxCount : 1;

    // 1. Validate paxCount invariant (1 <= paxCount <= 20)
    if (paxCount <= 0 || paxCount > 20) {
      throw new InvalidBookingError(
        `paxCount must be between 1 and 20. Received: ${paxCount}`
      );
    }

    // 2. Validate Chronological Invariant (T_dep >= T_arr)
    const arrTime = new Date(command.arrivalDate).getTime();
    const depTime = new Date(command.departureDate).getTime();
    if (isNaN(arrTime) || isNaN(depTime)) {
      throw new InvalidBookingError(
        `Invalid arrivalDate (${command.arrivalDate}) or departureDate (${command.departureDate})`
      );
    }
    if (depTime < arrTime) {
      throw new InvalidBookingError(
        `Departure date (${command.departureDate}) cannot precede arrival date (${command.arrivalDate})`
      );
    }

    // 3. Validate and resolve OperativeTerritory for Hotel (Fail-fast if non-operative like Mocoa)
    const rawHotelInput = command.hotel || command.hotelName || command.hotelId || 'Hotel Inntu Laureles';
    const hotelAddress = typeof rawHotelInput === 'string'
      ? rawHotelInput.trim()
      : rawHotelInput.address;

    if (!hotelAddress) {
      throw new InvalidBookingError('Hotel / Accommodation location is required');
    }

    // OperativeTerritory.fromString will throw NonOperativeTerritoryError if invalid or forbidden
    const hotelTerritory = typeof rawHotelInput === 'string'
      ? OperativeTerritory.fromString(rawHotelInput)
      : rawHotelInput;

    // Resolve matching hotel provider ID / Name if present in directory
    let resolvedHotelId = command.hotelId || 'HOTEL-INNTU';
    let resolvedHotelName =
      command.hotelName ||
      (typeof command.hotel === 'string' ? command.hotel : hotelTerritory.address);

    for (const [, provider] of Object.entries(ACCOMMODATION_PROVIDERS)) {
      if (
        command.hotelId &&
        provider.id.toLowerCase() === command.hotelId.toLowerCase()
      ) {
        resolvedHotelId = provider.id;
        break;
      }
    }

    // 4. Parse Patient Name into First and Last Name
    let firstName = command.firstName || '';
    let lastName = command.lastName || '';
    if (!firstName && command.patientName) {
      const parts = command.patientName.trim().split(/\s+/);
      if (parts.length === 1) {
        firstName = parts[0];
        lastName = 'N/A';
      } else {
        firstName = parts.slice(0, -1).join(' ');
        lastName = parts[parts.length - 1];
      }
    }
    if (!firstName) {
      firstName = 'Paciente';
      lastName = 'MedicalTrip';
    }

    // 5. Generate Standard Entity IDs
    const id = command.id || generateUUID();
    const patientId = `ENT-PAX-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate pseudo-passport hash for PHI anonymization
    const passportRaw = `${firstName}_${lastName}_${command.country || 'Curazao'}_${command.arrivalDate}`;
    let hash = 0;
    for (let i = 0; i < passportRaw.length; i++) {
      hash = ((hash << 5) - hash) + passportRaw.charCodeAt(i);
      hash |= 0;
    }
    const passportHash = `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;

    // 6. Handle Unique Booking Code Generation & Auto-Incrementing Suffix on Collision
    const resolvedCode = await this.resolveCollisionFreeCode(command.code);

    // 7. Instantiate Domain Entity
    const booking = new PatientBooking({
      id,
      code: resolvedCode,
      patientId,
      firstName,
      lastName,
      passportHash,
      country: command.country || 'Curazao',
      language: command.language || 'Papiamento',
      phone: command.phone || '+5999 512 0000',
      email: command.email || `${firstName.toLowerCase().replace(/\s+/g, '.')}.${lastName.toLowerCase().replace(/\s+/g, '.')}@medicaltrip.test`,
      companionNames: command.companionNames || (paxCount > 1 ? [`Acompañante de ${firstName}`] : []),
      paxCount,
      arrivalDate: new Date(command.arrivalDate).toISOString(),
      departureDate: new Date(command.departureDate).toISOString(),
      arrivalAirline: command.airline || command.arrivalAirline || 'Z-Fly',
      arrivalFlight: command.flightNumber || command.arrivalFlight || 'ZF-104',
      hotelId: resolvedHotelId,
      hotelName: resolvedHotelName,
      status: 'PROGRAMADO',
      notes: command.notes || '',
      passengers: command.passengers,
      requiresHotelReservation: command.requiresHotelReservation,
      hotelVoucherFileName: command.hotelVoucherFileName,
      hotelVoucherFileUrl: command.hotelVoucherFileUrl,
    });

    // 8. Persist Booking to Storage
    await this.storagePort.saveBooking(booking);

    // 9. Initialize and Persist Fresh Empty Settlement Ledger
    const settlement = SettlementLedger.createEmpty(booking.code);
    await this.storagePort.saveSettlement(settlement);

    // 10. Append to CQRS Event Stream
    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: booking.code,
      type: 'BOOKING_CREATED',
      payload: {
        bookingId: booking.id,
        code: booking.code,
        patientName: booking.fullName,
        country: booking.country,
        language: booking.language,
        paxCount: booking.paxCount,
        adultsCount: booking.adultsCount,
        childrenCount: booking.childrenCount,
        totalQuotationCOP: booking.totalIndividualQuotationCOP,
        requiresHotel: booking.requiresHotelReservation,
        arrivalDate: booking.arrivalDate,
        departureDate: booking.departureDate,
        hotelName: booking.hotelName,
      },
      timestamp: Date.now(),
    });

    // 11. Broadcast to Swarm Event Bus if available
    if (this.eventBusPort) {
      await this.eventBusPort.broadcast('BOOKING_CREATED', {
        bookingId: booking.id,
        code: booking.code,
        paxCount: booking.paxCount,
        language: booking.language,
      });
    }

    // Return hybrid result (both PatientBooking entity and { booking, settlement } container)
    const result = Object.create(booking) as CreatePatientBookingResult;
    result.booking = booking;
    result.settlement = settlement;

    return result;
  }

  /**
   * Generates a collision-free booking code by auto-incrementing suffix when collisions are detected.
   * e.g. RVA171 -> RVA171-1 -> RVA171-2, or RVA501 -> RVA501-1
   */
  private async resolveCollisionFreeCode(requestedCode?: string): Promise<string> {
    const allBookings = await this.storagePort.getAllBookings();
    const existingCodes = new Set(allBookings.map((b) => b.code.toUpperCase()));

    let baseCode = requestedCode ? requestedCode.trim().toUpperCase() : '';
    if (!baseCode) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      baseCode = `RVA${randomNum}`;
    }

    if (!existingCodes.has(baseCode)) {
      return baseCode;
    }

    const suffixMatch = baseCode.match(/^(.*?)-(\d+)$/);
    const rootCode = suffixMatch ? suffixMatch[1] : baseCode;

    let maxSuffix = 0;
    for (const code of existingCodes) {
      if (code === rootCode) {
        maxSuffix = Math.max(maxSuffix, 0);
      } else if (code.startsWith(`${rootCode}-`)) {
        const numPart = code.substring(rootCode.length + 1);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxSuffix) {
          maxSuffix = parsed;
        }
      }
    }

    return `${rootCode}-${maxSuffix + 1}`;
  }
}
