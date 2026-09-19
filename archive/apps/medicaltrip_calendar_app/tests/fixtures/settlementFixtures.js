/**
 * Test Fixtures: Deterministic Financial Settlement Scenarios
 * Ground-truth calculations for multi-day, multi-expense medical trips.
 */

export const SETTLEMENT_SCENARIOS = {
    STANDARD_RVA171_FULL: {
        patientId: 'rva171',
        advanceUnits: 2098100,
        advanceCents: 209810000n,
        events: [
            { costType: 'TRANSPORTE', costUnits: 160000, costCents: 16000000n },
            { costType: 'HONORARIO_GUIA', hours: 2.5, costUnits: 38750, costCents: 3875000n },
            { costType: 'CAJA_MENOR', costUnits: 12000, costCents: 1200000n },
            { costType: 'HONORARIO_GUIA', hours: 8.0, costUnits: 124000, costCents: 12400000n },
            { costType: 'FARMACIA', costUnits: 85000, costCents: 8500000n }
        ],
        extraTickets: [
            { amountUnits: 65000, amountCents: 6500000n }
        ],
        expected: {
            transportUnits: 160000,
            guideHours: 10.5,
            guideHonoraryUnits: 162750,
            outOfPocketUnits: 162000, // 12k + 85k + 65k
            totalCuentaCobroUnits: 484750,
            netBalanceUnits: -1613350, // 484,750 - 2,098,100
            isAgentPayable: false
        }
    },
    RVA282_CARDIO_SCENARIO: {
        patientId: 'rva282',
        advanceUnits: 1200000,
        advanceCents: 120000000n,
        events: [
            { costType: 'TRANSPORTE', costUnits: 145000, costCents: 14500000n },
            { costType: 'HONORARIO_GUIA', hours: 3.0, costUnits: 46500, costCents: 4650000n }
        ],
        extraTickets: [
            { amountUnits: 32000, amountCents: 3200000n } // Farmacia anticoagulante
        ],
        expected: {
            transportUnits: 145000,
            guideHours: 3.0,
            guideHonoraryUnits: 46500,
            outOfPocketUnits: 32000,
            totalCuentaCobroUnits: 223500,
            netBalanceUnits: -976500, // 223,500 - 1,200,000
            isAgentPayable: false
        }
    },
    OVERSPENT_DEFICIT_SCENARIO: {
        patientId: 'rva999',
        advanceUnits: 500000,
        advanceCents: 50000000n,
        events: [
            { costType: 'TRANSPORTE', costUnits: 350000, costCents: 35000000n },
            { costType: 'HONORARIO_GUIA', hours: 12.0, costUnits: 186000, costCents: 18600000n },
            { costType: 'FARMACIA', costUnits: 120000, costCents: 12000000n }
        ],
        extraTickets: [
            { amountUnits: 45000, amountCents: 4500000n }
        ],
        expected: {
            transportUnits: 350000,
            guideHours: 12.0,
            guideHonoraryUnits: 186000,
            outOfPocketUnits: 165000, // 120k + 45k
            totalCuentaCobroUnits: 701000,
            netBalanceUnits: 201000, // 701,000 - 500,000
            isAgentPayable: true
        }
    }
};
