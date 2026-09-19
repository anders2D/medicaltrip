import React, { useState } from 'react';
import { ItemizedReceiptOCRAdapter } from '../../../infrastructure/ocr/ItemizedReceiptOCRAdapter';
import { Money } from '../../../domain/values/Money';
import { MoneyDisplay } from '../common/MoneyDisplay';
import { ParsedReceipt } from '../../../application/ports/IReceiptOCRService';

export interface ReceiptOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptProcessed: (data: {
    description: string;
    amount: Money;
    receiptUuid: string;
  }) => void;
}

const PRESET_TICKETS = [
  {
    name: 'Cruz Verde Robledo ($45.000)',
    text: `
      DROGUERIA CRUZ VERDE ROBLEDO S.A.S.
      NIT: 800.149.695-1
      FECHA: 2026-08-20 15:30:00
      1x Ciprofloxacino 500mg x 10 Tabs     $28.500
      1x Gasas Esteriles y Solucion Salina  $16.500
      TOTAL COP: $45.000
    `,
  },
  {
    name: 'Farmacia Pasteur Laureles ($65.000)',
    text: `
      FARMACIA PASTEUR LAURELES
      NIT: 890.900.245-3
      FECHA: 2026-08-21 11:15:00
      1x Amoxicilina + Clavulanato 875mg    $42.000
      1x Analgesico Acetaminofen 1g         $23.000
      TOTAL COP: $65.000
    `,
  },
  {
    name: 'Peaje Túnel de Oriente ($24.800)',
    text: `
      CONCESION TUNEL DE ORIENTE S.A.S.
      NIT: 900.823.111-9
      FECHA: 2026-08-20 09:30:00
      1x Peaje Vehicular Categoria 1        $24.800
      TOTAL COP: $24.800
    `,
  },
];

export const ReceiptOCRModal: React.FC<ReceiptOCRModalProps> = ({
  isOpen,
  onClose,
  onReceiptProcessed,
}) => {
  const [ocrAdapter] = useState(() => new ItemizedReceiptOCRAdapter());
  const [vendorName, setVendorName] = useState('Droguería Cruz Verde Robledo');
  const [taxId, setTaxId] = useState('800.149.695-1');
  const [receiptDate, setReceiptDate] = useState('2026-08-20');
  const [totalAmountCOP, setTotalAmountCOP] = useState<number>(45000);
  const [rawText, setRawText] = useState(PRESET_TICKETS[0].text);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.96);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESET_TICKETS)[0]) => {
    setRawText(preset.text);
    const parsed = ocrAdapter.parseReceiptText(preset.text);
    setVendorName(parsed.vendorName);
    setTaxId(parsed.taxId || '');
    setReceiptDate(parsed.date);
    setTotalAmountCOP(parsed.totalAmount.units);
    setConfidenceScore(parsed.confidenceScore);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const parsed = await ocrAdapter.extractReceiptData(file);
      setVendorName(parsed.vendorName);
      setTaxId(parsed.taxId || '');
      setReceiptDate(parsed.date);
      setTotalAmountCOP(parsed.totalAmount.units);
      setConfidenceScore(parsed.confidenceScore);
      setRawText(parsed.rawText);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveExpense = () => {
    const amount = Money.fromUnits(totalAmountCOP, 'COP');
    const receiptUuid = 'rec-' + Date.now().toString(36);
    onReceiptProcessed({
      description: `Recibo Farmacia: ${vendorName}`,
      amount,
      receiptUuid,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      data-testid="receipt-ocr-modal"
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Captura & OCR de Recibos de Caja Menor
              </h3>
              <p className="text-xs text-zinc-400">
                Extracción automática de facturas y tickets térmicos en terreno
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Presets de Prueba (Facturas Reales de Terreno)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_TICKETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Upload / Camera drag box */}
          <div className="rounded-xl border-2 border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
            <input
              type="file"
              accept="image/*,.txt"
              id="receipt-file-input"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="receipt-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              <span className="text-2xl">📷</span>
              <span>Subir Foto o Arrastrar Ticket de Farmacia</span>
              <span className="text-[10px] text-zinc-400">Formatos: PNG, JPG, WebP o Ticket TXT</span>
            </label>
          </div>

          {/* Extracted Form Fields */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-700">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Datos Extraídos por Motor OCR
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Confianza: {Math.round(confidenceScore * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                  Comercio / Proveedor
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  data-testid="ocr-vendor-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                  NIT / Identificación Tributaria
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                  Fecha del Recibo
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                  Monto Total a Deducir (COP)
                </label>
                <input
                  type="number"
                  step="100"
                  value={totalAmountCOP}
                  onChange={(e) => setTotalAmountCOP(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs font-mono font-bold text-sky-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-sky-300"
                  data-testid="ocr-amount-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveExpense}
            className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500"
            data-testid="ocr-submit-btn"
          >
            💾 Guardar y Deducir de Caja Menor
          </button>
        </div>
      </div>
    </div>
  );
};
