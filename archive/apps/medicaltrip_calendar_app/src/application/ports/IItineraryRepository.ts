import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';

export interface IItineraryRepository {
  getById(id: string): Promise<MedicalItinerary | null>;
  getByBookingCode(code: string): Promise<MedicalItinerary | null>;
  save(itinerary: MedicalItinerary): Promise<void>;
  list(): Promise<MedicalItinerary[]>;
  delete(id: string): Promise<void>;
}
