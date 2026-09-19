/**
 * Medical Trip Colombia S.A.S. - PatientFlightSection
 * Sección de seguimiento de vuelos y logística de llegada:
 * - Rastreo de vuelo internacional (Aerolínea, código, llegada a JMC Rionegro)
 * - Tarjeta del conductor asignado Ramón Rosero (Kia Sonet NLX666, teléfono, WhatsApp)
 * - Botón de apertura del Kit de Bienvenida y Orientación 1-click
 * - CERO botón DriverCheckInAction en el DOM
 * - CERO tarifas de transporte o cifras financieras
 */

import React, { useState } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { PatientOrientationModal } from './PatientOrientationModal';
import { Plane, Car, Compass, MessageCircle, Phone, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const PatientFlightSection: React.FC = () => {
  const { activeBooking, transfers } = useAppContext();
  const [isOrientationKitOpen, setIsOrientationKitOpen] = useState<boolean>(false);

  // Flight details
  const flightNumber = activeBooking?.arrivalFlight || 'ZF-104';
  const airline = activeBooking?.arrivalAirline || 'Z-Fly';
  const arrivalDateRaw = activeBooking?.arrivalDate || '2026-08-20T10:00:00.000Z';

  const formatArrivalDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        timeCOT: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    } catch {
      return { date: '20 de Agosto 2026', timeCOT: '10:00 AM' };
    }
  };

  const arrivalFormatted = formatArrivalDateTime(arrivalDateRaw);

  // Driver details (Empirical defaults or from transfers)
  const arrivalTransfer = transfers.find((t) => t.routeType === 'AIRPORT_ARRIVAL') || transfers[0];
  const driverName = arrivalTransfer?.driverName || 'Ramón Rosero';
  const driverPhone = '+57 310 456 7890';
  const vehicleModel = 'Kia Sonet (Sedán / SUV)';
  const licensePlate = 'NLX666';

  return (
    <section data-testid="patient-flight-section" className="space-y-6">
      {/* 1. Header Card with Welcome Kit CTA */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Plane className="w-4 h-4 text-sky-600" />
            <span>Vuelo Internacional & Traslado de Llegada</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Información de su arribo al Aeropuerto JMC Rionegro y chofer asignado para su traslado
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOrientationKitOpen(true)}
          data-testid="btn-open-patient-orientation-kit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer min-h-[42px]"
        >
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Ver Kit de Bienvenida y Orientación</span>
        </button>
      </div>

      {/* 2. Grid Cards: Flight Tracking & Driver Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Flight Tracking Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Rastreo de Vuelo
                </h3>
                <p className="text-[11px] text-zinc-500">{airline}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Confirmado
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">Número de Vuelo</span>
              <span className="text-sm font-bold text-zinc-950 font-mono tabular-nums tracking-wide">
                {flightNumber}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium block">Fecha y Hora Estimada de Aterrizaje</span>
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-zinc-900">{arrivalFormatted.date}</span>
                <span className="font-mono font-bold text-sky-900 tabular-nums">
                  {arrivalFormatted.timeCOT} COT
                </span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium block">Aeropuerto de Llegada</span>
              <p className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Aeropuerto Internacional José María Córdova (MDE / SKRG)</span>
              </p>
              <p className="text-[11px] text-zinc-500 pl-5">
                Rionegro, Antioquia • Puerta de Salida Internacional
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Driver Card (Ramón Rosero) */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Conductor Asignado
                </h3>
                <p className="text-[11px] text-zinc-500">Transporte Especial de Salud</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full text-[10px] font-mono font-semibold">
              Flota Oficial MT
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Driver Identity */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-500 font-medium block">Nombre del Conductor</span>
                <span className="text-sm font-bold text-zinc-950">{driverName}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                RR
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-zinc-500 font-medium block">Vehículo</span>
                <span className="font-semibold text-zinc-900">{vehicleModel}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-500 font-medium block">Placa Oficial</span>
                <span className="font-mono font-bold text-zinc-950 tabular-nums bg-white px-2 py-0.5 rounded border border-zinc-200">
                  {licensePlate}
                </span>
              </div>
            </div>

            {/* Reception Instruction */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 text-emerald-950 text-[11px] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Su conductor lo estará esperando a la salida internacional con una paleta identificativa de <strong>Medical Trip Colombia</strong> con su nombre.
              </span>
            </div>

            {/* Direct Contact Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://wa.me/573104567890?text=${encodeURIComponent(
                  `Hola Ramón, soy ${activeBooking?.firstName || 'el paciente'}. Ya me encuentro en el aeropuerto.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="btn-driver-whatsapp"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer min-h-[40px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Chofer</span>
              </a>

              <a
                href={`tel:${driverPhone.replace(/\s+/g, '')}`}
                data-testid="btn-driver-phone"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-200/70 transition-all cursor-pointer min-h-[40px]"
              >
                <Phone className="w-3.5 h-3.5 text-zinc-600" />
                <span className="font-mono tabular-nums">{driverPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Orientation Modal */}
      <PatientOrientationModal
        isOpen={isOrientationKitOpen}
        onClose={() => setIsOrientationKitOpen(false)}
        driverName={driverName}
        driverPhone={driverPhone}
      />
    </section>
  );
};
