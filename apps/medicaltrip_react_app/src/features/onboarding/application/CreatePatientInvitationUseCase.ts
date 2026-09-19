/**
 * Medical Trip Colombia S.A.S. - CreatePatientInvitationUseCase
 * Caso de uso para que el coordinador genere una invitación con el nombre preasignado del paciente.
 * Retorna la entidad de la invitación, el enlace compartible y el mensaje listo para WhatsApp.
 */

import { PatientInvitation } from '../domain/PatientInvitation';
import { IPatientInvitationRepository } from '../domain/IPatientInvitationRepository';

export interface CreatePatientInvitationCommand {
  patientName: string;
  country?: string;
  language?: string;
  phone?: string;
  email?: string;
  estimatedArrivalDate?: string;
  coordinatorNotes?: string;
  baseUrl?: string;
}

export interface CreatePatientInvitationResult {
  invitation: PatientInvitation;
  shareableUrl: string;
  whatsAppMessage: string;
}

export class CreatePatientInvitationUseCase {
  constructor(private readonly invitationRepository: IPatientInvitationRepository) {}

  private generateToken(): string {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const year = new Date().getFullYear();
    return `INV-${year}-${randomHex}`;
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public async execute(command: CreatePatientInvitationCommand): Promise<CreatePatientInvitationResult> {
    const token = this.generateToken();
    const id = this.generateUuid();

    const invitation = new PatientInvitation({
      id,
      token,
      patientName: command.patientName,
      country: command.country || 'Curazao',
      language: command.language || 'Papiamento',
      phone: command.phone || '',
      email: command.email || '',
      estimatedArrivalDate: command.estimatedArrivalDate || '',
      coordinatorNotes: command.coordinatorNotes || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    await this.invitationRepository.saveInvitation(invitation);

    const effectiveBaseUrl =
      command.baseUrl ||
      (typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://medicaltripapp-nine.vercel.app');

    const shareableUrl = invitation.buildShareableUrl(effectiveBaseUrl);
    const whatsAppMessage = invitation.buildWhatsAppMessage(effectiveBaseUrl);

    return {
      invitation,
      shareableUrl,
      whatsAppMessage,
    };
  }
}
