/**
 * Medical Trip Colombia S.A.S. - SwarmDiagnosticsModal
 * Interactive Diagnostics Drawer / Modal for the Decentralized Actor Swarm.
 * Allows executing RPC diagnostic tasks across [DRV], [GUIA], [NURSE], and [FIN] actors,
 * verifying SHA-256 cryptographic chaining, and inspecting CRDT convergence.
 */

import React, { useState } from 'react';
import { Bot, Activity, Zap, RefreshCw, Car, UserCheck, HeartPulse, Scale } from 'lucide-react';
import { Modal } from '@/core/ui/Modal';
import { Button } from '@/core/ui/Button';
import { Badge } from '@/core/ui/Badge';
import { useSwarmActors } from './hooks/useSwarmActors';
import { useAppContext } from '@/presentation/state/AppContext';

export interface SwarmDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwarmDiagnosticsModal: React.FC<SwarmDiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const {
    statusInfo,
    actorStatuses,
    isExecuting,
    calculateFare,
    calculateGuideFee,
    calculateFastingWindow,
    auditSettlement,
    refreshStatus,
  } = useSwarmActors();

  const { activeBooking, settlement } = useAppContext();

  const [diagnosticLog, setDiagnosticLog] = useState<string | null>(null);

  const runDriverTest = async () => {
    try {
      const res = await calculateFare({
        tripType: 'AIRPORT_JMC_MEDELLIN',
        vehicleType: 'VAN_XL',
        paxCount: activeBooking?.paxCount || 5,
        origin: 'Aeropuerto Internacional JMC (Rionegro)',
        destination: activeBooking?.hotelName || 'Hotel Inntu Laureles',
      });
      setDiagnosticLog(
        `[DRV_ACTOR SUCCESS]\n` +
        `• Tarifa Base: $${res.baseFareCOP.toLocaleString('es-CO')} COP\n` +
        `• Recargo Nocturno: $${res.nightSurchargeCOP.toLocaleString('es-CO')} COP\n` +
        `• Total Liquidado: $${res.totalFareCOP.toLocaleString('es-CO')} COP\n` +
        `• Distancia Estimada: ${res.distanceKm} km\n` +
        `• Notas: ${res.notes}`
      );
    } catch (e: unknown) {
      setDiagnosticLog(`[DRV_ACTOR ERROR] ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const runGuideTest = async () => {
    try {
      const res = await calculateGuideFee({
        hours: 6.5,
        includePrepAllowance: true,
      });
      setDiagnosticLog(
        `[GUIA_ACTOR SUCCESS]\n` +
        `• Horas Turno: ${res.hours}h @ $${res.hourlyRateCOP.toLocaleString('es-CO')}/h\n` +
        `• Base Guianza: $${res.baseFeeCOP.toLocaleString('es-CO')} COP\n` +
        `• Prep Allowance: $${res.prepAllowanceCOP.toLocaleString('es-CO')} COP\n` +
        `• Subsidio Alimentación: $${res.mealSubsidyCOP.toLocaleString('es-CO')} COP (${res.mealSubsidyTier})\n` +
        `• Total Honorarios: $${res.totalGuideFeeCOP.toLocaleString('es-CO')} COP`
      );
    } catch (e: unknown) {
      setDiagnosticLog(`[GUIA_ACTOR ERROR] ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const runNurseTest = async () => {
    try {
      const res = await calculateFastingWindow({
        labAppointmentIso: '2026-08-25T07:30:00.000Z',
        testTypes: ['GLICEMIA', 'PERFIL_LIPIDICO', 'PT_INR'],
      });
      setDiagnosticLog(
        `[NURSE_ACTOR SUCCESS]\n` +
        `• Cita Laboratorio: ${res.labAppointmentIso}\n` +
        `• Horas Ayuno Requeridas: ${res.fastingHoursRequired}h\n` +
        `• Inicio Ayuno Estricto: ${res.fastingStartIso}\n` +
        `• Corte Absoluto de Agua: ${res.waterCutoffIso}\n` +
        `• Checkpoints Activos: ${res.checkpoints.length} hitos clínicos`
      );
    } catch (e: unknown) {
      setDiagnosticLog(`[NURSE_ACTOR ERROR] ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const runFinTest = async () => {
    try {
      const res = await auditSettlement({
        bookingId: activeBooking?.code || 'RVA-DEMO',
        fleetTaxisCents: settlement?.totalFleetTaxis.cents || 16000000n,
        guideFeesCents: settlement?.totalGuideFees.cents || 14500000n,
        expensesCents: settlement?.totalExpenses.cents || 8500000n,
        advancesCents: settlement?.totalAdvances.cents || 35000000n,
      });
      setDiagnosticLog(
        `[FIN_ACTOR SUCCESS]\n` +
        `• Reserva: ${res.bookingId}\n` +
        `• Total Débitos: ${res.formattedDebits}\n` +
        `• Total Créditos (Anticipos): ${res.formattedCredits}\n` +
        `• Saldo Neto: ${res.formattedNetBalance}\n` +
        `• Estado Auditoría: ${res.status}\n` +
        `• Invariante Aritmética: ${res.auditPassed ? 'PASÓ (0.00 DISCREPANCIA)' : 'FALLÓ'}`
      );
    } catch (e: unknown) {
      setDiagnosticLog(`[FIN_ACTOR ERROR] ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const actorsList = [
    { role: 'DRV_ACTOR', name: 'Driver Actor [DRV]', icon: Car, desc: 'Rutas, tarifas JMC, recargos y distancias Haversine' },
    { role: 'GUIA_ACTOR', name: 'Guide Actor [GUIA]', icon: UserCheck, desc: 'Honorarios $15.5k/h, subsidios $8k-$45k e idiomas' },
    { role: 'NURSE_ACTOR', name: 'Nurse Actor [NURSE]', icon: HeartPulse, desc: 'Ventana ayuno 8h, toma domicilio $65k y prequirúrgico' },
    { role: 'FIN_ACTOR', name: 'Financial Auditor [FIN]', icon: Scale, desc: 'SHA-256 Ledger, balance en integer cents y sellos' },
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Swarm de Actores Web Workers & Ledger SHA-256"
      subtitle="Concurrencia descentralizada punto a punto, CRDTs y auditoría criptográfica"
      size="lg"
    >
      <div data-testid="swarm-diagnostics-modal" className="space-y-4">
        {/* Top Swarm Summary Banner */}
        <div className="p-3 bg-zinc-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Mesh P2P de Actores</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-zinc-400">
                {statusInfo.isWorkerEnvironment ? 'Web Workers Nativos (Multi-hilo)' : 'Direct Swarm Bus (Node/Vitest Engine)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 uppercase">Mensajes Enrutados</div>
              <div className="font-mono font-bold text-sky-300">{statusInfo.totalMessagesRouted}</div>
            </div>
            <div className="text-right border-l border-zinc-700 pl-3">
              <div className="text-[10px] text-zinc-400 uppercase">PNCounter CRDT</div>
              <div className="font-mono font-bold text-emerald-300">+{statusInfo.crdtPNCounterValue}</div>
            </div>
            <div className="text-right border-l border-zinc-700 pl-3">
              <div className="text-[10px] text-zinc-400 uppercase">LWWSet CRDT</div>
              <div className="font-mono font-bold text-amber-300">{statusInfo.crdtLWWSetSize} ops</div>
            </div>
          </div>
        </div>

        {/* Actor Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {actorsList.map(({ role, name, icon: Icon, desc }) => {
            const node = actorStatuses[role];
            return (
              <div
                key={role}
                className="p-3 bg-white border border-zinc-200 rounded-xl flex items-start gap-3 shadow-2xs hover:border-zinc-300 transition-colors"
              >
                <div className="p-2 rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-100">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-zinc-950 truncate">{name}</span>
                    <Badge variant={node?.status === 'READY' || node?.status === 'IDLE' ? 'success' : node?.status === 'BUSY' ? 'sky' : 'danger'} size="sm">
                      {node?.status || 'READY'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-600 line-clamp-1 mt-0.5">{desc}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 font-mono">
                    <span>Msgs: {node?.messagesProcessed || 0}</span>
                    <span>&bull;</span>
                    <span>Activo: {new Date(node?.lastActiveTimestamp || Date.now()).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Diagnostic Execution Bar */}
        <div className="border-t border-zinc-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Ejecutar Diagnóstico en Tiempo Real</span>
            </span>
            <Button variant="ghost" size="sm" onClick={refreshStatus} className="text-xs text-zinc-600 py-0.5 px-1.5">
              <RefreshCw className="w-3 h-3 mr-1" />
              Actualizar
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runDriverTest}
              isLoading={isExecuting}
              data-testid="test-driver-actor-btn"
              className="text-xs justify-center text-zinc-800"
            >
              <Car className="w-3.5 h-3.5 mr-1 text-sky-600" />
              Tarifa JMC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runGuideTest}
              isLoading={isExecuting}
              data-testid="test-guide-actor-btn"
              className="text-xs justify-center text-zinc-800"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Subsidio Guía
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runNurseTest}
              isLoading={isExecuting}
              data-testid="test-nurse-actor-btn"
              className="text-xs justify-center text-zinc-800"
            >
              <HeartPulse className="w-3.5 h-3.5 mr-1 text-teal-600" />
              Ayuno 8h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runFinTest}
              isLoading={isExecuting}
              data-testid="test-fin-actor-btn"
              className="text-xs justify-center text-zinc-800"
            >
              <Scale className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Auditar FIN
            </Button>
          </div>
        </div>

        {/* Diagnostic Output Log Box */}
        {diagnosticLog && (
          <div className="bg-zinc-950 text-zinc-100 rounded-xl p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-zinc-800 animate-in fade-in">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-zinc-800 text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-emerald-400" />
                Respuesta del Actor Swarm
              </span>
              <button
                type="button"
                onClick={() => setDiagnosticLog(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                Limpiar
              </button>
            </div>
            <div>{diagnosticLog}</div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-2 border-t border-zinc-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
