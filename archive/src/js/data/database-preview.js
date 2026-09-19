/**
 * Medical Trip Hub — Catálogo Maestro de Base de Datos Relacional 3NF (SQLite)
 * Evidencia empírica extraída de data/medicaltrip_master.db y 206 libros de data/reservas_drive/
 */

export const DATABASE_SCHEMA_METRICS = {
    totalTables: 10,
    totalPatients: 304,
    totalDriveCases: 193,
    totalOcelEvents: 18602,
    totalOcelRelations: 25241,
    foreignKeyIntegrity: "100% (0 Violaciones)",
    normalizationLevel: "3NF (Tercera Forma Normal)"
};

export const DATABASE_TABLES = [
    {
        id: "tbl-pacientes",
        name: "pacientes",
        label: "Pacientes Normalizados",
        icon: "fa-users",
        badge: "304 Registros",
        columns: ["UUID", "Nombre Completo", "País Origen", "Idioma", "RVA / CTZ", "Mensajes"],
        rows: [
            ["ENT-PAX-1001", "[PAX] George Hernandez", "Curazao", "Papiamento / Inglés", "RVA282-5", "248 msgs"],
            ["ENT-PAX-1002", "[PAX] Zulaica Giterson", "Curazao", "Papiamento / Neerlandés", "RVA271-5", "333 msgs"],
            ["ENT-PAX-1003", "[PAX] Carlos Marcano", "Curazao", "Papiamento / Español", "RVA007-1", "112 msgs"],
            ["ENT-PAX-1004", "[PAX] Shalini Mohan", "Surinam", "Inglés / Sranan Tongo", "RVA144-2", "89 msgs"],
            ["ENT-PAX-1005", "[PAX] Ziva Jansen", "Curazao", "Papiamento / Neerlandés", "CTZ320-1", "64 msgs"],
            ["ENT-PAX-1006", "[PAX] Mariana Doran", "Curazao", "Papiamento / Inglés", "RVA176-1", "142 msgs"],
            ["ENT-PAX-1007", "[PAX] Jacqueline Lanoy", "Curazao", "Papiamento", "RVA244-1", "98 msgs"],
            ["ENT-PAX-1008", "[PAX] Robertico Joseph", "Curazao", "Papiamento", "RVA247-1", "81 msgs"],
            ["ENT-PAX-1009", "[PAX] Urvin Faneijte", "Curazao", "Papiamento", "RVA248-1", "115 msgs"],
            ["ENT-PAX-1010", "[PAX] Chantilly Leonora", "Curazao", "Papiamento / Neerlandés", "CTZ167-2", "73 msgs"],
            ["ENT-PAX-1011", "[PAX] Audrey Papa", "Curazao", "Papiamento / Inglés", "CTZ216-2", "156 msgs"],
            ["ENT-PAX-1012", "[PAX] Hermeline Bazur", "Curazao", "Papiamento", "CTZ237-1", "92 msgs"]
        ]
    },
    {
        id: "tbl-plantillas-drive",
        name: "estructura_libros_rva",
        label: "Estructura 6 Hojas (Drive)",
        icon: "fa-table-cells",
        badge: "6 Hojas Estándar",
        columns: ['Tipo Documento', 'Código / Estándar', 'Registros Extraídos', 'Hojas Canónicas Mapeadas', 'Países Atendidos'],
        rows: [
            ['Reserva Confirmada', 'RVA (151 Casos)', '151 Libros Procesados', 'PASAPORTE, ARCHIVO, ITINERARIO, COSTEO, CONFIRMACION, VUELO+SIM', 'Curazao (200), Bonaire (8), Surinam (11), NL (3)'],
            ['Cotización Oficial', 'CTZ (59 Casos)', '59 Libros Procesados', 'COSTEO, ITINERARIO PROPUESTO, PASAPORTE PRELIMINAR', 'Curazao, Aruba, Sint Maarten, Bonaire'],
            ['Filiación & Pasaporte', 'PASAPORTE-HC', '218 Expedientes', 'Nombre, Pasaporte, RH, Seguro, Peso, Altura, Idioma, Contacto', 'Caribe Neerlandés y Países Bajos'],
            ['Despacho Logístico', 'VUELO+HOTEL+SIM', '203 Despachos', 'Wingo 7449 / AV 093, Suite Park 42 / Villa Anita, SIM Claro', 'Aeropuerto JMC ➔ Medellín'],
            ['Costeo & Margen', 'COSTEO (Spread 30%)', '218 Liquidaciones', 'Neta Sistema vs Precio Venta vs Margen Spread 30% vs Retención', 'Bancolombia TRM Hedging 72h'],
            ['Cronograma Operativo', 'ITINERARIO', '2.910 Hitos Parseados', 'Recogidas JMC, Citas HPTU / Cardio VID, Retornos y Vuelos', 'Medellín / Rionegro / Manizales'],
            ['Formatos Estándar', 'PLANTILLA JENNY / STD', '1.685 Hojas Totales', 'Formato Maestro de 6 Hojas para Operaciones y Franquicias', 'Medical Trip Colombia S.A.S.']
        ]
    },
    {
        id: "tbl-paquetes-tarifas",
        name: "catalogo_paquetes_2025",
        label: "Catálogo Tarifas 2025",
        icon: "fa-notes-medical",
        badge: "Tarifario Maestro",
        columns: ["Paquete / Procedimiento", "Proveedor Clínico", "Duración", "Tarifa Convenio", "Tarifa Venta", "Margen Spread"],
        rows: [
            ["Chequeo Médico Básico (Hombre/Mujer)", "Hospital Pablo Tobón Uribe (HPTU)", "1 Día", "$1.850.000 COP", "$2.650.000 COP", "30.2% ($800.000 COP)"],
            ["Chequeo Integral Cardiológico", "Clínica Cardio VID", "1 Día", "$2.750.000 COP", "$3.800.000 COP", "27.6% ($1.050.000 COP)"],
            ["Programa Rotativo SOY VITAL Premium", "Sanante / Parque de la Salud Dr. Rojas MZL", "9 Días / 8 Noches", "$7.200.000 COP", "$10.280.000 COP", "30.0% ($3.080.000 COP)"],
            ["Estudio de Polisomnografía Nocturna", "Clínica del Sueño / HPTU", "1 Noche", "$950.000 COP", "$1.360.000 COP", "30.1% ($410.000 COP)"],
            ["Consulta Ginecología & Piso Pélvico", "Especialistas HPTU", "Consulta", "$280.000 COP", "$400.000 COP", "30.0% ($120.000 COP)"],
            ["Resonancia Nuclear Magnética (RNM)", "Cedimed / HPTU", "Ambulatorio", "$498.000 COP", "$710.000 COP", "29.9% ($212.000 COP)"]
        ]
    },
    {
        id: "tbl-reservas",
        name: "reservas_rva",
        label: "Reservas Confirmadas (RVA)",
        icon: "fa-shield-halved",
        badge: "193 Expedientes",
        columns: ["Código RVA", "Paciente / Acompañantes", "Fecha Llegada", "Aerolínea / Vuelo", "Hospedaje Destino", "Estado"],
        rows: [
            ["RVA282-5", "[PAX] George Hernandez (Curazao)", "2026-08-05", "WINGO 7449", "Ed. Park 42 El Poblado", "COMPLETADO"],
            ["RVA176-1", "[PAX] Mariana Doran (Curazao x2)", "2025-10-20", "WINGO 7449", "Ed. Park 42 El Poblado", "COMPLETADO"],
            ["RVA244-1", "[PAX] Jacqueline Lanoy (Curazao x2)", "2025-11-14", "Avianca 093", "Hotel Poblado Plaza", "COMPLETADO"],
            ["RVA247-1", "[PAX] Robertico Joseph (Curazao x1)", "2025-11-20", "WINGO 7449", "Ed. Park 42 El Poblado", "COMPLETADO"],
            ["RVA248-1", "[PAX] Urvin Faneijte (Curazao x2)", "2025-12-05", "WINGO 7449", "Ed. Park 42 El Poblado", "COMPLETADO"],
            ["RVA271-5", "[PAX] Zulaica Giterson (Curazao)", "2026-07-28", "Avianca 093", "Hotel Poblado Plaza", "COMPLETADO"],
            ["RVA007-1", "[PAX] Carlos Marcano (Curazao)", "2026-06-15", "WINGO 7449", "Ed. Park 42 El Poblado", "COMPLETADO"],
            ["RVA144-2", "[PAX] Shalini Mohan (Surinam)", "2026-07-10", "Copa CM 452", "Villa Anita Casa Recuperación", "COMPLETADO"],
            ["RVA011-10", "[PAX] Reemy Poppen (Curazao)", "2026-07-13", "WINGO 7449", "Ed. Park 42 El Poblado", "COMPLETADO"],
            ["RVA335-1", "[PAX] Sharella Ernestina (Curazao)", "2026-07-31", "WINGO 7449", "Hotel Dorado La 70", "COMPLETADO"]
        ]
    },
    {
        id: "tbl-cotizaciones",
        name: "cotizaciones_ctz",
        label: "Cotizaciones Dinámicas (CTZ)",
        icon: "fa-file-invoice-dollar",
        badge: "79 Cotizaciones",
        columns: ["Código CTZ", "Paciente / Caso", "Procedimiento Principal", "Monto USD", "Monto COP", "Margen Spread"],
        rows: [
            ["CTZ320-1", "[PAX] Ziva Jansen (Curazao)", "Chequeo Médico Integral + Ginecología", "$1.850 USD", "$7.400.000 COP", "30.0% ($2.220.000)"],
            ["CTZ150-1", "[PAX] Suvienne Rosa Lourens (Cur x4)", "Paquete Médico Familiar x4 Personas", "$4.950 USD", "$19.800.000 COP", "30.0% ($5.940.000)"],
            ["CTZ167-2", "[PAX] Chantilly Leonora (Curazao)", "Resonancia + Valoración Especialista", "$1.200 USD", "$4.800.000 COP", "29.5% ($1.416.000)"],
            ["CTZ170-1", "[PAX] Elyhaila Delando (Ámsterdam)", "Chequeo Especializado + Hospedaje Park 42", "$2.600 USD", "$10.400.000 COP", "30.0% ($3.120.000)"],
            ["CTZ216-2", "[PAX] Audrey Papa (Curazao x2)", "Paquete Quirúrgico + Recuperación Villa Anita", "$3.800 USD", "$15.200.000 COP", "31.5% ($4.788.000)"],
            ["CTZ237-1", "[PAX] Hermeline Bazur (Curazao x2)", "Chequeo Integral + Cardiología VID", "$2.400 USD", "$9.600.000 COP", "28.5% ($2.736.000)"],
            ["CTZ282-5", "[PAX] George Hernandez (Curazao)", "Paquete Quirúrgico + Estadía Park 42", "$2.850 USD", "$11.400.000 COP", "30.0% ($3.420.000)"],
            ["CTZ271-5", "[PAX] Zulaica Giterson (Curazao)", "Chequeo Integral Cardio VID + RNM", "$1.500 USD", "$6.000.000 COP", "28.5% ($1.710.000)"],
            ["CTZ343-1", "[PAX] Netishkoemar Lila (Surinam)", "Medicina Regenerativa Regencord", "$3.200 USD", "$12.800.000 COP", "32.0% ($4.096.000)"]
        ]
    },
    {
        id: "tbl-traslados",
        name: "traslados_logistica",
        label: "Logística Aeroturex",
        icon: "fa-van-shuttle",
        badge: "63 Traslados",
        columns: ["Código RVA", "Paciente", "Fecha / Hora", "Ruta de Servicio", "Conductor Asignado", "Tarifa Cobrada"],
        rows: [
            ["RVA282-5", "[PAX] George Hernandez", "2026-08-05 14:30", "JMC Aeropuerto ➔ Edificio Park 42", "[DRV] Ramón Rosero", "$110.000 COP"],
            ["RVA282-5", "[PAX] George Hernandez", "2026-08-06 07:00", "Edificio Park 42 ➔ HPTU Clínica", "[DRV] Ramón Rosero", "$50.000 COP"],
            ["RVA176-1", "[PAX] Mariana Doran", "2025-10-20 16:15", "JMC Aeropuerto ➔ Edificio Park 42", "[DRV] Ramón Rosero", "$110.000 COP"],
            ["RVA244-1", "[PAX] Jacqueline Lanoy", "2025-11-14 18:45", "JMC Aeropuerto ➔ Hotel Poblado Plaza", "[DRV] Juan Carlos Montoya", "$110.000 COP"],
            ["RVA271-5", "[PAX] Zulaica Giterson", "2026-07-28 12:15", "JMC Aeropuerto ➔ Hotel Poblado Plaza", "[DRV] Ramón Rosero", "$110.000 COP"],
            ["RVA144-2", "[PAX] Shalini Mohan", "2026-07-10 18:40", "JMC Aeropuerto ➔ Villa Anita", "[DRV] Ramón Rosero", "$110.000 COP"]
        ]
    },
    {
        id: "tbl-empleados",
        name: "empleados",
        label: "Directorio de Personal",
        icon: "fa-id-card-clip",
        badge: "5 Roles",
        columns: ["UUID", "Nombre Real", "Rol Operativo", "Teléfono E.164", "Identificador Chat"],
        rows: [
            ["EMP-CAROLINA", "[COORD] Carolina Cortázar", "Coordinadora General de Atención al Cliente (ACV)", "+573001234567", "carolina_acv@medicaltrip.co"],
            ["EMP-JENNY", "[DIR-MED] Dra. Jenny Paola Acosta", "Dirección General & Auditoría Médica", "+573007654321", "dra.acosta@medicaltrip.co"],
            ["EMP-BLANCA", "[COM-INT] Blanca Gilma Corrales", "Comercial & Alianzas Caribe", "+573109876543", "blanca.corrales@medicaltrip.co"],
            ["EMP-RAMON", "[DRV] Ramón Rosero", "Conductor Principal Flota Aeroturex", "+573155551234", "ramon.rosero@aeroturex.com"],
            ["EMP-MARCOS", "[MED] Dr. Marcos Yepes", "Médico Asesor & Especialista Tratante", "+573123456789", "dr.yepes@medicaltrip.co"]
        ]
    },
    {
        id: "tbl-proveedores",
        name: "proveedores",
        label: "Red Hospitalaria & Proveedores",
        icon: "fa-hospital-user",
        badge: "10 Proveedores",
        columns: ["UUID", "Tipo Proveedor", "Nombre Comercial", "Teléfono Contacto", "Ciudad / Sede", "Estado Convenio"],
        rows: [
            ["PROV-HPTU", "Hospital", "Hospital Pablo Tobón Uribe (HPTU)", "+576044459000", "Medellín (Robledo)", "Convenio Activo"],
            ["PROV-VID", "Clínica", "Clínica Cardio VID", "+576043227090", "Medellín (Robledo)", "Convenio Activo"],
            ["PROV-SANANTE", "Centro de Salud", "Sanante / Parque de la Salud Dr. Rojas", "+576068870000", "Manizales (MZL)", "Convenio Activo"],
            ["PROV-REGENCORD", "Clínica", "Regencord Medicina Regenerativa", "+576044481234", "Medellín (El Poblado)", "Convenio Activo"],
            ["PROV-AEROTUREX", "Transporte Especial", "Aeroturex Transporte Especializado", "+573155551234", "Rionegro / JMC", "Convenio Activo"],
            ["PROV-PARK42", "Hospedaje", "Edificio Park 42", "+573008889999", "Medellín (El Poblado)", "Convenio Activo"],
            ["PROV-VANITA", "Casa Recuperación", "Villa Anita Recovery House", "+573117778888", "Medellín / Guarne", "Convenio Activo"]
        ]
    },
    {
        id: "tbl-plantillas-wa",
        name: "plantillas_comunicacion",
        label: "Plantillas WhatsApp",
        icon: "fa-whatsapp",
        badge: "4 Scripts",
        columns: ["Categoría", "Frecuencia", "Ejemplo de Texto Estandarizado", "Variables Dinámicas"],
        rows: [
            ["Bienvenida & Triaje", "100% de Leads", "Bon dia / Hello! Bienvenido a Medical Trip Colombia. ¿Nos confirmas tu nombre y fecha estimada de viaje?", "{{nombre}}, {{pais_origen}}"],
            ["Envío de Cotización", "100% de CTZ", "Estimado {{nombre}}, adjuntamos la propuesta formal {{codigo_ctz}} en PDF con tarifas y hospedaje.", "{{nombre}}, {{codigo_ctz}}, {{monto_usd}}"],
            ["Confirmación Reserva", "100% de RVA", "¡Reserva confirmada {{codigo_rva}}! Te asignamos al conductor [DRV] Ramón Rosero en el aeropuerto JMC.", "{{nombre}}, {{codigo_rva}}, {{conductor}}"],
            ["Check-Mig & Vuelo", "48h antes", "Hola {{nombre}}, ya radicamos tu formulario Check-Mig para el vuelo {{numero_vuelo}}. Adjuntamos soporte.", "{{nombre}}, {{numero_vuelo}}, {{fecha}}"]
        ]
    }
];
