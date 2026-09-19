/**
 * Medical Trip Hub — Catálogo de Definiciones de Flujos y Diagramas Mermaid
 * 13 Flujos Operativos Sanitizados y Verificados (100% Soundness)
 */

export const FLOW_DEFINITIONS = {
    "can-macro": `graph LR
    L["1. Lead y Medisch Dossier: [COORD] Carolina Cortázar"] --> Q["2. Cotización CTZ: [COM-INT] Blanca Gilma Corrales"]
    Q --> R["3. Reserva RVA y Póliza: [COORD] Carolina Cortázar"]
    R --> C["4. Check-Mig y Vuelo: [COORD] Carolina Cortázar"]
    C --> T["5. Llegada y Traslado: [DRV] Ramón Rosero (Aeroturex)"]
    T --> H["6. Hospedaje: [HOTEL] Ed. Park 42 / Poblado Plaza"]
    H --> M["7. Cita Médica & Labs: [MED] Dr. Marcos Yepes"]
    M --> S{"Procedimiento"}
    S -->|Cirugía Plástica| OP["8. Procedimiento Quirúrgico: [MED] Dr. Marcos Yepes"]
    S -->|Chequeo Ejecutivo| CHQ["8. Chequeo Integral: [CLINIC] Cardio VID / HPTU"]
    S -->|Terapia Celular| REG["8. Células Madre: [CLINIC] Regencord"]
    OP --> REC["9. Recuperación: [GUIA] Enfermera Bilingüe / [HOTEL] Villa Anita"]
    CHQ --> REC
    REG --> REC
    REC --> FIT["10. Certificado Fit-to-Fly: [MED] Dr. Marcos Yepes"]
    FIT --> RET["11. Retorno y Cierre: [COORD] Carolina Cortázar"]`,

    "can-lead": `sequenceDiagram
    autonumber
    actor Pax as [PAX] George Hernandez (Curazao)
    actor Coord as [COORD] Carolina Cortázar
    actor Med as [MED] Dr. Marcos Yepes
    Pax->>Coord: Contacto inicial por WhatsApp (Papiamento / Inglés)
    Coord->>Pax: Solicitud de Historia Clínica y Pasaporte
    Pax->>Coord: Envía PDFs y Fotos de Exámenes
    Coord->>Coord: Registro de Expediente de Lead (ENT-PAX-1001)
    Coord->>Med: Solicita concepto médico y códigos CUPS
    Med->>Coord: Emite lista de CUPS recomendados
    Coord->>Pax: Confirma viabilidad para cotizar`,

    "can-quote": `flowchart TD
    A["Selección de Códigos CUPS: [MED] Dr. Marcos Yepes"] --> B["Consulta Tarifas Convenio: [DIR-MED] Dra. Jenny Acosta"]
    B --> C["Aplicación de Margen Spread 30%: [COORD] Carolina Cortázar"]
    C --> D["Selección Hospedaje: [HOTEL] Poblado Plaza / Villa Anita"]
    D --> E["Inclusión Traslados: [DRV] Ramón Rosero (Aeroturex)"]
    E --> F["Inclusión Guianza: [GUIA] Acompañante Bilingüe"]
    F --> G["Conversión USD/COP según TRM: [COORD] Carolina"]
    G --> H["Generación de PDF Formal CTZ###"]
    H --> I["Envío al WhatsApp de [PAX] George Hernandez"]`,

    "can-booking": `sequenceDiagram
    autonumber
    actor Pax as [PAX] George Hernandez
    actor Coord as [COORD] Carolina Cortázar
    actor Bank as [FIN] Bancolombia
    actor Ins as [SEG] Aseguradora Médica
    actor Hotel as [HOTEL] Edificio Park 42
    Pax->>Coord: Envío de Comprobante de Depósito
    Coord->>Bank: Verificación de Acreditación de Fondos
    Bank-->>Coord: Fondos Confirmados
    Coord->>Coord: Genera Código Canónico RVA282-5
    Coord->>Ins: Emisión de Póliza Médica de Viajero
    Coord->>Hotel: Bloqueo de Habitación
    Coord->>Pax: Apertura de Grupo WhatsApp Operativo y Entrega de Póliza`,

    "can-checkmig": `flowchart TD
    A["Control Pre-Viaje 48h: [COORD] Carolina Cortázar"] --> B["Consulta Datos de Vuelo de [PAX] George Hernandez"]
    B --> C["Verificación de Estado de Vuelo (FlightAware)"]
    C --> D{"Estado de Vuelo"}
    D -->|Reprogramado| E["[COORD] Carolina actualiza hora con [DRV] Ramón Rosero"]
    D -->|A Tiempo| F["[COORD] Carolina radica Check-Mig en Migración Colombia"]
    E --> F
    F --> G["Descarga de PDF Radicado Oficial"]
    G --> H["Envío por WhatsApp a [PAX] George Hernandez"]
    H --> I["Confirmación en Bitácora Operativa"]`,

    "can-transport": `sequenceDiagram
    autonumber
    actor Coord as [COORD] Carolina Cortázar
    actor Trans as [DRV] Despacho Aeroturex
    actor Driver as [DRV] Ramón Rosero (Chofer)
    actor Pax as [PAX] George Hernandez
    Coord->>Trans: Plantilla 16:30 pm (RVA282, WINGO 7449)
    Trans-->>Coord: Confirmado (Asigna a [DRV] Ramón Rosero)
    Coord->>Pax: Envía datos de [DRV] Ramón Rosero y puerta 2 JMC
    Driver->>Driver: Espera en sala internacional con cartel
    Pax->>Driver: Contacto en puerta y traslado a Medellín
    Driver->>Coord: Notifica finalización en WhatsApp`,

    "can-clinical": `flowchart TD
    A["Inicio Jornada: 08:00 AM con [GUIA] Acompañante Bilingüe"] --> B{"¿Tiene Laboratorios Hoy?"}
    B -->|Sí| C["Verificar Ayuno de 8-12 hrs de [PAX] Zulaica Giterson"]
    D --> E["Toma de Muestras de Sangre y Orina: [CLINIC] HPTU"]
    C --> D["Traslado al Laboratorio con [DRV] Ramón Rosero"]
    E --> F["Carga Digital de Resultados PDF"]
    F --> G["Cita de Valoración: [MED] Dr. Marcos Yepes en HPTU"]
    B -->|No| G
    G --> H{"Aptitud Quirúrgica: [MED] Dr. Marcos Yepes"}
    H -->|Apto| I["Programación de Quirófano con [DIR-MED] Dra. Jenny Acosta"]
    H -->|Requiere Compensación| J["Ajuste de Tratamiento Previo con [MED] Dr. Yepes"]`,

    "can-companion": `sequenceDiagram
    autonumber
    actor Acomp as [GUIA] Acompañante Bilingüe
    actor Pax as [PAX] Zulaica Giterson
    actor Doc as [MED] Dr. Marcos Yepes
    actor Farm as [FARM] Farmacia Cruz Verde
    actor ERP as [FIN] Módulo Liquidaciones
    Acomp->>Pax: Encuentro en Lobby del Hotel Poblado Plaza (08:30 am)
    Acomp->>Doc: Traducción simultánea Papiamento/Español en consulta
    Doc->>Acomp: Entrega de Fórmula Médica
    Acomp->>Farm: Compra de medicamentos con caja menor
    Acomp->>Pax: Explicación de posología al paciente
    Acomp->>ERP: Registro de 6.5 horas de turno`,

    "can-postop": `flowchart TD
    A["Llegada a [HOTEL] Villa Anita de [PAX] Zulaica Giterson"] --> B["Asignación de Cama Hospitalaria"]
    B --> C["Evaluación de Signos: [GUIA] Enfermera Postoperatoria"]
    C --> D["Suministro de Dieta Postoperatoria Especializada"]
    D --> E["Curaciones Diarias y Drenajes"]
    E --> F{"Estado de Movilidad"}
    F -->|Estable| G["Tour Suave de Recuperación: Guatapé con [DRV] Ramón Rosero"]
    F -->|Reposo Requerido| H["Fisioterapia en Cama: [CLINIC] Clínica de la Columna"]
    G --> I["Preparación para Alta Médica"]
    H --> I`,

    "can-fittotly": `sequenceDiagram
    autonumber
    actor Pax as [PAX] Zulaica Giterson
    actor Doc as [MED] Dr. Marcos Yepes (Cirujano)
    actor Coord as [COORD] Carolina Cortázar
    actor Trans as [DRV] Ramón Rosero (Chofer)
    Pax->>Doc: Consulta de Control Final (Día previo)
    Doc->>Doc: Evaluación de Cicatrización
    Doc->>Coord: Emisión de Certificado Fit-to-Fly
    Coord->>Coord: Diligencia Check-Mig de Salida
    Coord->>Pax: Entrega de Pasabordo y Certificado
    Coord->>Trans: Recogida en Hotel hacia JMC
    Trans->>Pax: Traslado al Aeropuerto y Despedida`,

    "can-finance": `flowchart TD
    A["[FIN] Desembolso Anticipo Caja Menor ($1M-$2M Nequi/Bancolombia)"] --> B["[GUIA/DRV] Despliegue en Campo con el Paciente"]
    
    subgraph Gastos_Calle ["Gastos en Calle con el Cliente"]
        B --> G1["🚕 Taxis & Traslados ($30k-$35k Poblado/Tesoro)"]
        B --> G2["⏱️ Horas de Guianza ($15.500/h + Domingos)"]
        B --> G3["🥪 Alimentación Escalonada ($8k-$45k)"]
        B --> G4["🅿️ Parqueaderos ($12k-$16.5k HPTU/Tesoro)"]
        B --> G5["💊 Farmacia Post-Op (Cruz Verde / Rebaja)"]
        B --> G6["📁 Alistamiento Carpeta Médica ($15.500 fija)"]
    end
    
    G1 & G2 & G3 & G4 & G5 & G6 --> C["📸 Fotos de Tickets en WhatsApp & Recibos Físicos"]
    C --> D["📑 Transcripción a Sábanas Excel (Liquidacion_transporte / ACP)"]
    D --> DTW["⚡ Algoritmo DTW (Dynamic Time Warping)"]
    DTW --> E["⚖️ Balanza: Cuenta de Cobro vs Anticipos Recibidos"]
    E --> F{"Resultado de Balanza"}
    F -->|Saldo a favor Agente| H["💰 Giro Bancario Diferencia (ej. +$466.792 RVA171 Yenny)"]
    F -->|Saldo a favor Empresa| I["🔄 Fondo Rotativo para Siguiente Reserva (RVA)"]`,

    "can-whatsapp": `flowchart TD
    A["Mensaje Entrante de WhatsApp a [COORD] Carolina Cortázar"] --> B{"Tipo de Evento"}
    B -->|Retraso de Vuelo| C["[COORD] Carolina actualiza hora en Aeroturex y alerta a [DRV] Ramón Rosero"]
    B -->|Complicación Post-Op| D["Alerta Inmediata a [COORD] Carolina y [MED] Dr. Marcos Yepes"]
    B -->|Depósito No Acreditado| E["[COORD] Carolina envía link o datos de reintento de pago a [PAX] Paciente"]
    B -->|Solicitud de Itinerario| F["[COORD] Carolina responde con Ficha Técnica del Día a [PAX] Paciente"]`
};

