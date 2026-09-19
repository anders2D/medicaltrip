-- =============================================================================
-- ESQUEMA RELACIONAL EN TERCERA FORMA NORMAL (3NF) - MEDICAL TRIP OPERATIVE CLOUD
-- Dialecto: PostgreSQL 15+ / Compatible SQLite3
-- =============================================================================

-- Extensiones requeridas en PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- 1. MÓDULO DE PACIENTES Y CONTACTOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_paciente VARCHAR(30) UNIQUE NOT NULL, -- ENT-PAX-XXXX
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    pasaporte_numero VARCHAR(50) UNIQUE,
    pais_origen VARCHAR(50) NOT NULL, -- 'Curazao', 'Aruba', 'Surinam', 'USA'
    ciudad_origen VARCHAR(100),
    idioma_principal VARCHAR(20) DEFAULT 'Papiamento', -- 'Papiamento', 'Español', 'Ingles', 'Neerlandes'
    telefono_e164 VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    fecha_nacimiento DATE,
    genero VARCHAR(10),
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_telefono VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expedientes_medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    antecedentes_patologicos TEXT,
    alergias TEXT,
    medicacion_actual TEXT,
    medisch_dossier_url TEXT,
    resumen_historia_clinica TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. MÓDULO DE PROVEEDORES Y CATÁLOGO DE SERVICIOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_proveedor VARCHAR(30) UNIQUE NOT NULL, -- ENT-PROV-XXXX
    tipo_proveedor VARCHAR(30) NOT NULL, -- 'CLINICA', 'TRANSPORTE', 'HOTEL', 'LABORATORIO', 'AGENCIA'
    razon_social VARCHAR(150) NOT NULL,
    nit_rut VARCHAR(50),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(30) NOT NULL,
    contacto_email VARCHAR(150),
    direccion VARCHAR(200),
    ciudad VARCHAR(50) DEFAULT 'Medellin',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicos_especialistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_clinica_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    registro_medico VARCHAR(50),
    especialidad VARCHAR(100) NOT NULL, -- 'Medicina General', 'Cirugia Plastica', 'Cardiologia', 'Alergologia', 'Neurologia'
    telefono VARCHAR(30),
    es_bilingue BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS procedimientos_cups_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_cups VARCHAR(30) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'RNM', 'TAC', 'ECO', 'LAB', 'CIRUGIA', 'SUEROTERAPIA', 'BLOQUEO'
    descripcion VARCHAR(255) NOT NULL,
    tarifa_particular_cop DECIMAL(12,2) NOT NULL,
    tarifa_convenio_cop DECIMAL(12,2) NOT NULL,
    margen_bruto_cop DECIMAL(12,2) GENERATED ALWAYS AS (tarifa_particular_cop - tarifa_convenio_cop) STORED,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS hoteles_alojamientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
    nombre_hotel VARCHAR(100) NOT NULL,
    tipo_alojamiento VARCHAR(50) NOT NULL, -- 'HOTEL_EJECUTIVO', 'CASA_RECUPERACION_POSTOP', 'APARTAMENTO'
    tarifa_noche_sencilla_cop DECIMAL(10,2) NOT NULL,
    tarifa_noche_doble_cop DECIMAL(10,2) NOT NULL,
    incluye_desayuno BOOLEAN DEFAULT TRUE,
    incluye_dieta_postop BOOLEAN DEFAULT FALSE,
    direccion VARCHAR(200) NOT NULL,
    zona VARCHAR(50) DEFAULT 'El Poblado'
);

