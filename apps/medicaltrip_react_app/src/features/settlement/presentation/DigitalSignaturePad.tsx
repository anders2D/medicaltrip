/**
 * Medical Trip Colombia S.A.S. - DigitalSignaturePad
 * High-DPI Retina Digital Signature Pad Modal using HTML5 Canvas with smooth stroke interpolation.
 * Features:
 * - High-DPI devicePixelRatio auto-scaling for crisp Retina & Super Retina rendering.
 * - Smooth quadratic Bézier stroke interpolation for natural stylus/touch calligraphy.
 * - Hardware Palm-Rejection simulation (active pointer capture & stylus priority).
 * - Statutory legal consent certification banner with booking dossier tracking.
 * - Signer role switcher (Paciente Titular, Guía Acompañante, Coordinador Operativo).
 * - Sign-off commit to Single-Writer CQRS event stream via SignOffItineraryUseCase.
 * - Multi-burst celebration confetti trigger via useConfetti on seal.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eraser, CheckCircle2, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Modal } from '@/core/ui/Modal';
import { Button } from '@/core/ui/Button';
import { Input } from '@/core/ui/Input';
import { Select } from '@/core/ui/Select';
import { useAppContext } from '@/presentation/state/AppContext';
import { useLanguage } from '@/core/i18n';
import { useSettlement } from './hooks/useSettlement';
import { LanguageSwitcher } from '@/core/ui/LanguageSwitcher';
import { SignOffItineraryUseCase } from '../../../application/use-cases/SignOffItineraryUseCase';
import { fireSignatureSealBurst, fireSettlementZeroBlast } from '@/presentation/hooks/useConfetti';

export interface DigitalSignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSigned?: (signatureDataUrl: string, signerRole: string, signerName: string) => void;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  isOpen,
  onClose,
  onSigned,
}) => {
  const { activeBooking, storagePort, refreshData, executeOneTapSettlementWorkflow } = useAppContext();
  const { t } = useLanguage();
  const { activeDayDate, activeDayNumber } = useSettlement();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activePointerTypeRef = useRef<string | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [signerRole, setSignerRole] = useState<'PATIENT' | 'GUIDE' | 'COORDINATOR'>('PATIENT');
  const [signerName, setSignerName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill signer name from active booking on mount or role change
  useEffect(() => {
    if (activeBooking && (!signerName || signerRole === 'PATIENT')) {
      setSignerName(activeBooking.patientFullName);
    }
  }, [activeBooking]);

  // Setup High-DPI Canvas with exact devicePixelRatio scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set internal buffer dimensions to physical device pixels
    canvas.width = (rect.width || 400) * dpr;
    canvas.height = (rect.height || 180) * dpr;

    // Scale context so drawing commands use CSS logical pixels
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#09090b'; // Deep zinc-950 pen ink
    ctx.lineWidth = 2.5;

    // Fill clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width || 400, rect.height || 180);
    setHasDrawn(false);
    lastPointRef.current = null;
    activePointerIdRef.current = null;
    activePointerTypeRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      setupCanvas();
    }, 50);
    return () => {
      clearTimeout(timer);
    };
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
    setErrorMessage(null);
    lastPointRef.current = null;
    activePointerIdRef.current = null;
    activePointerTypeRef.current = null;
  };

  // Extract logical coordinates relative to canvas bounding client rect
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

  // Pointer Down - Palm Rejection & Stroke Initialization
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Palm Rejection: If already drawing with a pen or primary finger, ignore secondary touches
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
      if (activePointerTypeRef.current === 'pen' && e.pointerType === 'touch') {
        return; // Palm resting on screen while writing with stylus
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    activePointerIdRef.current = e.pointerId;
    activePointerTypeRef.current = e.pointerType;

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
    // Draw initial dot for single tap
    ctx.lineTo(currentPoint.x + 0.5, currentPoint.y + 0.5);
    ctx.stroke();

    setIsDrawing(true);
    setHasDrawn(true);
  };

  // Pointer Move - Smooth Quadratic Interpolation
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activePointerIdRef.current !== e.pointerId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(e);
    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      // Smooth midpoint quadratic interpolation
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
    } else {
      ctx.beginPath();
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }

    lastPointRef.current = currentPoint;
  };

  // Pointer Up / Cancel / Lost - Stroke Finalization
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
      activePointerTypeRef.current = null;
      lastPointRef.current = null;
      setIsDrawing(false);
    }
  };

  // One-Tap Unified Settlement & Signature Flow
  const handleOneTapSettlement = async () => {
    if (!activeBooking) {
      setErrorMessage(t.signature.errorNoBooking);
      return;
    }

    if (!hasDrawn) {
      setErrorMessage(t.signature.errorNoSignature);
      return;
    }

    if (!signerName.trim()) {
      setErrorMessage(t.signature.errorNoSignerName);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';

      // 1. Execute unified OneTapSettlementWorkflowUseCase (Liquidación Diaria)
      const result = await executeOneTapSettlementWorkflow({
        bookingId: activeBooking.code,
        signatoryRole: signerRole === 'COORDINATOR' ? 'AUDITOR' : signerRole,
        signatureBase64Png: signatureDataUrl,
        date: activeDayDate,
        dayNumber: activeDayNumber,
        clientMetadata: {
          signerName: signerName.trim(),
        },
      });

      // 2. Fire Celebratory Confetti Burst
      fireSignatureSealBurst();
      if (result.ledger.isSettled()) {
        fireSettlementZeroBlast();
      }

      // 3. Automatically trigger browser download of generated PDF statement
      try {
        const url = URL.createObjectURL(result.pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.pdfFilename || `Liquidacion_${activeBooking.code}_${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Fallback for headless environments
      }

      // 4. Set success status & badge
      setIsSuccess(true);
      setSuccessNotice(t.signature.successNotice);

      if (onSigned) {
        onSigned(signatureDataUrl, signerRole, signerName.trim());
      }

      setIsSaving(false);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error('DIGITAL SIGNATURE PAD ERROR:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error al procesar liquidación 1-Tap.');
      setIsSaving(false);
    }
  };

  // Sign and Seal Settlement (Standard)
  const handleSignAndSeal = async () => {
    if (!activeBooking) {
      setErrorMessage(t.signature.errorNoBooking);
      return;
    }

    if (!hasDrawn) {
      setErrorMessage(t.signature.errorNoSignature);
      return;
    }

    if (!signerName.trim()) {
      setErrorMessage(t.signature.errorNoSignerName);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';

      const signUseCase = new SignOffItineraryUseCase(storagePort, storagePort);

      await signUseCase.execute({
        bookingId: activeBooking.code,
        signerRole,
        signerName: signerName.trim(),
        signatureDataUrl,
      });

      await refreshData();

      // Fire celebratory confetti burst!
      fireSignatureSealBurst();

      if (onSigned) {
        onSigned(signatureDataUrl, signerRole, signerName.trim());
      }

      setIsSaving(false);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar la firma.');
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.signature.modalTitle}
      subtitle={t.signature.modalSubtitle}
      size="lg"
    >
      <div data-testid="digital-signature-pad" className="space-y-4">
        {errorMessage && (
          <div
            data-testid="signature-error-banner"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div
            data-testid="one-tap-success-badge"
            className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
        )}

        {/* Signer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t.signature.signerRole}
            value={signerRole}
            onChange={(e) => {
              const role = e.target.value as 'PATIENT' | 'GUIDE' | 'COORDINATOR';
              setSignerRole(role);
              if (role === 'PATIENT' && activeBooking) {
                setSignerName(activeBooking.patientFullName);
              } else if (role === 'GUIDE') {
                setSignerName('Andrés Cantero (Guía Bilingüe)');
              } else if (role === 'COORDINATOR') {
                setSignerName('Carolina López (Coordinación Médica)');
              }
            }}
            options={[
              { value: 'PATIENT', label: t.signature.patientRole },
              { value: 'GUIDE', label: t.signature.guideRole },
              { value: 'COORDINATOR', label: t.signature.coordinatorRole },
            ]}
          />
          <Input
            label={t.signature.signerName}
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder={t.signature.signerNamePlaceholder}
            prefixIcon={<UserCheck className="w-4 h-4" />}
            required
          />
        </div>

        {/* Statutory Legal Consent Box with Multilingual Switcher */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 flex items-start gap-2.5 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <strong className="text-zinc-950 font-bold">{t.signature.legalConsentTitle}</strong>
              <LanguageSwitcher size="xs" compact showIcon={false} />
            </div>
            <p className="text-zinc-700 leading-relaxed" data-testid="legal-consent-text">
              {t.signature.legalConsentText(activeBooking?.code || 'RVA-PROV')}
            </p>
          </div>
        </div>

        {/* Canvas Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              {t.signature.canvasTitle}
            </label>
            <button
              type="button"
              data-testid="clear-signature-btn"
              onClick={clearCanvas}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-zinc-100 min-h-[36px]"
            >
              <Eraser className="w-3.5 h-3.5" />
              {t.signature.clearCanvas}
            </button>
          </div>

          <div className="relative border-2 border-dashed border-zinc-300 rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              data-testid="signature-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full h-44 cursor-crosshair touch-none select-none block"
            />
            {!hasDrawn && (
              <div
                className="absolute inset-0 flex items-center justify-center text-zinc-400 pointer-events-none text-xs font-medium select-none"
                aria-hidden="true"
              >
                {t.signature.canvasInstruction}
              </div>
            )}
            {/* Base line marker */}
            <div className="absolute bottom-6 inset-x-8 border-b border-zinc-200 pointer-events-none" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="min-h-[44px] px-4 text-xs font-semibold"
          >
            {t.common.cancel}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid="sign-and-seal-btn"
              onClick={handleSignAndSeal}
              isLoading={isSaving}
              disabled={!hasDrawn || !signerName.trim() || isSuccess}
              className="min-h-[44px] px-3.5 text-xs font-semibold text-zinc-800"
            >
              <CheckCircle2 className="w-4 h-4 mr-1 text-zinc-500" />
              <span>{t.signature.signOnly}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              data-testid="btn-submit-one-tap-settlement"
              onClick={handleOneTapSettlement}
              isLoading={isSaving}
              disabled={!hasDrawn || !signerName.trim() || isSuccess}
              className="min-h-[44px] px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>{t.signature.signAndDownload}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DigitalSignaturePad;

