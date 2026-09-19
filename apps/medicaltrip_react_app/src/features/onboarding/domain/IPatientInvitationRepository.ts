/**
 * Medical Trip Colombia S.A.S. - IPatientInvitationRepository Port
 * Puerto hexagonal para la persistencia y consulta de invitaciones de pacientes.
 * Permite desacoplar el dominio de la tecnología de almacenamiento (LocalStorage, IndexedDB o Supabase).
 */

import { PatientInvitation } from './PatientInvitation';

export interface IPatientInvitationRepository {
  /**
   * Guarda o actualiza una invitación.
   */
  saveInvitation(invitation: PatientInvitation): Promise<void>;

  /**
   * Obtiene una invitación por su token único alfanumérico.
   */
  getInvitationByToken(token: string): Promise<PatientInvitation | null>;

  /**
   * Lista todas las invitaciones registradas en el sistema.
   */
  listInvitations(): Promise<PatientInvitation[]>;

  /**
   * Marca una invitación como completada al registrarse la reserva del paciente.
   */
  markAsCompleted(token: string, bookingId: string): Promise<void>;

  /**
   * Elimina una invitación por token.
   */
  deleteInvitation(token: string): Promise<void>;
}
