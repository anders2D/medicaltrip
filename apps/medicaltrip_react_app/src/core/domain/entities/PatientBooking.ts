import { InvalidBookingError } from '../errors/DomainError';

export type AgeCategory = 'ADULT' | 'CHILD' | 'INFANT';
export type PassengerRole = 'PATIENT' | 'COMPANION';
export type RoomPreference = 'SINGLE' | 'DOUBLE_SHARED' | 'TWIN' | 'EXTRA_BED' | 'NONE';

export interface MedicalSurvey {
  hasPreexistingConditions: boolean;
  conditionsDescription?: string;
  takesMedications: boolean;
  medicationsList?: string;
  specialRequirements?: string[]; // e.g. ['WHEELCHAIR', 'OXYGEN', 'DIETARY', 'RAMP_ASSIST', 'OTHER']
  specialRequirementsNotes?: string;
}

export interface FlightLeg {
  from: string;
  to: string;
  flightNumber: string;
  airline: string;
  departureTime?: string;
  arrivalTime?: string;
}

export type TreatmentPhase = 'DIAGNOSTIC' | 'SURGERY' | 'POST_OP_CONTROL';

export interface PassengerDocuments {
  passportFileName?: string;
  passportFileUrl?: string;
  medicalSurveyFileName?: string;
  medicalSurveyFileUrl?: string;
  flightTicketFileName?: string;
  flightTicketFileUrl?: string;
  hotelVoucherFileName?: string;
  hotelVoucherFileUrl?: string;
}

export interface PassengerRecord {
  id: string;
  fullName: string;
  age: number;
  ageCategory: AgeCategory;
  role?: PassengerRole; // 'PATIENT' (recibe atención) | 'COMPANION' (acompañante)
  passportNumber?: string;
  relationshipWithPrimary?: string; // 'Titular', 'Cónyuge', 'Hijo/a', 'Familiar', 'Amigo/a'
  requiresHotelBed?: boolean;
  roomPreference?: RoomPreference;
  sharesRoomWith?: string;
  dietaryRestrictions?: string;
  mobilityNeeds?: string;
  individualQuotationCOP: number;
  medicalSurvey: MedicalSurvey;
  documents?: PassengerDocuments;
}

export class PatientBooking {
  public readonly id: string;
  public readonly code: string;
  public readonly patientId: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly passportHash: string;
  public readonly country: string;
  public readonly language: string;
  public readonly phone: string;
  public readonly email: string;
  public readonly companionNames: string[];
  public readonly paxCount: number;
  public readonly arrivalDate: string; // ISO-8601 UTC
  public readonly departureDate: string; // ISO-8601 UTC
  public readonly arrivalAirline: string;
  public readonly arrivalFlight: string;
  public readonly flightLegs: FlightLeg[];
  public readonly treatmentPhase: TreatmentPhase;
  public readonly hotelId: string;
  public readonly hotelName: string;
  public readonly hotelNights?: number;
  public readonly hotelNightlyRateCents?: bigint;
  public readonly hotelTotalQuotedCents?: bigint;
  public readonly hotelAgencyDepositCents?: bigint;
  public readonly hotelDirectPayCents?: bigint;
  public readonly status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  public readonly notes: string;
  public readonly passengers: PassengerRecord[];
  public readonly requiresHotelReservation: boolean;
  public readonly hotelVoucherFileName?: string;
  public readonly hotelVoucherFileUrl?: string;