export const FLOW_METADATA = [
    { id: "flow-macro", canvasId: "can-macro", navId: "nav-flow-macro", title: "0. Ciclo de Vida Macro 360°" },
    { id: "flow-lead", canvasId: "can-lead", navId: "nav-flow-lead", title: "1. Lead & Medisch Dossier ([COORD] Carolina Cortázar)" },
    { id: "flow-quote", canvasId: "can-quote", navId: "nav-flow-quote", title: "2. Cotización Dinámica CTZ ([COM-INT] Blanca Gilma)" },
    { id: "flow-booking", canvasId: "can-booking", navId: "nav-flow-booking", title: "3. Depósito & Póliza RVA ([COORD] Carolina Cortázar)" },
    { id: "flow-checkmig", canvasId: "can-checkmig", navId: "nav-flow-checkmig", title: "4. Check-Mig & Vuelos ([COORD] Carolina Cortázar)" },
    { id: "flow-transport", canvasId: "can-transport", navId: "nav-flow-transport", title: "5. Despacho Aeroturex ([DRV] Ramón Rosero)" },
    { id: "flow-clinical", canvasId: "can-clinical", navId: "nav-flow-clinical", title: "6. Citas HPTU & Labs ([MED] Dr. Marcos Yepes)" },
    { id: "flow-companion", canvasId: "can-companion", navId: "nav-flow-companion", title: "7. Acompañamiento Bilingüe ([GUIA] Guianza Express)" },
    { id: "flow-postop", canvasId: "can-postop", navId: "nav-flow-postop", title: "8. Villa Anita & Post-Op ([GUIA] Enfermera)" },
    { id: "flow-fittotly", canvasId: "can-fittotly", navId: "nav-flow-fittotly", title: "9. Alta Médica Fit-to-Fly ([MED] Dr. Marcos Yepes)" },
    { id: "flow-finance", canvasId: "can-finance", navId: "nav-flow-finance", title: "10. Liquidaciones & DTW ([DIR-MED] Dra. Jenny Acosta)" },
    { id: "flow-whatsapp", canvasId: "can-whatsapp", navId: "nav-flow-whatsapp", title: "11. Atención WhatsApp & Excepciones ([COORD] Carolina Cortázar)" },
    { id: "flow-audit", isHtml: true, navId: "nav-flow-audit", title: "12. Auditoría de Vacíos & Gaps" },
    { id: "flow-itinerarios", isHtml: true, navId: "nav-flow-itinerarios", title: "13. Itinerarios & Liquidaciones en Campo" }
];
