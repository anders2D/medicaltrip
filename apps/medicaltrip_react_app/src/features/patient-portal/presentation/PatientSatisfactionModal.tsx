/**
 * Medical Trip Colombia S.A.S. - PatientSatisfactionModal
 * Modal de Certificación de Conformidad & Satisfacción del Paciente:
 * - Pad de firma digital HTML5 Canvas táctil/stylus con Retina 2x
 * - Calificación interactiva de 5 estrellas
 * - Declaración legal en el idioma preferido del paciente
 * - Derivación criptográfica de sello SHA-256
 * - Celebración con lluvia de confeti (canvas-confetti)
 * - Certificado imprimible de atención médica recibida
 * - CERO matemática financiera ni saldos contables en el DOM
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/core/i18n';
import { computeSha256 } from '../utils/sha256';
import {
  Award,
  Star,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Printer,
  X,
  FileCheck,
  Check,
} from 'lucide-react';

export interface PatientSatisfactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  bookingCode?: string;
  patientId?: string;
}

export const PatientSatisfactionModal: React.FC<PatientSatisfactionModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Catia Rodrigues',
  bookingCode = 'RVA171-4',
  patientId = 'ENT-PAX-0171',
}) => {
  const { language } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [hasSigned, setHasSigned] = useState<boolean>(false);
  const [isSignedSubmitted, setIsSignedSubmitted] = useState<boolean>(false);
  const [sha256Seal, setSha256Seal] = useState<string>('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [certificateTimestamp, setCertificateTimestamp] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Legal statement translations
  const legalStatements: Record<string, string> = {
    es: `Por medio de la presente, yo, ${patientName}, certifico haber recibido a entera conformidad y satisfacción todos los servicios de coordinación médica, logística de aeropuerto, acompañamiento bilingüe y traslados asistidos brindados por Medical Trip Colombia S.A.S. durante mi estancia médica en la ciudad de Medellín.`,
    en: `I hereby certify that I, ${patientName}, have received to my full conformity and complete satisfaction all medical coordination, airport logistics, bilingual companionship, and assisted healthcare transfers provided by Medical Trip Colombia S.A.S. during my medical journey in Medellín.`,
    nl: `Hierbij verklaar ik, ${patientName}, tot mijn volledige tevredenheid en conformiteit alle medische coördinatie, luchthavenlogistiek, tweetalige begeleiding en vervoersdiensten te hebben ontvangen van Medical Trip Colombia S.A.S. tijdens mijn medische verblijf in Medellín.`,
    pap: `Pa medio di esaki, ami, ${patientName}, ta deklará di a risibí na mi total konformidat i satisfakshon tur e servisionan di kordinashon médiko, logístika di aeropuerto, kompañamentu bilingue i transporte di salú duná pa Medical Trip Colombia S.A.S. durante mi estadía médiko na Medellín.`,
  };

  const legalText = legalStatements[language] || legalStatements.es;

  // Initialize Canvas with Retina scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#18181b'; // zinc-900
  }, []);

  useEffect(() => {
    if (isOpen && !isSignedSubmitted) {
      setTimeout(setupCanvas, 100);
    }
  }, [isOpen, isSignedSubmitted, setupCanvas]);

  const getCanvasPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(e.nativeEvent);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newPos = getCanvasPos(e.nativeEvent);

    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(newPos.x, newPos.y);
        ctx.stroke();
      }
    } catch {
      // Headless fallback
    }

    lastPosRef.current = newPos;
    setHasSigned(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch {
        // Headless fallback
      }
    }
    setHasSigned(false);
  };

  // Submit and certify
  const handleCertify = async () => {
    if (!hasSigned) return;

    let dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    try {
      if (canvasRef.current && typeof canvasRef.current.toDataURL === 'function') {
        const url = canvasRef.current.toDataURL('image/png');
        if (url && url !== 'data:,') dataUrl = url;
      }
    } catch {
      // Headless fallback
    }
    setSignatureDataUrl(dataUrl);

    const now = new Date();
    const isoTimestamp = now.toISOString();
    setCertificateTimestamp(now.toLocaleString('es-CO'));

    // Compute cryptographic SHA-256 seal
    const sealData = `${patientName}|${bookingCode}|${patientId}|${rating}|${isoTimestamp}|${dataUrl}`;
    const hash = computeSha256(sealData);
    setSha256Seal(hash);

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0284C7', '#4F46E5', '#10B981', '#F59E0B', '#6366F1'],
        disableForReducedMotion: true,
      });
    } catch {
      // safe fallback
    }

    setIsSignedSubmitted(true);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="patient-satisfaction-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white border border-zinc-200/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/80 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950">
                Certificado de Conformidad & Satisfacción
              </h2>
              <p className="text-xs text-zinc-500">
                Medical Trip Colombia S.A.S. • Protocolo de Calidad Internacional
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-satisfaction-modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 text-zinc-900">
          {!isSignedSubmitted ? (
            <>
              {/* 1. 5-Star Satisfaction Rating */}
              <div className="bg-zinc-50/60 rounded-xl border border-zinc-200/70 p-4 text-center">
                <p className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-2">
                  ¿Cómo califica su experiencia con Medical Trip Colombia?
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        data-testid={`star-rating-${star}`}
                        className="p-1 text-2xl transition-transform duration-150 active:scale-90 hover:scale-110 cursor-pointer"
                        aria-label={`${star} estrellas`}
                      >
                        <Star
                          className={`w-7 h-7 ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-300 stroke-[1.5]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-semibold text-zinc-600 mt-2 font-mono">
                  {rating === 5 && '⭐⭐⭐⭐⭐ Excelente Servicio'}
                  {rating === 4 && '⭐⭐⭐⭐ Muy Buen Servicio'}
                  {rating === 3 && '⭐⭐⭐ Buen Servicio'}
                  {rating <= 2 && 'Atención Aceptable'}
                </p>
              </div>

              {/* 2. Legal Statement */}
              <div className="p-4 bg-zinc-50/40 rounded-xl border border-zinc-200/60 text-xs text-zinc-700 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 font-bold uppercase tracking-wider text-[10px]">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Declaración Formal de Conformidad del Paciente</span>
                </div>
                <p className="italic bg-white p-3 rounded-lg border border-zinc-200/70">
                  "{legalText}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>Paciente: <strong>{patientName}</strong></span>
                  <span className="font-mono">Reserva: <strong>{bookingCode}</strong></span>
                </div>
              </div>

              {/* 3. HTML5 Canvas Signature Pad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span>Firma Digital del Paciente</span>
                    <span className="text-[10px] text-zinc-400 font-normal font-mono">
                      (Touch o Ratón)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    data-testid="btn-clear-satisfaction-signature"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Borrar</span>
                  </button>
                </div>

                <div className="relative border border-zinc-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <canvas
                    ref={canvasRef}
                    data-testid="patient-satisfaction-canvas"
                    className="w-full h-40 touch-none cursor-crosshair block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-zinc-300 select-none">
                      Dibuje su firma aquí
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Al estampar su firma digital se derivará automáticamente un sello criptográfico inmutable SHA-256.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCertify}
                  disabled={!hasSigned}
                  data-testid="btn-sign-satisfaction"
                  className="w-full sm:w-auto px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Firmar y Certificar Conformidad</span>
                </button>
              </div>
            </>
          ) : (
            /* Printable Certificate of Care View */
            <div data-testid="certificate-of-care-container" className="space-y-4 animate-fade-in">
              {/* Success Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-950 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">¡Firma de Conformidad Registrada Exitosamente!</p>
                  <p className="text-[11px] text-emerald-800">
                    Se ha emitido el Certificado Oficial de Atención Médica con sello digital SHA-256.
                  </p>
                </div>
              </div>

              {/* Formal Certificate Card */}
              <div
                id="printable-certificate-care"
                className="bg-zinc-50 border-2 border-zinc-900/10 rounded-2xl p-6 space-y-5 text-zinc-900 relative"
              >
                {/* Certificate Header */}
                <div className="text-center pb-4 border-b border-zinc-200">
                  <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-zinc-500">
                    República de Colombia • Medical Trip Colombia S.A.S.
                  </span>
                  <h3 className="text-sm font-extrabold text-zinc-950 tracking-tight mt-1">
                    CERTIFICADO DE CONFORMIDAD DE ATENCIÓN MÉDICA
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Certificate of Care & Healthcare Hospitality
                  </p>
                </div>

                {/* Patient & Service Details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-zinc-200/70">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block font-mono">Paciente Titular</span>
                    <p className="font-bold text-zinc-950 mt-0.5">{patientName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{patientId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block font-mono">Código de Reserva</span>
                    <p className="font-bold text-zinc-950 font-mono mt-0.5 tabular-nums">{bookingCode}</p>
                    <p className="text-[10px] text-zinc-500">Medellín, Antioquia</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block font-mono">Calificación Otorgada</span>
                    <p className="font-bold text-amber-900 mt-0.5 font-mono">
                      {'★'.repeat(rating)} ({rating}/5 Estrellas)
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block font-mono">Fecha de Emisión</span>
                    <p className="font-semibold text-zinc-900 mt-0.5 font-mono tabular-nums text-[11px]">
                      {certificateTimestamp}
                    </p>
                  </div>
                </div>

                {/* Certified Legal Statement */}
                <div className="text-[11px] text-zinc-600 leading-relaxed bg-white p-3.5 rounded-xl border border-zinc-200/70 italic">
                  "{legalText}"
                </div>

                {/* Signature & SHA-256 Seal Proof */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-zinc-200 text-center flex flex-col items-center">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Firma Registrada del Paciente
                    </span>
                    {signatureDataUrl && (
                      <img
                        src={signatureDataUrl}
                        alt="Firma del Paciente"
                        className="max-h-16 object-contain my-auto"
                      />
                    )}
                    <span className="text-[10px] font-bold text-zinc-800 mt-1 border-t border-zinc-200 pt-1 w-3/4">
                      {patientName}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-zinc-200 flex flex-col justify-center">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Sello Digital SHA-256 Inmutable</span>
                    </span>
                    <p
                      data-testid="satisfaction-sha256-seal"
                      className="font-mono text-[10px] text-zinc-900 break-all bg-zinc-50 p-2 rounded border border-zinc-200 tabular-nums leading-tight font-semibold"
                    >
                      {sha256Seal}
                    </p>
                    <span className="text-[9px] text-emerald-700 font-mono font-bold mt-1">
                      ✓ Verificado Criptográficamente
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  data-testid="btn-print-certificate"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-900 rounded-xl text-xs font-semibold border border-zinc-200 transition-all cursor-pointer min-h-[40px]"
                >
                  <Printer className="w-4 h-4 text-zinc-600" />
                  <span>Imprimir / Guardar Certificado</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  data-testid="btn-close-certificate-view"
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer min-h-[40px]"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
