/**
 * Medical Trip Colombia S.A.S. - SupabasePatientInvitationAdapter
 * Adaptador de infraestructura desacoplado para IPatientInvitationRepository con Supabase.
 * Diseñado según los estándares de Arquitectura Hexagonal para habilitar la persistencia
 * en la nube con fallback 100% offline-first.
 */

import { IPatientInvitationRepository } from '../domain/IPatientInvitationRepository';
import { PatientInvitation, PatientInvitationProps } from '../domain/PatientInvitation';
import { LocalStoragePatientInvitationAdapter } from './LocalStoragePatientInvitationAdapter';

export interface SupabaseClientStub {
  from: (table: string) => {
    select: (columns?: string) => any;
    insert: (values: any) => any;
    upsert: (values: any) => any;
    update: (values: any) => any;
    delete: () => any;
    eq: (column: string, value: any) => any;
    single: () => any;
  };
}

export class SupabasePatientInvitationAdapter implements IPatientInvitationRepository {
  private readonly client: SupabaseClientStub | null;
  private readonly tableName: string;
  private readonly fallback: LocalStoragePatientInvitationAdapter;

  constructor(client: SupabaseClientStub | null = null, tableName: string = 'patient_invitations') {
    this.client = client;
    this.tableName = tableName;
    this.fallback = new LocalStoragePatientInvitationAdapter();
  }

  public async saveInvitation(invitation: PatientInvitation): Promise<void> {
    await this.fallback.saveInvitation(invitation);

    if (!this.client) {
      return;
    }

    const payload = {
      id: invitation.id,
      token: invitation.token,
      patient_name: invitation.patientName,
      country: invitation.country,
      language: invitation.language,
      phone: invitation.phone,
      email: invitation.email,
      estimated_arrival_date: invitation.estimatedArrivalDate,
      coordinator_notes: invitation.coordinatorNotes,
      status: invitation.status,
      created_at: invitation.createdAt,
      completed_at: invitation.completedAt,
      completed_booking_id: invitation.completedBookingId,
    };

    try {
      const { error } = await this.client.from(this.tableName).upsert(payload);
      if (error) {
        console.warn(`[SupabasePatientInvitationAdapter] Cloud sync notice: ${error.message || error}. Handled locally.`);
      }
    } catch (err) {
      console.warn(`[SupabasePatientInvitationAdapter] Cloud request error:`, err, `. Handled locally.`);
    }
  }

  public async getInvitationByToken(token: string): Promise<PatientInvitation | null> {
    if (!this.client) return this.fallback.getInvitationByToken(token);

    try {
      const query = this.client
        .from(this.tableName)
        .select('*')
        .eq('token', token.trim().toUpperCase());

      const { data, error } = typeof query.maybeSingle === 'function'
        ? await query.maybeSingle()
        : await query.limit(1).then((r: any) => ({ data: r.data?.[0] ?? null, error: r.error }));

      if (error || !data) {
        return this.fallback.getInvitationByToken(token);
      }

      const props: PatientInvitationProps = {
        id: data.id,
        token: data.token,
        patientName: data.patient_name,
        country: data.country,
        language: data.language,
        phone: data.phone,
        email: data.email,
        estimatedArrivalDate: data.estimated_arrival_date,
        coordinatorNotes: data.coordinator_notes,
        status: data.status,
        createdAt: data.created_at,
        completedAt: data.completed_at,
        completedBookingId: data.completed_booking_id,
      };

      return new PatientInvitation(props);
    } catch {
      return this.fallback.getInvitationByToken(token);
    }
  }

  public async listInvitations(): Promise<PatientInvitation[]> {
    if (!this.client) return this.fallback.listInvitations();

    try {
      const { data, error } = await this.client.from(this.tableName).select('*');
      if (error || !data || data.length === 0) {
        return this.fallback.listInvitations();
      }

      const cloudInvitations = data.map(
        (item: any) =>
          new PatientInvitation({
            id: item.id,
            token: item.token,
            patientName: item.patient_name,
            country: item.country,
            language: item.language,
            phone: item.phone,
            email: item.email,
            estimatedArrivalDate: item.estimated_arrival_date,
            coordinatorNotes: item.coordinator_notes,
            status: item.status,
            createdAt: item.created_at,
            completedAt: item.completed_at,
            completedBookingId: item.completed_booking_id,
          })
      );

      const localInvitations = await this.fallback.listInvitations();
      const map = new Map<string, PatientInvitation>();
      for (const inv of cloudInvitations) {
        map.set(inv.token, inv);
      }
      for (const inv of localInvitations) {
        if (!map.has(inv.token)) {
          map.set(inv.token, inv);
        }
      }
      return Array.from(map.values());
    } catch {
      return this.fallback.listInvitations();
    }
  }

  public async markAsCompleted(token: string, bookingId: string): Promise<void> {
    await this.fallback.markAsCompleted(token, bookingId);
    if (!this.client) return;

    try {
      await this.client
        .from(this.tableName)
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          completed_booking_id: bookingId,
        })
        .eq('token', token.trim().toUpperCase());
    } catch {
      // Handled locally
    }
  }

  public async deleteInvitation(token: string): Promise<void> {
    await this.fallback.deleteInvitation(token);
    if (!this.client) return;
    try {
      await this.client.from(this.tableName).delete().eq('token', token.trim().toUpperCase());
    } catch {
      // Handled locally
    }
  }
}
