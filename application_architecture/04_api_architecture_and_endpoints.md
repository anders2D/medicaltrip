# 04. Arquitectura de Software, Microservicios y Contratos de API (REST / OpenAPI)

Esta especificación técnica detalla los contratos de API, endpoints RESTful, webhooks de WhatsApp y tareas en segundo plano para el backend de **Medical Trip Operative Cloud**.

---

## 🏗️ Stack Tecnológico Backend Recomendado

* **Lenguaje & Framework**: **Python (FastAPI)** o **TypeScript (NestJS / Node.js)**.
* **Base de Datos**: PostgreSQL 15+ con motor ORM (SQLAlchemy / Prisma) y extensiones espaciales/vectoriales.
* **Cola de Mensajería & Workers**: Redis + Celery / BullMQ para tareas asíncronas (Check-Mig, FlightAware, Webhooks de WhatsApp).
* **Motor BPMN 2.0**: SpiffWorkflow (Python) o Camunda Zeebe.

---

## 📡 Endpoints Principales de la API REST

### 1. Módulo Comercial & Cotizaciones (`/api/v1/commercial`)
| Método | Endpoint | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/leads` | Registra un nuevo lead con historial médico adjunto. | `{ nombre, telefono, pais_origen, dossier_url }` |
| `POST` | `/api/v1/quotes` | Genera una cotización dinámica (`CTZ###`) con cálculo de margen. | `{ paciente_id, cups_ids: [], hotel_id, dias_estadía, trm }` |
| `GET` | `/api/v1/quotes/{codigo_ctz}/pdf` | Descarga el PDF formal en USD/COP de la cotización. | `codigo_ctz` |
| `POST` | `/api/v1/reservations/confirm` | Convierte una `CTZ` en `RVA` validando el depósito bancario. | `{ cotizacion_id, comprobante_pago_url, fecha_llegada, fecha_salida }` |

### 2. Módulo Logístico & Transporte (`/api/v1/logistics`)
| Método | Endpoint | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/transfers/dispatch` | Despacha la programación del día a Aeroturex. | `{ reserva_id, fecha, hora, vuelo, origen, destino }` |
| `PATCH` | `/api/v1/transfers/{id}/assign-driver` | Asigna conductor y vehículo al traslado. | `{ conductor_nombre, conductor_telefono, placa }` |
| `POST` | `/api/v1/checkmig/generate` | Detona el bot para radicar el Check-Mig de entrada/salida. | `{ reserva_id, tipo: "ENTRADA" \| "SALIDA" }` |
| `GET` | `/api/v1/flights/track/{numero_vuelo}` | Consulta el estado en tiempo real del vuelo en FlightAware. | `numero_vuelo` |

### 3. Módulo Clínico (`/api/v1/clinical`)
| Método | Endpoint | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/appointments` | Agenda una cita médica en clínica (HPTU/Cardio VID). | `{ reserva_id, clinica_id, medico_id, fecha_hora, cups_id }` |
| `POST` | `/api/v1/labs/upload` | Carga el PDF de resultados de laboratorios y notifica al médico. | `{ cita_id, archivo_pdf, resultado_aprobado: bool }` |
| `POST` | `/api/v1/fit-to-fly` | Emite el certificado de aptitud de vuelo postoperatorio. | `{ reserva_id, medico_firma, observaciones }` |

### 4. Módulo Financiero & Liquidaciones (`/api/v1/finance`)
| Método | Endpoint | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/settlements/transports` | Genera la sábana de liquidación de traslados Aeroturex. | `?periodo_inicio=&periodo_fin=` |
| `GET` | `/api/v1/settlements/accompaniments` | Genera la liquidación de turnos y viáticos de acompañantes. | `?periodo_inicio=&periodo_fin=` |
| `POST` | `/api/v1/reconciliation/dtw` | Ejecuta el algoritmo DTW para reconciliar transacciones bancarias. | `{ archivo_extracto_bancolombia }` |

---

## 🤖 Webhooks & Tareas en Segundo Plano (Background Workers)

### 1. Webhook de WhatsApp (`POST /api/v1/webhooks/whatsapp`)
- Procesa mensajes entrantes en tiempo real.
- Si el mensaje contiene un número de vuelo o solicitud de cotización, dispara el pipeline de clasificación Pydantic y lo asocia al expediente `RVA` activo.

### 2. Cron Jobs Asíncronos (Redis/Celery)
- **`cron_flight_monitor`** (Cada 15 min): Monitorea si el vuelo de un paciente presenta retraso y actualiza la hora de recogida de Aeroturex automáticamente.
- **`cron_checkmig_reminder`** (Diario 19:00): Identifica pasajeros que viajan en las próximas 24h y genera sus Check-Mig de salida.
- **`cron_daily_dispatch`** (Diario 16:30): Compila todos los traslados del día siguiente y emite la orden de servicio en PDF/WhatsApp para Aeroturex.
