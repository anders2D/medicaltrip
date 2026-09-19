---
name: patient-creator
description: Skill especializado para crear, parametrizar y persistir pacientes individuales ("Paciente X") de forma aislada y determinista directamente en Supabase Cloud REST API, generando automáticamente su código de reserva (RVA-xxx), desglose de itinerario clínico, turnos de acompañamiento presencial ($15.500/h), flota de traslados Aeroturex, comprobantes de caja menor, balance contable en BigInt cents y token WhatsApp de autogestión.
---

# 🏥 Skill: Patient X Creator (Medical Trip Colombia)

Este skill permite aprovisionar cualquier paciente individual nuevo (**Paciente X**) con un solo comando o instrucción en lenguaje natural, respetando la arquitectura hexagonal del sistema, cálculos financieros deterministas (`BigInt` cents) y persistencia directa en Supabase Cloud (`https://pxmobokcqhsixfvdsrwj.supabase.co`).

---

## 🚀 Capacidades Principales

1. **Generación de Reserva (`PatientBooking`)**:
   - Asignación de código correlativo determinista (ej. `RVA888`, `RVA360-1`, etc.).
   - Soporte para titular y acompañantes (`PassengerRecord`).
   - Normalización de vuelos de llegada (`Arajet`, `Wingo`, `Copa`, etc.) y hoteles asignados (`HOTEL 1616`, `Dann Carlton`, etc.).

2. **Generación de Itinerario Inteligente (`GenerateSmartItineraryUseCase`)**:
   - Presets médicos soportados:
     - `OPHTHALMOLOGY_3D` (Oftalmología / Cirugía Refractiva / Glaucornea)
     - `CARDIOLOGY_5D` (Cardiología / Cateterismo / Cardio VID)
     - `PLASTIC_SURGERY_12D` (Cirugía Plástica / Lipoescultura / Quirófanos El Tesoro)
     - `UROLOGY_4D` (Urología / Litotricia Láser / Pablo Tobón Uribe)
   - Generación automática de eventos clínicos (`ItineraryEvent`), turnos de acompañamiento presencial (`CompanionShift` a tarifa base $15.500/h) y traslados con chofer (`DriverTransfer` Aeroturex).

3. **Gestión de Caja Menor y Anticipos**:
   - Registro de gastos iniciales auditados (SIM Cards Claro/Tigo, Pólizas Colasistencia, Fajas postquirúrgicas).
   - Abonos/anticipos bancarios o SWIFT con balance determinista BigInt.

4. **Conciliación Contable y Sello Criptográfico (`ReconcileSettlementUseCase`)**:
   - Cálculo determinista del Ledger: $\text{NetBalance} = \text{TotalGastos} + \text{TotalHonorariosGuía} + \text{TotalTrasladosFlota} - \text{TotalAnticipos}$.
   - Sello de auditoría `sha256Seal`.

5. **Token de Autogestión WhatsApp**:
   - Generación de token `INV-YYYY-XXXX` y enlace directo para onboarding del paciente vía WhatsApp.

---

## 🛠️ Modos de Ejecución

### Modo 1: Ejecución Interactiva con Agente
Simplemente solicita al asistente:
> "Crea un paciente de Curazao llamado Marvin Evertsz para cirugía de cataratas del 10 al 20 de octubre con 1 acompañante y abono de $1.500.000 COP."

El agente invocará el script TypeScript usando `vite-node` con los parámetros indicados.

### Modo 2: Ejecución CLI con Archivo JSON
Puedes pasar un archivo de configuración JSON directamente:

```bash
cd apps/medicaltrip_react_app
./node_modules/.bin/vite-node ../../.agents/skills/patient-creator/scripts/create_patient.ts ../../.agents/skills/patient-creator/examples/sample_patients.json
```

O crear un archivo temporal JSON con la siguiente estructura:

```json
{
  "firstName": "Natalie",
  "lastName": "Rumai",
  "country": "Curazao",
  "language": "Papiamento / Holandés",
  "phone": "+599 9 521 8844",
  "email": "natalie.rumai@patient.medicaltrip.test",
  "arrivalDate": "2026-10-10T14:30:00Z",
  "departureDate": "2026-10-20T18:00:00Z",
  "airline": "Arajet",
  "flightNumber": "DM-101",
  "hotelName": "HOTEL 1616 Poblado",
  "specialtyPreset": "OPHTHALMOLOGY_3D",
  "companionNames": ["Glenda Rumai"],
  "advancesCOP": [
    { "description": "Abono Bancolombia", "amountCOP": 1500000 }
  ],
  "initialExpensesCOP": [
    { "category": "SIM_CARD", "description": "2 SIM Cards Claro", "amountCOP": 30000 }
  ],
  "notes": "Cirugía refractiva en Glaucornea."
}
```

---

## 📋 Parámetros Soportados

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `firstName` | `string` | Sí | Nombre del paciente |
| `lastName` | `string` | Sí | Apellidos del paciente |
| `country` | `string` | No (def: Curazao) | País / Territorio de origen (Curazao, Aruba, Bonaire, etc.) |
| `language` | `string` | No (def: Papiamento) | Idioma principal del paciente |
| `phone` | `string` | No | Teléfono internacional E.164 para WhatsApp |
| `email` | `string` | No | Correo electrónico de contacto |
| `arrivalDate` | `string (ISO-8601)` | Sí | Fecha y hora UTC de llegada a Medellín |
| `departureDate` | `string (ISO-8601)` | Sí | Fecha y hora UTC de retorno |
| `airline` | `string` | No (def: Arajet) | Aerolínea |
| `flightNumber` | `string` | No | Código de vuelo de llegada |
| `hotelName` | `string` | No (def: HOTEL 1616) | Hotel asignado en Medellín |
| `specialtyPreset`| `string` | No (def: OPHTHALMOLOGY_3D) | `OPHTHALMOLOGY_3D`, `CARDIOLOGY_5D`, `PLASTIC_SURGERY_12D`, `UROLOGY_4D` |
| `companionNames` | `string[]` | No | Nombres de acompañantes |
| `advancesCOP` | `Array<{ description, amountCOP, date? }>` | No | Anticipos o depósitos en COP |
| `initialExpensesCOP` | `Array<{ category, description, amountCOP }>` | No | Gastos iniciales de caja menor |
| `notes` | `string` | No | Notas clínicas u operativas |

---

## 🔒 Reglas Invariantes
1. **BigInt Determinista**: Todo valor monetario se convierte a céntimos enteros antes de cualquier operación contable.
2. **Persistencia Directa**: Los datos se insertan directamente en las tablas de Supabase Cloud (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`).
3. **Privacidad**: Nunca persistir números de tarjeta o datos PHI sensibles en texto plano.
