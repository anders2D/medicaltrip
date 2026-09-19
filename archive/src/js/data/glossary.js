/**
 * Medical Trip Hub — Glosario y Diccionario de Términos Operativos
 */

export const GLOSSARY_CATEGORIES = [
    { id: "cat-all", label: "Todos los Términos", icon: "fa-list" },
    { id: "cat-roles", label: "Roles & Prefijos", icon: "fa-user-tag" },
    { id: "cat-docs", label: "Códigos & Documentos", icon: "fa-file-lines" },
    { id: "cat-tech", label: "Finanzas & Tecnología", icon: "fa-microchip" },
    { id: "cat-places", label: "Ubicaciones & Red", icon: "fa-hospital" }
];

export const GLOSSARY_TERMS = [
    // 1. ROLES Y PREFIJOS
    {
        term: "[PAX]",
        category: "cat-roles",
        badge: "Rol Operativo",
        badgeClass: "badge-blue",
        title: "Pasajero / Paciente Internacional",
        origin: "Proveniente de la industria aeronáutica comercial (Passenger)",
        meaning: "Identifica al paciente que viaja desde el exterior (Curazao, Aruba, Surinam, etc.) a Colombia para someterse a tratamientos médicos, cirugías o chequeos.",
        example: "[PAX] George Hernandez (Curazao) en el caso RVA282-5."
    },
    {
        term: "[COORD]",
        category: "cat-roles",
        badge: "Rol Operativo",
        badgeClass: "badge-purple",
        title: "Coordinadora de Atención al Cliente y Viajero (ACV)",
        origin: "Atención al Cliente y Logística Integral",
        meaning: "Responsable del canal de WhatsApp, triaje de leads, recepción de Medisch Dossier, cotizaciones, radicación de Check-Mig y despacho de transportes.",
        example: "[COORD] Carolina Cortázar (Líder operativa de ACV)."
    },
    {
        term: "[DIR-MED]",
        category: "cat-roles",
        badge: "Rol Operativo",
        badgeClass: "badge-teal",
        title: "Dirección General & Auditoría Médica",
        origin: "Representación Legal y Dirección Asistencial",
        meaning: "Máxima autoridad de la empresa. Gestiona convenios hospitalarios, autoriza procedimientos de alta complejidad y audita márgenes financieros.",
        example: "[DIR-MED] Dra. Jenny Paola Acosta."
    },
    {
        term: "[COM-INT]",
        category: "cat-roles",
        badge: "Rol Operativo",
        badgeClass: "badge-amber",
        title: "Comercial & Alianzas Caribe",
        origin: "Desarrollo de Negocios Internacionales",
        meaning: "Encargada de las relaciones B2B con agencias de viajes emisoras en Curazao y captación de pacientes en el Caribe insular.",
        example: "[COM-INT] Blanca Gilma Corrales."
    },
    {
        term: "[MED]",
        category: "cat-roles",
        badge: "Rol Operativo",
        badgeClass: "badge-teal",
        title: "Médico Asesor & Especialistas",
        origin: "Cuerpo Médico Tratante",
        meaning: "Médicos generales bilingües y especialistas (cirujanos plásticos, cardiólogos, alergólogos) que emiten conceptos, asignan códigos CUPS y otorgan el alta médica.",
        example: "[MED] Dr. Marcos Yepes (Médico Asesor) / Dr. Daniel Amaya."
    },
    {
        term: "[DRV]",
        category: "cat-roles",
        badge: "Rol Operativo",
        badgeClass: "badge-blue",
        title: "Conductor / Chofer de Transporte Especial",
        origin: "Flota de Transporte Aeroturex (Driver)",
        meaning: "Conductores certificados de servicio especial encargados de recibir a los pacientes en el aeropuerto JMC y trasladarlos entre clínicas y hoteles.",
        example: "[DRV] Ramón Rosero (Principal) / [DRV] Juan Carlos Montoya."
    },
    {
        term: "[GUIA]",
        category: "cat-roles",
        badge: "Rol Operativo",
        badgeClass: "badge-purple",
        title: "Acompañante Presencial Bilingüe & Enfermería",
        origin: "Guianza Express & Cuidados de Campo",
        meaning: "Personal que acompaña al paciente en el consultorio para traducción simultánea (Papiamento/Inglés/Español), compra en farmacias y curaciones postoperatorias.",
        example: "[GUIA] Enfermera Bilingüe de Guianza Express."
    },
    {
        term: "[CLINIC]",
        category: "cat-roles",
        badge: "Entidad Aliada",
        badgeClass: "badge-teal",
        title: "Red Hospitalaria & Clínicas",
        origin: "Prestadores de Servicios de Salud",
        meaning: "Hospitales y centros médicos de cuarto nivel donde se practican los exámenes de laboratorio, imágenes diagnósticas y cirugías.",
        example: "[CLINIC] Hospital Pablo Tobón Uribe (HPTU), Cardio VID, Regencord."
    },
    {
        term: "[HOTEL]",
        category: "cat-roles",
        badge: "Entidad Aliada",
        badgeClass: "badge-amber",
        title: "Hospedaje & Casas de Recuperación",
        origin: "Infraestructura Hotelera",
        meaning: "Alojamientos con camas hospitalarias articuladas y adecuación postquirúrgica para la estadía segura del paciente.",
        example: "[HOTEL] Villa Anita, Edificio Park 42, Hotel Poblado Plaza."
    },
    {
        term: "[FIN]",
        category: "cat-roles",
        badge: "Entidad Financiera",
        badgeClass: "badge-amber",
        title: "Módulo Financiero, Tesorería & Banco",
        origin: "Control Contable y Monetario",
        meaning: "Gestión de depósitos internacionales, conciliación de transferencias en Bancolombia y cálculo de rentabilidad neta.",
        example: "[FIN] Bancolombia / Tesorería Medical Trip."
    },

    // 2. CÓDIGOS Y DOCUMENTOS
    {
        term: "RVA",
        category: "cat-docs",
        badge: "Código Canónico",
        badgeClass: "badge-amber",
        title: "Código de Reserva Confirmada",
        origin: "Acrónimo de 'Reserva'",
        meaning: "Identificador único asignado cuando un paciente realiza el depósito bancario. Activa la póliza de viajero, el bloqueo de hotel y el grupo de WhatsApp.",
        example: "RVA282-5 (Expediente de reserva del caso George Hernandez)."
    },
    {
        term: "CTZ",
        category: "cat-docs",
        badge: "Código Canónico",
        badgeClass: "badge-teal",
        title: "Cotización Formal Dinámica",
        origin: "Acrónimo de 'Cotización'",
        meaning: "Propuesta económica en PDF que incluye procedimientos médicos, tarifas de hospedaje, traslados, acompañamiento y conversión multidivisa USD/COP.",
        example: "CTZ282-5 (Cotización enviada previo a la reserva)."
    },
    {
        term: "CUPS",
        category: "cat-docs",
        badge: "Estándar Médico",
        badgeClass: "badge-teal",
        title: "Clasificación Única de Procedimientos en Salud",
        origin: "Ministerio de Salud de Colombia",
        meaning: "Códigos numéricos oficiales estandarizados en Colombia para facturar y ordenar cirugías, resonancias y laboratorios clínicos.",
        example: "Código 883101 (Resonancia Nuclear Magnética de Cerebro)."
    },
    {
        term: "Medisch Dossier",
        category: "cat-docs",
        badge: "Documento Clínico",
        badgeClass: "badge-purple",
        title: "Expediente Médico Internacional",
        origin: "Término en Neerlandés / Papiamento ('Historial Médico')",
        meaning: "Conjunto de antecedentes, diagnósticos y exámenes previos que el paciente envía en su idioma nativo para valoración por los médicos en Medellín.",
        example: "Dossier con reportes de laboratorio enviado por WhatsApp."
    },
    {
        term: "Check-Mig",
        category: "cat-docs",
        badge: "Trámite Migratorio",
        badgeClass: "badge-rose",
        title: "Formulario Migratorio Obligatorio de Colombia",
        origin: "Migración Colombia",
        meaning: "Declaración electrónica obligatoria que debe radicarse 48 a 24 horas antes de abordar vuelos internacionales hacia y desde Colombia.",
        example: "Check-Mig radicado por [COORD] Carolina para vuelo Wingo 7449."
    },
    {
        term: "Fit-to-Fly",
        category: "cat-docs",
        badge: "Certificado Clínico",
        badgeClass: "badge-teal",
        title: "Certificado Médico de Aptitud de Vuelo",
        origin: "Regulación Aeronáutica Médica Internacional",
        meaning: "Certificado formal firmado por el cirujano tratante avalando que el paciente ha cicatrizado y se encuentra en condiciones seguras de viajar en avión.",
        example: "Certificado Fit-to-Fly expedido en consulta final previa al viaje."
    },

    // 3. TECNOLOGÍA & FINANZAS
    {
        term: "DTW",
        category: "cat-tech",
        badge: "Algoritmo",
        badgeClass: "badge-purple",
        title: "Dynamic Time Warping (Alineamiento Temporal Dinámico)",
        origin: "Algoritmo de series de tiempo matemáticas",
        meaning: "Técnica que flexibiliza el eje temporal para emparejar automáticamente los servicios prestados en WhatsApp con los asientos contables registrados en Excel días después.",
        example: "Reconciliación de traslados con desfase de 3 a 14 días en sábanas contables."
    },
    {
        term: "Spread 30%",
        category: "cat-tech",
        badge: "Regla Financiera",
        badgeClass: "badge-amber",
        title: "Margen Diferencial de Convenio",
        origin: "Modelo de Negocio Medical Trip",
        meaning: "Diferencial de ganancia bruta (~30%) que se aplica entre la tarifa hospitalaria institucional acordada por convenio y la tarifa particular cobrada al viajero.",
        example: "Tarifa Convenio HPTU $498.000 vs. Tarifa Venta $710.000 (Margen: $212.000)."
    },
    {
        term: "3NF",
        category: "cat-tech",
        badge: "Base de Datos",
        badgeClass: "badge-blue",
        title: "Tercera Forma Normal",
        origin: "Teoría de Bases de Datos Relacionales (Codd)",
        meaning: "Diseño de base de datos relacional donde cada tabla tiene una clave primaria única y no existen dependencias transitivas ni datos duplicados.",
        example: "data/medicaltrip_master.db estructurada en 3NF estricta."
    },
    {
        term: "OCEL 2.0",
        category: "cat-tech",
        badge: "Minería de Procesos",
        badgeClass: "badge-purple",
        title: "Object-Centric Event Logs (Registro Centrado en Objetos)",
        origin: "Estándar OCPM de Minería de Procesos",
        meaning: "Formato avanzado de registro de eventos donde una sola acción (ej. un traslado) puede estar asociada a múltiples entidades a la vez (paciente, chofer, clínica, hotel).",
        example: "18.602 eventos OCEL y 25.241 relaciones E2O en el master log."
    },
    {
        term: "Soundness",
        category: "cat-tech",
        badge: "Validación Matemática",
        badgeClass: "badge-teal",
        title: "Solidez Estructural en Redes de Procesos",
        origin: "Teoría de Redes de Petri y BPMN 2.0",
        meaning: "Propiedad matemática que garantiza que un diagrama de procesos siempre inicia en un solo punto, finaliza limpiamente y no tiene interbloqueos ni tareas muertas.",
        example: "Los 13 diagramas de flujo cuentan con 100% Soundness garantizado."
    },
    {
        term: "PHI",
        category: "cat-tech",
        badge: "Privacidad & Legal",
        badgeClass: "badge-rose",
        title: "Protected Health Information (Información Médica Protegida)",
        origin: "Estándares HIPAA / Ley 1581 de Colombia / GDPR",
        meaning: "Datos médicos y personales confidenciales que deben protegerse y seudonimizarse (ej. `ENT-PAX-XXXX`) para evitar la exposición pública de historiales o pasaportes.",
        example: "Seudonimización automática en todos los reportes y visualizadores."
    },

    // 4. UBICACIONES Y RED
    {
        term: "JMC",
        category: "cat-places",
        badge: "Aeropuerto",
        badgeClass: "badge-blue",
        title: "Aeropuerto Internacional José María Córdova (MDE / SKRG)",
        origin: "Rionegro / Medellín, Colombia",
        meaning: "Principal puerta de entrada aérea internacional donde la flota de Aeroturex recibe a los pacientes en la Puerta 2 de Llegadas Internacionales.",
        example: "Traslado JMC ➔ Edificio Park 42 ($110.000 COP)."
    },
    {
        term: "HPTU",
        category: "cat-places",
        badge: "Hospital",
        badgeClass: "badge-teal",
        title: "Hospital Pablo Tobón Uribe",
        origin: "Medellín, Colombia",
        meaning: "Hospital universitario de alta complejidad con acreditación internacional, principal aliado clínico para cirugías complejas y laboratorios de referencia.",
        example: "Cita de valoración y exámenes prequirúrgicos de [PAX] Zulaica Giterson."
    },
    {
        term: "Villa Anita",
        category: "cat-places",
        badge: "Casa de Recuperación",
        badgeClass: "badge-amber",
        title: "Villa Anita Recovery House",
        origin: "Medellín / Guarne",
        meaning: "Centro de recuperación postoperatorio especializado con enfermería 24/7, alimentación balanceada postquirúrgica y masajes de drenaje linfático.",
        example: "Hospedaje postoperatorio para cirugías plásticas de alta recuperación."
    }
];
