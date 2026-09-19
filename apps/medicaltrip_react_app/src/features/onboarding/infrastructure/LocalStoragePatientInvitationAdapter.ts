/**
 * Medical Trip Colombia S.A.S. - LocalStoragePatientInvitationAdapter
 * Adaptador de infraestructura para IPatientInvitationRepository basado en LocalStorage.
 * 100% Offline / Local-First, sin dependencias en la nube.
 */

import { IPatientInvitationRepository } from '../domain/IPatientInvitationRepository';
import { PatientInvitation, PatientInvitationProps } from '../domain/PatientInvitation';

export class LocalStoragePatientInvitationAdapter implements IPatientInvitationRepository {
  private readonly storageKey: string;
  private memoryFallback: Map<string, string> = new Map();

  constructor(storageKey: string = 'MedicalTrip_PatientInvitations') {
    this.storageKey = storageKey;
  }

  private isLocalStorageAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private getRawStore(): Record<string, PatientInvitationProps> {
    try {
      if (this.isLocalStorageAvailable()) {
        const data = window.localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
      }
      const memData = this.memoryFallback.get(this.storageKey);
      return memData ? JSON.parse(memData) : {};
    } catch {
      return {};
    }
  }

  private setRawStore(store: Record<string, PatientInvitationProps>): void {
    const json = JSON.stringify(store);
    try {
      if (this.isLocalStorageAvailable()) {
        window.localStorage.setItem(this.storageKey, json);
      } else {
        this.memoryFallback.set(this.storageKey, json);
      }
    } catch {
      this.memoryFallback.set(this.storageKey, json);
    }
  }

  public async saveInvitation(invitation: PatientInvitation): Promise<void> {
    const store = this.getRawStore();
    const props: PatientInvitationProps = {
      id: invitation.id,
      token: invitation.token,
      patientName: invitation.patientName,
      country: invitation.country,
      language: invitation.language,
      phone: invitation.phone,
      email: invitation.email,
      estimatedArrivalDate: invitation.estimatedArrivalDate,
      coordinatorNotes: invitation.coordinatorNotes,
      status: invitation.status,
      createdAt: invitation.createdAt,
      completedAt: invitation.completedAt,
      completedBookingId: invitation.completedBookingId,
    };
    store[invitation.token.toUpperCase()] = props;
    this.setRawStore(store);
  }

  public async getInvitationByToken(token: string): Promise<PatientInvitation | null> {
    if (!token) return null;
    const store = this.getRawStore();
    const raw = store[token.trim().toUpperCase()];
    if (!raw) return null;
    return new PatientInvitation(raw);
  }

  public async listInvitations(): Promise<PatientInvitation[]> {
    const store = this.getRawStore();
    return Object.values(store).map((props) => new PatientInvitation(props));
  }

  public async markAsCompleted(token: string, bookingId: string): Promise<void> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) return;
    const completed = invitation.markAsCompleted(bookingId);
    await this.saveInvitation(completed);
  }

  public async deleteInvitation(token: string): Promise<void> {
    const store = this.getRawStore();
    delete store[token.trim().toUpperCase()];
    this.setRawStore(store);
  }
}
