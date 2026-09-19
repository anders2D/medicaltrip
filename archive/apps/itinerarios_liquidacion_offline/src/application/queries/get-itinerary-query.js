import { DomainError } from '../../domain/errors/domain-error.js';

/**
 * Query Handler: GetItineraryQuery
 * Provides day-by-day itinerary view with live FSM statuses and progress aggregation.
 */
export class GetItineraryQuery {
  /** @type {import('../../domain/ports/storage-port.js').IStoragePort} */
  #storagePort;

  /**
   * @param {object} params
   * @param {import('../../domain/ports/storage-port.js').IStoragePort} params.storagePort
   */
  constructor({ storagePort } = {}) {
    if (!storagePort) {
      throw new DomainError('[GetItineraryQuery] storagePort es obligatorio.');
    }
    this.#storagePort = storagePort;
  }

  /**
   * Executes query.
   * @param {object} [params]
   * @param {string} [params.id] - Optional single item lookup
   * @param {number} [params.dayNumber] - Filter by specific day
   * @param {string} [params.reservationCode] - Filter by reservation code
   * @param {string} [params.status] - Filter by status
   * @param {boolean} [params.groupByDay=false] - Return grouped by day
   * @returns {Promise<{
   *   items: import('../../domain/entities/itinerary-item.js').ItineraryItem[],
   *   totalCount: number,
   *   byDay: Record<number, import('../../domain/entities/itinerary-item.js').ItineraryItem[]>,
   *   metrics: {
   *     total: number,
   *     completed: number,
   *     inSite: number,
   *     inTransit: number,
   *     scheduled: number,
   *     cancelled: number,
   *     progressPercentage: number
   *   }
   * }>}
   */
  async execute({
    id = null,
    dayNumber = null,
    reservationCode = null,
    status = null,
    groupByDay = false
  } = {}) {
    if (id) {
      const single = await this.#storagePort.getItinerary(id);
      const items = single ? [single] : [];
      return this._formatResult(items, groupByDay);
    }

    const items = await this.#storagePort.getAllItineraries({
      dayNumber,
      reservationCode,
      status
    });

    return this._formatResult(items, groupByDay);
  }

  /**
   * @private
   */
  _formatResult(items, groupByDay) {
    const byDay = {};
    let completed = 0;
    let inSite = 0;
    let inTransit = 0;
    let scheduled = 0;
    let cancelled = 0;

    for (const item of items) {
      const day = item.dayNumber;
      if (!byDay[day]) {
        byDay[day] = [];
      }
      byDay[day].push(item);

      switch (item.status) {
        case 'COMPLETADO':
          completed++;
          break;
        case 'EN_SITIO':
          inSite++;
          break;
        case 'EN_CAMINO':
          inTransit++;
          break;
        case 'PROGRAMADO':
          scheduled++;
          break;
        case 'CANCELADO':
          cancelled++;
          break;
        default:
          break;
      }
    }

    const activeCount = items.length - cancelled;
    const progressPercentage = activeCount > 0 ? Math.round((completed / activeCount) * 100) : 0;

    return {
      items,
      totalCount: items.length,
      byDay,
      metrics: {
        total: items.length,
        completed,
        inSite,
        inTransit,
        scheduled,
        cancelled,
        progressPercentage
      }
    };
  }
}
