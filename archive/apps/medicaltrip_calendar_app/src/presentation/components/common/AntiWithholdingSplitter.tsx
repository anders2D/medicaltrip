import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Split, ArrowRight } from 'lucide-react';
import { Money } from '../../../domain/values/Money';
import { Guide } from '../../../domain/entities/Guide';

interface AntiWithholdingSplitterProps {
  reservationCode: string;
  guideName: string;
  totalNetBalance: Money;
  totalTransportCost?: Money;
  destinationAccount?: string;
  onApplySplit?: (splitTransfers: Array<{ amount: Money; reference: string; concept: string }>) => void;
}

export const AntiWithholdingSplitter: React.FC<AntiWithholdingSplitterProps> = ({
  reservationCode,
  guideName,
  totalNetBalance,
  totalTransportCost = Money.zero('COP'),
  destinationAccount = '379-194776-96',
  onApplySplit,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSplitActive, setIsSplitActive] = useState(false);

  const thresholdCents = Guide.WITHHOLDING_TAX_THRESHOLD_COP_CENTS; // $523.700 COP
  const exceedsThreshold = totalNetBalance.amountInCents > thresholdCents;

  if (!exceedsThreshold) {
    return null;
  }

  // Calculate smart split:
  // Transfer 1: Transport up to 500k COP or 500k max
  // Transfer 2: Remainder (Honorarios)
  const maxSingleTransferCents = 50000000n; // $500.000 COP (< 523.700)
  
  let transfer1Cents = totalTransportCost.amountInCents > 0n 
    ? (totalTransportCost.amountInCents > maxSingleTransferCents ? maxSingleTransferCents : totalTransportCost.amountInCents)
    : maxSingleTransferCents;

  if (transfer1Cents >= totalNetBalance.amountInCents) {
    transfer1Cents = maxSingleTransferCents;
  }
  const transfer2Cents = totalNetBalance.amountInCents - transfer1Cents;

  const transfer1 = {
    title: 'Transferencia 1 (Transporte Oficial)',
    amount: Money.fromCents(transfer1Cents, 'COP'),
    reference: `${reservationCode} ACP transporte`,
    concept: 'TRANSPORTE',
  };

  const transfer2 = {
    title: 'Transferencia 2 (Saldo Honorarios)',
    amount: Money.fromCents(transfer2Cents, 'COP'),
    reference: `${reservationCode} ACP ${guideName.split(' ')[0] || 'Guia'}`,
    concept: 'HONORARIOS',
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleActivateSplit = () => {
    setIsSplitActive(true);
    if (onApplySplit) {
      onApplySplit([transfer1, transfer2]);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-zinc-900 transition-all dark:bg-amber-500/10 dark:text-zinc-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold tracking-wide uppercase text-amber-800 dark:text-amber-300">
                Tope de Retención Superado
              </h4>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-800 dark:text-amber-200">
                &gt; $523.700 COP
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              Total neto a pagar: <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{totalNetBalance.format()}</strong>. Para evitar retención en la fuente, se recomienda dividir en 2 giros.
            </p>
          </div>
        </div>

        {!isSplitActive ? (
          <button
            type="button"
            onClick={handleActivateSplit}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-amber-700 active:scale-95 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            <Split className="h-3.5 w-3.5" />
            <span>Dividir Pago</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Dividido
          </span>
        )}
      </div>

      {isSplitActive && (
        <div className="mt-3.5 grid grid-cols-1 gap-2.5 pt-3 border-t border-amber-500/20 sm:grid-cols-2">
          {/* Transfer 1 */}
          <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>{transfer1.title}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">&lt; $523.700</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {transfer1.amount.format()}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(transfer1.amount.units.toString(), 1)}
                className="flex min-h-[36px] items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Copiar monto"
              >
                {copiedIndex === 1 ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span className="text-[10px]">Monto</span>
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-1.5 text-[11px] dark:border-zinc-800/60">
              <span className="truncate font-mono text-zinc-600 dark:text-zinc-400">{transfer1.reference}</span>
              <button
                type="button"
                onClick={() => handleCopy(transfer1.reference, 2)}
                className="shrink-0 text-[10px] font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                {copiedIndex === 2 ? 'Copiado' : 'Copiar Ref'}
              </button>
            </div>
          </div>

          {/* Transfer 2 */}
          <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>{transfer2.title}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">&lt; $523.700</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {transfer2.amount.format()}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(transfer2.amount.units.toString(), 3)}
                className="flex min-h-[36px] items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Copiar monto"
              >
                {copiedIndex === 3 ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span className="text-[10px]">Monto</span>
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-1.5 text-[11px] dark:border-zinc-800/60">
              <span className="truncate font-mono text-zinc-600 dark:text-zinc-400">{transfer2.reference}</span>
              <button
                type="button"
                onClick={() => handleCopy(transfer2.reference, 4)}
                className="shrink-0 text-[10px] font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                {copiedIndex === 4 ? 'Copiado' : 'Copiar Ref'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