  constructor(params: {
    id: string;
    code: string;
    patientId: string;
    firstName: string;
    lastName: string;
    passportHash: string;
    country: string;
    language: string;
    phone: string;
    email: string;
    companionNames?: string[];
    paxCount: number;
    arrivalDate: string;
    departureDate: string;
    arrivalAirline: string;
    arrivalFlight: string;
    flightLegs?: FlightLeg[];
    treatmentPhase?: TreatmentPhase;
    hotelId: string;
    hotelName: string;
    hotelNights?: number;
    hotelNightlyRateCents?: bigint;
    hotelTotalQuotedCents?: bigint;
    hotelAgencyDepositCents?: bigint;
    hotelDirectPayCents?: bigint;
    status?: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
    notes?: string;
    passengers?: PassengerRecord[];
    requiresHotelReservation?: boolean;
    hotelVoucherFileName?: string;
    hotelVoucherFileUrl?: string;
  }) {
    if (!params.id || !params.code) {
      throw new InvalidBookingError('Booking must have valid id and code');
    }
    if (params.paxCount <= 0 || params.paxCount > 20) {
      throw new InvalidBookingError(`paxCount must be between 1 and 20. Received: ${params.paxCount}`);
    }
    if (new Date(params.departureDate) < new Date(params.arrivalDate)) {
      throw new InvalidBookingError(`Departure date (${params.departureDate}) cannot precede arrival date (${params.arrivalDate})`);
    }

    this.id = params.id;
    this.code = params.code;
    this.patientId = params.patientId;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.passportHash = params.passportHash;
    this.country = params.country;
    this.language = params.language;
    this.phone = params.phone;
    this.email = params.email;
    this.companionNames = params.companionNames || [];
    this.paxCount = params.paxCount;
    this.arrivalDate = params.arrivalDate;
    this.departureDate = params.departureDate;
    this.arrivalAirline = params.arrivalAirline;
    this.arrivalFlight = params.arrivalFlight;
    this.flightLegs = params.flightLegs || [];
    this.treatmentPhase = params.treatmentPhase || 'DIAGNOSTIC';
    this.hotelId = params.hotelId;
    this.hotelName = params.hotelName;
    this.hotelNights = params.hotelNights;
    this.hotelNightlyRateCents = params.hotelNightlyRateCents;
    this.hotelTotalQuotedCents = params.hotelTotalQuotedCents;
    this.hotelAgencyDepositCents = params.hotelAgencyDepositCents;
    this.hotelDirectPayCents = params.hotelDirectPayCents;
    this.status = params.status || 'PROGRAMADO';
    this.notes = params.notes || '';
    this.requiresHotelReservation = params.requiresHotelReservation ?? false;
    this.hotelVoucherFileName = params.hotelVoucherFileName;
    this.hotelVoucherFileUrl = params.hotelVoucherFileUrl;

    // Resolve or build default passenger list
    if (params.passengers && params.passengers.length > 0) {
      this.passengers = params.passengers.map((p, idx) => ({
        ...p,
        role: p.role || (idx === 0 ? 'PATIENT' : 'COMPANION'),
        requiresHotelBed: p.requiresHotelBed !== undefined ? p.requiresHotelBed : true,
      }));
    } else {
      const defaultPrimary: PassengerRecord = {
        id: `${params.id}-pax-0`,
        fullName: `${params.firstName} ${params.lastName}`.trim(),
        age: 35,
        ageCategory: 'ADULT',
        role: 'PATIENT',
        relationshipWithPrimary: 'Titular',
        requiresHotelBed: true,
        roomPreference: 'SINGLE',
        individualQuotationCOP: 0,
        medicalSurvey: {
          hasPreexistingConditions: false,
          takesMedications: false,
          specialRequirements: [],
        },
      };
      const companions: PassengerRecord[] = (params.companionNames || []).map((cName, idx) => ({
        id: `${params.id}-pax-${idx + 1}`,
        fullName: cName,
        age: 30,
        ageCategory: 'ADULT',
        role: 'COMPANION',
        relationshipWithPrimary: 'Acompañante',
        requiresHotelBed: true,
        roomPreference: 'DOUBLE_SHARED',
        individualQuotationCOP: 0,
        medicalSurvey: {
          hasPreexistingConditions: false,
          takesMedications: false,
          specialRequirements: [],
        },
      }));
      this.passengers = [defaultPrimary, ...companions];
    }

    Object.freeze(this);
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  public get patientFullName(): string {
    return this.fullName;
  }

  public get totalTravelers(): number {
    return Math.max(this.paxCount, 1 + this.companionNames.length, this.passengers.length);
  }

  public get totalIndividualQuotationCOP(): number {
    return this.passengers.reduce((sum, p) => sum + (p.individualQuotationCOP || 0), 0);
  }

  public get adultsCount(): number {
    return this.passengers.filter((p) => p.ageCategory === 'ADULT').length;
  }

  public get childrenCount(): number {
    return this.passengers.filter((p) => p.ageCategory === 'CHILD').length;
  }

  public get infantsCount(): number {
    return this.passengers.filter((p) => p.ageCategory === 'INFANT').length;
  }

  public get patientsCount(): number {
    return this.passengers.filter((p) => p.role === 'PATIENT').length;
  }

  public get companionsCount(): number {
    return this.passengers.filter((p) => p.role === 'COMPANION').length;
  }

  public get hotelGuestsCount(): number {
    return this.passengers.filter((p) => p.requiresHotelBed !== false).length;
  }

  public get hotelRoomsNeededEstimate(): number {
    const singleRooms = this.passengers.filter(
      (p) => p.requiresHotelBed !== false && p.roomPreference === 'SINGLE'
    ).length;
    const sharedGuests = this.passengers.filter(
      (p) =>
        p.requiresHotelBed !== false &&
        (p.roomPreference === 'DOUBLE_SHARED' || p.roomPreference === 'TWIN' || !p.roomPreference)
    ).length;
    return singleRooms + Math.ceil(sharedGuests / 2);
  }

  public get patientPassengers(): PassengerRecord[] {
    return this.passengers.filter((p) => p.role === 'PATIENT');
  }

  public get companionPassengers(): PassengerRecord[] {
    return this.passengers.filter((p) => p.role === 'COMPANION');
  }
}
