export interface ISignatureStorageService {
  saveSignature(reservaId: string, milestoneId: string, signatureDataUrl: string): Promise<string>;
  getSignature(signatureUuid: string): Promise<string | null>;
  deleteSignature(signatureUuid: string): Promise<void>;
}
