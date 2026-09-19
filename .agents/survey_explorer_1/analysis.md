# 📊 Análisis Exhaustivo de Dominio y Datos Empíricos: Medical Trip Colombia S.A.S.

> **Autor**: Survey Explorer 1 (Domain & Empirical Data)  
> **Fecha**: 2026-08-23T04:54:00Z  
> **Destinatario**: Orchestrator (`2b250ea1-fa35-4e8a-acb4-2b5dc5303699`)  
> **Estado**: Completado  

---

## 📑 Resumen Ejecutivo

Este documento sintetiza la investigación exhaustiva sobre el modelo de negocio, reglas de dominio, territorio operativo, tarifas financieras y los **4 arquetipos operativos reales** extraídos del corpus de 4 años de operaciones de **Medical Trip Colombia S.A.S.** (`data/master_extracted_drive_database.json`, `data/medicaltrip_master.db`, chats de WhatsApp y libros de liquidación contable).

---

## 1. 🏥 Análisis Profundo de los 4 Arquetipos Operativos Reales (R5)

### 1.1. Arquetipo 1: `RVA171 Catia x5` (Itinerario Familiar / Multi-Pax Cosmético, Dental y Pediátrico)

* **Código de Reserva Canónico**: `RVA171-4` / `RVA171-5` (Expediente: `RVA171-4_5-Rodrigues_Catia Mrs x 5- VIAJE AGOSTO.xlsx`).
* **Información de Pasajeros**:
  - **Titular**: `[PAX] Catia Rodrigues` (Curazao / Papiamento & Holandés).
  - **Acompañantes / Grupo (5 Pax)**: `Tatiana Faria`, `Mariana Faria`, `María Rodrigues`, `Lisandra Rodrigues`.
  - **Identificador Normalizado**: `ENT-PAX-1028` / `ENT-PAX-1149`.
* **Procedimientos y Especialidades Médicas**:
  - **Oftalmología & Cirugía Ocular**: Dra. Jorge Eduardo Peláez en Clínica Clofán (Torre Médica Ciudad del Río). Exámenes diagnósticos y cirugía refractiva/ocular.
  - **Ecografías Diagnósticas**: CIMA Ayudas Diagnósticas (Cra 44).
  - **Urología Pediátrica**: Dr. Carlos Londoño / Dr. Juan David Londoño ($400.000 COP).
  - **Procedimientos Estéticos / Consulta Capilar**: Massai Clínica y Cita Capilar.
