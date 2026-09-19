/**
 * Medical Trip Colombia S.A.S. - ArrivalTrackingCard
 * Visual flight & airport arrival logistics tracker card.
 * Features:
 * - Flight details (airline, flight number e.g. Wingo 7449, ZF-104, scheduled arrival time at JMC MDE).
 * - Assigned fleet driver profile ([DRV-01] Ramón Rosero NLX666, [DRV-02] Juan Carlos Montoya, [DRV-03] Andrés Cantero).
 * - Destination accommodation (Villa Anita Envigado / Park 42 Poblado / Hotel Inntu Laureles / Novelty Suites).
 * - Live transfer status timeline (Solicitado ➔ En Tránsito / En Terminal ➔ Completado en Hotel).
 * - 1-Click Driver Check-in Action (`DriverCheckInAction`).
 * - Welcome Orientation Kit trigger button.
 */

import React, { useState } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { useLanguage } from '@/core/i18n';
import { DriverCheckInAction } from './DriverCheckInAction';
import { WelcomeOrientationModal } from './WelcomeOrientationModal';
import { FLEET_DRIVERS, ACCOMMODATION_PROVIDERS } from '../../../infrastructure/data/providers.data';
import {
  Plane,
  Car,
  Building2,
  Clock,
  Compass,
  Gift,
  ChevronRight,
} from 'lucide-react';

export interface ArrivalTrackingCardProps {
  className?: string;
  onOpenOrientationKit?: () => void;
  compact?: boolean;
}

export const ArrivalTrackingCard: React.FC<ArrivalTrackingCardProps> = ({
  className = '',
  onOpenOrientationKit,
  compact = false,
}) => {
  const { activeBooking, transfers } = useAppContext();
  const { t } = useLanguage();
  const [isInternalModalOpen, setIsInternalModalOpen] = useState<boolean>(false);

  // If no active booking, return null
  if (!activeBooking) {
    return null;
  }

  // Find arrival transfer
  const arrivalTransfer = transfers.find((t) => t.routeType === 'AIRPORT_ARRIVAL') || transfers[0];
  const driverId = arrivalTransfer?.driverId || 'DRV-01';
  const driver = FLEET_DRIVERS[driverId] || {
    id: driverId,
    name: arrivalTransfer?.driverName || 'Ramón Rosero',
    vehicleModel: 'Kia Sonet (Sedán / SUV)',
    vehicleClass: 'SEDAN' as const,
    licensePlate: 'NLX666',
    company: 'Aeroturex Transporte Especial',
    phone: '+57 310 456 7890',
  };

  // Find destination hotel
  const hotelId = activeBooking.hotelId || 'HOTEL-PARK42';
  const hotel = ACCOMMODATION_PROVIDERS[hotelId] || {
    id: hotelId,
    name: activeBooking.hotelName || 'Hospedaje Asignado',
    address: 'Medellín, Colombia',
    zone: 'POBLADO' as const,
    phone: '+57 604 448 0042',
  };

  // Format arrival date & time
  const rawDate = activeBooking.arrivalDate ? new Date(activeBooking.arrivalDate) : new Date();
  const arrivalDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;
  const formattedDate = arrivalDate.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = arrivalDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const transferStatus = arrivalTransfer?.status || 'CONFIRMED';
  const isCheckedIn = transferStatus === 'IN_TRANSIT' || transferStatus === 'COMPLETED';

  const handleOpenKit = () => {
    if (onOpenOrientationKit) {
      onOpenOrientationKit();
    } else {
      setIsInternalModalOpen(true);
    }
  };

  return (
    <>
      <div
        data-testid="arrival-tracking-card"
        className={`bg-white rounded-xl border border-zinc-200/90 overflow-hidden ${className}`}
      >
        {/* Header Ribbon */}
        <div className="bg-zinc-950 border-b border-zinc-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold tracking-wide uppercase">
                  {t.arrivalLogistics.trackingTitle}
                </span>
                <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tabular-nums">
                  {activeBooking.arrivalFlight || 'Vuelo JMC'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium font-mono">
                {activeBooking.arrivalAirline} • {activeBooking.code} ({activeBooking.paxCount} Pax)
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenKit}
              data-testid="btn-open-welcome-kit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 duration-200 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer min-h-[38px] border border-white/10"
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.arrivalLogistics.openWelcomeKit}</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className={`${compact ? 'p-2 sm:p-3' : 'p-3.5 sm:p-4'} grid grid-cols-1 md:grid-cols-3 gap-3.5`}>
          {/* 1. Flight & JMC Terminal Schedule */}
          <div className="flex flex-col justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
            <div>
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.arrivalLogistics.scheduledArrival}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base sm:text-xl font-extrabold text-zinc-950 font-mono tabular-nums">
                  {formattedTime}
                </span>
                <span className="text-xs font-medium text-zinc-600">{formattedDate}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium flex items-center gap-1">
                <Compass className="w-3 h-3 text-zinc-400" />
                {t.arrivalLogistics.terminal}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Aerolínea:</span>
              <span className="font-semibold text-zinc-800">{activeBooking.arrivalAirline}</span>
            </div>
          </div>

          {/* 2. Assigned Fleet Driver & Vehicle */}
          <div className="flex flex-col justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
            <div>
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Car className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.arrivalLogistics.driverAssigned}</span>
              </div>
              <p className="text-sm font-bold text-zinc-950 truncate">
                {driver.name}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5 truncate font-medium">
                {driver.vehicleModel} {driver.licensePlate ? `• [${driver.licensePlate}]` : ''}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500">{driver.company}</span>
              <span className="font-mono font-semibold text-zinc-800 tabular-nums">{driver.phone}</span>
            </div>
          </div>

          {/* 3. Destination Accommodation */}
          <div className="flex flex-col justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
            <div>
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{t.arrivalLogistics.destinationHotel}</span>
              </div>
              <p className="text-sm font-bold text-zinc-950 truncate">
                {hotel.name}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5 truncate font-medium">
                {hotel.address}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Zona Operativa:</span>
              <span className="font-semibold text-zinc-800 uppercase text-xs bg-zinc-200/70 px-1.5 py-0.5 rounded font-mono">
                {(hotel as any).zone || hotel.sector || 'POBLADO'}
              </span>
            </div>
          </div>
        </div>

        {/* Transfer Status Timeline & 1-Click Action Bar */}
        <div className="px-3.5 sm:px-4 py-3 bg-zinc-50/80 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status Timeline */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-semibold hidden md:inline">
              {t.arrivalLogistics.transferStatusTimeline}:
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Step 1 */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-200 text-zinc-700">
                1. {t.arrivalLogistics.statusRequested}
              </span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
              {/* Step 2 */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  isCheckedIn
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                2. {t.arrivalLogistics.statusInTransit}
              </span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
              {/* Step 3 */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  transferStatus === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                3. {t.arrivalLogistics.statusCompleted}
              </span>
            </div>
          </div>

          {/* 1-Click Check-In Action Button */}
          <div className="flex items-center justify-end">
            <DriverCheckInAction
              bookingId={activeBooking.id || activeBooking.code}
              transferId={arrivalTransfer?.id}
              currentStatus={transferStatus}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Internal Welcome Kit Modal */}
      <WelcomeOrientationModal
        isOpen={isInternalModalOpen}
        onClose={() => setIsInternalModalOpen(false)}
      />
    </>
  );
};