-- -----------------------------------------------------------------------------
-- 3. MÓDULO COMERCIAL, COTIZACIONES Y RESERVAS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotizaciones_ctz (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_ctz VARCHAR(30) UNIQUE NOT NULL, -- CTZ271-1
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    fecha_emision DATE DEFAULT CURRENT_DATE,
    validez_dias INTEGER DEFAULT 30,
    trm_aplicada DECIMAL(10,2) NOT NULL,
    total_servicios_medicos_usd DECIMAL(12,2) DEFAULT 0.0,
    total_hospedaje_usd DECIMAL(12,2) DEFAULT 0.0,
    total_transporte_usd DECIMAL(12,2) DEFAULT 0.0,
    total_acompanamiento_usd DECIMAL(12,2) DEFAULT 0.0,
    total_general_usd DECIMAL(12,2) NOT NULL,
    total_general_cop DECIMAL(14,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'EMITIDA', -- 'EMITIDA', 'ACEPTADA', 'EXPIRADA', 'RECHAZADA'
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items_cotizacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID NOT NULL REFERENCES cotizaciones_ctz(id) ON DELETE CASCADE,
    procedimiento_id UUID REFERENCES procedimientos_cups_catalogo(id),
    concepto_personalizado VARCHAR(200),
    cantidad INTEGER DEFAULT 1,
    precio_unitario_cop DECIMAL(12,2) NOT NULL,
    precio_unitario_usd DECIMAL(10,2) NOT NULL,
    subtotal_cop DECIMAL(12,2) NOT NULL,
    subtotal_usd DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reservas_rva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_rva VARCHAR(30) UNIQUE NOT NULL, -- RVA282-5
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    cotizacion_id UUID REFERENCES cotizaciones_ctz(id) ON DELETE SET NULL,
    hotel_id UUID REFERENCES hoteles_alojamientos(id),
    numero_acompanantes INTEGER DEFAULT 0,
    fecha_llegada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    deposito_requerido_usd DECIMAL(10,2) NOT NULL,
    deposito_pagado_usd DECIMAL(10,2) DEFAULT 0.0,
    saldo_pendiente_usd DECIMAL(10,2) GENERATED ALWAYS AS (deposito_requerido_usd - deposito_pagado_usd) STORED,
    estado_reserva VARCHAR(30) DEFAULT 'CONFIRMADA', -- 'CONFIRMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA'
    grupo_whatsapp_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. MÓDULO DE LOGÍSTICA, VUELOS, CHECK-MIG Y TRASLADOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS itinerarios_vuelo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas_rva(id) ON DELETE CASCADE,
    tipo_trayecto VARCHAR(20) NOT NULL, -- 'LLEGADA', 'RETORNO'
    aerolinea VARCHAR(50) NOT NULL, -- 'Wingo', 'Avianca', 'Copa'
    numero_vuelo VARCHAR(20) NOT NULL, -- 'WINGO 7449'
    aeropuerto_origen VARCHAR(10) NOT NULL, -- 'CUR', 'AUA', 'MDE', 'BOG'
    aeropuerto_destino VARCHAR(10) NOT NULL,
    fecha_hora_estimada TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_real TIMESTAMP WITH TIME ZONE,
    estado_vuelo VARCHAR(30) DEFAULT 'PROGRAMADO'
);

CREATE TABLE IF NOT EXISTS checkmig_formularios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas_rva(id) ON DELETE CASCADE,
    tipo_tramite VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA'
    codigo_radicado VARCHAR(50),
    archivo_pdf_url TEXT,
    completado BOOLEAN DEFAULT FALSE,
    fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS polizas_asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas_rva(id) ON DELETE CASCADE,
    numero_certificado VARCHAR(100) UNIQUE NOT NULL,
    aseguradora VARCHAR(100) NOT NULL,
    cobertura_monto_usd DECIMAL(12,2) DEFAULT 50000.0,
    vigencia_desde DATE NOT NULL,
    vigencia_hasta DATE NOT NULL,
    archivo_poliza_url TEXT
);

CREATE TABLE IF NOT EXISTS traslados_transporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas_rva(id) ON DELETE CASCADE,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    conductor_nombre VARCHAR(100) NOT NULL,
    conductor_telefono VARCHAR(30) NOT NULL,
    vehiculo_placa VARCHAR(20),
    fecha_hora_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    origen VARCHAR(200) NOT NULL,
    destino VARCHAR(200) NOT NULL,
    costo_proveedor_cop DECIMAL(10,2) NOT NULL,
    precio_cliente_usd DECIMAL(10,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'PROGRAMADO', -- 'PROGRAMADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'
    comentarios TEXT
);

-- -----------------------------------------------------------------------------
-- 5. MÓDULO CLÍNICO, CITAS Y RESULTADOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas_medicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas_rva(id) ON DELETE CASCADE,
    proveedor_clinica_id UUID NOT NULL REFERENCES proveedores(id),
    medico_id UUID REFERENCES medicos_especialistas(id),
    procedimiento_id UUID REFERENCES procedimientos_cups_catalogo(id),
    fecha_hora_cita TIMESTAMP WITH TIME ZONE NOT NULL,
    requiere_ayuno BOOLEAN DEFAULT FALSE,
    estado_cita VARCHAR(30) DEFAULT 'PROGRAMADA', -- 'PROGRAMADA', 'ATENDIDA', 'REPROGRAMADA', 'CANCELADA'
    evolucion_medica TEXT,
    formula_medica_url TEXT
);

