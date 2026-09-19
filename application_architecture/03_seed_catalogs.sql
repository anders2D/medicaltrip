-- =============================================================================
-- SEED DATA: CATÁLOGOS REALES DE TARIFAS, PROVEEDORES Y CUPS MÉDICOS
-- Extraído de: TARIFAS CONVENIO VS PARTICULARES 2024.xlsx & 01. Tarifas 2025.xlsx
-- =============================================================================

-- 1. INSERTAR PROVEEDORES PRINCIPALES
INSERT INTO proveedores (codigo_proveedor, tipo_proveedor, razon_social, contacto_nombre, contacto_telefono, direccion, ciudad)
VALUES 
    ('PROV-AEROTUREX', 'TRANSPORTE', 'Aeroturex Transporte Especial S.A.S.', 'Despacho Logístico', '+573007132111', 'Aeropuerto JMC / Medellín', 'Medellin'),
    ('PROV-HPTU', 'CLINICA', 'Hospital Pablo Tobón Uribe (HPTU)', 'Admisiones Internacionales', '+5744459000', 'Calle 78B #69-240', 'Medellin'),
    ('PROV-CARDIOVID', 'CLINICA', 'Clínica Cardio VID (Fundación VID)', 'Chequeos Ejecutivos', '+5743227090', 'Calle 78B #75-86', 'Medellin'),
    ('PROV-REGENCORD', 'CLINICA', 'Regencord Banco de Células Madre y Terapia Celular', 'Dirección Médica', '+573001234567', 'El Poblado', 'Medellin'),
    ('PROV-COLUMNA', 'CLINICA', 'Clínica de la Columna y Quiropráctica', 'Recepción Pacientes', '+573105554433', 'Laureles', 'Medellin'),
    ('PROV-HOT-POBLADO', 'HOTEL', 'Hotel Poblado Plaza', 'Reservas Corporativas', '+5743125555', 'Cra 43A #4 Sur-75', 'Medellin'),
    ('PROV-HOT-DORADO70', 'HOTEL', 'Hotel Dorado La 70', 'Recepción', '+5744487070', 'Cra 70 #44B-70', 'Medellin'),
    ('PROV-HOT-VANITA', 'HOTEL', 'Villa Anita Casa de Recuperación Postoperatoria', 'Enfermería de Turno', '+57315998877', 'Envigado / El Poblado', 'Medellin')
ON CONFLICT (codigo_proveedor) DO NOTHING;

