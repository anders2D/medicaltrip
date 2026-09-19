import React, { useRef, useState, useEffect } from 'react';
import { Patient } from '../../../domain/entities/Patient';
import { ItineraryMilestone } from '../../../domain/entities/ItineraryMilestone';

export interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  milestone?: ItineraryMilestone | null;
  onSaveSignature: (signatureDataUrl: string) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  patient,
  milestone,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<'#1d4ed8' | '#0f172a'>('#1d4ed8');
  const [pointsCount, setPointsCount] = useState(0);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      setPointsCount(0);
    }
  }, [isOpen, penColor]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setPointsCount((prev) => prev + 1);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setPointsCount((prev) => prev + 1);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setPointsCount(0);
  };

  const handleAutoSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.bezierCurveTo(100, 30, 200, 150, 300, 70);
    ctx.bezierCurveTo(350, 40, 400, 130, 480, 90);
    ctx.stroke();
    setPointsCount(45);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      data-testid="digital-signature-modal"
    >
      <div className="flex w-full max-w-xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">✍️</span>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Certificación de Conformidad & Firma Digital
              </h3>
              <p className="text-xs text-zinc-400">
                Paciente: {patient.fullName} ({patient.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Legal statement */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">
            <span className="font-bold text-zinc-800 dark:text-zinc-200">Declaración de Conformidad: </span>
            "Certifico que recibí a entera satisfacción los servicios médicos, de transporte y acompañamiento bilingüe estipulados en este itinerario."
            {milestone && (
              <div className="mt-1 font-semibold text-sky-700 dark:text-sky-300">
                Hito Asignado: {milestone.title} ({milestone.location.rawName})
              </div>
            )}
          </div>

          {/* Canvas Wrapper */}
          <div className="relative rounded-xl border-2 border-zinc-300 bg-white p-1 dark:border-zinc-700 shadow-inner">
            <canvas
              ref={canvasRef}
              width={520}
              height={180}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full touch-none cursor-crosshair rounded-lg bg-white"
              data-testid="signature-canvas"
            />
            <div className="absolute bottom-3 left-4 text-[10px] text-zinc-400 select-none pointer-events-none">
              ✕ Firma del Paciente / Acompañante Autorizado
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Tinta:</span>
              <button
                type="button"
                onClick={() => setPenColor('#1d4ed8')}
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white text-xs ${
                  penColor === '#1d4ed8' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
                title="Tinta Azul"
              />
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white text-xs ${
                  penColor === '#0f172a' ? 'ring-2 ring-zinc-700 ring-offset-2' : ''
                }`}
                title="Tinta Negra"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoSign}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                title="Simular trazo automático"
              >
                🪄 Auto-Firmar
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-rose-400"
              >
                🔄 Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs text-zinc-400">
            {pointsCount} puntos de trazo capturados
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500"
              data-testid="signature-submit-btn"
            >
              💾 Certificar y Guardar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
