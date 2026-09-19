import { Money } from './Money.js';

export class SettlementLedger {
    constructor(patientId, advanceTotal = Money.zero('COP')) {
        this.patientId = patientId;
        this.advanceTotal = advanceTotal;
        this.expenses = [];
        this.guideHoursTotal = 0;
        this.guideHonoraryTotal = Money.zero('COP');
        this.transportTotal = Money.zero('COP');
        this.outOfPocketTotal = Money.zero('COP');
    }

    calculateFromEvents(events = [], extraTickets = []) {
        this.guideHoursTotal = 0;
        this.guideHonoraryTotal = Money.zero('COP');
        this.transportTotal = Money.zero('COP');
        this.outOfPocketTotal = Money.zero('COP');

        events.forEach(evt => {
            if (evt.costType === 'TRANSPORTE') {
                this.transportTotal = this.transportTotal.add(evt.cost);
            } else if (evt.costType === 'HONORARIO_GUIA') {
                this.guideHoursTotal += evt.hours;
                this.guideHonoraryTotal = this.guideHonoraryTotal.add(evt.cost);
            } else if (evt.costType === 'CAJA_MENOR' || evt.costType === 'FARMACIA') {
                this.outOfPocketTotal = this.outOfPocketTotal.add(evt.cost);
            }
        });

        extraTickets.forEach(ticket => {
            const ticketMoney = Money.fromUnits(ticket.amountUnits || 0, 'COP');
            this.outOfPocketTotal = this.outOfPocketTotal.add(ticketMoney);
        });

        this.totalCuentaCobro = this.transportTotal.add(this.guideHonoraryTotal).add(this.outOfPocketTotal);
        this.netBalance = this.totalCuentaCobro.subtract(this.advanceTotal);

        return {
            transportTotal: this.transportTotal,
            guideHoursTotal: this.guideHoursTotal,
            guideHonoraryTotal: this.guideHonoraryTotal,
            outOfPocketTotal: this.outOfPocketTotal,
            totalCuentaCobro: this.totalCuentaCobro,
            advanceTotal: this.advanceTotal,
            netBalance: this.netBalance,
            isAgentPayable: this.netBalance.isPositive() // Si es positivo, se le transfiere a la guía/chofer
        };
    }
}
