import { DomainError } from '../errors/domain-error.js';

/**
 * Abstract Port: IStoragePort
 * Primary persistence contract for relational/structured entities and CQRS event streams.
 */
export class IStoragePort {
  /**
   * @param {import('../entities/itinerary-item.js').ItineraryItem} _item
   * @returns {Promise<void>}
   */
  async saveItinerary(_item) {
    throw new DomainError('[IStoragePort] saveItinerary no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _id
   * @returns {Promise<import('../entities/itinerary-item.js').ItineraryItem | null>}
   */
  async getItinerary(_id) {
    throw new DomainError('[IStoragePort] getItinerary no ha sido implementado en el adaptador.');
  }

  /**
   * @param {object} [_filter]
   * @returns {Promise<import('../entities/itinerary-item.js').ItineraryItem[]>}
   */
  async getAllItineraries(_filter) {
    throw new DomainError('[IStoragePort] getAllItineraries no ha sido implementado en el adaptador.');
  }

  /**
   * @param {import('../entities/settlement-ledger.js').SettlementLedger} _ledger
   * @returns {Promise<void>}
   */
  async saveSettlementLedger(_ledger) {
    throw new DomainError('[IStoragePort] saveSettlementLedger no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _reservationCode
   * @returns {Promise<import('../entities/settlement-ledger.js').SettlementLedger | null>}
   */
  async getSettlementLedger(_reservationCode) {
    throw new DomainError('[IStoragePort] getSettlementLedger no ha sido implementado en el adaptador.');
  }

  /**
   * @param {import('../value-objects/actor-event.js').ActorEvent} _event
   * @returns {Promise<void>}
   */
  async appendEvent(_event) {
    throw new DomainError('[IStoragePort] appendEvent no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _aggregateId
   * @returns {Promise<import('../value-objects/actor-event.js').ActorEvent[]>}
   */
  async getEventStream(_aggregateId) {
    throw new DomainError('[IStoragePort] getEventStream no ha sido implementado en el adaptador.');
  }

  /**
   * @param {import('../entities/expense-item.js').ExpenseItem} _expense
   * @returns {Promise<void>}
   */
  async saveExpense(_expense) {
    throw new DomainError('[IStoragePort] saveExpense no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _id
   * @returns {Promise<import('../entities/expense-item.js').ExpenseItem | null>}
   */
  async getExpense(_id) {
    throw new DomainError('[IStoragePort] getExpense no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _reservationCode
   * @returns {Promise<import('../entities/expense-item.js').ExpenseItem[]>}
   */
  async getExpensesByReservation(_reservationCode) {
    throw new DomainError('[IStoragePort] getExpensesByReservation no ha sido implementado en el adaptador.');
  }

  /**
   * @param {import('../entities/driver-transfer.js').DriverTransfer} _transfer
   * @returns {Promise<void>}
   */
  async saveDriverTransfer(_transfer) {
    throw new DomainError('[IStoragePort] saveDriverTransfer no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _id
   * @returns {Promise<import('../entities/driver-transfer.js').DriverTransfer | null>}
   */
  async getDriverTransfer(_id) {
    throw new DomainError('[IStoragePort] getDriverTransfer no ha sido implementado en el adaptador.');
  }

  /**
   * @param {import('../entities/companion-shift.js').CompanionShift} _shift
   * @returns {Promise<void>}
   */
  async saveCompanionShift(_shift) {
    throw new DomainError('[IStoragePort] saveCompanionShift no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _id
   * @returns {Promise<import('../entities/companion-shift.js').CompanionShift | null>}
   */
  async getCompanionShift(_id) {
    throw new DomainError('[IStoragePort] getCompanionShift no ha sido implementado en el adaptador.');
  }

  /**
   * @param {import('../entities/patient-signature.js').PatientSignature} _signature
   * @returns {Promise<void>}
   */
  async saveSignature(_signature) {
    throw new DomainError('[IStoragePort] saveSignature no ha sido implementado en el adaptador.');
  }

  /**
   * @param {string} _id
   * @returns {Promise<import('../entities/patient-signature.js').PatientSignature | null>}
   */
  async getSignature(_id) {
    throw new DomainError('[IStoragePort] getSignature no ha sido implementado en el adaptador.');
  }
}
