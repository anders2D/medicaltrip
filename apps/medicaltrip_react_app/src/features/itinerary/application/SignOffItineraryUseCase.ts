/**
 * Medical Trip Colombia S.A.S. - SignOffItineraryUseCase
 * CQRS Command Use Case for capturing biometric digital signatures on itinerary milestones and final case sign-off.
 */

import { IStoragePort } from '@/core/ports';
import { IBlobStoragePort } from '@/core/ports';
import { ItineraryEvent } from '../domain/ItineraryEvent';

export interface SignOffItineraryCommand {
  bookingId: string;
  eventId?: string;
  signerRole: 'PATIENT' | 'GUIDE' | 'COORDINATOR';
  signerName: string;
  signatureDataUrl?: string; // Base64 data URL from HTML5 canvas
  signatureBlob?: Blob | ArrayBuffer | string;
}

export interface SignOffItineraryResult {
  readonly signatureId: string;
  readonly signatureBlobId: string;
  readonly signedAt: string;
  readonly event?: ItineraryEvent;
}

export class SignOffItineraryUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly blobStoragePort: IBlobStoragePort
  ) {}

  public async execute(command: SignOffItineraryCommand): Promise<SignOffItineraryResult> {
    const signatureId = `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const signedAt = new Date().toISOString();
    const sigData = command.signatureBlob || command.signatureDataUrl || '';

    // Store signature image blob
    await this.blobStoragePort.saveBlob(
      signatureId,
      command.bookingId,
      'image/png',
      'SIGNATURE',
      sigData
    );

    let updatedEvent: ItineraryEvent | undefined;

    if (command.eventId) {
      const event = await this.storagePort.getEventById(command.eventId);
      if (event) {
        updatedEvent = event.attachSignature(signatureId);
        await this.storagePort.saveEvent(updatedEvent);
      }
    }

    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: command.bookingId,
      type: 'ITINERARY_SIGNED_OFF',
      payload: {
        signatureId,
        eventId: command.eventId,
        signerRole: command.signerRole,
        signerName: command.signerName,
      },
      timestamp: Date.now(),
    });

    return {
      signatureId,
      signatureBlobId: signatureId,
      signedAt,
      event: updatedEvent,
    };
  }
}
