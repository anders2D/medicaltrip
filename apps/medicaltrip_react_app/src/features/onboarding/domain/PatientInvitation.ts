/**
 * Medical Trip Colombia S.A.S. - PatientInvitation Domain Entity
 * Representa una invitación de registro generada por el coordinador
 * para que el paciente complete sus datos y registre a sus acompañantes.
 */

import { InvalidBookingError } from '@/core/domain';

export type InvitationStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';

export interface PatientInvitationProps {
  id: string;
  token: string;
  patientName: string;
  country?: string;
  language?: string;
  phone?: string;
  email?: string;
  estimatedArrivalDate?: string;
  coordinatorNotes?: string;
  status?: InvitationStatus;
  createdAt?: string;
  completedAt?: string;
  completedBookingId?: string;
}

export class PatientInvitation {
  public readonly id: string;
  public readonly token: string;
  public readonly patientName: string;
  public readonly country: string;
  public readonly language: string;
  public readonly phone: string;
  public readonly email: string;
  public readonly estimatedArrivalDate: string;
  public readonly coordinatorNotes: string;
  public readonly status: InvitationStatus;
  public readonly createdAt: string;
  public readonly completedAt?: string;
  public readonly completedBookingId?: string;

  constructor(params: PatientInvitationProps) {
    if (!params.id) {
      throw new InvalidBookingError('Invitation must have a valid ID');
    }
    if (!params.token || params.token.trim().length === 0) {
      throw new InvalidBookingError('Invitation must have a valid token');
    }
    if (!params.patientName || params.patientName.trim().length === 0) {
      throw new InvalidBookingError('Invitation must have a pre-assigned patient name');
    }

    this.id = params.id;
    this.token = params.token.trim().toUpperCase();
    this.patientName = params.patientName.trim();
    this.country = params.country || 'Curazao';
    this.language = params.language || 'Papiamento';
    this.phone = params.phone || '';
    this.email = params.email || '';
    this.estimatedArrivalDate = params.estimatedArrivalDate || '';
    this.coordinatorNotes = params.coordinatorNotes || '';
    this.status = params.status || 'PENDING';
    this.createdAt = params.createdAt || new Date().toISOString();
    this.completedAt = params.completedAt;
    this.completedBookingId = params.completedBookingId;

    Object.freeze(this);
  }

  public isPending(): boolean {
    return this.status === 'PENDING';
  }

  public isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  public markAsCompleted(bookingId: string): PatientInvitation {
    return new PatientInvitation({
      id: this.id,
      token: this.token,
      patientName: this.patientName,
      country: this.country,
      language: this.language,
      phone: this.phone,
      email: this.email,
      estimatedArrivalDate: this.estimatedArrivalDate,
      coordinatorNotes: this.coordinatorNotes,
      status: 'COMPLETED',
      createdAt: this.createdAt,
      completedAt: new Date().toISOString(),
      completedBookingId: bookingId,
    });
  }

  public buildShareableUrl(origin: string = ''): string {
    const base = origin.replace(/\/$/, '');
    const encodedName = encodeURIComponent(this.patientName);
    const encodedCountry = encodeURIComponent(this.country);
    const encodedLang = encodeURIComponent(this.language);
    const encodedDate = encodeURIComponent(this.estimatedArrivalDate);
    return `${base}/?registro=true&token=${this.token}&name=${encodedName}&country=${encodedCountry}&lang=${encodedLang}&date=${encodedDate}`;
  }

  public buildWhatsAppMessage(origin: string = ''): string {
    const url = this.buildShareableUrl(origin);
    return (
      `Hola ${this.patientName}, te saluda el equipo de Medical Trip Colombia S.A.S. 🇨🇴✨\n\n` +
      `Te compartimos tu enlace exclusivo para completar el registro de tu viaje médico y el de tus acompañantes ` +
      `(pacientes que recibirán atención y familiares de apoyo, requerimientos de hotel y vuelos):\n\n` +
      `🔗 ${url}\n\n` +
      `¡Quedamos atentos a tu confirmación para tener todo preparado a tu llegada!`
    );
  }
}
