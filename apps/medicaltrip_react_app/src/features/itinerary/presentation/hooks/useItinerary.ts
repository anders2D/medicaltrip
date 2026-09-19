import { useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { ItineraryEvent } from '../../domain/ItineraryEvent';
import { EventStatusType } from '../../domain/EventStatus';
import { CreateEventCommand } from '../../application/CreateEventUseCase';

export function useItinerary() {
  const {
    events,
    activeBooking,
    isLoading,
    createEvent,
    updateEvent,
    rescheduleEvent,
    deleteEvent,
    transitionEventStatus,
    openCreateDrawer,
    openEditDrawer,
  } = useAppContext();

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );
  }, [events]);

  const eventsByDayNumber = useMemo(() => {
    const map = new Map<number, ItineraryEvent[]>();
    for (const evt of sortedEvents) {
      const day = evt.dayNumber || 1;
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day)!.push(evt);
    }
    return map;
  }, [sortedEvents]);

  const scheduleEvent = async (command: CreateEventCommand) => {
    return await createEvent(command);
  };

  const moveEvent = async (
    eventId: string,
    newStartDateTime: string,
    newEndDateTime: string,
    newLocation?: string
  ) => {
    return await rescheduleEvent(eventId, newStartDateTime, newEndDateTime, newLocation);
  };

  const markStatus = async (eventId: string, nextStatus: EventStatusType) => {
    await transitionEventStatus(eventId, nextStatus);
  };

  const removeEvent = async (eventId: string) => {
    await deleteEvent(eventId);
  };

  return {
    events: sortedEvents,
    eventsByDayNumber,
    activeBooking,
    isLoading,
    scheduleEvent,
    moveEvent,
    markStatus,
    removeEvent,
    updateEvent,
    openCreateDrawer,
    openEditDrawer,
  };
}
