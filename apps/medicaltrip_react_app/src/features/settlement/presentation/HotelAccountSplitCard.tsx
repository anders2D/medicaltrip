/**
 * Medical Trip Colombia S.A.S. - HotelAccountSplitCard
 * Sistematización del Libro 'PAGO HOTEL MDE' y Desglose Contable de Alojamiento.
 *
 * Resuelve la contabilidad hotelera dividida:
 * 1. Total Cotizado al Pasajero (Noches * Tarifa Cotizada).
 * 2. Depósito de Garantía cobrado por Medical Trip (1 noche / 20%).
 * 3. Saldo Exacto a Pagar por el Pasajero DIRECTAMENTE en la recepción del hotel.
 * 4. Generación y Envío 1-Click del Voucher de Hotel con el desglose exacto para WhatsApp.
 */

import React, { useState, useMemo } from 'react';
import { PatientBooking } from '@/core/domain';
import { Money } from '@/core/domain';
import {
  Hotel,
  Share2,
  Copy,
  Check,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

export interface HotelAccountSplitCardProps {
  booking: PatientBooking | null;
}

export const HotelAccountSplitCard: React.FC<HotelAccountSplitCardProps> = ({ booking }) => {
  const [copied, setCopied] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Default values based on empirical RVA350 / Caribbean archetypes
  const defaultNights = booking?.hotelNights || 7;
  const defaultNightlyRate = booking?.hotelNightlyRateCents
    ? Number(booking.hotelNightlyRateCents / 100n)
    : 310000;

  const [nights, setNights] = useState<number>(defaultNights);
  const [nightlyRateCOP, setNightlyRateCOP] = useState<number>(defaultNightlyRate);
  const [agencyDepositCOP, setAgencyDepositCOP] = useState<number>(
    booking?.hotelAgencyDepositCents
      ? Number(booking.hotelAgencyDepositCents / 100n)
      : 442000
  );

  // Deterministic BigInt calculations
  const totalQuotedMoney = useMemo(() => {
    return Money.fromAmount(nights * nightlyRateCOP, 'COP');
  }, [nights, nightlyRateCOP]);

  const agencyDepositMoney = useMemo(() => {
    return Money.fromAmount(agencyDepositCOP, 'COP');
  }, [agencyDepositCOP]);

  const directPayHotelMoney = useMemo(() => {
    const directCents = totalQuotedMoney.cents - agencyDepositMoney.cents;
    return Money.fromCents(directCents >= 0n ? directCents : 0n, 'COP');
  }, [totalQuotedMoney, agencyDepositMoney]);

  // Hotel details
  const hotelName = booking?.hotelName || 'HOTEL 1616 Poblado';
  const patientName = booking ? `${booking.firstName} ${booking.lastName}` : 'Natalie Rumai';
  const bookingCode = booking?.code || 'RVA350-1';

  // Voucher Text for WhatsApp
  const voucherText = useMemo(() => {
    return (
      `*VOUCHER DE ALOJAMIENTO - MEDICAL TRIP COLOMBIA*\n` +
      `----------------------------------------\n` +
      `Pasajero: ${patientName} (${bookingCode})\n` +
      `Hotel: ${hotelName}\n` +
      `Estadía: ${nights} Noches\n` +
      `Valor Total Alojamiento: ${totalQuotedMoney.formatCOP()}\n` +
      `Depósito Pagado a Agencia: ${agencyDepositMoney.formatCOP()} (Garantía confirmada)\n` +
      `*SALDO A PAGAR EN RECEPCIÓN*: ${directPayHotelMoney.formatCOP()}\n` +
      `----------------------------------------\n` +
      `Presentar este comprobante en la recepción del hotel al realizar el Check-In.`
    );
  }, [patientName, bookingCode, hotelName, nights, totalQuotedMoney, agencyDepositMoney, directPayHotelMoney]);

  const handleCopyVoucher = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(voucherText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = booking?.phone ? booking.phone.replace(/[^0-9]/g, '') : '5997864234';
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(voucherText)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      data-testid="hotel-account-split-card"
      className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-left select-none"
    >
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center justify-center shrink-0">
            <Hotel className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-950 flex items-center gap-2 flex-wrap">
              <span>Desglose Contable de Hotel (Sistematizado)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase font-semibold">
                {hotelName}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500">
              Cálculo automatizado de depósito de garantía y saldo a pagar en recepción
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="btn-toggle-hotel-calculator"
          onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer transition-all self-start sm:self-auto"
        >
          <span>{isCalculatorOpen ? 'Ocultar Parámetros' : 'Ajustar Noches/Tarifa'}</span>
          {isCalculatorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. Visual Bento Grid con los 3 Saldo Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Cotizado */}
        <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
            <span>Total Cotizado</span>
            <span className="font-mono text-[10px] bg-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-700">
              {nights} Noches
            </span>
          </div>
          <div
            data-testid="hotel-total-quoted-amount"
            className="text-lg sm:text-xl font-bold font-mono text-zinc-950 tabular-nums"
          >
            {totalQuotedMoney.formatCOP()}
          </div>
          <span className="text-[10px] text-zinc-400 block font-mono">
            ${nightlyRateCOP.toLocaleString('es-CO')} COP / noche
          </span>
        </div>

        {/* Card 2: Depósito Pagado a Medical */}
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800">
            <span>Depósito a Medical</span>
            <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
              Garantía Pax
            </span>
          </div>
          <div
            data-testid="hotel-agency-deposit-amount"
            className="text-lg sm:text-xl font-bold font-mono text-emerald-900 tabular-nums"
          >
            {agencyDepositMoney.formatCOP()}
          </div>
          <span className="text-[10px] text-emerald-700/80 block font-medium">
            Cobrado por anticipado (1 noche)
          </span>
        </div>

        {/* Card 3: Saldo Directo en Recepción */}
        <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
            <span>Paga Pax en Recepción</span>
            <span className="font-mono text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-bold">
              Check-In
            </span>
          </div>
          <div
            data-testid="hotel-direct-pay-amount"
            className="text-lg sm:text-xl font-black font-mono text-amber-950 tabular-nums"
          >
            {directPayHotelMoney.formatCOP()}
          </div>
          <span className="text-[10px] text-amber-800 font-medium block">
            Saldo pendiente en hotel
          </span>
        </div>
      </div>

      {/* 3. Panel de Ajuste Rápido (Colapsable) */}
      {isCalculatorOpen && (
        <div
          data-testid="hotel-calculator-panel"
          className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3 animate-fade-in text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                Noches de Estadía:
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={nights}
                onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-zinc-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                Tarifa por Noche (COP):
              </label>
              <input
                type="number"
                step="5000"
                value={nightlyRateCOP}
                onChange={(e) => setNightlyRateCOP(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-zinc-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                Depósito Agencia (COP):
              </label>
              <input
                type="number"
                step="5000"
                value={agencyDepositCOP}
                onChange={(e) => setAgencyDepositCOP(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-zinc-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Los cambios recalculan automáticamente el saldo exacto para el voucher del pasajero.</span>
          </div>
        </div>
      )}

      {/* 4. Action Bar: Copiar y Enviar Voucher por WhatsApp */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100">
        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-mono">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Voucher con desglose listo para compartir</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="btn-copy-hotel-voucher"
            onClick={handleCopyVoucher}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 min-h-[34px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-600" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Voucher'}</span>
          </button>

          <button
            type="button"
            data-testid="btn-whatsapp-hotel-voucher"
            onClick={handleSendWhatsApp}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[34px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Enviar Voucher WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
