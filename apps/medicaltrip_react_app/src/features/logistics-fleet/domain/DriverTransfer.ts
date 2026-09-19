import { Money } from '@/core/domain';
import { OperativeTerritory } from '@/core/domain';

export type VehicleClass = 'SEDAN' | 'VAN_XL' | 'DUSTER';
export type RouteClass = 'AIRPORT_ARRIVAL' | 'AIRPORT_DEPARTURE' | 'INTRA_CITY_SHORT' | 'INTRA_CITY_LONG' | 'OUT_OF_TOWN';

export class DriverTransfer {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly driverId: string;
  public readonly driverName: string;
  public readonly vehicleType: VehicleClass;
  public readonly routeType: RouteClass;
  public readonly origin: OperativeTerritory;
  public readonly destination: OperativeTerritory;
  public readonly scheduledTime: string;
  public readonly baseRate: Money;
  public readonly nightSurcharge: Money;
  public readonly waitingTimeFee: Money;
  public readonly parkingFee: Money;
  public readonly status: 'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

  constructor(params: {
    id: string;
    bookingId: string;
    driverId: string;
    driverName: string;
    vehicleType?: VehicleClass;
    routeType: RouteClass;
    origin: OperativeTerritory;
    destination: OperativeTerritory;
    scheduledTime: string;
    baseRate: Money;
    nightSurcharge?: Money;
    waitingTimeFee?: Money;
    parkingFee?: Money;
    status?: 'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  }) {
    this.id = params.id;
    this.bookingId = params.bookingId;
    this.driverId = params.driverId;
    this.driverName = params.driverName;
    this.vehicleType = params.vehicleType || 'SEDAN';
    this.routeType = params.routeType;
    this.origin = params.origin;
    this.destination = params.destination;
    this.scheduledTime = params.scheduledTime;
    this.baseRate = params.baseRate;
    this.nightSurcharge = params.nightSurcharge || Money.zero();
    this.waitingTimeFee = params.waitingTimeFee || Money.zero();
    this.parkingFee = params.parkingFee || Money.zero();
    this.status = params.status || 'CONFIRMED';
    Object.freeze(this);
  }

  public calculateTotalCost(): Money {
    return this.baseRate
      .add(this.nightSurcharge)
      .add(this.waitingTimeFee)
      .add(this.parkingFee);
  }
}
