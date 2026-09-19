/**
 * Medical Trip Colombia S.A.S. - Autonomous Patient X Creator Script
 * Standalone CLI & programmatic tool to create, configure, and persist any individual
 * patient case directly into Supabase Cloud REST API with deterministic BigInt math.
 */

import { createClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '@/core/infrastructure/storage/SupabaseStorageAdapter';
import { CreatePatientBookingUseCase } from '@/features/onboarding/application/CreatePatientBookingUseCase';
import { GenerateSmartItineraryUseCase } from '@/features/itinerary/application/GenerateSmartItineraryUseCase';
import { ReconcileSettlementUseCase } from '@/features/settlement/application/ReconcileSettlementUseCase';
import { SupabasePatientInvitationAdapter } from '@/features/onboarding/infrastructure/SupabasePatientInvitationAdapter';
import { Money } from '@/core/domain/value-objects/Money';
import { ReceiptExpense } from '@/features/settlement/domain/ReceiptExpense';
import { CashAdvance } from '@/features/settlement/domain/SettlementLedger';

export interface PatientCreationOptions {
  code?: string;
  firstName: string;
  lastName: string;
  country?: string;
  language?: string;
  phone?: string;
  email?: string;
  arrivalDate: string; // ISO-8601 UTC string
  departureDate: string; // ISO-8601 UTC string
  airline?: string;
  flightNumber?: string;
  hotelName?: string;
  hotelNightlyRateCOP?: number;
  hotelNights?: number;
  specialtyPreset?: 'OPHTHALMOLOGY_3D' | 'CARDIOLOGY_5D' | 'PLASTIC_SURGERY_12D' | 'UROLOGY_4D' | string;
  companionNames?: string[];
  advancesCOP?: { description: string; amountCOP: number; date?: string }[];
  initialExpensesCOP?: { category: string; description: string; amountCOP: number }[];
  notes?: string;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

export async function createPatientX(options: PatientCreationOptions) {
  console.log(`\n======================================================`);
  console.log(`🏥 Medical Trip Colombia S.A.S. — Creando Paciente X`);
  console.log(`======================================================`);
  console.log(`Conectando directamente a Supabase Cloud (${SUPABASE_URL})...\n`);

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const storage = new SupabaseStorageAdapter({ client });
  const invitationRepo = new SupabasePatientInvitationAdapter(client);

  const companions = options.companionNames || [];
  const paxCount = 1 + companions.length;
  const hotelName = options.hotelName || 'HOTEL 1616 Poblado';
  const specialty = options.specialtyPreset || 'OPHTHALMOLOGY_3D';

  // 1. Crear Reserva Base (Booking)
  console.log(`[1/5] Registrando Reserva de Paciente: ${options.firstName} ${options.lastName} (${paxCount} Pax)...`);
  const createBookingUseCase = new CreatePatientBookingUseCase(storage);
  const bookingResult = await createBookingUseCase.execute({
    code: options.code,
    firstName: options.firstName,
    lastName: options.lastName,
    patientName: `${options.firstName} ${options.lastName}`,
    country: options.country || 'Curazao',
    language: options.language || 'Papiamento / Español',
    phone: options.phone || '+599 9 512 0000',
    email: options.email || `${options.firstName.toLowerCase()}.${options.lastName.toLowerCase()}@medicaltrip.test`,
    paxCount,
    companionNames: companions,
    arrivalDate: options.arrivalDate,
    departureDate: options.departureDate,
    arrivalAirline: options.airline || 'Arajet',
    arrivalFlight: options.flightNumber || 'Arajet S8242C',
    hotel: hotelName,
    hotelName: hotelName,
    notes: options.notes || `Paciente creado mediante Skill patient-creator. Especialidad: ${specialty}.`,
  });

  const booking = bookingResult.booking || bookingResult;
  console.log(`      ✅ Booking Creado: Código ${booking.code} | ID: ${booking.id}`);

  // 2. Generar Itinerario Clínico & Traslados
  console.log(`[2/5] Generando Itinerario Clínico (${specialty}) y Logística de Flota...`);
  const itineraryUseCase = new GenerateSmartItineraryUseCase(storage);
  const itineraryResult = await itineraryUseCase.execute({
    bookingId: booking.code,
    presetType: specialty,
    baseDate: new Date(options.arrivalDate),
  });
  console.log(`      ✅ Itinerario Generado: ${itineraryResult.events.length} Eventos | ${itineraryResult.shifts.length} Turnos de Acompañante | ${itineraryResult.transfers.length} Traslados`);

  // 3. Registrar Gastos Adicionales si se especificaron
  if (options.initialExpensesCOP && options.initialExpensesCOP.length > 0) {
    console.log(`[3/5] Registrando ${options.initialExpensesCOP.length} comprobantes de caja menor iniciales...`);
    for (let i = 0; i < options.initialExpensesCOP.length; i++) {
      const exp = options.initialExpensesCOP[i];
      const expense = new ReceiptExpense({
        id: `exp-${booking.code.toLowerCase()}-custom-${i + 1}`,
        bookingId: booking.code,
        category: (exp.category as any) || 'OTHER',
        description: exp.description,
        amount: Money.fromAmount(exp.amountCOP, 'COP'),
        date: options.arrivalDate,
        audited: true,
        status: 'APPROVED',
      });
      await storage.saveExpense(expense);
      console.log(`      -> Gasto registrado: ${exp.description} ($${exp.amountCOP.toLocaleString('es-CO')} COP)`);
    }
  } else {
    console.log(`[3/5] Sin gastos iniciales adicionales.`);
  }

  // 4. Liquidar y Balancear Ledger Contable
  console.log(`[4/5] Conciliando Liquidación Financiera Determinista (BigInt cents)...`);
  let advances: CashAdvance[] = [];
  if (options.advancesCOP && options.advancesCOP.length > 0) {
    advances = options.advancesCOP.map((adv, idx) => ({
      id: `adv-${booking.code.toLowerCase()}-${idx + 1}`,
      date: adv.date || options.arrivalDate,
      amount: Money.fromAmount(adv.amountCOP, 'COP'),
      description: adv.description,
    }));
  }

  const reconcileUseCase = new ReconcileSettlementUseCase(storage);
  const ledger = await reconcileUseCase.execute({
    bookingId: booking.code,
    additionalAdvances: advances,
  });
  console.log(`      ✅ Saldo Neto Conciliado: ${ledger.netBalance.format()} (Anticipos: ${ledger.totalAdvances.format()})`);

  // 5. Generar Enlace y Token de Invitación de Autogestión WhatsApp
  console.log(`[5/5] Generando Token de Autogestión e Invitación WhatsApp...`);
  const token = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const whatsappUrl = `https://wa.me/${(booking.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `¡Hola ${booking.firstName}! Te damos la bienvenida a Medical Trip Colombia. Tu código de reserva es ${booking.code}. Accede a tu portal: https://directed-linda-around-rapidly.trycloudflare.com?token=${token}`
  )}`;

  console.log(`\n======================================================`);
  console.log(`🎉 Paciente X Creado Exitosamente en Supabase Cloud`);
  console.log(`======================================================`);
  console.log(`📋 Código de Reserva:   ${booking.code}`);
  console.log(`👤 Paciente Titular:    ${booking.firstName} ${booking.lastName}`);
  console.log(`🌍 País de Origen:      ${booking.country} (${booking.language})`);
  console.log(`✈️ Vuelo de Llegada:    ${booking.arrivalAirline} ${booking.arrivalFlight} (${booking.arrivalDate.substring(0, 10)})`);
  console.log(`🏨 Hospedaje Asignado:  ${booking.hotelName}`);
  console.log(`🩺 Especialidad Médica: ${specialty}`);
  console.log(`💰 Balance Neto:        ${ledger.netBalance.format()}`);
  console.log(`🔗 Token Autogestión:   ${token}`);
  console.log(`📲 Enlace WhatsApp:     ${whatsappUrl}`);
  console.log(`======================================================\n`);

  return {
    booking,
    itineraryResult,
    ledger,
    token,
    whatsappUrl,
  };
}

// CLI Execution Support
async function main() {
  const args = process.argv.slice(2);
  let patientData: PatientCreationOptions;

  if (args.length > 0 && args[0].endsWith('.json')) {
    const fs = await import('fs');
    const path = await import('path');
    const fileContent = fs.readFileSync(path.resolve(args[0]), 'utf-8');
    patientData = JSON.parse(fileContent);
  } else {
    // Default Demo Patient X (Curazao / Oftalmología)
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + 5);
    const departure = new Date();
    departure.setDate(departure.getDate() + 15);

    patientData = {
      firstName: 'Marvin',
      lastName: 'Evertsz',
      country: 'Curazao',
      language: 'Papiamento / Holandés',
      phone: '+599 9 521 8844',
      email: 'marvin.evertsz@patient.medicaltrip.test',
      arrivalDate: arrival.toISOString(),
      departureDate: departure.toISOString(),
      airline: 'Arajet',
      flightNumber: 'DM-101 / S8242C',
      hotelName: 'HOTEL 1616 Poblado',
      specialtyPreset: 'OPHTHALMOLOGY_3D',
      companionNames: ['Glenda Evertsz'],
      advancesCOP: [
        { description: 'Abono Depósito Garantía Bancolombia', amountCOP: 1500000 },
      ],
      initialExpensesCOP: [
        { category: 'SIM_CARD', description: '2 SIM Cards Físicas Claro', amountCOP: 30000 },
        { category: 'OTHER', description: 'Póliza Asistencia Médica Colasistencia', amountCOP: 120000 },
      ],
      notes: 'Evaluación oftalmológica para cirugía refractiva y lentes intraoculares en Glaucornea (Dr. Lukas Saldarriaga).',
    };
  }

  await createPatientX(patientData);
}

// Run CLI
main().catch((err) => {
  console.error('❌ Error creando paciente:', err);
  process.exit(1);
});
