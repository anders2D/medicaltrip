/**
 * Medical Trip Colombia S.A.S. - ReceiptOcrModal
 * Modal for scanning, parsing, and itemizing pharmacy, toll, lab, and transport receipts via simulated OCR.
 * Features:
 * - Direct camera capture and drag-and-drop file upload.
 * - 1-Click quick presets for common medical trip vendors (Cruz Verde, Pasteur, Túnel Oriente, CIMA).
 * - Animated laser scan beam with thermal contrast enhancement and optical character extraction.
 * - Editable parsed metadata (Vendor, NIT, Date, Category, Description, Itemized Lines in BigInt Cents).
 * - Single-Writer CQRS ledger debit commit via SettleExpenseUseCase and Dexie IndexedDB binary storage.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Building2,
  Calendar,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Modal } from '@/core/ui/Modal';
import { Button } from '@/core/ui/Button';
import { Badge } from '@/core/ui/Badge';
import { Input } from '@/core/ui/Input';
import { Select } from '@/core/ui/Select';
import { useAppContext } from '@/presentation/state/AppContext';
import {
  SimulatedReceiptOCRAdapter,
  KNOWN_RECEIPT_PRESETS,
  ReceiptPresetDefinition,
} from '../infrastructure/SimulatedReceiptOCRAdapter';
import { SettleExpenseUseCase } from '../../../application/use-cases/SettleExpenseUseCase';
import { Money } from '@/core/domain';
import { ExpenseCategory, ReceiptExpense } from '../domain/ReceiptExpense';
import { OCRResult, OCRParsedItem } from '../../../domain/ports/IOCRPort';

export interface ReceiptOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproved?: (expense: ReceiptExpense) => void;
}

type ScanStep = 'IDLE' | 'SCANNING' | 'PARSED' | 'SAVING';

export const ReceiptOcrModal: React.FC<ReceiptOcrModalProps> = ({
  isOpen,
  onClose,
  onApproved,
}) => {
  const { activeBooking, storagePort, recalculateSettlement, refreshData } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ScanStep>('IDLE');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [fileBlobData, setFileBlobData] = useState<string | null>(null);

  // Parsed Form State
  const [vendorName, setVendorName] = useState<string>('');
  const [vendorTaxId, setVendorTaxId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('PHARMACY');
  const [description, setDescription] = useState<string>('');
  const [items, setItems] = useState<OCRParsedItem[]>([]);
  const [totalCents, setTotalCents] = useState<bigint>(0n);
  const [confidence, setConfidence] = useState<number>(0.95);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ocrAdapter = useRef(new SimulatedReceiptOCRAdapter()).current;

  const resetForm = useCallback(() => {
    setStep('IDLE');
    setScanProgress(0);
    setScanMessage('');
    setSelectedFileName('');
    setFileBlobData(null);
    setVendorName('');
    setVendorTaxId('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('PHARMACY');
    setDescription('');
    setItems([]);
    setTotalCents(0n);
    setConfidence(0.95);
    setErrorMessage(null);
  }, []);

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  // Perform Simulated OCR process with animated scan steps
  const runOcrProcess = async (input: Blob | string, nameHint: string) => {
    setStep('SCANNING');
    setSelectedFileName(nameHint);
    setErrorMessage(null);
    setScanProgress(15);
    setScanMessage('Analizando imagen y mejorando contraste térmico...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setScanProgress(45);
      setScanMessage('Extrayendo encabezado fiscal (NIT y Razón Social)...');

      await new Promise((r) => setTimeout(r, 400));
      setScanProgress(75);
      setScanMessage('Reconociendo líneas de artículos y valores en COP...');

      const result: OCRResult = await ocrAdapter.recognizeReceipt(input);

      await new Promise((r) => setTimeout(r, 300));
      setScanProgress(100);
      setScanMessage('¡Lectura OCR completada!');

      // Populate form state
      setVendorName(result.vendorName || 'Establecimiento Médico / Farmacia');
      setVendorTaxId(result.vendorTaxId || '');
      setDate(result.date || new Date().toISOString().split('T')[0]);
      setItems(result.items);
      setTotalCents(result.totalAmount.cents);
      setConfidence(result.confidence);
      setDescription(`Compra en ${result.vendorName || 'Farmacia'}`);

      // Auto-assign category
      const lowerVendor = (result.vendorName || '').toLowerCase();
      if (lowerVendor.includes('peaje') || lowerVendor.includes('túnel') || lowerVendor.includes('tunel')) {
        setCategory('TOLL');
      } else if (lowerVendor.includes('copago') || lowerVendor.includes('cima') || lowerVendor.includes('clofán') || lowerVendor.includes('clofan')) {
        setCategory('MEDICAL_LAB');
      } else if (lowerVendor.includes('parqueadero') || lowerVendor.includes('parking')) {
        setCategory('PARKING');
      } else {
        setCategory('PHARMACY');
      }

      setStep('PARSED');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al procesar el recibo.');
      setStep('IDLE');
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset: ReceiptPresetDefinition | undefined = KNOWN_RECEIPT_PRESETS[presetKey];
    if (!preset) return;
    runOcrProcess(preset.key, `${preset.name}.png`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFileBlobData(dataUrl);
      runOcrProcess(file, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setFileBlobData(dataUrl);
        runOcrProcess(file, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleApproveAndSettle = async () => {
    if (!activeBooking) {
      setErrorMessage('No hay una reserva activa seleccionada.');
      return;
    }

    if (totalCents <= 0n) {
      setErrorMessage('El monto total debe ser mayor a $0 COP.');
      return;
    }

    setStep('SAVING');
    setErrorMessage(null);

    try {
      const settleUseCase = new SettleExpenseUseCase(storagePort, storagePort);

      const command = {
        bookingId: activeBooking.code,
        category,
        description: description || `Gasto en ${vendorName}`,
        amount: Money.fromCents(totalCents, 'COP'),
        vendorName,
        vendorTaxId,
        receiptBlobData: fileBlobData || undefined,
        date,
        audited: true,
        status: 'APPROVED' as const,
      };

      const result = await settleUseCase.execute(command);

      await recalculateSettlement();
      await refreshData();

      if (onApproved) {
        onApproved(result.expense);
      }

      handleModalClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al liquidar el recibo.');
      setStep('PARSED');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Escanear y Liquidar Recibo OCR"
      subtitle="Extracción óptica inteligente de comprobantes de farmacia, copagos y peajes"
      size="lg"
    >
      <div data-testid="receipt-ocr-modal" className="space-y-4">
        {errorMessage && (
          <div
            data-testid="ocr-error-banner"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: IDLE / DROPZONE & PRESETS */}
        {step === 'IDLE' && (
          <div className="space-y-4">
            {/* Quick Presets Bar */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                Plantillas y Recibos Frecuentes (1-Click Demo)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(KNOWN_RECEIPT_PRESETS).map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    data-testid={`preset-btn-${preset.key}`}
                    onClick={() => handlePresetSelect(preset.key)}
                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300 text-left transition-all flex items-start justify-between cursor-pointer min-h-[44px]"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">{preset.vendorName}</div>
                    </div>
                    <Badge variant="emerald" size="sm">
                      {Money.fromCents(preset.totalCents, 'COP').formatCOP()}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Dropzone & Mobile Camera Trigger */}
            <div className="space-y-2">
              <div
                data-testid="ocr-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-6 text-center cursor-pointer bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-zinc-900">
                  Arrastra tu foto de recibo o haz clic para seleccionar
                </div>
                <p className="text-xs text-zinc-600 mt-1 font-medium">
                  Soporta tickets térmicos PNG, JPG, JPEG o PDF hasta 10MB
                </p>
              </div>

              {/* Mobile Direct Camera Trigger CTA */}
              <div className="flex sm:hidden justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full min-h-[44px] text-xs font-semibold text-zinc-800 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Tomar Foto con Cámara del Móvil</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SCANNING ANIMATION */}
        {step === 'SCANNING' && (
          <div data-testid="ocr-scanning-container" className="py-8 px-4 text-center space-y-4">
            <div className="relative w-24 h-28 mx-auto bg-zinc-100 border border-zinc-200/80 rounded-xl flex items-center justify-center overflow-hidden shadow-xs">
              <FileText className="w-12 h-12 text-zinc-400" />
              {/* Laser scanner line animation */}
              <div
                className="absolute inset-x-0 h-1.5 bg-emerald-500 shadow-[0_0_12px_#10b981] animate-bounce top-0"
                style={{ animationDuration: '1.2s' }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-bold text-zinc-900 flex items-center justify-center gap-2">
                <ScanLine className="w-4 h-4 text-emerald-600 animate-spin" />
                Escaneando: {selectedFileName}
              </div>
              <div className="text-xs text-zinc-600">{scanMessage}</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden border border-zinc-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 3 & 4: PARSED / APPROVE FORM */}
        {(step === 'PARSED' || step === 'SAVING') && (
          <div data-testid="ocr-parsed-form" className="space-y-4">
            {/* Header / Confidence banner */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Recibo Extraído Exitosamente
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium">
                    NIT y totales auditados con {Math.round(confidence * 100)}% de confianza
                  </div>
                </div>
              </div>
              <Badge variant="emerald" size="sm">
                OCR Verificado
              </Badge>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Establecimiento / Proveedor"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Ej. Droguerías Cruz Verde"
                prefixIcon={<Building2 className="w-4 h-4" />}
                required
              />
              <Input
                label="NIT / Identificación Fiscal"
                value={vendorTaxId}
                onChange={(e) => setVendorTaxId(e.target.value)}
                placeholder="Ej. 800.149.695-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Fecha del Gasto"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                prefixIcon={<Calendar className="w-4 h-4" />}
                required
              />
              <Select
                label="Categoría de Liquidación"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                options={[
                  { value: 'PHARMACY', label: '💊 Farmacia & Medicamentos' },
                  { value: 'MEDICAL_LAB', label: '🧪 Laboratorio Clínico / Copago' },
                  { value: 'TOLL', label: '🛣️ Peajes Viales' },
                  { value: 'PARKING', label: '🅿️ Parqueadero Clínico' },
                  { value: 'MEAL_SUBSIDY', label: '🍽️ Subsidio Alimentación' },
                  { value: 'OTHER', label: '📦 Otros Gastos Terreno' },
                ]}
              />
            </div>

            <Input
              label="Descripción / Justificación"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del gasto..."
              required
            />

            {/* Itemized Items Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Desglose de Artículos Extraídos ({items.length})
                </span>
                <span className="text-xs text-zinc-600 font-medium">Valores en COP</span>
              </div>
              <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-700 font-semibold">
                    <tr>
                      <th className="p-2 pl-3">Descripción</th>
                      <th className="p-2 text-center w-14">Cant.</th>
                      <th className="p-2 pr-3 text-right">Valor COP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/60">
                        <td className="p-2 pl-3 font-medium text-zinc-900">{item.description}</td>
                        <td className="p-2 text-center text-zinc-600">{item.quantity || 1}</td>
                        <td className="p-2 pr-3 text-right font-mono tabular-nums font-semibold text-zinc-950">
                          {item.amount.formatCOP()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Row */}
            <div className="p-3.5 bg-zinc-100 rounded-xl flex items-center justify-between border border-zinc-200">
              <div>
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                  Total a Liquidar
                </span>
                <span className="text-xs text-zinc-600">
                  Reserva: <strong className="text-zinc-900">{activeBooking?.code}</strong>
                </span>
              </div>
              <div className="text-xl font-extrabold text-zinc-950 font-mono tabular-nums">
                {Money.fromCents(totalCents, 'COP').formatCOP()}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={resetForm}
                disabled={step === 'SAVING'}
                className="min-h-[44px] px-4 text-xs font-semibold"
              >
                Volver a Escanear
              </Button>
              <Button
                variant="primary"
                size="sm"
                data-testid="ocr-approve-btn"
                onClick={handleApproveAndSettle}
                isLoading={step === 'SAVING'}
                className="min-h-[44px] px-4 text-xs font-semibold"
              >
                Aprobar & Registrar Gasto
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReceiptOcrModal;
