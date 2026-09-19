import { Money } from './Money.js';
import { OperativeTerritory } from './OperativeTerritory.js';

export class PatientBooking {
    constructor({
        id,
        code,
        name,
        country,
        paxCount = 1,
        language = 'Papiamento',
        hotel,
        startDate,
        endDate,
        advanceTotalUnits = 0,
        companionName = ''
    }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.country = country;
        this.paxCount = Number(paxCount) || 1;
        this.language = language;
        
        // Invariante de territorio para el hotel
        this.hotelTerritory = new OperativeTerritory(hotel);
        this.hotel = this.hotelTerritory.name;
        
        this.startDate = new Date(startDate);
        this.endDate = new Date(endDate);
        this.advanceTotal = Money.fromUnits(advanceTotalUnits, 'COP');
        this.companionName = companionName;
    }
}
