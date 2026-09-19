/**
 * Medical Trip Colombia S.A.S. - PatientHotelSection
 * Sección de hospedaje y recuperación para el paciente internacional:
 * - Alojamiento asignado (Hotel Inntu Laureles / Edificio Park 42 / Novelty Suites)
 * - Dirección completa y enlace accesible a Google Maps
 * - Amenidades clínicas y de recuperación post-quirúrgica
 * - Contacto de recepción y asistencia en habitación
 * - CERO tarifas hoteleras o cifras financieras en el DOM
 */

import React from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { Building2, MapPin, ExternalLink, Phone, ShieldCheck, Wifi, Bed, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const PatientHotelSection: React.FC = () => {
  const { activeBooking } = useAppContext();

  // Resolve hotel metadata based on active booking
  const hotelName = activeBooking?.hotelName || 'Hotel Inntu Laureles';
  const isPark42 = hotelName.toLowerCase().includes('park 42') || hotelName.toLowerCase().includes('airbnb');
  const isNovelty = hotelName.toLowerCase().includes('novelty');

  const hotelDetails = isPark42
    ? {
        name: 'Edificio Residencial Park 42 Poblado',
        zone: 'El Poblado • Medellín',
        address: 'Cra 42 # 5 Sur-42, El Poblado, Medellín, Antioquia',
        mapsUrl: 'https://maps.google.com/?q=Cra+42+5+Sur+42+Medellin',
        phone: '+57 604 448 0042',
        roomType: 'Apartamento Suite Ejecutivo Post-Op',
      }
    : isNovelty
    ? {
        name: 'Hotel Novelty Suites Poblado',
        zone: 'El Poblado • Medellín',
        address: 'Calle 4 Sur # 43A-109, El Poblado, Medellín, Antioquia',
        mapsUrl: 'https://maps.google.com/?q=Hotel+Novelty+Suites+Medellin',
        phone: '+57 604 319 4000',
        roomType: 'Master Suite con Asistencia Médica',
      }
    : {
        name: 'Hotel Inntu Laureles',
        zone: 'Laureles - Estadio • Medellín',
        address: 'Transversal 39 # 74B-10, Laureles, Medellín, Antioquia',
        mapsUrl: 'https://maps.google.com/?q=Hotel+Inntu+Laureles+Medellin',
        phone: '+57 604 448 0042',
        roomType: 'Habitación Superior con Cama Articulada',
      };

  const amenities = [
    {
      icon: <Bed className="w-4 h-4 text-indigo-600" />,
      title: 'Ergonomía de Recuperación',
      desc: 'Camas articuladas y almohadas ortopédicas para reposo post-operatorio.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      title: 'Acceso para Movilidad Reducida',
      desc: 'Ascensores amplios, duchas al ras de piso con barras de seguridad y rampas.',
    },
    {
      icon: <HeartHandshake className="w-4 h-4 text-rose-600" />,
      title: 'Asistencia Médica Domiciliaria',
      desc: 'Acceso permitido a enfermería y toma de muestras de laboratorio en habitación.',
    },
    {
      icon: <Wifi className="w-4 h-4 text-sky-600" />,
      title: 'WiFi de Alta Velocidad (Fibra)',
      desc: 'Conectividad estable para videollamadas y teleconsultas médicas.',
    },
  ];

  return (
    <section data-testid="patient-hotel-section" className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Hospedaje & Centro de Recuperación</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Su alojamiento asignado en Medellín seleccionado bajo estándares de bienestar médico
          </p>
        </div>

        <a
          href={hotelDetails.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="btn-hotel-map-link"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer min-h-[42px]"
        >
          <MapPin className="w-4 h-4 text-rose-400" />
          <span>Ver Ubicación en Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </a>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
              {hotelDetails.zone}
            </span>
            <h3 className="text-base font-bold text-zinc-950 mt-1">
              {hotelDetails.name}
            </h3>
            <p className="text-xs text-zinc-600 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{hotelDetails.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${hotelDetails.phone.replace(/\s+/g, '')}`}
              data-testid="btn-hotel-phone"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-mono tabular-nums">{hotelDetails.phone}</span>
            </a>
          </div>
        </div>

        {/* Accommodation Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
            <span className="text-[11px] text-zinc-500 font-medium block">Tipo de Habitación</span>
            <p className="font-semibold text-zinc-900 mt-0.5">{hotelDetails.roomType}</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
            <span className="text-[11px] text-zinc-500 font-medium block">Recepción & Seguridad</span>
            <p className="font-semibold text-zinc-900 mt-0.5">24 Horas / Personal Bilingüe</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
            <span className="text-[11px] text-zinc-500 font-medium block">Estado de Reserva</span>
            <p className="font-semibold text-emerald-800 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Confirmada y Garantizada
            </p>
          </div>
        </div>

        {/* Recovery Amenities Grid */}
        <div>
          <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-3">
            Amenidades Diseñadas para su Recuperación Médica
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {amenities.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-50/60 border border-zinc-200/60 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                  {item.icon}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900">{item.title}</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
