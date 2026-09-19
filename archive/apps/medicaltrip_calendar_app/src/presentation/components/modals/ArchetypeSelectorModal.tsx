import React from 'react';
import {
  ARCHETYPE_METADATA_LIST,
  ArchetypeMetadata,
} from '../../../infrastructure/archetypes/ArchetypeRegistry';
import { MoneyDisplay } from '../common/MoneyDisplay';

export interface ArchetypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeArchetypeId: string;
  onSelectArchetype: (archetypeId: string) => void;
}

export const ArchetypeSelectorModal: React.FC<ArchetypeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeArchetypeId,
  onSelectArchetype,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      data-testid="archetype-selector-modal"
    >
      <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Seleccionar Arquetipo Operativo Real (Google Drive)
              </h3>
              <p className="text-xs text-zinc-400">
                4 expedientes clínicos reales con datos de transporte, guianza y liquidación determinista
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

        {/* 4 Archetypes Cards Grid */}
        <div className="grid grid-cols-2 gap-4 p-6 overflow-y-auto max-h-[75vh]">
          {ARCHETYPE_METADATA_LIST.map((meta: ArchetypeMetadata) => {
            const isActive = activeArchetypeId.toLowerCase().includes(meta.id.toLowerCase());

            return (
              <div
                key={meta.id}
                onClick={() => {
                  onSelectArchetype(meta.id);
                  onClose();
                }}
                className={`relative flex flex-col justify-between rounded-xl border p-4.5 cursor-pointer transition-all hover:shadow-lg ${
                  isActive
                    ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20 dark:bg-sky-950/20 dark:border-sky-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                }`}
                data-testid={`archetype-card-${meta.id}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {meta.code}
                    </span>
                    <span className="text-xs font-semibold text-zinc-500">
                      🇨🇼 {meta.country} • {meta.paxCount} Pax
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {meta.name}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {meta.description}
                  </p>

                  <div className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span>🏨</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{meta.hotel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🗣️</span>
                      <span>Idioma: {meta.language}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Anticipo Base</span>
                    <div>
                      <MoneyDisplay amountCents={meta.advanceCents} className="text-xs font-bold text-sky-700 dark:text-sky-300" />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {isActive ? 'Activo ✓' : 'Cargar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
