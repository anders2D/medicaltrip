import { MilestoneCategory, MilestoneStatus, MilestoneFinancialType } from '../../domain/entities/ItineraryMilestone';
import { CurrencyCode } from '../../domain/values/Money';

export interface ScheduleMilestoneCommand {
  reservaId: string;
  dayNumber: number;
  title: string;
  category: MilestoneCategory;
  startDateTime: string; // ISO string
  endDateTime?: string; // ISO string
  location: string;
  coordinates?: { latitude: number; longitude: number };
  providerId?: string;
  providerName?: string;
  assignedDriverId?: string;
  assignedGuideId?: string;
  assignedNurseId?: string;
  financialType?: MilestoneFinancialType;
  costCents?: string | number | bigint;
  currency?: CurrencyCode;
  guideHours?: number;
  notes?: string;
  requiresGpsCheckIn?: boolean;
  requiresSignature?: boolean;
  requiresReceipt?: boolean;
}

export interface RescheduleMilestoneCommand {
  reservaId: string;
  milestoneId: string;
  newStartDateTime: string; // ISO string
  newEndDateTime?: string; // ISO string
}

export interface SignOffItineraryCommand {
  reservaId: string;
  milestoneId: string;
  signatureDataUrl: string;
  signedByPaxName: string;
}

export interface MilestoneDTO {
  id: string;
  reservaId: string;
  dayNumber: number;
  title: string;
  category: MilestoneCategory;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  location: string;
  canonicalCorridor: string;
  status: MilestoneStatus;
  costFormatted: string;
  costCents: string;
  currency: CurrencyCode;
  providerName?: string;
  assignedDriverId?: string;
  assignedGuideId?: string;
  assignedNurseId?: string;
  gpsChecked: boolean;
  requiresGpsCheckIn: boolean;
  requiresSignature: boolean;
  requiresReceipt: boolean;
  signatureUuid?: string;
  receiptUuid?: string;
  notes?: string;
}