* **Hospedaje**: `Hotel Inntu Laureles` (Transversal 39 #74B-10, Segundo Parque de Laureles, Medellín).
* **Duración**: 5 a 7 Días (Lunes 10 a Lunes 17 de Agosto de 2026).
* **Cronograma e Itinerario Diario Hora a Hora**:
  - **Día 1 (Lunes 10-Ago)**:
    - `10:00 AM`: Llegada en vuelo Z-Fly procedente de Curazao al Aeropuerto JMC.
    - `12:00 PM`: Traslado Aeropuerto JMC ➔ Hotel Inntu Laureles (Uber XL / Andrés, $160.000 COP / $54.851 COP TC).
    - `01:00 PM`: Almuerzo en Laureles.
    - `02:00 PM`: Traslado Hotel Inntu ➔ Clínica Clofán (Ciudad del Río) en Uber XL ($38.000 COP).
    - `03:00 PM`: Consulta y exámenes de Oftalmología con Dr. Peláez para María ([GUIA] Yenny, 3.5 hrs = $54.250 COP).
    - `04:30 PM`: Ticket Parqueadero Sótano Clofán ($12.000 COP).
    - `06:00 PM`: Traslado Clínica Clofán ➔ Hotel Inntu Laureles (Uber XL, $49.138 COP).
  - **Día 2 (Martes 11-Ago)**:
    - `05:45 AM`: Traslado en ayunas Hotel Inntu ➔ CIMA Cra 44 (Tatiana y Mariana, $40.000 COP).
    - `06:30 AM - 02:30 PM`: Acompañamiento en ecografías CIMA ([GUIA] Yenny, turno 8h = $124.000 COP).
    - `10:30 AM - 01:30 PM`: Traslado y guianza de compras CC Santa Fé para Lisandra y María ([GUIA] Yenny, 3h = $46.500 COP + Uber $38.000 COP).
    - `02:00 PM`: Subsidio de alimentación por jornada continua >8h ($35.000 COP).
    - `02:30 PM`: Traslado CC Santa Fé ➔ Clínica Clofán para Cirugía Ocular de María (Uber, $49.300 COP).
    - `03:30 PM`: Compra de medicamentos y colirios en Droguería Cruz Verde Poblado ($85.000 COP).
    - `06:30 PM`: Traslado Clofán ➔ Hotel Inntu (Uber, $54.886 COP).
  - **Día 3 (Miércoles 12-Ago)**:
    - `09:00 AM`: Traslado Hotel ➔ Control Postoperatorio Oftalmología Clofán ($41.482 COP).
    - `11:30 AM`: Control Médico Dr. Peláez ([GUIA] Yenny, 2.5h = $38.750 COP).
    - `01:00 PM`: Traslado Clofán ➔ CC El Tesoro ($83.931 COP).
    - `05:30 PM`: Traslado CC El Tesoro ➔ Hotel Inntu Laureles ($73.719 COP).
  - **Día 4 (Jueves 13-Ago)**:
    - `08:00 AM`: Traslado Hotel ➔ Consulta Urología Pediátrica Dr. Londoño (Tatiana/Mariana, Uber $55.836 COP).
    - `09:00 AM - 12:30 PM`: Acompañamiento consulta bilingüe ([GUIA] Alejandro, 3.5h = $54.250 COP).
    - `11:00 AM - 01:30 PM`: Traslado y acompañamiento Cita Capilar Lisandra ([GUIA] Yenny, 2.5h = $38.750 COP + Uber $33.712 COP).
  - **Día 5 (Lunes 17-Ago)**:
    - `01:00 PM`: Check-out y cierre administrativo con [COORD] Carolina Cortázar.
    - `03:00 PM`: Traslado de salida Hotel Inntu ➔ Aeropuerto JMC en Van Especial ($160.000 COP).
* **Actores Asignados**:
  - `[DRV]`: Andrés (Flota Uber XL / Transporte Privado).
  - `[GUIA]`: Yenny (Guía Bilingüe Líder), Alejandro (Guía de Apoyo).
  - `[FIN] / [COORD]`: Carolina Cortázar (@MedicaltripACV), Jenny Paola Acosta ([DIR-MED] Bancolombia / TC Jenny 6005).
* **Rubros Financieros Empíricos**:
  - Total Traslados Flota/Uber: ~$685.000 COP.
  - Total Honorarios de Acompañamiento: ~$356.500 COP.
  - Gastos Menores & Farmacia (Cruz Verde, Parqueaderos, Almuerzos): ~$167.000 COP.
  - Anticipos Totales Recibidos: `$2.098.100 COP` ($1.000.000 anticipo inicial + $1.098.100 anticipo complementario).
  - Cuentas de Cobro vs Anticipos: Genera saldo cruzado en liquidación contable.

---

### 1.2. Arquetipo 2: `RVA282 George Cardio` (Chequeo Cardiovascular Integral & Urología de Alto Riesgo)

* **Código de Reserva Canónico**: `RVA282-5` / `RVA282-6` (Expediente: `RVA282-5_6-Hernandez_George Mr x 2 - Agosto 2026.xlsx`).
* **Información de Pasajeros**:
  - **Titular**: `[PAX] George Hernandez` (Curazao / Papiamento & Inglés, Teléfono `+599 9 5681193`).
  - **Acompañante**: `Adriaan Fabian` (2 Pax).
  - **Identificador Normalizado**: `ENT-PAX-0282` / `ENT-PAX-1084`.
* **Procedimientos y Especialidades Médicas**:
  - **Chequeo Cardiovascular Integral**: Clínica Cardio VID / CES Prado.
  - **Urología & Diagnóstico de Laboratorio**: Laboratorio Echavarría (Uroanálisis $25.000 COP, Urocultivo y Antibiograma CMI $100.000 COP).
  - **Consulta Médica General & Cierre**: Dr. Marcos Yepes (Certificado *Fit-to-Fly* y resumen bilingüe).
* **Hospedaje**: `Airbnb Edificio Park 42 Poblado` (Cra 42 #9-28, El Poblado, Medellín).
* **Duración**: 4 Días (operación intensiva) / 32 Días de estancia extendida (Agosto a Septiembre 2026).
* **Cronograma e Itinerario Diario Hora a Hora**:
  - **Día 1 (Miércoles 05-Ago)**:
    - `03:27 PM`: Aterrizaje Vuelo Wingo 7449 en JMC.
    - `04:15 PM`: Recogida en puerta internacional por [DRV] Ramón Rosero (Aeroturex, Kia Sonet placa NLX666) y entrega de SIM Card Claro / eSIM 80GB ($62.780 COP costo red / $90.909 COP tarifa).
    - `05:30 PM`: Check-in en Edificio Park 42 Poblado ($145.000 COP traslado).
  - **Día 2 (Jueves 06-Ago)**:
    - `07:00 AM`: Toma de muestra de orina en habitación Park 42 y organización de carpeta clínica ([GUIA] Yenny, 1.0h = $15.500 COP).
    - `08:30 AM`: Traslado Park 42 ➔ Torre Oviedo Poblado ([DRV] Ramón Rosero / Andrés, $30.000 COP).
    - `09:00 AM - 01:00 PM`: Entrega de muestras en Laboratorio Echavarría y consulta de Urología en CES Oviedo Piso 6 con Enfermera Jefe Bibiana ([GUIA] Yenny, 4.0h = $62.000 COP).
    - `11:00 AM`: Subsidio de alimentación guía 4h ($25.000 COP).
    - `12:30 PM`: Ticket de parqueadero Torre Oviedo ($14.000 COP).
    - `01:30 PM`: Traslado de retorno a Edificio Park 42 ($30.000 COP).
  - **Día 3 (Viernes 07-Ago)**:
    - `08:00 AM`: Traslado Ed. Park 42 ➔ Clínica Cardio VID (Robledo).
    - `09:00 AM`: Chequeo Cardiovascular, Ecocardiograma y Prueba de Esfuerzo ([GUIA] Yenny, 5.0h = $77.500 COP + Traslado largo $55.000 COP).
    - `02:00 PM`: Retorno a Ed. Park 42.
  - **Día 4 (Sábado 08-Ago)**:
    - `02:00 PM`: Valoración médica final y emisión de Certificado *Fit-to-Fly* con Dr. Marcos Yepes.
    - `04:00 PM`: Traslado de salida Ed. Park 42 ➔ Aeropuerto JMC ([DRV] Ramón Rosero, $110.000 COP).
* **Actores Asignados**:
  - `[DRV]`: Ramón Rosero (Aeroturex - Kia Sonet NLX666), Juan Carlos Montoya (Kia Soul ESO942), Andrés.
  - `[GUIA]`: Yenny (Guía Bilingüe Principal).
  - `[MED]`: Dr. Marcos Yepes (Médico Asesor).
  - `[COORD]`: Carolina Cortázar (@MedicaltripACV).
* **Rubros Financieros Empíricos**:
  - Póliza de asistencia médica al viajero Colasistencia (32 días x $6.000 = $192.000 COP tarifa / $77.220 COP costo precompra).
  - Laboratorios Echavarría: Uroanálisis + Urocultivo ($125.000 COP tarifa / $43.400 COP liquidado).
  - Traslados Aeroturex: 4 servicios aeropuerto ($173.700 COP c/u) + Recargo nocturno ($25.000 COP) + Trayectos cortos ($45.000 COP) + Trayectos largos ($55.000 COP).
  - Anticipo Recibido: `$1.200.000 COP` (o $800.000 COP base).

---

### 1.3. Arquetipo 3: `RVA341 Hogenboom CES` (Cirugía Compleja en Clínica CES / Extracción Domiciliaria)

* **Código de Reserva Canónico**: `RVA341-1` / `RVA341-2` (Expediente: `RVA341-1-Hogenboom_Eduard Mr - CUR.xlsx`).
* **Información de Pasajeros**:
  - **Titular**: `[PAX] Eduard Hogenboom` (Curazao / Inglés nativo).
  - **Acompañante**: `Marcelle Cameron / Linda` (2 Pax).
  - **Identificador Normalizado**: `ENT-PAX-1126` / `ENT-PAX-1142`.
* **Procedimientos y Especialidades Médicas**:
  - **Urología Compleja & Pre-Quirúrgico**: Clínica CES Sede Oviedo (Carrera 43A #6S-15, Piso 4) con el Dr. Carlos Suárez (especialista bilingüe en inglés).
  - **Anestesiología & Valoración Quirúrgica**: Clínica CES Sede Prado Centro (Calle 58 #50C-2).
  - **Toma de Laboratorios Domiciliarios**: Laboratorio Echavarría Atención Domiciliaria en habitación de hotel (vigilancia estricta de función renal eGFR bajo).
  - **Soporte Institucional**: Emisión de Carta de Garantía institucional de Medical Trip Colombia para Clínica CES.
* **Hospedaje**: `Hotel Inntu Laureles Habitación 1004` (Transversal 39 #74B-10, Laureles, Medellín).
* **Duración**: 6 Días intensivos / 15 Días período completo (Miércoles 12 a Miércoles 26 de Agosto de 2026).
* **Cronograma e Itinerario Diario Hora a Hora**:
  - **Día 1 (Miércoles 12-Ago)**:
    - `03:27 PM`: Vuelo Wingo Curazao ➔ Medellín (JMC).
    - `04:30 PM`: Activación de QR para eSIM virtual 80GB.
    - `05:00 PM`: Traslado Aeropuerto JMC ➔ Hotel Inntu Laureles ([DRV] Andrés - Aeroturex, $110.000 COP).
    - `06:00 PM`: Check-in Habitación 1004 Hotel Inntu.
  - **Día 2 (Jueves 13-Ago)**:
    - `08:00 AM - 11:00 AM`: Reposo matutino para aclimatación a la altitud de Medellín (1.500 msnm) e hidratación controlada por eGFR bajo.
    - `11:00 AM`: Traslado Hotel Inntu (Laureles) ➔ CES Sede Oviedo (El Poblado) en Sedán Ejecutivo ($35.000 COP).
    - `12:00 PM - 05:00 PM`: Consulta especializada de Urología en inglés con Dr. Carlos Suárez ([GUIA] Alejandro, 5.0 hrs = $77.500 COP).
    - `01:30 PM`: Subsidio de alimentación guía turno tarde ($25.000 COP).
    - `05:00 PM`: Retorno a Hotel Inntu Laureles ($35.000 COP).
  - **Día 3 (Viernes 14-Ago)**:
    - `05:30 AM`: Visita de enfermera de Laboratorio Echavarría a la habitación 1004 de Hotel Inntu para toma de muestras de sangre domiciliaria en ayunas ($65.000 COP toma domiciliaria + $32.350 COP propina/recargo llegada temprana).
    - `08:00 AM`: Traslado Laureles ➔ Clínica CES Prado Centro ($35.000 COP).
    - `09:00 AM`: Consulta de Anestesiología y pre-anestesia ([GUIA] Alejandro, 4.0h = $62.000 COP).
    - `01:00 PM`: Retorno a Hotel Inntu.
  - **Día 4-5 (Sábado 15 - Domingo 16-Ago)**:
    - Monitoreo post-atención médica, reportes diarios de evolución emitidos por Andrés Cantero ACP.
  - **Día 6 (Miércoles 26-Ago)**:
    - `02:00 PM`: Traslado Hotel Inntu Laureles ➔ Aeropuerto JMC ([DRV] Andrés, $110.000 COP).
* **Actores Asignados**:
  - `[DRV]`: Andrés (Conductor Sedán Ejecutivo), Ramón Rosero (Aeroturex).
  - `[GUIA]`: Alejandro (Guía Bilingüe Especialista en Inglés), Andrés Cantero (Mde ACP Español).
  - `[NURSE]`: Enfermera Emi Echavarría (Atención Domiciliaria Hotel Inntu).
  - `[COORD] / [FIN]`: Carolina Cortázar, Duván Medical, Jenny Acosta.
* **Rubros Financieros Empíricos**:
  - Laboratorios Domiciliarios Echavarría: $65.000 COP + Propina/llegada temprana enfermera $32.350 COP.
  - Guianza Bilingüe en Inglés: $15.500 COP/h (turnos de 4h-5h).
  - Traslados Aeroturex: $110.000 COP (JMC) + $35.000 COP trayectos urbanos Laureles-Poblado.
  - Anticipo Total Recibido: `$950.000 COP`.

---

### 1.4. Arquetipo 4: `RVA077 Rumai Cirugía 12d` (Itinerario Extendido de 12 Días de Cirugía Bariátrica / Estética)

* **Código de Reserva Canónico**: `RVA077-5` / `RVA077-1` / `RVA077-3` (Expediente: `RVA077-5-Rumai_Alejandra Mrs x 2-CUR-Agosto 2026.xlsx`).
* **Información de Pasajeros**:
  - **Titular**: `[PAX] Alejandra Filomena Rumai` (Curazao / Papiamento, Teléfono `+599 9 568 7561`).
  - **Acompañantes**: `Xiomahara Rumai`, `Giandra`, `Reginald` (Hijo).
  - **Identificador Normalizado**: `ENT-PAX-1143` / `ENT-PAX-1166` / `ENT-PAX-1219` / `ENT-PAX-1271`.
* **Procedimientos y Especialidades Médicas**:
  - **Gastroenterología & Valoración Quirúrgica**: Dr. Mosquera en Hospital Pablo Tobón Uribe (HPTU Torre B, Consultorio 154).
  - **Imágenes Diagnósticas de Alta Complejidad**: Centro Hernán Ocazionez ($170.755 COP: Radiografía de Tórax + Ecografía Abdomen Total + Ecografía de Mama).
  - **Ginecología & Pre-quirúrgico**: Clínica Universitaria Bolivariana ($135.000 COP).
  - **Evaluación Cardiológica**: Clínica Cardio VID.
  - **Insumos y Farmacia Postoperatoria**: Droguería Locatel Robledo y Poblado (fajas postquirúrgicas, gasas estériles, apósitos y analgésicos).
* **Hospedaje**: `Hotel Novelty Suites` (Calle 4 Sur #43A-109, El Poblado, Medellín) y traslado posterior a Apartamento Amoblado Poblado.
* **Duración**: 12 Días Continuos (Lunes 10 a Viernes 21 de Agosto de 2026).
* **Cronograma e Itinerario Diario Hora a Hora**:
  - **Día 1 (Lunes 10-Ago)**:
    - `10:00 AM`: Llegada Vuelo Z-Air / 7Z 0511 desde Curazao al Aeropuerto JMC.
    - `11:00 AM`: Traslado JMC ➔ Hotel Novelty Suites El Poblado ([DRV] Juan Carlos Montoya, Kia Soul ESO942 / Ramón Rosero NLX666, $145.000 COP).
    - `12:30 PM`: Traslado Novelty Suites (Poblado) ➔ HPTU (Robledo) en trayecto largo ([GUIA/DRV] Yenny, 0.75h = $55.000 COP).
    - `03:45 PM`: Consulta con Dr. Mosquera en Gastroenterología HPTU Torre B Consultorio 154 ([GUIA] Yenny, 4h = $62.000 COP).
    - `05:30 PM`: Traslado HPTU ➔ Locatel para insumos preoperatorios ($30.000 COP).
    - `06:30 PM`: Traslado Locatel ➔ Hotel Novelty Suites ($30.000 COP).
  - **Día 2 (Martes 11-Ago)**:
    - `01:30 PM`: Traslado y traslado de maletas CC Santa Fé ➔ Hotel Novelty ➔ Apartamento El Poblado ([GUIA] Yenny, $30.000 COP).
  - **Día 3 (Miércoles 12-Ago)**:
    - `08:00 AM`: Traslado Poblado ➔ Centro Diagnóstico Hernán Ocazionez ($35.000 COP).
    - `09:00 AM - 01:00 PM`: Realización de Radiografía de Tórax, Ecografía de Abdomen Total y Ecografía Mamaria ($170.755 COP pagados con factura directa + [GUIA] Yenny 4.0h = $62.000 COP).
    - `01:30 PM`: Retorno a Apartamento Poblado ($35.000 COP).
  - **Día 4 (Jueves 13-Ago)**:
    - `08:30 AM`: Consulta de Ginecología en Clínica Bolivariana ($135.000 COP) y valoración pre-anestésica en Cardio VID ([GUIA] Yenny, 5.0h = $77.500 COP + Traslados $70.000 COP).
  - **Día 5 (Viernes 14-Ago)**:
    - `06:00 AM`: Ingreso a quirófano para procedimiento quirúrgico programado.
    - `06:00 AM - 06:00 PM`: Acompañamiento clínico integral en sala de recuperación y hospitalización ([GUIA] Yenny, 12h = $186.000 COP + Subsidio almuerzo/cena $35.000 COP).
  - **Días 6 a 10 (Sábado 15 - Miércoles 19-Ago)**:
    - Reposo postoperatorio en Apartamento Poblado, visitas de enfermería para curaciones y drenajes linfáticos, compras recurrentes en Locatel Farmacia.
  - **Día 11 (Jueves 20-Ago)**:
    - `10:00 AM`: Consulta de control postoperatorio, retiro de puntos y emisión de certificado médico *Fit-to-Fly*.
  - **Día 12 (Viernes 21-Ago)**:
    - `07:00 AM` (Cambio de hora agendado): Check-out y traslado de salida Hotel Novelty Suites ➔ Aeropuerto JMC ([DRV] Gustavo Mora, Duster LKN507 / Oswaldo Giraldo PUO663, $145.000 COP).
* **Actores Asignados**:
  - `[DRV]`: Juan Carlos Montoya (Kia Soul ESO942), Ramón Rosero (Kia Sonet NLX666), Oswaldo Giraldo (Duster PUO663), Gustavo Mora (Duster LKN507).
  - `[GUIA]`: Yenny (Guía y Acompañante Quirúrgica Líder).
  - `[NURSE]`: Enfermera Postoperatoria para curaciones y drenajes.
  - `[FIN] / [COORD]`: Carolina Cortázar, Jenny Acosta (Manejo de caja en pesos y cambio de divisas USD en efectivo).
* **Rubros Financieros Empíricos**:
  - Exámenes Hernán Ocazionez: $170.755 COP.
  - Consulta Clínica Bolivariana: $135.000 COP.
  - Traslados Aeroturex: $145.000 COP entrada + $145.000 COP salida + múltiples trayectos cortos ($30.000 COP) y largos ($55.000 COP).
  - Anticipo Total Recibido: `$1.850.000 COP` (combinación de transferencia Bancolombia y cambio de dólares USD a efectivo COP).

---

## 2. 🗺️ Especificación del Territorio Operativo (OperativeTerritory Invariant)

### 2.1. Zonas y Corredores Operativos Habilitados
La operación médica de Medical Trip Colombia S.A.S. se concentra estrictamente en los siguientes corredores metropolitanos y de salud:

| Corredor / Zona | Nodos Clave Incluidos | Proveedores / Clínicas / Hoteles Principales |
| :--- | :--- | :--- |
| **Medellín - El Poblado** | Cra 43A (Milla de Oro), Provenza, San Lucas, Oviedo | Hotel Poblado Plaza, Ed. Park 42, CES Sede Oviedo, Novelty Suites |
| **Medellín - Laureles / Estadio** | Segundo Parque Laureles, Av. Nutibara, Cra 70 | Hotel Inntu Laureles, Hotel Dorado La 70, Clínica de la Columna |
| **Medellín - Ciudad del Río** | Cra 48, Calle 19A | Clínica Clofán, Torre Médica Ciudad del Río |
| **Medellín - Robledo** | Calle 78B | Hospital Pablo Tobón Uribe (HPTU), Clínica Cardio VID |
| **Medellín - Prado Centro** | Calle 58, Carrera 50C | Clínica CES Prado Centro |
| **Oriente Antioqueño / Rionegro** | Aeropuerto Internacional José María Córdova (JMC) | Base de recepción y despacho de vuelos internacionales |
| **Área Metropolitana Valle de Aburrá** | Envigado, Sabaneta, Bello, Itagüí | Villa Anita Casa de Recuperación, Clínicas odontológicas aliadas |
| **Eje Cafetero & Bogotá (Sub-sedes)** | Manizales, Bogotá D.C. (Aeropuerto BOG) | Centros de enlace clínico secundario |

### 2.2. Zonas Prohibidas / No Operativas (Fail-Fast Domain Invariant)
El sistema debe validar de manera **determinista e inmutable** cada dirección, hotel o centro médico ingresado en las reservas. Si se detecta una ubicación fuera de corredor, la entidad de dominio `OperativeTerritory` debe lanzar inmediatamente una excepción de dominio (`DomainError`):

* **Zonas Prohibidas Explícitas**:
  - `MOCOA` (Putumayo) — *Origen de confusión empírica por el identificador de contacto "Mocoa Duván Medical" en los chats contables*.
  - `AMAZONAS` / `LETICIA`
  - `TUMACO` / `NARIÑO`
  - `ARAUCA`
  - `GUAVIARE` / `CHOCÓ` / `LA GUAJIRA RURAL`

* **Comportamiento Requerido en Código DDD**:
```typescript
if (OperativeTerritory.FORBIDDEN_LOCATIONS.some(f => normalized.includes(f))) {
    throw new DomainInvariantViolationError(
        `[DomainError - Violación de Invariante Geoespacial]: La ubicación '${locationName}' está explícitamente fuera del corredor habilitado de Medical Trip Colombia S.A.S.`
    );
}
```

---

## 3. 💰 Catálogo Financiero, Tarifario y Modelado Matemático Exacto (BigInt)

### 3.1. Tarifario Empírico Extraído de los Libros de Liquidación

| Rubro / Concepto | Tarifa Particular (COP) | Tarifa Convenio / Costo Red (COP) | Unidad de Medida / Regla de Liquidación |
| :--- | :--- | :--- | :--- |
| **Acompañamiento Guía Bilingüe Base** | `$15.500 COP` | `$12.000 COP` | Por hora ejecutada en consultorio / examen |
| **Turno Completo Guía (8 Horas Diurnas)** | `$124.000 COP` | `$96.000 COP` | Turno de 8 horas continuas |
| **Paquete Especial Acompañamiento 8h** | `$221.400 COP` | `$150.000 COP` | Acompañamiento premium con traducción médica técnica |
| **Subsidio Alimentación Guía (Turno 4h)** | `$25.000 COP` | `$25.000 COP` | Reembolso directo de viático por jornada matutina/tarde |
| **Subsidio Alimentación Guía (>8h)** | `$35.000 COP` | `$35.000 COP` | Reembolso directo por jornada extendida o quirúrgica |
| **Traslado Aeropuerto JMC ➔ Medellín (Sedán)** | `$145.000 - $173.700 COP` | `$110.000 COP` | Por trayecto sencillo (Aeroturex / Conductor) |
| **Traslado Aeropuerto JMC ➔ Medellín (Van / XL)** | `$160.000 COP` | `$130.000 COP` | Por trayecto para grupos de 3 a 5 pasajeros |
| **Recargo Nocturno Transporte (Aeroturex)** | `$25.000 COP` | `$25.000 COP` | Vuelos con llegada/salida después de las 20:00 o antes de las 06:00 |
| **Traslado Urbano Corto (ej. Poblado-Poblado)** | `$30.000 - $45.000 COP` | `$25.000 COP` | Trayectos dentro de la misma comuna |
| **Traslado Urbano Medio (ej. Laureles-Poblado)** | `$35.000 - $45.000 COP` | `$28.000 COP` | Trayectos inter-comunas centrales |
| **Traslado Urbano Largo (ej. Poblado-Robledo)** | `$55.000 COP` | `$40.000 COP` | Trayectos norte-sur / HPTU / Cardio VID |
| **Toma de Laboratorio Domiciliaria (Echavarría)** | `$65.000 COP` | `$65.000 COP` | Tarifa fija de visita domiciliaria en hotel |
| **Propina / Llegada Temprana Enfermera Lab** | `$32.350 COP` | `$32.350 COP` | Recargo por atención antes de las 06:00 AM |
| **Parqueadero Torre Médica / Clínica** | `$12.000 - $14.000 COP` | `$12.000 - $14.000 COP` | Gasto de caja menor contra recibo físico |
| **Póliza Asistencia al Viajero (Colasistencia)** | `$6.000 COP / día` | `$2.413 COP / día` | Póliza obligatoria por día de estancia ($192k vs $77.22k x 32d) |
| **eSIM Datos Internacionales (80GB x 30 días)** | `$90.909 COP` | `$62.780 COP` | Recarga eSIM prepago entregada en aeropuerto |

### 3.2. Modelado Matemático Determinista con `BigInt` (Zero-Float Errors)

Para cumplir con el estándar R3 y erradicar anomalías de coma flotante de IEEE 754:
1. **Unidad Atómica en Centavos**:
   - Moneda `COP`: $1 COP = 100 Centavos (ej. `$15.500 COP` $\rightarrow$ `1550000n` centavos).
   - Moneda `USD`: $1 USD = 100 Cents (ej. `$100.00 USD` $\rightarrow$ `10000n` cents).
2. **Invariantes Aritméticos**:
   - Toda suma, resta y multiplicación de liquidaciones multi-día se realiza mediante operaciones atómicas con enteros `BigInt`.
   - La conversión a string visual se formatea exclusivamente en la capa de presentación mediante `Intl.NumberFormat('es-CO')`.
3. **Flujo CQRS de Asiento Financiero**:
   - Cada hito del itinerario genera un evento de gasto inmutable (`ExpenseRecordedEvent`), el cual se proyecta en el libro mayor (`FinancialLedgerReadModel`) sin redondeos intermedios.

---

## 4. 🔄 Mapeo de Reconciliación Temporal (DTW)

El análisis empírico confirma la necesidad del algoritmo DTW documentado en `methodology/04_temporal_alignment_dtw.md`:
* **Desfase Observado**: Mientras que en el chat de WhatsApp los hitos suceden en fechas como el 10, 11 o 13 de agosto, las planillas de liquidación de Aeroturex y los recibos de la coordinadora Carolina se concilian 4 a 7 días después (los días 15, 19 o 20 de agosto).
* **Banda de Sakoe-Chiba ($R = 7\text{ días}$)**: Permite asociar transacciones agrupadas (ej. anticipo de $300.000 COP que cubre 2 traslados) con sus respectivos eventos operativos sin contaminación inter-mensual.

---

## 5. 🎯 Conclusión del Relevamiento

Los datos y especificaciones detallados en este informe proporcionan la totalidad de los parámetros empíricos, entidades, valores y restricciones necesarios para alimentar la arquitectura hexagonal, el motor de base de datos local-first y la interfaz dividida Master-Detail de la nueva aplicación offline.
