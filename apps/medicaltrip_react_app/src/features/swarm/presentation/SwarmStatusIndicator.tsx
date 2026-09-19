/**
 * Medical Trip Colombia S.A.S. - SwarmStatusIndicator
 * Live micro-indicator displaying decentralized Web Worker swarm health,
 * actor activity pulses, and quick trigger for the diagnostics modal.
 */

import React, { useState } from 'react';
import { Bot, Zap } from 'lucide-react';
import { useSwarmActors } from './hooks/useSwarmActors';
import { SwarmDiagnosticsModal } from './SwarmDiagnosticsModal';

export const SwarmStatusIndicator: React.FC = () => {
  const { actorStatuses, isExecuting } = useSwarmActors();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const actors = [
    { label: 'DRV', status: actorStatuses.DRV_ACTOR?.status || 'READY' },
    { label: 'GUIA', status: actorStatuses.GUIA_ACTOR?.status || 'READY' },
    { label: 'NURSE', status: actorStatuses.NURSE_ACTOR?.status || 'READY' },
    { label: 'FIN', status: actorStatuses.FIN_ACTOR?.status || 'READY' },
  ];

  return (
    <>
      <button
        type="button"
        data-testid="swarm-status-indicator"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 transition-all duration-200 cursor-pointer select-none text-xs active:scale-95 group"
        title="Abrir panel de diagnóstico de Actores Web Workers y SHA-256"
      >
        <div className="flex items-center gap-1">
          <Bot className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-xs text-zinc-800 hidden sm:inline">Swarm</span>
        </div>

        {/* 4 Actor Pulse Dots */}
        <div className="flex items-center gap-1 border-l border-zinc-200 pl-1.5">
          {actors.map(({ label, status }) => {
            const isBusy = status === 'BUSY' || isExecuting;
            const isError = status === 'ERROR';

            return (
              <span
                key={label}
                className="flex items-center gap-0.5"
                title={`Actor [${label}]: ${status}`}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isError
                      ? 'bg-rose-500'
                      : isBusy
                      ? 'bg-sky-400 animate-ping'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-mono font-medium text-zinc-500 uppercase hidden md:inline">
                  {label}
                </span>
              </span>
            );
          })}
        </div>

        <Zap className="w-3 h-3 text-amber-500 opacity-70 group-hover:opacity-100" />
      </button>

      <SwarmDiagnosticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
