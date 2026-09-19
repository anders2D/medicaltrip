/**
 * Medical Trip Colombia S.A.S. - DriverCheckInAction
 * 1-Click touch-friendly button/action for fleet drivers & coordinators to confirm patient reception
 * at the international terminal (JMC Rionegro Airport) with instant visual feedback and timestamp recording.
 */

import React, { useState } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { useLanguage } from '@/core/i18n';
import { PerformDriverCheckInUseCase, PerformDriverCheckInResult } from '../../../application/use-cases/PerformDriverCheckInUseCase';
import { CheckCircle2, Loader2, Navigation, Car } from 'lucide-react';

export interface DriverCheckInActionProps {
  bookingId?: string;
  transferId?: string;
  eventId?: string;
  currentStatus?: string; // 'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED'
  gpsChecked?: boolean;
  onCheckInSuccess?: (result: PerformDriverCheckInResult) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline' | 'pill';
  className?: string;
  compact?: boolean;
}

export const DriverCheckInAction: React.FC<DriverCheckInActionProps> = ({
  bookingId,
  transferId,
  eventId,
  currentStatus,
  gpsChecked = false,
  onCheckInSuccess,
  size = 'md',
  variant = 'primary',
  className = '',
  compact = false,
}) => {
  const { storagePort, activeBooking, refreshData, recalculateSettlement } = useAppContext();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckedInOptimistic, setIsCheckedInOptimistic] = useState<boolean>(
    currentStatus === 'IN_TRANSIT' || currentStatus === 'COMPLETED' || gpsChecked
  );
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const effectiveBookingId = bookingId || activeBooking?.id || activeBooking?.code || '';

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || isCheckedInOptimistic) return;
    if (!effectiveBookingId) return;

    setIsLoading(true);
    try {
      const useCase = new PerformDriverCheckInUseCase(storagePort);
      const result = await useCase.execute({
        bookingId: effectiveBookingId,
        transferId,
        eventId,
        targetTransferStatus: 'IN_TRANSIT',
        targetEventStatus: 'EN_SITIO',
        driverNotes: 'Paciente recibido en Terminal Internacional JMC con cartel identificador Medical Trip.',
      });

      setIsCheckedInOptimistic(true);
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCheckInTime(timeFormatted);

      if (refreshData) {
        await refreshData();
      }
      if (recalculateSettlement) {
        await recalculateSettlement();
      }
      if (onCheckInSuccess) {
        onCheckInSuccess(result);
      }
    } catch (err) {
      console.error('Driver check-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isCheckedIn = isCheckedInOptimistic || currentStatus === 'IN_TRANSIT' || currentStatus === 'COMPLETED' || gpsChecked;

  // Render when already checked in
  if (isCheckedIn) {
    return (
      <div
        data-testid="driver-checked-in-badge"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold select-none ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="truncate">
          {t.arrivalLogistics.driverCheckedInSuccess}
          {checkInTime && <span className="ml-1 text-xs text-emerald-600 font-mono">({checkInTime})</span>}
        </span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs min-h-[36px]',
    md: 'px-3.5 py-2 text-xs sm:text-sm min-h-[44px]',
    lg: 'px-4 py-2.5 text-sm font-bold min-h-[48px]',
  };

  const variantClasses = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border border-indigo-700',
    outline:
      'bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-700 border border-indigo-300',
    pill:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full border border-emerald-700',
  };

  return (
    <button
      type="button"
      onClick={handleCheckIn}
      disabled={isLoading || !effectiveBookingId}
      data-testid="btn-driver-check-in"
      aria-label={t.arrivalLogistics.driverCheckIn}
      className={`relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none active:scale-95 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{t.arrivalLogistics.driverCheckingIn}</span>
        </>
      ) : (
        <>
          <Navigation className="w-4 h-4 text-current shrink-0 animate-pulse" />
          <span>{t.arrivalLogistics.driverCheckIn}</span>
          {!compact && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-xs opacity-80 font-mono bg-black/10 px-1.5 py-0.5 rounded">
              <Car className="w-3 h-3" />
              Terminal JMC
            </span>
          )}
        </>
      )}
    </button>
  );
};
