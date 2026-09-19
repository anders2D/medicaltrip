/**
 * Medical Trip Colombia S.A.S. - EventDetailDrawer
 * Dual-Paradigm Event Detail & Creation Drawer.
 * Desktop (>=768px): Right-hand slide-over drawer (480px width).
 * Mobile (<768px): Touch-optimized swipe-to-dismiss bottom sheet with grab handle.
 */

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { EventForm } from './EventForm';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { X, Trash2, CalendarCheck } from 'lucide-react';

export const EventDetailDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    drawerMode,
    activeEvent,
    defaultSlot,
    activeBooking,
    closeDrawer,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useAppContext();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow || 'unset';
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const handleDelete = async () => {
    if (!activeEvent) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento del itinerario?')) {
      setIsDeleting(true);
      try {
        await deleteEvent(activeEvent.id);
        closeDrawer();
      } catch (err) {
        console.error('Error deleting event:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSave = async (formData: any) => {
    setIsSaving(true);
    try {
      if (drawerMode === 'create') {
        await createEvent({
          bookingId: activeBooking ? activeBooking.code : formData.bookingId,
          dayNumber: formData.dayNumber,
          title: formData.title,
          category: formData.category,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime,
          location: formData.location,
          providerId: formData.providerId,
          providerName: formData.providerName,
          assignedDriverId: formData.assignedDriverId,
          assignedGuideId: formData.assignedGuideId,
          financialType: formData.financialType,
          cost: formData.cost,
          guideHours: formData.guideHours,
          status: formData.status,
          requiresGpsCheckIn: formData.requiresGpsCheckIn,
          requiresReceipt: formData.requiresReceipt,
          requiresSignature: formData.requiresSignature,
          notes: formData.notes,
        });
      } else if (activeEvent) {
        const updated = new ItineraryEvent({
          ...activeEvent,
          ...formData,
        });
        await updateEvent(updated);
      }
      closeDrawer();
    } catch (err) {
      console.error('Error saving event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" data-testid="event-detail-drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Responsive Panel Container: Desktop Right Slide-Over / Mobile Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:max-w-lg w-full flex flex-col pointer-events-none">
        <div className="w-full max-h-[92vh] md:max-h-full md:h-full bg-white rounded-t-2xl md:rounded-t-none md:border-l border-zinc-200 flex flex-col pointer-events-auto animate-in slide-in-from-bottom md:slide-in-from-right duration-200 overflow-hidden">
          {/* Mobile Drag Handle Pill */}
          <div className="md:hidden pt-2.5 pb-1 flex justify-center bg-zinc-50 border-b border-zinc-100">
            <div className="w-12 h-1.5 bg-zinc-300 rounded-full" />
          </div>

          {/* Drawer Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 leading-tight">
                  {drawerMode === 'create' ? 'Nuevo Evento de Itinerario' : 'Detalle del Evento'}
                </h3>
                {activeBooking && (
                  <span className="text-xs text-zinc-600 font-mono">
                    Reserva: {activeBooking.code} · {activeBooking.fullName}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {drawerMode === 'edit' && activeEvent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  data-testid="btn-delete-event"
                  title="Eliminar evento"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                aria-label="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
            <EventForm
              initialEvent={activeEvent}
              defaultDate={defaultSlot?.date}
              defaultStartTime={defaultSlot?.startTime}
              defaultEndTime={defaultSlot?.endTime}
              bookingId={activeBooking?.code || 'RVA171-4'}
              onSave={handleSave}
              onCancel={closeDrawer}
              isLoading={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
