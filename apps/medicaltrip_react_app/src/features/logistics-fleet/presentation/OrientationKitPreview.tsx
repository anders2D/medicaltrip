/**
 * Medical Trip Colombia S.A.S. - OrientationKitPreview
 * Comprehensive welcome & Caribbean orientation kit preview component:
 * 1. 24/7 Emergency Contacts (Concierge hotline, assigned guide, assigned driver, hotel front desk/nursing, 123 emergency).
 * 2. Local SIM Card Delivery Status (Claro 80GB prepago, $90.909 COP tariff, assigned Colombian mobile number).
 * 3. Currency Exchange Rate Guidance (USD/ANG/EUR ➔ COP reference rates, authorized Casas de Cambio, ATM recommendations).
 * 4. Clinical fasting reminder for morning lab appointments.
 */

import React from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { useLanguage } from '@/core/i18n';
import { FLEET_DRIVERS, ACCOMMODATION_PROVIDERS, BILINGUAL_COMPANIONS } from '../../../infrastructure/data/providers.data';
import {
  PhoneCall,
  Wifi,
  DollarSign,
  Clock,
  ShieldCheck,
  Building2,
  Car,
  UserCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export interface OrientationKitPreviewProps {
  className?: string;
  onClose?: () => void;
  showDismissButton?: boolean;
}

export const OrientationKitPreview: React.FC<OrientationKitPreviewProps> = ({
  className = '',
  onClose,
  showDismissButton = false,
}) => {
  const { activeBooking, transfers, events } = useAppContext();
  const { t } = useLanguage();

  // Find assigned driver from active transfers or defaults
  const arrivalTransfer = transfers.find((t) => t.routeType === 'AIRPORT_ARRIVAL') || transfers[0];
  const driverId = arrivalTransfer?.driverId || 'DRV-01';
  const driverInfo = FLEET_DRIVERS[driverId] || {
    id: driverId,
    name: arrivalTransfer?.driverName || 'Ramón Rosero',
    vehicleModel: 'Kia Sonet (Sedán / SUV)',
    vehicleClass: 'SEDAN' as const,
    licensePlate: 'NLX666',
    company: 'Aeroturex Transporte Especial',
    phone: '+57 310 456 7890',
  };

  // Find assigned hotel info
  const hotelId = activeBooking?.hotelId || 'HOTEL-PARK42';
  const hotelInfo = ACCOMMODATION_PROVIDERS[hotelId] || {
    id: hotelId,
    name: activeBooking?.hotelName || 'Hospedaje Asignado',
    address: 'Medellín, Colombia',
    zone: 'POBLADO' as const,
    phone: '+57 604 448 0042',
  };

  // Find assigned companion guide
  const guideEvent = events.find((e) => e.assignedGuideId);
  const guideId = guideEvent?.assignedGuideId || 'GUIA-01';
  const guideInfo =
    (BILINGUAL_COMPANIONS && (BILINGUAL_COMPANIONS[guideId] || BILINGUAL_COMPANIONS['GUIA-01'])) || {
      id: guideId,
      name: 'Yenny Roberto',
      languages: ['Papiamento', 'Español', 'Inglés'],
      phone: '+57 300 123 4567',
    };

  // Phone copy feedback
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div
      data-testid="orientation-kit-preview"
      className={`flex flex-col gap-5 text-zinc-950 ${className}`}
    >
      {/* 1. Emergency & 24/7 Contacts Directory */}
      <section className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                {t.arrivalLogistics.emergencyContactsTitle}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                {t.arrivalLogistics.emergencyContacts}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider font-mono">
            24/7 Activo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Concierge Hotline */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100/70 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-600 truncate">
                  {t.arrivalLogistics.conciergeHotline}
                </p>
                <p className="text-xs font-bold text-indigo-950 font-mono tabular-nums">+57 300 123 4567</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('+573001234567', 'concierge')}
              title="Copiar teléfono"
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
            >
              {copiedKey === 'concierge' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Assigned Guide */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100/70 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-600 truncate">
                  {t.arrivalLogistics.guideContact}: {guideInfo.name}
                </p>
                <p className="text-xs font-bold text-zinc-900 font-mono tabular-nums">{guideInfo.phone}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(guideInfo.phone || '', 'guide')}
              title="Copiar teléfono"
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
            >
              {copiedKey === 'guide' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Assigned Driver */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100/70 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Car className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-600 truncate">
                  {t.arrivalLogistics.driverContact}: {driverInfo.name} ({driverInfo.licensePlate || 'Flota'})
                </p>
                <p className="text-xs font-bold text-zinc-900 font-mono tabular-nums">{driverInfo.phone}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(driverInfo.phone || '', 'driver')}
              title="Copiar teléfono"
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
            >
              {copiedKey === 'driver' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Hotel Front Desk & Nursing */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100/70 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-600 truncate">
                  {t.arrivalLogistics.hotelContact}: {hotelInfo.name.replace('Hotel ', '')}
                </p>
                <p className="text-xs font-bold text-zinc-900 font-mono tabular-nums">{hotelInfo.phone}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(hotelInfo.phone || '', 'hotel')}
              title="Copiar teléfono"
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
            >
              {copiedKey === 'hotel' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* National 123 Emergency Line */}
        <div className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-lg bg-rose-50/70 border border-rose-200/60 text-xs">
          <div className="flex items-center gap-2 text-rose-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{t.arrivalLogistics.police123}</span>
          </div>
          <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
            Tel: 123
          </span>
        </div>
      </section>

      {/* 2. Local Claro SIM Card Status */}
      <section className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                {t.arrivalLogistics.simCardTitle}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                {t.arrivalLogistics.simCardStatus}
              </p>
            </div>
          </div>
          <span
            data-testid="sim-status-badge"
            className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t.arrivalLogistics.simDeliveredBadge}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-xs uppercase font-bold text-zinc-500">Plan de Datos</span>
            <p className="font-semibold text-zinc-900 mt-0.5">{t.arrivalLogistics.simPlan}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-xs uppercase font-bold text-zinc-500">Tarifa Liquidación</span>
            <p className="font-bold text-indigo-900 mt-0.5 font-mono tabular-nums">{t.arrivalLogistics.simTariff}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-xs uppercase font-bold text-zinc-500">{t.arrivalLogistics.simAssignedNumber}</span>
            <p className="font-mono font-bold text-zinc-900 mt-0.5 tabular-nums">+57 304 598 1234</p>
          </div>
        </div>
      </section>

      {/* 3. Currency Exchange Rate Guidance */}
      <section className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950">
              {t.arrivalLogistics.currencyTitle}
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              {t.arrivalLogistics.currencyGuidance}
            </p>
          </div>
        </div>

        {/* Reference Rates Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-xs font-bold text-emerald-800 uppercase font-mono">1 USD ➔ COP</span>
            <p className="text-sm font-extrabold text-emerald-950 font-mono mt-0.5 tabular-nums">~$4.050</p>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200 text-center">
            <span className="text-xs font-bold text-sky-800 uppercase font-mono">1 ANG/AWG ➔ COP</span>
            <p className="text-sm font-extrabold text-sky-950 font-mono mt-0.5 tabular-nums">~$2.250</p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 text-center">
            <span className="text-xs font-bold text-purple-800 uppercase font-mono">1 EUR ➔ COP</span>
            <p className="text-sm font-extrabold text-purple-950 font-mono mt-0.5 tabular-nums">~$4.400</p>
          </div>
        </div>

        {/* Authorized Houses & ATM Tips */}
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2">
            <Building2 className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900">{t.arrivalLogistics.authorizedHouses}</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                • <strong>Centro Comercial Oviedo</strong> (Cra 43A #6 Sur-15, Poblado) · Western Union / Cambios G&D<br />
                • <strong>Milla de Oro Poblado</strong> (Cra 42 #3 Sur-81) · Cambios Medellín<br />
                • <strong>El Tesoro Parque Comercial</strong> (Cra 25A #1A Sur-45)
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-amber-950">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              {t.arrivalLogistics.atmAdvice}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Clinical Fasting Reminder */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="text-xs text-indigo-950">
          <p className="font-bold">{t.arrivalLogistics.fastingReminder}</p>
        </div>
      </section>

      {showDismissButton && onClose && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-orientation-kit"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-95 duration-200 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[44px]"
          >
            {t.arrivalLogistics.closeKit}
          </button>
        </div>
      )}
    </div>
  );
};
