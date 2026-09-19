import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentRole, SwarmMessage } from '../../application/ports/IActorSwarmBus';
import { swarmBus, WebWorkerSwarmBus } from '../../infrastructure/workers/WebWorkerSwarmBus';
import { AuditBlock } from '../../infrastructure/workers/financialAuditorWorker';
import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';

export interface ActorStatus {
  role: AgentRole;
  name: string;
  avatar: string;
  status: 'ONLINE' | 'BUSY' | 'IDLE' | 'OFFLINE';
  activityDescription: string;
  lastPingTime: string;
}

export function useActorSwarm(itinerary?: MedicalItinerary) {
  const [messages, setMessages] = useState<SwarmMessage[]>(() => [...swarmBus.getMessageHistory()]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [actorStatuses, setActorStatuses] = useState<Record<AgentRole, ActorStatus>>({
    DRV: {
      role: 'DRV',
      name: 'Ramón Rosero (Aeroturex)',
      avatar: '🚗',
      status: 'ONLINE',
      activityDescription: 'Flota Sedán / Van Especial en posición',
      lastPingTime: new Date().toLocaleTimeString('es-CO'),
    },
    GUIA: {
      role: 'GUIA',
      name: 'Yenny Roberto (ACP Lead)',
      avatar: '🗣️',
      status: 'ONLINE',
      activityDescription: 'Acompañamiento clínico bilingüe Papiamento/Inglés',
      lastPingTime: new Date().toLocaleTimeString('es-CO'),
    },
    NURSE: {
      role: 'NURSE',
      name: 'Emi Echavarría (Enfermera)',
      avatar: '🩺',
      status: 'ONLINE',
      activityDescription: 'Tomas domiciliarias en ayunas 05:30 AM',
      lastPingTime: new Date().toLocaleTimeString('es-CO'),
    },
    FIN: {
      role: 'FIN',
      name: 'Carolina Cortázar (Auditor)',
      avatar: '🛡️',
      status: 'ONLINE',
      activityDescription: 'Verificación criptográfica SHA-256 en tiempo real',
      lastPingTime: new Date().toLocaleTimeString('es-CO'),
    },
    COORD: {
      role: 'COORD',
      name: 'Jenny Acosta (Coordinador)',
      avatar: '📋',
      status: 'ONLINE',
      activityDescription: 'Gestión de itinerarios médicos y reservas',
      lastPingTime: new Date().toLocaleTimeString('es-CO'),
    },
  });

  // Crypto Audit Hash Chain
  const auditBlocks: AuditBlock[] = useMemo(() => {
    const txs = itinerary ? itinerary.transactions.map((t) => t.toJSON()) : [];
    return swarmBus.buildAuditChain(txs);
  }, [itinerary]);

  const auditVerification = useMemo(() => {
    return swarmBus.verifyAuditChain(auditBlocks);
  }, [auditBlocks]);

  // Subscribe to swarm messages
  useEffect(() => {
    const unsubscribe = swarmBus.subscribe('BROADCAST', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.sender && actorStatuses[msg.sender]) {
        setActorStatuses((prev) => ({
          ...prev,
          [msg.sender]: {
            ...prev[msg.sender],
            status: 'BUSY',
            activityDescription: String((msg.payload as any)?.description || msg.topic),
            lastPingTime: new Date().toLocaleTimeString('es-CO'),
          },
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [actorStatuses]);

  const postAgentMessage = useCallback(
    async (sender: AgentRole, recipient: AgentRole | 'BROADCAST', topic: string, payload: any) => {
      const msg: SwarmMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        sender,
        recipient,
        topic,
        payload,
        timestamp: new Date().toISOString(),
      };

      if (recipient === 'BROADCAST') {
        await swarmBus.broadcast(msg);
      } else {
        await swarmBus.postMessageToAgent(recipient, msg);
      }

      setMessages((prev) => [...prev, msg]);
    },
    []
  );

  const simulateDriverTransfer = useCallback(
    async (pickup: string, dropoff: string, costCOP: number) => {
      await postAgentMessage('DRV', 'FIN', 'TRANSFER_REQUESTED', {
        description: `Traslado solicitado: ${pickup} ➔ ${dropoff}`,
        costCOP,
      });
    },
    [postAgentMessage]
  );

  const simulateGuideShift = useCallback(
    async (guideName: string, hours: number, tier: number) => {
      await postAgentMessage('GUIA', 'FIN', 'SHIFT_COMPLETED', {
        guideName,
        hours,
        tier,
        description: `Turno de ${hours}h completado con subsidio Tier ${tier}`,
      });
    },
    [postAgentMessage]
  );

  return {
    messages,
    actorStatuses,
    auditBlocks,
    auditVerification,
    isDrawerOpen,
    setIsDrawerOpen,
    postAgentMessage,
    simulateDriverTransfer,
    simulateGuideShift,
  };
}