-- 2. INSERTAR CATÁLOGO DE PROCEDIMIENTOS CUPS CON TARIFAS CONVENIO VS PARTICULAR
INSERT INTO procedimientos_cups_catalogo (codigo_cups, categoria, descripcion, tarifa_particular_cop, tarifa_convenio_cop)
VALUES
    -- RESONANCIAS MAGNÉTICAS (RNM)
    ('883101', 'RNM', 'RESONANCIA MAGNETICA DE CEREBRO SIMPLE', 710000.00, 498000.00),
    ('883101-C', 'RNM', 'RESONANCIA NUCLEAR MAGNETICA DE CEREBRO CONTRASTADA', 998000.00, 764000.00),
    ('883102', 'RNM', 'RESONANCIA MAGNETICA DE BASE DE CRANEO-SILLA TURCA', 710000.00, 498000.00),
    ('883103', 'RNM', 'RESONANCIA MAGNETICA DE ORBITAS', 710000.00, 498000.00),
    ('883104', 'RNM', 'RESONANCIA MAGNETICA CEREBRAL FUNCIONAL', 850000.00, 629000.00),
    ('883210', 'RNM', 'RESONANCIA MAGNETICA DE COLUMNA CERVICAL SIMPLE', 710000.00, 498000.00),
    ('883220', 'RNM', 'RESONANCIA MAGNETICA DE COLUMNA TORACICA SIMPLE', 710000.00, 498000.00),
    ('883230', 'RNM', 'RESONANCIA MAGNETICA DE COLUMNA LUMBOSACRA SIMPLE', 710000.00, 498000.00),
    ('883401', 'RNM', 'RESONANCIA MAGNETICA DE ABDOMEN SIMPLE', 710000.00, 498000.00),
    ('883434', 'RNM', 'COLANGIORESONANCIA VIAS BILIARES', 710000.00, 498000.00),
    
    -- BLOQUEOS Y MANEJO DE DOLOR (2025)
    ('61100', 'BIOP', 'BIOPSIA DE TIROIDES GUIADA POR ECOGRAFIA', 600000.00, 428720.00),
    ('401101', 'BLOQ', 'BLOQUEO DE NERVIO MEDIANO', 950000.00, 731500.00),
    ('38200', 'BLOQ', 'NEUROLISIS DE RAÍCES ESPINALES', 3800000.00, 2849050.00),
    ('48301', 'BLOQ', 'BLOQUEOS FACETARIOS CERVICALES, TORÁCICOS Y LUMBARES', 1350000.00, 950000.00),
    ('992300', 'BLOQ', 'INYECCION INTERLAMINAR DE ESTEROIDES', 1650000.00, 1242600.00),
    ('53304', 'BLOQ', 'BLOQUEO GASSERIANO DEL TRIGEMINO GUIADO POR FLUOROSCOPIA', 3000000.00, 2268129.00),
    
    -- CONSULTAS ESPECIALIZADAS Y CHEQUEOS
    ('890243', 'CONS', 'CONSULTA POR ESPECIALISTA EN DOLOR Y CUIDADOS PALIATIVOS', 320000.00, 236550.00),
    ('890201', 'CONS', 'CONSULTA VALORACION MEDICA GENERAL BILINGUE (DR. MARCOS YEPES)', 250000.00, 180000.00),
    ('CHQ-CARDIOVID', 'CHEQUEO', 'PAQUETE CHEQUEO EJECUTIVO CARDIO VID INTEGRAL', 3800000.00, 2750000.00),
    ('TER-REGENCORD', 'TERAPIA', 'PROTOCOLO TERAPIA CELULAR CON CELULAS MADRE MESENQUIMALES', 15000000.00, 11500000.00)
ON CONFLICT (codigo_cups) DO NOTHING;

-- 3. INSERTAR HOTELES Y ALOJAMIENTOS CON TARIFAS
INSERT INTO hoteles_alojamientos (proveedor_id, nombre_hotel, tipo_alojamiento, tarifa_noche_sencilla_cop, tarifa_noche_doble_cop, incluye_desayuno, incluye_dieta_postop, direccion, zona)
SELECT id, 'Hotel Poblado Plaza', 'HOTEL_EJECUTIVO', 420000.00, 510000.00, TRUE, FALSE, 'Cra 43A #4 Sur-75', 'El Poblado'
FROM proveedores WHERE codigo_proveedor = 'PROV-HOT-POBLADO'
ON CONFLICT DO NOTHING;

INSERT INTO hoteles_alojamientos (proveedor_id, nombre_hotel, tipo_alojamiento, tarifa_noche_sencilla_cop, tarifa_noche_doble_cop, incluye_desayuno, incluye_dieta_postop, direccion, zona)
SELECT id, 'Hotel Dorado La 70', 'HOTEL_EJECUTIVO', 220000.00, 280000.00, TRUE, FALSE, 'Cra 70 #44B-70', 'Laureles'
FROM proveedores WHERE codigo_proveedor = 'PROV-HOT-DORADO70'
ON CONFLICT DO NOTHING;

INSERT INTO hoteles_alojamientos (proveedor_id, nombre_hotel, tipo_alojamiento, tarifa_noche_sencilla_cop, tarifa_noche_doble_cop, incluye_desayuno, incluye_dieta_postop, direccion, zona)
SELECT id, 'Villa Anita Recovery House', 'CASA_RECUPERACION_POSTOP', 350000.00, 480000.00, TRUE, TRUE, 'Calle 10 Sur #30-45', 'El Poblado'
FROM proveedores WHERE codigo_proveedor = 'PROV-HOT-VANITA'
ON CONFLICT DO NOTHING;
