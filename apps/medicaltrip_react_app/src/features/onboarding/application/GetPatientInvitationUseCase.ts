/**
 * Medical Trip Colombia S.A.S. - GetPatientInvitationUseCase
 * Caso de uso para recuperar los datos de una invitación mediante su token.
 * Soporta recuperación directa del repositorio local y fallback resiliente
 * desde parámetros de URL para entornos distribuidos sin nube.
 */

import { PatientInvitation } from '../domain/PatientInvitation';
import { IPatientInvitationRepository } from '../domain/IPatientInvitationRepository';

export interface GetPatientInvitationQuery {
  token: string;
  fallbackName?: string;
  fallbackCountry?: string;
  fallbackLanguage?: string;
  fallbackDate?: string;
}

export class GetPatientInvitationUseCase {
  constructor(private readonly invitationRepository: IPatientInvitationRepository) {}

  public async execute(query: GetPatientInvitationQuery): Promise<PatientInvitation | null> {
    if (!query.token) return null;

    // 1. Intentar buscar en el repositorio local / Supabase
    const existing = await this.invitationRepository.getInvitationByToken(query.token);
    if (existing) {
      return existing;
    }

    // 2. Fallback resiliente: Si el enlace se abre en un dispositivo distinto sin sincronización de nube aún,
    // reconstruir la invitación a partir de los parámetros codificados en la URL
    if (query.fallbackName && query.fallbackName.trim().length > 0) {
      const fallbackInvitation = new PatientInvitation({
        id: `url-inv-${query.token}`,
        token: query.token,
        patientName: query.fallbackName,
        country: query.fallbackCountry || 'Curazao',
        language: query.fallbackLanguage || 'Papiamento',
        estimatedArrivalDate: query.fallbackDate || '',
        status: 'PENDING',
      });

      // Guardar en el almacenamiento del dispositivo actual para persistencia
      await this.invitationRepository.saveInvitation(fallbackInvitation);
      return fallbackInvitation;
    }

    return null;
  }
}
