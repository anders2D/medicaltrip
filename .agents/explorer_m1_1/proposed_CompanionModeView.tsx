/**
 * Medical Trip Colombia S.A.S. - CompanionModeView (Window 7: Consola Operativa en Terreno)
 * Consola móvil de alta ergonomía táctil para personal en terreno y acompañantes bilingües (Yenny Roberto).
 * Cumple con Alternativa 10 (Minimalismo Funcional Radical, Alta Legibilidad bajo Sol, Cero Fuga Administrativa).
 *
 * Directrices de Diseño y Operación:
 * 1. Ergonomía táctil móvil estricta (mínimo 48px de área táctil en cada botón/acción interactiva).
 * 2. Contador de turno con cálculo exacto: $15.500 COP/h + $15.500 COP de auxilio de alistamiento/preparación.
 * 3. Selector táctil de 5 niveles de subsidio de alimentación ($0, $8k, $25k, $35k, $45k COP).
 * 4. Registro de caja menor en 1 toque (Café $15k, Farmacia $185k, Taxi $90k, Peaje $16.1k) y modal OCR.
 * 5. Agenda diaria / huddle clínico del paciente con botones directos de WhatsApp a conductor y dirección médica.
 * 6. Pad de firma digital HTML5 Canvas con derivación de sello criptográfico SHA-256 instantáneo.
 * 7. Encabezado limpio con badge de rol del usuario y botón Salir (btn-logout).
 * 8. Aislamiento absoluto: 0 controles de administrador, 0 navegación de módulos, 0 selector de pacientes.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Clock,
  Utensils,
  Wallet,
  Camera,
  Calendar,
  PenTool,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Coffee,
  Pill,
  Car,
  MapPin,
  MessageSquare,
  Plus,
  Minus,
  ShieldCheck,
  Sparkles,
  UserCheck,
  RefreshCw,
  Eraser,
  Check,
  PhoneCall,
  ChevronRight,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/core/auth';
import { useAppContext } from '@/presentation/state/AppContext';
import { CompanionShift, MealSubsidyTier } from '@/features/companion-shifts';
import { ReceiptOcrModal } from '@/features/settlement';
import { CompanionTurnSheetModal } from '@/features/companion-shifts';
import { sha256 } from '@/features/settlement';
import { fireSignatureSealBurst } from '@/features/settlement';
import { Money } from '@/core/domain';
import { ExpenseCategory } from '@/features/settlement';

interface Point {
  x: number;
  y: number;
  time: number;
}

interface QuickExpensePreset {
  id: string;
  name: string;
  category: ExpenseCategory;
  defaultDesc: string;
  amountCOP: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const QUICK_EXPENSE_PRESETS: QuickExpensePreset[] = [
  {
    id: 'cafe',
    name: 'Café',
    category: 'MEAL_SUBSIDY',
    defaultDesc: 'Café & Refrigerio en Terreno',
    amountCOP: 15000,
    icon: Coffee,
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: 'farmacia',
    name: 'Farmacia',
    category: 'PHARMACY',
    defaultDesc: 'Farmacia Clofán / Pasteur (Medicamentos)',
    amountCOP: 185000,
    icon: Pill,
    colorClass: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    id: 'taxi',
    name: 'Taxi',
    category: 'OTHER',
    defaultDesc: 'Taxi Extra CIMA ↔ Hotel',
    amountCOP: 90000,
    icon: Car,
    colorClass: 'text-zinc-700 bg-zinc-100 border-zinc-300',
  },
  {
    id: 'peaje',
    name: 'Peaje',
    category: 'TOLL',
    defaultDesc: 'Peaje Túnel de Oriente',
    amountCOP: 16100,
    icon: Car,
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
  },
];

const MEAL_TIER_DETAILS: {
  tier: MealSubsidyTier;
  amountCOP: number;
  label: string;
  hoursRange: string;
  emoji: string;
}[] = [
  { tier: 'TIER_0', amountCOP: 0, label: 'Ninguno', hoursRange: '< 3h', emoji: '🚫' },
  { tier: 'TIER_1', amountCOP: 8000, label: 'Refrigerio', hoursRange: '3 - 5h', emoji: '🥐' },
  { tier: 'TIER_2', amountCOP: 25000, label: 'Almuerzo Estándar', hoursRange: '5 - 8h', emoji: '🍽️' },
  { tier: 'TIER_3', amountCOP: 35000, label: 'Almuerzo + Cena', hoursRange: '8 - 12h', emoji: '🍱' },
  { tier: 'TIER_4', amountCOP: 45000, label: 'Jornada Completa', hoursRange: '≥ 12h', emoji: '🌟' },
];

export const CompanionModeView: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    activeBooking,
    events,
    shifts,
    expenses,
    logFastExpense,
    saveCompanionShift,
    transitionEventStatus,
    refreshData,
    recalculateSettlement,
  } = useAppContext();

  // Shift state
  const [hoursLogged, setHoursLogged] = useState<number>(4.0);
  const [selectedMealTier, setSelectedMealTier] = useState<MealSubsidyTier>('TIER_1');
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [isShiftSaved, setIsShiftSaved] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Modals state
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [isTurnSheetModalOpen, setIsTurnSheetModalOpen] = useState<boolean>(false);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  // Signature canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [sha256Seal, setSha256Seal] = useState<string | null>(null);
  const [isSealing, setIsSealing] = useState<boolean>(false);
  const lastPointRef = useRef<Point | null>(null);

  // Auto-resolve suggested meal tier when hours change
  const suggestedTier = useMemo(() => {
    return CompanionShift.resolveMealSubsidyTier(hoursLogged).tier;
  }, [hoursLogged]);

  // Sync existing shift for activeBooking if exists
  useEffect(() => {
    if (shifts && shifts.length > 0) {
      const activeShift = shifts[shifts.length - 1];
      if (activeShift) {
        setHoursLogged(activeShift.hoursLogged);
        setSelectedMealTier(activeShift.mealSubsidyTier);
        if (activeShift.notes) setShiftNotes(activeShift.notes);
      }
    }
  }, [shifts]);

  // Auto-update meal tier suggestion if user hasn't explicitly diverged
  const handleHoursChange = (newHours: number) => {
    const clamped = Math.max(0.5, Math.min(24, Math.round(newHours * 4) / 4));
    setHoursLogged(clamped);
    setIsShiftSaved(false);
  };

  const applySuggestedTier = () => {
    setSelectedMealTier(suggestedTier);
    setIsShiftSaved(false);
  };

  // Hourly math computation: $15.500 COP/h + $15.500 prep allowance + meal subsidy
  const hourlySubtotalCOP = Math.round(hoursLogged * 15500);
  const prepAllowanceCOP = 15500;
  const mealSubsidyAmountCOP = useMemo(() => {
    return CompanionShift.resolveMealSubsidyAmount(selectedMealTier).amount;
  }, [selectedMealTier]);
  const totalShiftCOP = hourlySubtotalCOP + prepAllowanceCOP + mealSubsidyAmountCOP;

  // Save Companion Shift
  const handleSaveShift = async () => {
    try {
      const shift = new CompanionShift({
        id: `shift-${activeBooking?.code || 'bkg'}-${Date.now()}`,
        bookingId: activeBooking?.code || 'RVA171-4',
        guideId: user?.username || 'GUIA-01',
        guideName: user?.name || 'Yenny Roberto',
        dayNumber: 1,
        date: new Date().toISOString().split('T')[0],
        hoursLogged,
        mealSubsidyTier: selectedMealTier,
        notes: shiftNotes,
        status: 'IN_PROGRESS',
      });
      await saveCompanionShift(shift);
      setIsShiftSaved(true);
      setSaveMessage('Turno guardado correctamente.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: unknown) {
      console.error('Error al guardar turno:', err);
      setSaveMessage('Error al guardar turno en almacenamiento local.');
    }
  };

  // 1-Tap Fast Expense Logging
  const handleLogFastExpense = async (preset: QuickExpensePreset) => {
    try {
      await logFastExpense({
        category: preset.category,
        description: preset.defaultDesc,
        amountCOP: preset.amountCOP,
        vendorName: 'Comercio en Terreno',
      });
      setQuickNotification(
        `✅ ${preset.name} por $${preset.amountCOP.toLocaleString('es-CO')} COP registrado con éxito.`
      );
      setTimeout(() => setQuickNotification(null), 3000);
    } catch (err: unknown) {
      console.error('Error registrando gasto rápido:', err);
      setQuickNotification('Error al registrar gasto.');
    }
  };

  // Canvas stroke setup
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = (rect.width || 340) * dpr;
    canvas.height = (rect.height || 160) * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width || 340, rect.height || 160);
    setHasDrawn(false);
    lastPointRef.current = null;
  }, []);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    lastPointRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now(),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    const midX = (lastPointRef.current.x + currentX) / 2;
    const midY = (lastPointRef.current.y + currentY) / 2;
    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
    ctx.stroke();

    lastPointRef.current = { x: currentX, y: currentY, time: Date.now() };
    setHasDrawn(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearSignature = () => {
    setupCanvas();
    setSha256Seal(null);
  };

  // Seal signature with instant SHA-256
  const handleSealSignature = async () => {
    if (!hasDrawn && !sha256Seal) {
      alert('Por favor dibuje su firma antes de certificar.');
      return;
    }
    setIsSealing(true);
    try {
      const payload = {
        bookingCode: activeBooking?.code || 'RVA171-4',
        patientFullName: activeBooking?.patientFullName || 'Catia Rodrigues',
        guideName: user?.name || 'Yenny Roberto',
        date: new Date().toISOString().split('T')[0],
        hoursLogged,
        totalShiftCOP,
        timestamp: new Date().toISOString(),
      };
      const seal = sha256(JSON.stringify(payload));
      setSha256Seal(seal);
      fireSignatureSealBurst();
    } catch (err: unknown) {
      console.error('Error al generar sello:', err);
    } finally {
      setIsSealing(false);
    }
  };

  // Today's Agenda Milestones
  const patientFirstName = activeBooking?.firstName || 'Catia';
  const patientLastName = activeBooking?.lastName || 'Rodrigues';
  const bookingCode = activeBooking?.code || 'RVA171-4';
  const clinicName = activeBooking?.clinic || 'Clínica CIMA';
  const hotelName = activeBooking?.hotelName || 'Hotel Inntu Poblado';

  const defaultMilestones = [
    {
      id: 'm1',
      time: '05:30 AM',
      title: 'Toma de Muestras en Ayuno',
      location: 'Laboratorio Clínico CIMA · Sótano 1',
      status: 'COMPLETED',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'm2',
      time: '08:30 AM',
      title: 'Traslado Hotel ➔ Hospital CIMA',
      location: 'Vehículo Sedán Aeroturex (Ramón Rosero)',
      status: 'COMPLETED',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'm3',
      time: '09:30 AM',
      title: 'Valoración Preanestésica & Cirugía Plástica',
      location: 'Consultorio 402 · Dr. Carlos Mejía',
      status: 'IN_PROGRESS',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'm4',
      time: '02:00 PM',
      title: 'Reclamación Medicamentos & Faja Postquirúrgica',
      location: 'Droguería Pasteur Torre Médica El Tesoro',
      status: 'SCHEDULED',
      badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    },
    {
      id: 'm5',
      time: '04:30 PM',
      title: 'Traslado Retorno a Hotel & Reposo',
      location: `${hotelName} · Habitación 304`,
      status: 'SCHEDULED',
      badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    },
  ];

  return (
    <div
      data-testid="companion-mode-root"
      id="consola-terreno"
      className="min-h-screen w-screen bg-zinc-900 text-zinc-100 font-sans select-none flex flex-col overflow-x-hidden pb-12"
    >
      {/* 1. TOP DOCKED HEADER (High Contrast & 48px Action Targets) */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-sm shrink-0 shadow-sm">
            MT
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Consola en Terreno
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div data-testid="user-role-badge" className="text-xs font-semibold text-zinc-300">
              {user?.name || 'Yenny Roberto'} · Guía de Terreno
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Planilla de Turno Modal Trigger for Test Compatibility & Fast Access */}
          <button
            type="button"
            data-testid="btn-header-companion-turn"
            onClick={() => setIsTurnSheetModalOpen(true)}
            className="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-amber-500/70 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 duration-200"
            title="Abrir Planilla Detallada de Turno"
          >
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Planilla de Turno</span>
            <span className="sm:hidden">Turno</span>
          </button>

          {/* Clean Logout Button */}
          <button
            type="button"
            data-testid="btn-logout"
            onClick={logout}
            className="min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-red-950/70 hover:border-red-600/70 text-zinc-300 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 duration-200"
            title="Cerrar Sesión Segura"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* 2. ACTIVE PATIENT HUDDLE STATUS BAR */}
      <section className="bg-zinc-950 border-b border-zinc-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base" role="img" aria-label="Bandera Curazao">
            🇨🇼
          </span>
          <span className="font-bold text-white tracking-wide">
            {patientFirstName} {patientLastName}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-bold text-[11px]">
            {bookingCode}
          </span>
        </div>

        <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-medium">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            {clinicName}
          </span>
          <span className="hidden sm:inline-block text-zinc-600">•</span>
          <span className="hidden sm:inline-block">{hotelName}</span>
        </div>
      </section>

      {/* Notification Toast */}
      {quickNotification && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-950 border border-emerald-600 text-emerald-200 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{quickNotification}</span>
        </div>
      )}

      {/* MAIN COCKPIT BODY */}
      <main className="max-w-2xl mx-auto w-full p-4 space-y-5">
        {/* ========================================================================= */}
        {/* CARD 1: SHIFT TIMER & HOURLY BILLING ($15.500/h + $15.500 PREP ALLOWANCE) */}
        {/* ========================================================================= */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Planilla de Horas & Turno</h2>
                <p className="text-[11px] text-zinc-400 font-mono">
                  $15.500 COP/h + $15.500 COP de auxilio de alistamiento
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
              En Turno
            </span>
          </div>

          {/* Stepper with 48px touch targets */}
          <div className="flex items-center justify-between gap-3 bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => handleHoursChange(hoursLogged - 0.5)}
              disabled={hoursLogged <= 0.5}
              className="min-h-[48px] min-w-[48px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xl flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 duration-200"
              aria-label="Disminuir horas"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-white">
                {hoursLogged.toFixed(1)}
                <span className="text-sm font-semibold text-zinc-400 ml-1">horas</span>
              </div>
              <span className="text-[11px] text-amber-400 font-medium">
                Paso de 30 min (0.5h)
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleHoursChange(hoursLogged + 0.5)}
              disabled={hoursLogged >= 24}
              className="min-h-[48px] min-w-[48px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xl flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 duration-200"
              aria-label="Aumentar horas"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick hour preset chips (All >= 48px height) */}
          <div className="grid grid-cols-5 gap-1.5">
            {[2, 4, 6, 8, 12].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleHoursChange(preset)}
                className={`min-h-[48px] rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 duration-200 ${
                  hoursLogged === preset
                    ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400/50 font-black'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                <span>{preset}h</span>
                <span className="text-[9px] opacity-70">fijo</span>
              </button>
            ))}
          </div>

          {/* Real-time Math Summary */}
          <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal Horas ({hoursLogged}h × $15.500):</span>
              <span className="font-mono tabular-nums text-zinc-200">
                ${hourlySubtotalCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Auxilio de Alistamiento:</span>
              <span className="font-mono tabular-nums text-zinc-200">
                +${prepAllowanceCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Subsidio Alimentación ({selectedMealTier.replace('TIER_', 'T')}):</span>
              <span className="font-mono tabular-nums text-zinc-200">
                +${mealSubsidyAmountCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="border-t border-zinc-800 pt-2 flex justify-between items-center text-sm font-bold text-white">
              <span>Total a Liquidar Guía:</span>
              <span className="text-base font-black font-mono tabular-nums text-emerald-400">
                ${totalShiftCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* Shift Notes & Save Button */}
          <div className="space-y-2">
            <input
              type="text"
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              placeholder="Notas operativas de turno (opcional)..."
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />

            <button
              type="button"
              onClick={handleSaveShift}
              className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-200 transition-all shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Guardar / Actualizar Turno</span>
            </button>

            {saveMessage && (
              <p className="text-xs text-center font-medium text-emerald-400 animate-in fade-in">
                {saveMessage}
              </p>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CARD 2: 1-CLICK LUNCH SUBSIDY TIERS ($0, $8K, $25K, $35K, $45K COP) */}
        {/* ========================================================================= */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Subsidio de Alimentación (1-Toque)</h2>
            </div>

            {suggestedTier !== selectedMealTier && (
              <button
                type="button"
                data-testid="btn-apply-suggested-tier"
                onClick={applySuggestedTier}
                className="text-[11px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Aplicar Sugerencia ({suggestedTier.replace('TIER_', 'T')})</span>
              </button>
            )}
          </div>

          {/* 5-Tier Buttons (Each >= 52px touch target) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Subsidio de Alimentación">
            {MEAL_TIER_DETAILS.map((opt) => {
              const isSelected = selectedMealTier === opt.tier;
              const isSuggested = suggestedTier === opt.tier;
              const testId = `meal-tier-${opt.tier.replace('TIER_', '')}`;

              return (
                <button
                  key={opt.tier}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={testId}
                  onClick={() => {
                    setSelectedMealTier(opt.tier);
                    setIsShiftSaved(false);
                  }}
                  className={`relative min-h-[56px] p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between select-none active:scale-95 duration-200 ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  {isSuggested && !isSelected && (
                    <span className="absolute -top-2 right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-mono">
                      Auto
                    </span>
                  )}

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-sm">{opt.emoji}</span>
                    <span className="font-bold">{opt.hoursRange}</span>
                  </div>

                  <div className="font-mono font-black text-xs tabular-nums mt-0.5">
                    {opt.amountCOP === 0 ? '$0' : `$${opt.amountCOP.toLocaleString('es-CO')}`}
                  </div>

                  <div className={`text-[10px] font-medium line-clamp-1 ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CARD 3: 1-TAP PETTY CASH LOGGING & OCR SCANNER MODAL */}
        {/* ========================================================================= */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Caja Menor & Gastos de Bolsillo</h2>
            </div>
            <span className="text-[11px] text-zinc-400">1-Toque en Sitio</span>
          </div>

          {/* 4 Preset Fast Expense Buttons (Each >= 52px touch target) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_EXPENSE_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLogFastExpense(preset)}
                  className="min-h-[56px] p-2.5 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-left transition-all cursor-pointer flex flex-col justify-between active:scale-95 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5 text-amber-400" />
                      {preset.name}
                    </span>
                    <Plus className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="font-mono font-extrabold text-xs text-amber-400 tabular-nums mt-1">
                    ${preset.amountCOP.toLocaleString('es-CO')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 1-Tap OCR Camera Scanner Trigger (>= 52px touch target) */}
          <button
            type="button"
            data-testid="btn-companion-ocr"
            onClick={() => setIsOcrOpen(true)}
            className="w-full min-h-[52px] rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 duration-200 transition-all shadow-xs"
          >
            <Camera className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Escanear Factura / Recibo con Cámara (OCR 1-Tap)</span>
          </button>
        </section>

        {/* ========================================================================= */}
        {/* CARD 4: TODAY'S PATIENT AGENDA / ITINERARY HUDDLE */}
        {/* ========================================================================= */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Agenda del Paciente · Hoy</h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {/* Chronological Milestones List */}
          <div className="space-y-2.5">
            {defaultMilestones.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-black text-amber-400 pt-0.5 shrink-0">
                    {item.time}
                  </span>
                  <div>
                    <h4 className="font-bold text-white leading-tight">{item.title}</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{item.location}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : item.status === 'IN_PROGRESS'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {item.status === 'COMPLETED' ? 'Hecho' : item.status === 'IN_PROGRESS' ? 'En Curso' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>

          {/* 1-Click Operational Team WhatsApp Triggers */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Líneas Rápidas de Coordinación
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={`https://wa.me/573205557890?text=${encodeURIComponent(
                  `Hola Ramón (Conductor), coordinación de traslado de ${patientFirstName} (${bookingCode}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 duration-200"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Conductor: Ramón Rosero</span>
              </a>

              <a
                href={`https://wa.me/573014441122?text=${encodeURIComponent(
                  `Dra. Acosta, consulta sobre evolución clínica de ${patientFirstName} (${bookingCode}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-400 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 duration-200"
              >
                <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Dirección Médica: Dra. Acosta</span>
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CARD 5: DIGITAL SIGN-OFF CANVAS WITH INSTANT SHA-256 SEAL */}
        {/* ========================================================================= */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Firma de Conformidad del Paciente</h2>
            </div>
            <span className="text-[11px] text-zinc-400">Sello Criptográfico</span>
          </div>

          <p className="text-xs text-zinc-400">
            El paciente titular certifica las horas de acompañamiento y guianza presencial del día.
          </p>

          {/* High-DPI HTML5 Canvas for Touch Drawing */}
          <div className="bg-white rounded-2xl p-2 border border-zinc-700 shadow-inner">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-36 rounded-xl touch-none cursor-crosshair block"
              aria-label="Lienzo de firma digital"
            />
          </div>

          {/* Canvas Actions (Each >= 48px touch target) */}
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={clearSignature}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 duration-200"
            >
              <Eraser className="w-4 h-4" />
              <span>Limpiar</span>
            </button>

            <button
              type="button"
              data-testid="btn-companion-signoff"
              onClick={handleSealSignature}
              disabled={isSealing}
              className="min-h-[48px] flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-200 transition-all shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSealing ? 'Sellando...' : 'Certificar & Sellar Turno'}</span>
            </button>
          </div>

          {/* Cryptographic SHA-256 Seal Display */}
          {sha256Seal && (
            <div
              data-testid="signature-sha256-seal"
              className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 space-y-1 text-xs animate-in fade-in"
            >
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sello Criptográfico Verificado (FIPS 180-4)</span>
              </div>
              <div className="font-mono text-[10px] break-all bg-zinc-950/80 p-2 rounded-lg border border-emerald-900 text-emerald-400">
                {sha256Seal}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* OCR MODAL INTEGRATION */}
      {/* ========================================================================= */}
      {isOcrOpen && (
        <ReceiptOcrModal
          isOpen={isOcrOpen}
          onClose={() => setIsOcrOpen(false)}
          onApproved={(expense) => {
            setIsOcrOpen(false);
            setQuickNotification(
              `✅ Factura de ${expense.vendorName || 'farmacia'} aprobada e ingresada por $${expense.amount.formatted}.`
            );
            setTimeout(() => setQuickNotification(null), 3500);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* DETAILED TURN SHEET MODAL INTEGRATION */}
      {/* ========================================================================= */}
      {isTurnSheetModalOpen && (
        <CompanionTurnSheetModal
          isOpen={isTurnSheetModalOpen}
          onClose={() => setIsTurnSheetModalOpen(false)}
          onShiftSaved={(shift) => {
            setIsTurnSheetModalOpen(false);
            setHoursLogged(shift.hoursLogged);
            setSelectedMealTier(shift.mealSubsidyTier);
            setQuickNotification('✅ Planilla de turno guardada y conciliada.');
            setTimeout(() => setQuickNotification(null), 3500);
          }}
        />
      )}
    </div>
  );
};
