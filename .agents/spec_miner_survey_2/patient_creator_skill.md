# 🏥 Local Copy of Skill: Patient X Creator (Medical Trip Colombia)
Source: /Users/miyo123/projects/medicaltrip/.agents/skills/patient-creator/SKILL.md

Este skill permite aprovisionar cualquier paciente individual nuevo (**Paciente X**) con un solo comando o instrucción en lenguaje natural, respetando la arquitectura hexagonal del sistema, cálculos financieros deterministas (`BigInt` cents) y persistencia directa en Supabase Cloud (`https://pxmobokcqhsixfvdsrwj.supabase.co`).

## 🚀 Capacidades Principales
1. **Generación de Reserva (`PatientBooking`)**:
   - Código correlativo determinista (ej. `RVA888`, `RVA360-1`, etc.).
   - Soporte para titular y acompañantes (`PassengerRecord`).
   - Vuelos de llegada (`Arajet`, `Wingo`, `Copa`, etc.) y hoteles asignados (`HOTEL 1616`, `Dann Carlton`, etc.).

2. **Generación de Itinerario Inteligente (`GenerateSmartItineraryUseCase`)**:
   - Presets médicos soportados:
     - `OPHTHALMOLOGY_3D`
     - `CARDIOLOGY_5D`
     - `PLASTIC_SURGERY_12D`
     - `UROLOGY_4D`
   - Generación automática de eventos clínicos (`ItineraryEvent`), turnos de acompañamiento presencial (`CompanionShift` a tarifa base $15.500/h) y traslados con chofer (`DriverTransfer` Aeroturex).

3. **Gestión de Caja Menor y Anticipos**:
   - Registro de gastos iniciales auditados (SIM Cards Claro/Tigo, Pólizas Colasistencia, Fajas postquirúrgicas).
   - Abonos/anticipos bancarios o SWIFT con balance determinista BigInt.

4. **Conciliación Contable y Sello Criptográfico (`ReconcileSettlementUseCase`)**:
   - Cálculo determinista del Ledger: NetBalance = TotalGastos + TotalHonorariosGuía + TotalTrasladosFlota - TotalAnticipos.
   - Sello de auditoría `sha256Seal`.

5. **Token de Autogestión WhatsApp**:
   - Token `INV-YYYY-XXXX` y enlace directo para onboarding del paciente vía WhatsApp.

## 🔒 Reglas Invariantes
1. **BigInt Determinista**: Todo valor monetario se convierte a céntimos enteros antes de cualquier operación contable.
2. **Persistencia Directa**: Tablas de Supabase Cloud (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`).
3. **Privacidad**: Nunca persistir números de tarjeta o datos PHI sensibles en texto plano.
