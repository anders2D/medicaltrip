import { InvariantViolationError } from '../errors/DomainErrors';

export interface PatientProps {
  id: string; // e.g. "ENT-PAX-0171"
  firstName: string;
  lastName: string;
  passportHash: string;
  country: string;
  language: string;
  phone?: string;
  email?: string;
  companionNames?: string[];
}

/**
 * Patient Entity (ENT-PAX)
 * Represents an international patient or legal companion under PHI privacy protection rules.
 */
export class Patient {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly passportHash: string;
  readonly country: string;
  readonly language: string;
  readonly phone?: string;
  readonly email?: string;
  readonly companionNames: readonly string[];

  constructor(props: PatientProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvariantViolationError('[Paciente]: ID es obligatorio.');
    }
    if (!props.firstName || !props.firstName.trim()) {
      throw new InvariantViolationError('[Paciente]: Nombre es obligatorio.');
    }
    if (!props.country || !props.country.trim()) {
      throw new InvariantViolationError('[Paciente]: País de origen es obligatorio.');
    }

    this.id = props.id.trim();
    this.firstName = props.firstName.trim();
    this.lastName = (props.lastName || '').trim();
    this.passportHash = props.passportHash || 'ANON-HASH';
    this.country = props.country.trim();
    this.language = props.language || 'Papiamento';
    this.phone = props.phone;
    this.email = props.email;
    this.companionNames = Object.freeze(props.companionNames ? [...props.companionNames] : []);

    Object.freeze(this);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  toJSON(): PatientProps & { fullName: string } {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      passportHash: this.passportHash,
      country: this.country,
      language: this.language,
      phone: this.phone,
      email: this.email,
      companionNames: [...this.companionNames],
    };
  }
}
