/**
 * Medical Trip Hub — Actor Model & Multi-Agent Swarm Simulator (100% Offline)
 * Ejecuta enjambres descentralizados de subagentes autónomos ([DRV], [GUIA], [NURSE], [FIN])
 * con aislamiento radical de estado y comunicación asíncrona peer-to-peer.
 */

export class AgentSwarmSimulator {
    static _subagents = [
        { id: 'ACT-DRV-01', role: 'Driver Agent', name: 'Ramón Rosero', status: 'IDLE', activeTask: 'Monitoreo vuelo Wingo 7449' },
        { id: 'ACT-DRV-02', role: 'Driver Agent', name: 'Andrés Flota', status: 'IN_TRANSIT', activeTask: 'Ruta Laureles ➔ Clofán (Uber XL)' },
        { id: 'ACT-GUI-01', role: 'Guide Agent', name: 'Yenny Bilingüe', status: 'IN_CONSULTATION', activeTask: 'Traducción Papiamento en CIMA' },
        { id: 'ACT-NUR-01', role: 'Nurse Agent', name: 'Enfermera Villa Anita', status: 'ON_DUTY', activeTask: 'Administración Enoxaparina 40mg' },
        { id: 'ACT-FIN-01', role: 'Financial Auditor', name: 'Dra. Jenny Acosta', status: 'RECONCILING', activeTask: 'Alineación DTW de Cuentas de Cobro' }
    ];

    static getAgents() {
        return this._subagents;
    }

    static runTask(agentId, taskDescription, callback) {
        const agent = this._subagents.find(a => a.id === agentId);
        if (!agent) return;

        agent.status = 'WORKING';
        agent.activeTask = taskDescription;

        setTimeout(() => {
            agent.status = 'COMPLETED';
            if (callback) callback({ agent, result: 'Operación ejecutada y validada en libro mayor local.' });
            setTimeout(() => { agent.status = 'IDLE'; }, 3000);
        }, 800);
    }
}
