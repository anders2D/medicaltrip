/**
 * Medical Trip Colombia S.A.S. - CompanionTurnSheetModal
 * Dedicated Daily Companion Turn Management & Financial Accounting Modal:
 * - Bilingual Guide selection (Yenny Roberto GUIA-01, Alejandro Restrepo GUIA-02, Diana Morales GUIA-03).
 * - Shift hours logged with 15-minute precision (0.25h steps) and automatic rate computation ($15.500 COP/h + $15.500 COP prep allowance).
 * - 1-Click Meal Subsidy Selector ($0, $8.000, $25.000, $35.000, $45.000 COP) with auto-tier suggestion.
 * - Petty Cash Received (Caja Menor Recibida en Terreno): editable fund received with 1-click presets.
 * - Daily Out-of-Pocket Expenses Logger: 1-click presets (Café, Farmacia, Almuerzo, Taxi, Parqueadero) and custom entries.
 * - Real-time BigInt integer cents exact calculation via Money VO for net companion payout.
 * - High-DPI Digital Signature Canvas for guide/patient sign-off with instant SHA-256 cryptographic seal derivation.
 * - Multi-lingual i18n support (ES, EN, NL, PAP).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  UserCheck,
  Clock,
  DollarSign,
  ShieldCheck,
  Eraser,
  PenTool,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Printer,
  Calendar,
  Wallet,
  Receipt,
  Trash2,
  Tag,
  Coins,
  Paperclip,
  Camera,
  FileCheck,
  Eye,
  X,
} from 'lucide-react';
import { Modal } from '@/core/ui/Modal';
import { Button } from '@/core/ui/Button';
import { MealSubsidySelector } from './MealSubsidySelector';
import { CompanionShift, MealSubsidyTier } from '../domain/CompanionShift';
import { ReceiptExpense, ExpenseCategory } from '../../../domain/entities/ReceiptExpense';
import { Money } from '@/core/domain';
import { sha256, calculateBlockHash } from '../../../infrastructure/security/Sha256LedgerChain';
import { FIELD_STAFF } from '../../../infrastructure/data/providers.data';
import { useAppContext } from '@/presentation/state/AppContext';
import { useLanguage } from '@/core/i18n';
import { fireSignatureSealBurst } from '@/features/settlement';

export interface CompanionTurnSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShift?: CompanionShift;
  onShiftSaved?: (shift: CompanionShift) => void;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

interface LocalDailyExpense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amountCOP: number;
  vendorName?: string;
  isNew?: boolean;
  receiptFileName?: string;
  receiptFileDataUrl?: string;
  receiptFileSize?: number;
}

export const CompanionTurnSheetModal: React.FC<CompanionTurnSheetModalProps> = ({
  isOpen,
  onClose,
  initialShift,
  onShiftSaved,
}) => {
  const { activeBooking, storagePort, refreshData, recalculateSettlement, expenses, deleteExpense } = useAppContext();
  const { t } = useLanguage();

  // Master Guides List
  const guideOptions = useMemo(() => {
    return Object.values(FIELD_STAFF)
      .filter((staff) => staff.role === 'GUIDE')
      .map((g) => ({
        value: g.id,
        label: `${g.name} (${g.id}) - [${g.languages.join(', ')}]`,
        name: g.name,
      }));
  }, []);

  // Form State
  const [guideId, setGuideId] = useState<string>(initialShift?.guideId || 'GUIA-01');
  const [shiftDate, setShiftDate] = useState<string>(
    initialShift?.date || activeBooking?.arrivalDate || new Date().toISOString().split('T')[0]
  );
  const [dayNumber, setDayNumber] = useState<number>(initialShift?.dayNumber || 1);
  const [hoursLogged, setHoursLogged] = useState<number>(initialShift?.hoursLogged ?? 4);
  const [mealTier, setMealTier] = useState<MealSubsidyTier>(
    initialShift?.mealSubsidyTier || CompanionShift.resolveMealSubsidyTier(initialShift?.hoursLogged ?? 4).tier
  );
  const [notes, setNotes] = useState<string>(initialShift?.notes || '');
  const [shiftStatus, setShiftStatus] = useState<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'>(
    initialShift?.status || 'COMPLETED'
  );

  // Petty Cash (Caja Menor) & Daily Expenses State
  const [pettyCashCOP, setPettyCashCOP] = useState<number>(200000);
  const [dailyExpenses, setDailyExpenses] = useState<LocalDailyExpense[]>([]);

  // Inline Custom Expense Entry State
  const [customCategory, setCustomCategory] = useState<ExpenseCategory>('PHARMACY');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customAmountCOP, setCustomAmountCOP] = useState<string>('');

  // Support / Receipt File Attachment State
  const [customReceiptFile, setCustomReceiptFile] = useState<{
    name: string;
    size: number;
    dataUrl: string;
    type: string;
  } | null>(null);

  const customFileInputRef = useRef<HTMLInputElement>(null);
  const customCameraInputRef = useRef<HTMLInputElement>(null);
  const attachToSpecificExpenseInputRef = useRef<HTMLInputElement>(null);
  const [targetExpenseIdForAttachment, setTargetExpenseIdForAttachment] = useState<string | null>(null);

  // Preview Modal for attached receipt
  const [previewReceipt, setPreviewReceipt] = useState<{
    fileName: string;
    dataUrl: string;
    description: string;
  } | null>(null);

  // Signature & Crypto State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [signerRole, setSignerRole] = useState<'PATIENT' | 'GUIDE' | 'COORDINATOR'>('GUIDE');
  const [signerName, setSignerName] = useState<string>('');
  const [sha256Seal, setSha256Seal] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Status feedback
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  // Selected guide name
  const selectedGuideName = useMemo(() => {
    const found = guideOptions.find((g) => g.value === guideId);
    return found ? found.name : FIELD_STAFF[guideId]?.name || 'Guía Bilingüe';
  }, [guideId, guideOptions]);

  // Set default signer name when guide changes or active booking loads
  useEffect(() => {
    if (signerRole === 'GUIDE') {
      setSignerName(selectedGuideName);
    } else if (signerRole === 'PATIENT' && activeBooking) {
      setSignerName(activeBooking.patientFullName);
    }
  }, [signerRole, selectedGuideName, activeBooking]);

  // Update form if initialShift prop changes
  useEffect(() => {
    if (initialShift) {
      setGuideId(initialShift.guideId);
      setShiftDate(initialShift.date);
      setDayNumber(initialShift.dayNumber);
      setHoursLogged(initialShift.hoursLogged);
      setMealTier(initialShift.mealSubsidyTier);
      setNotes(initialShift.notes);
      setShiftStatus(initialShift.status);
    }
  }, [initialShift]);

  // Initialize or synchronize existing expenses for this shiftDate from context
  useEffect(() => {
    if (!isOpen) return;
    const existing = (expenses || [])
      .filter((e) => (e.date || '').startsWith(shiftDate))
      .map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amountCOP: e.amount.toAmountNumber(),
        vendorName: e.vendorName,
        isNew: false,
      }));
    if (existing.length > 0) {
      setDailyExpenses(existing);
    }
  }, [shiftDate, expenses, isOpen]);

  // Automated Real-Time BigInt Money Calculations
  const hourlyRateMoney = CompanionShift.DEFAULT_HOURLY_RATE_COP;
  const prepAllowanceMoney = CompanionShift.DEFAULT_PREP_ALLOWANCE_COP;
  const mealSubsidyMoney = CompanionShift.resolveMealSubsidyAmount(mealTier);

  const hourlySubtotalMoney = useMemo(() => {
    return hourlyRateMoney.multiply(hoursLogged);
  }, [hourlyRateMoney, hoursLogged]);

  const totalShiftFeeMoney = useMemo(() => {
    return hourlySubtotalMoney.add(prepAllowanceMoney).add(mealSubsidyMoney);
  }, [hourlySubtotalMoney, prepAllowanceMoney, mealSubsidyMoney]);

  // Petty Cash & Expenses Calculations
  const totalDailyExpensesCOP = useMemo(() => {
    return dailyExpenses.reduce((sum, e) => sum + e.amountCOP, 0);
  }, [dailyExpenses]);

  const totalDailyExpensesMoney = useMemo(() => {
    return Money.fromAmount(totalDailyExpensesCOP, 'COP');
  }, [totalDailyExpensesCOP]);

  const pettyCashMoney = useMemo(() => {
    return Money.fromAmount(pettyCashCOP, 'COP');
  }, [pettyCashCOP]);

  // Petty cash balance remaining in companion's pocket
  // If positive: companion still holds cash from the advance
  // If negative: companion spent out-of-pocket more than the petty cash
  const pettyCashBalanceCOP = useMemo(() => {
    return pettyCashCOP - totalDailyExpensesCOP;
  }, [pettyCashCOP, totalDailyExpensesCOP]);

  // Net payout to settle with the companion today:
  // Net = Total Shift Fees - Remaining Petty Cash in hand (or + out-of-pocket excess)
  const companionNetPayoutCOP = useMemo(() => {
    return totalShiftFeeMoney.toAmountNumber() - pettyCashBalanceCOP;
  }, [totalShiftFeeMoney, pettyCashBalanceCOP]);

  const companionNetPayoutMoney = useMemo(() => {
    return Money.fromAmount(companionNetPayoutCOP, 'COP');
  }, [companionNetPayoutCOP]);

  // Step hours by +/- 0.25h (15 min) or +/- 1h
  const adjustHours = (delta: number) => {
    setHoursLogged((prev) => {
      const next = Math.max(0, Math.round((prev + delta) * 100) / 100);
      const autoTier = CompanionShift.resolveMealSubsidyTier(next).tier;
      setMealTier(autoTier);
      return next;
    });
  };

  // Quick 1-Click Expense Presets
  const handleAddQuickExpense = (category: ExpenseCategory, description: string, amountCOP: number) => {
    const newExp: LocalDailyExpense = {
      id: `EXP-QUICK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category,
      description,
      amountCOP,
      vendorName: 'Comercio Local',
      isNew: true,
    };
    setDailyExpenses((prev) => [...prev, newExp]);
  };

  // Helper to read file as Base64 Data URL
  const handleFileRead = (
    file: File,
    onLoaded: (result: { name: string; size: number; dataUrl: string; type: string }) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      onLoaded({
        name: file.name,
        size: file.size,
        dataUrl,
        type: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCustomFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileRead(file, (res) => {
      setCustomReceiptFile(res);
      if (!customDescription.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setCustomDescription(`Soporte: ${cleanName}`);
      }
    });
    e.target.value = '';
  };

  const handleAttachToExpense = (expenseId: string) => {
    setTargetExpenseIdForAttachment(expenseId);
    attachToSpecificExpenseInputRef.current?.click();
  };

  const handleSpecificExpenseFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetExpenseIdForAttachment) return;
    handleFileRead(file, (res) => {
      setDailyExpenses((prev) =>
        prev.map((exp) =>
          exp.id === targetExpenseIdForAttachment
            ? {
                ...exp,
                receiptFileName: res.name,
                receiptFileDataUrl: res.dataUrl,
                receiptFileSize: res.size,
                isNew: true,
              }
            : exp
        )
      );
      setTargetExpenseIdForAttachment(null);
    });
    e.target.value = '';
  };

  // Add Custom Expense
  const handleAddCustomExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amount = parseInt(customAmountCOP.replace(/\D/g, ''), 10);
    if (!customDescription.trim() || isNaN(amount) || amount <= 0) {
      setErrorMessage('Por favor ingrese un concepto y monto válido para el gasto');
      return;
    }
    const newExp: LocalDailyExpense = {
      id: `EXP-CUSTOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: customCategory,
      description: customDescription.trim(),
      amountCOP: amount,
      vendorName: customReceiptFile ? 'Soporte Adjunto' : 'Comercio Local',
      isNew: true,
      receiptFileName: customReceiptFile?.name,
      receiptFileDataUrl: customReceiptFile?.dataUrl,
      receiptFileSize: customReceiptFile?.size,
    };
    setDailyExpenses((prev) => [...prev, newExp]);
    setCustomDescription('');
    setCustomAmountCOP('');
    setCustomReceiptFile(null);
    setErrorMessage(null);
  };

  // Remove Expense (and delete from storage if persisted)
  const handleRemoveExpense = async (id: string) => {
    setDailyExpenses((prev) => prev.filter((e) => e.id !== id));
    if (deleteExpense) {
      try {
        await deleteExpense(id);
      } catch (err) {
        console.warn('Failed to delete expense from storage in CompanionTurnSheetModal:', err);
      }
    }
  };

  // High-DPI Canvas Setup
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = (rect.width || 400) * dpr;
    canvas.height = (rect.height || 140) * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 2.5;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width || 400, rect.height || 140);
    setHasDrawn(false);
    lastPointRef.current = null;
    activePointerIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      setupCanvas();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, setupCanvas]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setSha256Seal(null);
    setSignatureDataUrl(null);
    setErrorMessage(null);
    lastPointRef.current = null;
    activePointerIdRef.current = null;
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, time: Date.now() };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now(),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    activePointerIdRef.current = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(e);
    lastPointRef.current = currentPoint;

    ctx.beginPath();
    ctx.moveTo(currentPoint.x, currentPoint.y);
    ctx.lineTo(currentPoint.x + 0.5, currentPoint.y + 0.5);
    ctx.stroke();

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activePointerIdRef.current !== e.pointerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(e);
    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      const midX = (lastPoint.x + currentPoint.x) / 2;
      const midY = (lastPoint.y + currentPoint.y) / 2;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      if (typeof ctx.quadraticCurveTo === 'function') {
        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
      } else {
        ctx.lineTo(currentPoint.x, currentPoint.y);
      }
      ctx.stroke();
    }
    lastPointRef.current = currentPoint;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // Safe ignore
        }
      }
      activePointerIdRef.current = null;
      lastPointRef.current = null;
      setIsDrawing(false);
    }
  };

  // Sign and derive instant SHA-256 seal
  const handleSignTurn = () => {
    if (!hasDrawn) {
      setErrorMessage(t.signature.errorNoSignature);
      return;
    }
    if (!signerName.trim()) {
      setErrorMessage(t.signature.errorNoSignerName);
      return;
    }

    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL('image/png') : '';
    setSignatureDataUrl(dataUrl);

    // Compute cryptographic SHA-256 seal for the turn shift & petty cash liquidation
    const bookingCode = activeBooking?.code || 'BOOKING-DEFAULT';
    const timestamp = Date.now();
    const payload = {
      bookingCode,
      guideId,
      guideName: selectedGuideName,
      shiftDate,
      dayNumber,
      hoursLogged,
      hourlyRateCents: hourlyRateMoney.cents.toString(),
      prepAllowanceCents: prepAllowanceMoney.cents.toString(),
      mealSubsidyTier: mealTier,
      mealSubsidyCents: mealSubsidyMoney.cents.toString(),
      totalShiftFeeCents: totalShiftFeeMoney.cents.toString(),
      pettyCashCOP,
      totalDailyExpensesCOP,
      companionNetPayoutCOP,
      signerRole,
      signerName: signerName.trim(),
      signatureHash: sha256(dataUrl.slice(0, 1000)),
    };

    const derivedSeal = calculateBlockHash(1, timestamp, payload, '0'.repeat(64), 0);
    setSha256Seal(derivedSeal);
    setErrorMessage(null);
    fireSignatureSealBurst();
  };

  // Save Shift to Storage & Recalculate Ledger
  const handleSaveShift = async () => {
    if (!guideId) {
      setErrorMessage(t.companion.errorNoGuide);
      return;
    }
    if (hoursLogged <= 0) {
      setErrorMessage(t.companion.errorNoHours);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const bookingCode = activeBooking?.code || 'BOOKING-DEFAULT';
      const shiftId = initialShift?.id || `SHIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newShift = new CompanionShift({
        id: shiftId,
        bookingId: bookingCode,
        guideId,
        guideName: selectedGuideName,
        dayNumber,
        date: shiftDate,
        hoursLogged,
        hourlyRate: hourlyRateMoney,
        prepAllowance: prepAllowanceMoney,
        mealSubsidyTier: mealTier,
        mealSubsidyAmount: mealSubsidyMoney,
        notes: sha256Seal ? `${notes} [SHA-256 SEAL: ${sha256Seal}]`.trim() : notes,
        status: shiftStatus,
      });

      // 1. Save shift to storage port
      await storagePort.saveShift(newShift);

      // 2. Persist newly added daily expenses to storage port
      for (const exp of dailyExpenses) {
        if (exp.isNew) {
          const newExpense = new ReceiptExpense({
            id: exp.id.startsWith('EXP-') ? exp.id : `EXP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            bookingId: bookingCode,
            category: exp.category,
            description: exp.description,
            amount: Money.fromAmount(exp.amountCOP, 'COP'),
            vendorName: exp.vendorName || (exp.receiptFileName ? 'Soporte Adjunto' : 'Gasto de Terreno'),
            receiptBlobUuid: exp.receiptFileDataUrl ? `blob-rec-${exp.id}` : undefined,
            date: shiftDate,
            audited: true,
            status: 'APPROVED',
          });
          await storagePort.saveExpense(newExpense);
        }
      }

      // 3. Append CQRS domain event log
      await storagePort.appendEventLog({
        id: `EVT-SHIFT-${Date.now()}`,
        bookingId: bookingCode,
        type: 'COMPANION_SHIFT_LOGGED',
        payload: {
          shiftId: newShift.id,
          guideId: newShift.guideId,
          hoursLogged: newShift.hoursLogged,
          totalFeeCents: newShift.calculateTotalFee().cents.toString(),
          sha256Seal,
          pettyCashReceivedCOP: pettyCashCOP,
          totalDailyExpensesCOP,
          companionNetPayoutCOP,
          attachedSupportsCount: dailyExpenses.filter((e) => !!e.receiptFileName).length,
          supports: dailyExpenses
            .filter((e) => !!e.receiptFileName)
            .map((e) => ({
              expenseId: e.id,
              fileName: e.receiptFileName,
              category: e.category,
              amountCOP: e.amountCOP,
            })),
        },
        timestamp: Date.now(),
      });

      await refreshData();
      if (activeBooking) {
        try {
          await recalculateSettlement();
        } catch {
          // Safe fallback if booking is uninitialized
        }
      }

      if (onShiftSaved) {
        onShiftSaved(newShift);
      }

      setSuccessMessage(t.companion.turnSavedSuccess);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el turno';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Export HTML Turn & Petty Cash Receipt
  const handleExportTurnReceipt = () => {
    const bookingCode = activeBooking?.code || 'RVA-DEFAULT';
    const patientName = activeBooking?.patientFullName || 'Paciente Internacional';
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante de Turno Acompañamiento - ${bookingCode}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #09090b; }
          .header { border-bottom: 2px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 800; color: #18181b; }
          .subtitle { font-size: 13px; color: #71717a; margin-top: 4px; }
          .card { background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 700; color: #27272a; margin-bottom: 12px; border-bottom: 1px solid #d4d4d8; padding-bottom: 4px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .label { font-weight: 600; color: #52525b; }
          .value { font-weight: 700; color: #09090b; }
          .total { border-top: 2px solid #18181b; padding-top: 12px; font-size: 15px; font-weight: 800; }
          .highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
          .seal { font-family: monospace; font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 8px; border-radius: 6px; word-break: break-all; margin-top: 16px; }
          .sig-img { max-height: 80px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${t.companion.turnTitle}</div>
          <div class="subtitle">Medical Trip Colombia S.A.S. • Protocolo Exclusivo de Liquidación Diaria</div>
        </div>
        <div class="card">
          <div class="row"><span class="label">Reserva:</span><span class="value">${bookingCode}</span></div>
          <div class="row"><span class="label">Paciente:</span><span class="value">${patientName}</span></div>
          <div class="row"><span class="label">Acompañante Asignado:</span><span class="value">${selectedGuideName} (${guideId})</span></div>
          <div class="row"><span class="label">Fecha / Jornada:</span><span class="value">${shiftDate} (Día ${dayNumber})</span></div>
        </div>

        <div class="card">
          <div class="section-title">1. Honorarios de Acompañamiento</div>
          <div class="row"><span class="label">Horas Asistidas:</span><span class="value">${hoursLogged.toFixed(2)}h @ $15.500 COP/h</span></div>
          <div class="row"><span class="label">Subtotal Horas:</span><span class="value">${hourlySubtotalMoney.format()}</span></div>
          <div class="row"><span class="label">Subsidio Preparación:</span><span class="value">${prepAllowanceMoney.format()}</span></div>
          <div class="row"><span class="label">Subsidio Alimentación (${mealTier}):</span><span class="value">${mealSubsidyMoney.format()}</span></div>
          <div class="row total"><span class="label">Total Honorarios Guía:</span><span class="value">${totalShiftFeeMoney.format()}</span></div>
        </div>

        <div class="card">
          <div class="section-title">2. Rendición de Caja Menor (Gastos de Terreno y Soportes)</div>
          <div class="row"><span class="label">Caja Menor Recibida:</span><span class="value">${pettyCashMoney.format()}</span></div>
          <div class="row"><span class="label">Gastos Justificados en Terreno:</span><span class="value">-${totalDailyExpensesMoney.format()}</span></div>
          ${dailyExpenses
            .map(
              (exp) => `
            <div class="row" style="padding-left:12px; font-size:12px; color:#52525b;">
              <span>• ${exp.description} (${exp.category}):</span>
              <span>$${exp.amountCOP.toLocaleString('es-CO')} COP</span>
            </div>
            ${
              exp.receiptFileName
                ? `<div style="padding-left:24px; font-size:11px; color:#4338ca; margin-bottom:4px;">
                    📎 Soporte adjunto: <strong>${exp.receiptFileName}</strong>
                   </div>
                   ${
                     exp.receiptFileDataUrl && exp.receiptFileDataUrl.startsWith('data:image')
                       ? `<div style="padding-left:24px; margin-bottom:8px;">
                            <img src="${exp.receiptFileDataUrl}" style="max-height:90px; border:1px solid #d4d4d8; border-radius:4px;" />
                          </div>`
                       : ''
                   }`
                : ''
            }
          `
            )
            .join('')}
          <div class="row total"><span class="label">${pettyCashBalanceCOP >= 0 ? 'Efectivo Sobrante en Mano:' : 'Excedente Pagado de Bolsillo:'}</span><span class="value">${Money.fromAmount(Math.abs(pettyCashBalanceCOP), 'COP').format()}</span></div>
        </div>

        <div class="highlight">
          <div class="row" style="font-size:16px; font-weight:800; color:#1e3a8a;">
            <span>Saldo Neto a Liquidar al Acompañante:</span>
            <span>${companionNetPayoutMoney.format()}</span>
          </div>
        </div>

        ${notes ? `<div style="font-size:13px; margin-bottom:16px;"><strong>Notas:</strong> ${notes}</div>` : ''}
        ${sha256Seal ? `<div class="seal"><strong>Sello Criptográfico SHA-256:</strong><br/>${sha256Seal}</div>` : ''}
        ${signatureDataUrl ? `<div style="margin-top:20px;"><strong>Firma (${signerRole} - ${signerName}):</strong><br/><img src="${signatureDataUrl}" class="sig-img" /></div>` : ''}
        <script>window.print();</script>
      </body>
      </html>
    `;
    const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.focus();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`🗣️ ${t.companion.turnTitle}`}
      subtitle={t.companion.turnSubtitle}
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTurnReceipt}
              data-testid="btn-export-turn-receipt"
              leftIcon={<Printer className="w-3.5 h-3.5 text-zinc-600" />}
              className="text-xs"
            >
              <span>{t.companion.exportReceipt}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              data-testid="btn-cancel-turn-modal"
              className="text-xs min-h-[38px]"
            >
              <span>{t.common.cancel}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveShift}
              isLoading={isSaving}
              data-testid="btn-save-companion-turn"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="text-xs min-h-[38px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <span>{t.companion.saveTurn}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-zinc-900" data-testid="companion-turn-sheet-content">
        {/* Error / Success Feedback */}
        {errorMessage && (
          <div
            data-testid="turn-error-banner"
            className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div
            data-testid="turn-success-banner"
            className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Section 1: Guide Assignment & Shift Timing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
          {/* Guide Selector */}
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.companion.guideAssigned}</span>
            </label>
            <select
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
              data-testid="select-companion-guide"
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {guideOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t.companion.shiftDate}</span>
            </label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              data-testid="input-shift-date"
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Section 2: Caja Menor Recibida (Anticipo de Terreno) */}
        <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-950">
                {t.companion.pettyCashReceived || 'Caja Menor Recibida (Anticipo de Terreno)'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
              Fondo Diario Asignado
            </span>
          </div>

          <p className="text-[11px] text-amber-800/90 leading-tight">
            {t.companion.pettyCashHelp || 'Fondo de efectivo entregado al acompañante al inicio del día para cubrir gastos de terreno (farmacia, taxis, parqueaderos, etc.).'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[160px] relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-zinc-500">$</span>
              <input
                type="number"
                step="10000"
                value={pettyCashCOP}
                onChange={(e) => setPettyCashCOP(Math.max(0, parseInt(e.target.value || '0', 10)))}
                data-testid="input-petty-cash"
                className="w-full pl-6 pr-12 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-3 top-2 text-[10px] font-semibold text-zinc-400">COP</span>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5">
              {[100000, 200000, 300000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPettyCashCOP(preset)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    pettyCashCOP === preset
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  ${(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: ¿Qué gastó hoy? — Rendición de Gastos de Caja Menor */}
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-zinc-900">
                {t.companion.whatSpentToday || '¿Qué gastó hoy? (Gastos de Terreno con Caja Menor)'}
              </span>
            </div>
            <span
              data-testid="daily-expenses-subtotal"
              className="text-xs font-bold font-mono text-zinc-800 bg-zinc-100 px-2.5 py-0.5 rounded-lg border border-zinc-200"
            >
              Total Gastado: {totalDailyExpensesMoney.format()}
            </span>
          </div>

          {/* 1-Click Fast Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Botones Rápidos de Gasto (1-Click):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddQuickExpense('OTHER', 'Café / Refrigerio Paciente y Guía', 15000)}
                data-testid="quick-expense-coffee"
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-zinc-200 transition-colors cursor-pointer"
              >
                ☕ Café $15k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickExpense('PHARMACY', 'Farmacia / Medicamentos en Terreno', 85000)}
                data-testid="quick-expense-pharmacy"
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-zinc-200 transition-colors cursor-pointer"
              >
                💊 Farmacia $85k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickExpense('MEAL_SUBSIDY', 'Almuerzo / Comida en Terreno', 25000)}
                data-testid="quick-expense-lunch"
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-zinc-200 transition-colors cursor-pointer"
              >
                🍽️ Almuerzo $25k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickExpense('OTHER', 'Taxi / Transporte de Emergencia', 25000)}
                data-testid="quick-expense-taxi"
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-zinc-200 transition-colors cursor-pointer"
              >
                🚕 Taxi $25k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickExpense('PARKING', 'Parqueadero Clínica', 12000)}
                data-testid="quick-expense-parking"
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-zinc-200 transition-colors cursor-pointer"
              >
                🅿️ Parqueadero $12k
              </button>
            </div>
          </div>

          {/* Hidden File Inputs for Receipts / Supports */}
          <input
            type="file"
            ref={customFileInputRef}
            onChange={handleCustomFileSelected}
            accept="image/*,.pdf"
            className="hidden"
            data-testid="input-expense-file-upload"
          />
          <input
            type="file"
            ref={customCameraInputRef}
            onChange={handleCustomFileSelected}
            accept="image/*"
            capture="environment"
            className="hidden"
            data-testid="input-expense-camera-upload"
          />
          <input
            type="file"
            ref={attachToSpecificExpenseInputRef}
            onChange={handleSpecificExpenseFileSelected}
            accept="image/*,.pdf"
            className="hidden"
            data-testid="input-specific-expense-file"
          />

          {/* Inline Custom Expense Form */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-zinc-100">
            <div className="sm:col-span-3">
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as ExpenseCategory)}
                data-testid="select-expense-category"
                className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 cursor-pointer"
              >
                <option value="PHARMACY">💊 Farmacia</option>
                <option value="MEAL_SUBSIDY">🍽️ Comida</option>
                <option value="PARKING">🅿️ Parqueadero</option>
                <option value="TOLL">🛣️ Peaje</option>
                <option value="SIM_CARD">📶 SIM Card</option>
                <option value="OTHER">📦 Otro</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="¿En qué gastó? (ej. Medicamentos Farmatodo)"
                data-testid="input-expense-description"
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                value={customAmountCOP}
                onChange={(e) => setCustomAmountCOP(e.target.value)}
                placeholder="Monto COP"
                data-testid="input-expense-amount"
                className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-semibold text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => handleAddCustomExpense()}
                data-testid="btn-add-daily-expense"
                className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* File / Support Attachment Controls */}
            <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2 p-2 bg-zinc-50 rounded-lg border border-dashed border-zinc-300">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => customFileInputRef.current?.click()}
                  data-testid="btn-trigger-file-upload"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Adjuntar Soporte (Foto / PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => customCameraInputRef.current?.click()}
                  data-testid="btn-trigger-camera-upload"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Tomar Foto</span>
                </button>
              </div>

              {customReceiptFile ? (
                <div
                  data-testid="attached-file-preview-chip"
                  className="inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-900"
                >
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="truncate max-w-[180px] font-semibold">{customReceiptFile.name}</span>
                  <span className="text-[10px] text-indigo-500 font-mono">
                    ({(customReceiptFile.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomReceiptFile(null)}
                    data-testid="btn-remove-attached-file"
                    className="text-indigo-400 hover:text-indigo-700 ml-1 cursor-pointer"
                    title="Quitar archivo adjunto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-400 italic">
                  Opcional: Facturas de farmacia, tickets de parqueadero o peajes
                </span>
              )}
            </div>
          </div>

          {/* List of Today's Expenses */}
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
            {dailyExpenses.length === 0 ? (
              <div className="py-2.5 px-3 bg-zinc-50 rounded-lg text-center text-xs text-zinc-500 font-medium">
                Sin gastos registrados hoy. Usa los botones rápidos arriba si tuviste gastos.
              </div>
            ) : (
              dailyExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200/80 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="font-semibold text-zinc-900 truncate">{exp.description}</span>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">[{exp.category}]</span>

                    {/* Support Attachment Badge or Quick Attach Trigger */}
                    {exp.receiptFileName ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewReceipt({
                            fileName: exp.receiptFileName!,
                            dataUrl: exp.receiptFileDataUrl || '',
                            description: exp.description,
                          })
                        }
                        data-testid={`btn-view-support-${exp.id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                        title="Ver soporte adjunto"
                      >
                        <Paperclip className="w-3 h-3 text-indigo-600" />
                        <span className="truncate max-w-[120px]">{exp.receiptFileName}</span>
                        <Eye className="w-3 h-3 text-indigo-500" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAttachToExpense(exp.id)}
                        data-testid={`btn-attach-support-${exp.id}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-500 hover:text-indigo-600 hover:bg-zinc-200/60 transition-colors cursor-pointer shrink-0"
                        title="Adjuntar soporte a este gasto"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>+ Soporte</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-zinc-900">
                      ${exp.amountCOP.toLocaleString('es-CO')} COP
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(exp.id)}
                      data-testid={`btn-remove-expense-${exp.id}`}
                      className="text-zinc-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4: 15-Minute Precision Hours Logger */}
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.companion.hoursLogged}</span>
              </label>
              <span className="text-xs text-zinc-500 font-medium">
                {t.companion.hoursPrecision} · $15.500 COP/h
              </span>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
              <button
                type="button"
                onClick={() => adjustHours(-1.0)}
                data-testid="btn-hours-minus-1h"
                className="px-2 py-1 bg-white hover:bg-zinc-200 text-zinc-700 rounded text-xs font-bold transition-colors cursor-pointer active:scale-95 duration-200"
                title="-1.0 hora"
              >
                -1h
              </button>
              <button
                type="button"
                onClick={() => adjustHours(-0.25)}
                data-testid="btn-hours-minus-15m"
                className="p-1 bg-white hover:bg-zinc-200 text-zinc-700 rounded transition-colors cursor-pointer active:scale-95 duration-200"
                title="-15 minutos (-0.25h)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="px-3 py-1 font-mono font-extrabold text-sm text-indigo-950 tabular-nums bg-white rounded border border-zinc-200">
                <span data-testid="hours-logged-display">{hoursLogged.toFixed(2)}</span>
                <span className="text-xs text-zinc-400 ml-0.5">h</span>
              </div>

              <button
                type="button"
                onClick={() => adjustHours(0.25)}
                data-testid="btn-hours-plus-15m"
                className="p-1 bg-white hover:bg-zinc-200 text-zinc-700 rounded transition-colors cursor-pointer active:scale-95 duration-200"
                title="+15 minutos (+0.25h)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => adjustHours(1.0)}
                data-testid="btn-hours-plus-1h"
                className="px-2 py-1 bg-white hover:bg-zinc-200 text-zinc-700 rounded text-xs font-bold transition-colors cursor-pointer active:scale-95 duration-200"
                title="+1.0 hora"
              >
                +1h
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Standardized 5-Tier Meal Allowance Selector */}
        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
          <MealSubsidySelector
            selectedTier={mealTier}
            onSelectTier={(tier) => setMealTier(tier)}
            hoursLogged={hoursLogged}
          />
        </div>

        {/* Section 6: Real-Time BigInt Financial Accounting Breakdown */}
        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.companion.subtotal} (BigInt Cents)</span>
            </span>
            <span
              data-testid="total-shift-fee-badge"
              className="text-base font-extrabold font-mono text-indigo-900 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 tabular-nums"
            >
              {totalShiftFeeMoney.format()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-indigo-100 text-xs">
            <div className="flex flex-col">
              <span className="text-zinc-500">{t.companion.hourlySubtotal}</span>
              <span data-testid="hourly-subtotal-cents" className="font-bold text-zinc-800 font-mono">
                {hourlySubtotalMoney.format()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-500">{t.companion.prepAllowance}</span>
              <span data-testid="prep-allowance-cents" className="font-bold text-zinc-800 font-mono">
                {prepAllowanceMoney.format()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-500">{t.companion.mealSubsidy}</span>
              <span data-testid="meal-subsidy-cents" className="font-bold text-zinc-800 font-mono">
                {mealSubsidyMoney.format()}
              </span>
            </div>
          </div>
        </div>

        {/* Section 7: Balance Consolidado de Liquidación del Acompañante */}
        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950">
                Liquidación Diaria Neta al Acompañante
              </span>
            </div>
            <span
              data-testid="companion-net-settlement-badge"
              className="text-base font-black font-mono text-emerald-900 bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-xs tabular-nums"
            >
              {companionNetPayoutMoney.format()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white/80 p-2.5 rounded-lg border border-emerald-100">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[11px]">Caja Menor Recibida:</span>
              <span className="font-bold font-mono text-zinc-800">{pettyCashMoney.format()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[11px]">Gastos Justificados:</span>
              <span className="font-bold font-mono text-rose-700">-{totalDailyExpensesMoney.format()}</span>
            </div>
            <div className="flex flex-col" data-testid="petty-cash-balance-badge">
              <span className="text-zinc-500 text-[11px]">
                {pettyCashBalanceCOP >= 0 ? 'Sobrante en Efectivo:' : 'Excedente de Bolsillo:'}
              </span>
              <span className={`font-bold font-mono ${pettyCashBalanceCOP >= 0 ? 'text-amber-800' : 'text-indigo-800'}`}>
                {Money.fromAmount(Math.abs(pettyCashBalanceCOP), 'COP').format()}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 leading-tight">
            {pettyCashBalanceCOP >= 0 ? (
              <span>
                💡 <strong>Ajuste transparente:</strong> De los honorarios de la jornada ({totalShiftFeeMoney.format()}) se descuenta el efectivo que ya tienes de la caja menor ({Money.fromAmount(pettyCashBalanceCOP, 'COP').format()}). Saldo neto a transferirte hoy: <strong>{companionNetPayoutMoney.format()}</strong>.
              </span>
            ) : (
              <span>
                💡 <strong>Reembolso a favor:</strong> Gastaste de tu propio bolsillo {Money.fromAmount(Math.abs(pettyCashBalanceCOP), 'COP').format()} por encima de la caja menor. Se te transfieren tus honorarios + el reembolso: <strong>{companionNetPayoutMoney.format()}</strong>.
              </span>
            )}
          </div>
        </div>

        {/* Section 8: Turn Notes & Operational Activity Log */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-800">
            {t.companion.notes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            data-testid="textarea-turn-notes"
            placeholder={t.companion.notesPlaceholder}
            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Section 9: Embedded Digital Signature Pad & SHA-256 Seal Derivation */}
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-xs font-bold text-zinc-900">
                {t.companion.digitalSignOff}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value as any)}
                data-testid="select-turn-signer-role"
                className="text-xs font-semibold bg-zinc-100 border border-zinc-300 rounded-md px-2 py-1 text-zinc-800 cursor-pointer"
              >
                <option value="GUIDE">{t.signature.guideRole}</option>
                <option value="PATIENT">{t.signature.patientRole}</option>
                <option value="COORDINATOR">{t.signature.coordinatorRole}</option>
              </select>
              <button
                type="button"
                onClick={clearCanvas}
                data-testid="btn-clear-turn-signature"
                className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors cursor-pointer active:scale-95 duration-200"
                title={t.signature.clearCanvas}
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              data-testid="input-turn-signer-name"
              placeholder={t.signature.signerNamePlaceholder}
              className="flex-1 px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* High-DPI Canvas */}
          <div className="relative w-full h-[120px] bg-white border border-dashed border-zinc-300 rounded-lg overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              data-testid="turn-signature-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full cursor-crosshair block"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-zinc-400 text-xs italic">
                {t.signature.canvasInstruction}
              </div>
            )}
          </div>

          {/* Sign & Derive SHA-256 Seal Button */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignTurn}
              data-testid="btn-seal-turn-sha256"
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
              className="text-xs font-semibold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 border-indigo-200 min-h-[34px]"
            >
              <span>{t.companion.signTurn}</span>
            </Button>

            {sha256Seal && (
              <div
                data-testid="turn-sha256-seal-badge"
                className="flex-1 max-w-[280px] bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-xs font-mono text-emerald-900 truncate"
                title={`SHA-256: ${sha256Seal}`}
              >
                🔒 {sha256Seal}
              </div>
            )}
          </div>
        </div>

        {/* Receipt Preview Lightbox / Modal */}
        {previewReceipt && (
          <div
            data-testid="receipt-preview-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-4 flex flex-col gap-3 shadow-sm border border-zinc-200/80">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-sm text-zinc-900 truncate">
                    {previewReceipt.fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  data-testid="btn-close-receipt-preview"
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-zinc-600">
                <span className="font-semibold">Concepto del gasto:</span> {previewReceipt.description}
              </div>

              <div className="bg-zinc-100 rounded-xl p-2 flex items-center justify-center min-h-[180px] max-h-[380px] overflow-auto">
                {previewReceipt.dataUrl && previewReceipt.dataUrl.startsWith('data:image') ? (
                  <img
                    src={previewReceipt.dataUrl}
                    alt={previewReceipt.fileName}
                    data-testid="receipt-preview-image"
                    className="max-h-[340px] max-w-full rounded-lg object-contain shadow-xs"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6 text-zinc-500">
                    <FileCheck className="w-10 h-10 text-indigo-500" />
                    <span className="text-xs font-semibold">{previewReceipt.fileName}</span>
                    <span className="text-[11px] text-zinc-400">Documento PDF / Soporte de gasto</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewReceipt(null)}
                  className="text-xs"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
