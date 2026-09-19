import { IItineraryRepository } from '../../../../src/application/ports/IItineraryRepository';
import { MedicalItinerary } from '../../../../src/domain/aggregates/MedicalItinerary';

export class InMemoryItineraryRepository implements IItineraryRepository {
  private readonly items = new Map<string, MedicalItinerary>();

  async getById(id: string): Promise<MedicalItinerary | null> {
    return this.items.get(id) || null;
  }

  async getByBookingCode(code: string): Promise<MedicalItinerary | null> {
    for (const item of this.items.values()) {
      if (item.code.toLowerCase() === code.toLowerCase()) {
        return item;
      }
    }
    return null;
  }

  async save(itinerary: MedicalItinerary): Promise<void> {
    this.items.set(itinerary.id, itinerary);
  }

  async list(): Promise<MedicalItinerary[]> {
    return Array.from(this.items.values());
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  clear(): void {
    this.items.clear();
  }
}
