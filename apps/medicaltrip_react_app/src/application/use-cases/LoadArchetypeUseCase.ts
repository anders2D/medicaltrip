/**
 * Medical Trip Colombia S.A.S. - LoadArchetypeUseCase
 * Command & Query Use Case for instant hydration of the 4 real-world Google Drive patient cases into storage.
 */

import { IStoragePort } from '../../domain/ports/IStoragePort';
import { ARCHETYPES_DATA, HISTORICAL_ARCHETYPES_DATA, ArchetypeBundle } from '../../infrastructure/data/archetypes.data';
import { InvariantViolationError } from '../../domain/errors/DomainError';

export interface LoadArchetypeCommand {
  archetypeKey: 'rva171' | 'rva282' | 'rva341' | 'rva077' | 'rva350' | string;
}

export class LoadArchetypeUseCase {
  constructor(private readonly storagePort: IStoragePort) {}

  public async execute(command: LoadArchetypeCommand): Promise<ArchetypeBundle> {
    const normalizedKey = command.archetypeKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bundle =
      ARCHETYPES_DATA[normalizedKey] ||
      ARCHETYPES_DATA[command.archetypeKey] ||
      HISTORICAL_ARCHETYPES_DATA[normalizedKey] ||
      HISTORICAL_ARCHETYPES_DATA[command.archetypeKey];

    if (!bundle) {
      const validKeys = Object.keys({ ...ARCHETYPES_DATA, ...HISTORICAL_ARCHETYPES_DATA }).join(', ');
      throw new InvariantViolationError(
        `Unknown archetype key '${command.archetypeKey}'. Available archetypes: ${validKeys}`
      );
    }

    // Persist booking
    await this.storagePort.saveBooking(bundle.booking);

    // Persist events
    for (const evt of bundle.events) {
      await this.storagePort.saveEvent(evt);
    }

    // Persist companion shifts
    for (const shift of bundle.shifts) {
      await this.storagePort.saveShift(shift);
    }

    // Persist fleet transfers
    for (const transfer of bundle.transfers) {
      await this.storagePort.saveTransfer(transfer);
    }

    // Persist receipts & disbursements
    for (const expense of bundle.expenses) {
      await this.storagePort.saveExpense(expense);
    }

    // Persist settlement ledger
    await this.storagePort.saveSettlement(bundle.settlement);

    // Append to CQRS event stream
    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: bundle.booking.id,
      type: 'ARCHETYPE_LOADED',
      payload: {
        archetypeKey: command.archetypeKey,
        bookingCode: bundle.booking.code,
        paxCount: bundle.booking.paxCount,
        eventsCount: bundle.events.length,
        netBalance: bundle.settlement.netBalance.toJSON(),
      },
      timestamp: Date.now(),
    });

    return bundle;
  }
}
