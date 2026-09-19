import { InvalidEventTransitionError } from '@/core/domain';

export type EventStatusType = 'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO';

export class EventStatus {
  private static readonly VALID_TRANSITIONS: Record<EventStatusType, EventStatusType[]> = {
    PROGRAMADO: ['EN_CAMINO', 'EN_SITIO', 'CANCELADO'],
    EN_CAMINO: ['EN_SITIO', 'CANCELADO'],
    EN_SITIO: ['COMPLETADO', 'CANCELADO'],
    COMPLETADO: [], // Terminal state
    CANCELADO: ['PROGRAMADO'], // Reopening permitted
  };

  public static canTransition(current: EventStatusType, next: EventStatusType): boolean {
    if (current === next) return true;
    return EventStatus.VALID_TRANSITIONS[current]?.includes(next) ?? false;
  }

  public static assertTransition(current: EventStatusType, next: EventStatusType): void {
    if (!EventStatus.canTransition(current, next)) {
      throw new InvalidEventTransitionError(current, next);
    }
  }

  public static getStatusLabel(status: EventStatusType): string {
    switch (status) {
      case 'PROGRAMADO': return 'Programado';
      case 'EN_CAMINO': return 'En Camino';
      case 'EN_SITIO': return 'En Sitio';
      case 'COMPLETADO': return 'Completado';
      case 'CANCELADO': return 'Cancelado';
    }
  }
}