CREATE TABLE IF NOT EXISTS resultados_laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_medica_id UUID NOT NULL REFERENCES citas_medicas(id) ON DELETE CASCADE,
    tipo_examen VARCHAR(100) NOT NULL,
    archivo_pdf_url TEXT NOT NULL,
    resultado_aprobado_cirujano BOOLEAN DEFAULT TRUE,
    fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. MÓDULO DE TERRENO, ACOMPAÑAMIENTO Y TURNOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turnos_acompanamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas_rva(id) ON DELETE CASCADE,
    acompanante_nombre VARCHAR(100) NOT NULL,
    acompanante_telefono VARCHAR(30) NOT NULL,
    fecha_turno DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    horas_totales DECIMAL(4,2) NOT NULL,
    tarifa_hora_cop DECIMAL(8,2) NOT NULL,
    honorarios_totales_cop DECIMAL(10,2) NOT NULL,
    actividades_desarrolladas TEXT NOT NULL,
    liquidado BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS viaticos_acompanamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES turnos_acompanamiento(id) ON DELETE CASCADE,
    concepto VARCHAR(100) NOT NULL, -- 'Alimentacion', 'Transporte Menor', 'Farmacia'
    monto_cop DECIMAL(10,2) NOT NULL,
    comprobante_imagen_url TEXT
);

-- -----------------------------------------------------------------------------
-- 7. MÓDULO FINANCIERO, LIQUIDACIONES Y RECONCILIACIÓN (DTW)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS liquidaciones_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    total_servicios INTEGER NOT NULL,
    monto_total_liquidado_cop DECIMAL(14,2) NOT NULL,
    monto_total_anticipos_cop DECIMAL(14,2) DEFAULT 0.0,
    saldo_por_pagar_cop DECIMAL(14,2) GENERATED ALWAYS AS (monto_total_liquidado_cop - monto_total_anticipos_cop) STORED,
    estado_pago VARCHAR(30) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PAGADO', 'CONCILIADO'
    comprobante_bancario_url TEXT,
    fecha_pago DATE
);

CREATE TABLE IF NOT EXISTS transacciones_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banco VARCHAR(50) DEFAULT 'Bancolombia',
    tipo_movimiento VARCHAR(20) NOT NULL, -- 'INGRESO_PAX', 'EGRESO_PROVEEDOR', 'EGRESO_HONORARIOS'
    referencia_bancaria VARCHAR(100) UNIQUE NOT NULL,
    fecha_transaccion TIMESTAMP WITH TIME ZONE NOT NULL,
    monto_cop DECIMAL(14,2) NOT NULL,
    reserva_id UUID REFERENCES reservas_rva(id),
    proveedor_id UUID REFERENCES proveedores(id),
    reconciliado_dtw BOOLEAN DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 8. VISTAS ANALÍTICAS Y DASHBOARDS EN TIEMPO REAL
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_resumen_operativo_pacientes AS
SELECT 
    p.codigo_paciente,
    p.nombres || ' ' || p.apellidos AS paciente_nombre,
    p.pais_origen,
    p.telefono_e164,
    r.codigo_rva,
    r.fecha_llegada,
    r.fecha_salida,
    r.estado_reserva,
    h.nombre_hotel,
    COUNT(DISTINCT t.id) AS total_traslados_programados,
    COUNT(DISTINCT c.id) AS total_citas_clinicas,
    COALESCE(SUM(ta.horas_totales), 0) AS total_horas_acompanamiento
FROM pacientes p
LEFT JOIN reservas_rva r ON p.id = r.paciente_id
LEFT JOIN hoteles_alojamientos h ON r.hotel_id = h.id
LEFT JOIN traslados_transporte t ON r.id = t.reserva_id
LEFT JOIN citas_medicas c ON r.id = c.reserva_id
LEFT JOIN turnos_acompanamiento ta ON r.id = ta.reserva_id
GROUP BY p.id, r.id, h.id;
