/**
 * Medical Trip Colombia S.A.S. - PersistStorageUseCase
 * Anti-eviction orchestration use case for requesting and monitoring permanent browser storage.
 */

import { IStoragePersistPort, StorageEstimate } from '../../domain/ports/IStoragePersistPort';

export interface PersistStorageResult {
  readonly isPersisted: boolean;
  readonly estimate: StorageEstimate;
  readonly storageEstimate: StorageEstimate;
}

export class PersistStorageUseCase {
  constructor(private readonly persistPort: IStoragePersistPort) {}

  public async execute(params: boolean | { requestPersistence?: boolean } = true): Promise<PersistStorageResult> {
    const autoRequest = typeof params === 'boolean' ? params : (params.requestPersistence ?? true);
    let isPersisted = await this.persistPort.isPersisted();

    if (!isPersisted && autoRequest) {
      isPersisted = await this.persistPort.requestPersistence();
    }

    await this.persistPort.touchHeartbeat();
    const estimate = await this.persistPort.getStorageEstimate();

    return {
      isPersisted,
      estimate,
      storageEstimate: estimate,
    };
  }
}
