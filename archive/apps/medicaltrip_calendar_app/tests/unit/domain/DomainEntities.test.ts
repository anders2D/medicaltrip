import { describe, it, expect } from 'vitest';
import { Patient } from '../../../src/domain/entities/Patient';
import { Booking } from '../../../src/domain/entities/Booking';
import { Provider } from '../../../src/domain/entities/Provider';
import { Hotel } from '../../../src/domain/entities/Hotel';
import { FinancialTransaction } from '../../../src/domain/entities/FinancialTransaction';
import { Money } from '../../../src/domain/values/Money';
import {
  InvariantViolationError,
  InvalidBookingError,
  NonOperativeTerritoryError,
} from '../../../src/domain/errors/DomainErrors';

describe('Domain Entities — Invariants & Integrity', () => {
  describe('Patient Entity (ENT-PAX)', () => {
    it('creates patient with valid attributes and PHI passport hashing', () => {
      const patient = new Patient({
        id: 'ENT-PAX-0171',
        firstName: 'Catia',
        lastName: 'Rodrigues',
        passportHash: 'HASH_SHA256_CATIA',
        country: 'Curazao',
        language: 'Papiamento',
        companionNames: ['Tatiana', 'Mariana'],
      });

      expect(patient.id).toBe('ENT-PAX-0171');
      expect(patient.fullName).toBe('Catia Rodrigues');
      expect(patient.companionNames.length).toBe(2);
      expect(Object.isFrozen(patient)).toBe(true);
    });

    it('throws InvariantViolationError when patient ID or name is missing', () => {
      expect(() => new Patient({ id: '', firstName: 'Catia', lastName: '', passportHash: '', country: 'Curazao', language: 'Papiamento' })).toThrow(InvariantViolationError);
      expect(() => new Patient({ id: 'ENT-PAX-01', firstName: '', lastName: '', passportHash: '', country: 'Curazao', language: 'Papiamento' })).toThrow(InvariantViolationError);
      expect(() => new Patient({ id: 'ENT-PAX-01', firstName: 'Catia', lastName: '', passportHash: '', country: '', language: 'Papiamento' })).toThrow(InvariantViolationError);
    });
  });

  describe('Booking Entity (RVA / CTZ)', () => {
    it('creates valid reservation dossier', () => {
      const booking = new Booking({
        id: 'bkg-01',
        code: 'RVA171-4',
        patientId: 'ENT-PAX-0171',
        paxCount: 5,
        arrivalDate: '2026-08-20T10:00:00Z',
        departureDate: '2026-08-25T18:00:00Z',
        hotelName: 'Hotel Inntu Laureles',
      });

      expect(booking.durationDays).toBe(6);
      expect(booking.paxCount).toBe(5);
      expect(booking.status).toBe('PROGRAMADO');
    });

    it('throws InvariantViolationError if departure is before arrival', () => {
      expect(() => new Booking({
        id: 'bkg-01',
        code: 'RVA171-4',
        patientId: 'ENT-PAX-0171',
        paxCount: 2,
        arrivalDate: '2026-08-25T10:00:00Z',
        departureDate: '2026-08-20T10:00:00Z',
      })).toThrow(InvariantViolationError);
    });

    it('throws InvariantViolationError if paxCount is invalid', () => {
      expect(() => new Booking({
        id: 'bkg-01',
        code: 'RVA171-4',
        patientId: 'ENT-PAX-0171',
        paxCount: 0,
        arrivalDate: '2026-08-20T10:00:00Z',
        departureDate: '2026-08-25T10:00:00Z',
      })).toThrow(InvariantViolationError);
    });
  });

  describe('Provider Entity (CLINIC / LAB)', () => {
    it('creates accredited clinical provider in authorized territory', () => {
      const provider = new Provider({
        id: 'CLINIC-HPTU',
        code: 'HPTU',
        name: 'Hospital Pablo Tobón Uribe',
        category: 'CLINIC',
        address: 'Calle 78B #69-240, Robledo',
        territory: 'Robledo Medellín',
        specialties: ['Gastroenterología', 'Neurología'],
      });

      expect(provider.code).toBe('HPTU');
      expect(provider.territory.canonicalCorridor).toBe('MEDELLIN');
    });

    it('rejects provider located in prohibited zone', () => {
      expect(() => new Provider({
        id: 'CLINIC-MOCOA',
        code: 'MOCOA-CLINIC',
        name: 'Clínica Mocoa',
        category: 'CLINIC',
        address: 'Centro de Mocoa',
        territory: 'Mocoa Putumayo',
        specialties: ['General'],
      })).toThrow(NonOperativeTerritoryError);
    });
  });

  describe('Hotel Entity (HOTEL)', () => {
    it('creates authorized hotel', () => {
      const hotel = new Hotel({
        id: 'HOTEL-INNTU',
        code: 'INNTU',
        name: 'Hotel Inntu Laureles',
        address: 'Transversal 39 #74B-10, Laureles',
        territory: 'Laureles Medellín',
      });

      expect(hotel.name).toBe('Hotel Inntu Laureles');
      expect(hotel.territory.canonicalCorridor).toBe('MEDELLIN');
    });
  });

  describe('FinancialTransaction Entity', () => {
    it('creates immutable financial transaction with Money value object', () => {
      const tx = new FinancialTransaction({
        id: 'tx-100',
        reservaId: 'RVA171-4',
        timestamp: '2026-08-21T15:00:00Z',
        type: 'OUT_OF_POCKET',
        amount: Money.fromCents(8500000n, 'COP'),
        description: 'Compra Cruz Verde Gotas Oftálmicas',
      });

      expect(tx.amount.amountInCents).toBe(8500000n);
      expect(tx.audited).toBe(false);

      const auditedTx = tx.markAudited('Carolina Cortázar');
      expect(auditedTx.audited).toBe(true);
      expect(auditedTx.auditedBy).toBe('Carolina Cortázar');
    });
  });
});
