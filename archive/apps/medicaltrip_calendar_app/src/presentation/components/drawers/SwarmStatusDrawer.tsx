import React from 'react';
import { useActorSwarm } from '../../hooks/useActorSwarm';
import { MedicalItinerary } from '../../../domain/aggregates/MedicalItinerary';

export interface SwarmStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: MedicalItinerary;
}

export const SwarmStatusDrawer: React.FC<SwarmStatusDrawerProps> = ({
  isOpen,
  onClose,
  itinerary,
}) => {
  const {
    actorStatuses,
    auditBlocks,
    auditVerification,
    messages,
    simulateDriverTransfer,
    simulateGuideShift,
  } = useActorSwarm(itinerary);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40 backdrop-blur-sm"
      data-testid="swarm-status-drawer"
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-900 dark:border-l dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Enjambre Multi-Agente & Web Workers
              </h3>
              <p className="text-[11px] text-zinc-400">
                Canales MessageChannel P2P + SHA-256 Blockchain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Cryptographic SHA-256 Chain Verification Badge */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Cadena Criptográfica Inmutable
                </span>
              </div>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {auditVerification.valid ? 'INTEGRIDAD 100%' : 'ALTERADA'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800 dark:text-emerald-300">
              {auditBlocks.length} bloques auditados mediante SHA-256 en Web Worker [FIN]. Cero posibilidad de alteración retroactiva.
            </p>
          </div>

          {/* Actor Status Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
              Estado de los Subagentes de Campo
            </h4>
            <div className="space-y-2">
              {Object.values(actorStatuses).map((actor) => (
                <div
                  key={actor.role}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{actor.avatar}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {actor.name}
                        </span>
                        <span className="rounded bg-zinc-200 px-1 py-0.2 text-[9px] font-extrabold dark:bg-zinc-700">
                          [{actor.role}]
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {actor.activityDescription}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {actor.status}
                    </span>
                    <div className="mt-0.5 text-[9px] font-mono text-zinc-400">
                      {actor.lastPingTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Swarm Interactivity */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Simulador de Mensajes Swarm
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => simulateDriverTransfer('Hotel Inntu', 'Clínica Clofán', 50000)}
                className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                🚗 Ping Traslado [DRV]
              </button>
              <button
                type="button"
                onClick={() => simulateGuideShift('Yenny Roberto', 4.0, 2)}
                className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                🗣️ Ping Turno [GUIA]
              </button>
            </div>
          </div>

          {/* Swarm Messages Log Stream */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Registro de Mensajes P2P ({messages.length})
            </h4>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-950 p-3 font-mono text-[11px] text-emerald-400 space-y-1.5">
              {messages.length === 0 ? (
                <div className="text-zinc-500">Sin mensajes en el bus...</div>
              ) : (
                messages.slice(-10).map((msg, i) => (
                  <div key={i} className="truncate">
                    <span className="text-zinc-400">[{msg.sender}➔{msg.recipient}]</span>{' '}
                    <span className="text-sky-300 font-bold">{msg.topic}</span>:{' '}
                    <span>{JSON.stringify(msg.payload)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
