# 🛡️ Reporte de Auditoría de Calidad y Extracción de Datos
## Medical Trip Colombia S.A.S. — Base de Datos Master 3NF & OCEL 2.0

- **Fecha de Auditoría**: 2026-08-21 22:27:34
- **Motor de Base de Datos**: SQLite3 / OCEL 2.0 Relacional (`data/medicaltrip_master.db`)
- **Estado de Integridad Referencial**: **100% VÁLIDO (0 Errores de Clave Foránea)**

---

## 📊 1. Métricas de Cobertura y Volumen Extraído

| Entidad / Tabla | Total Registros | Tasa de Completitud | Estado de Calidad |
| :--- | :--- | :--- | :--- |
| **Pacientes Normalizados (`pacientes`)** | **304** | 100% | ✅ Identidad Única Asignada |
| **Expedientes de Reserva (`reservas_rva`)** | **95** | 98.4% | ✅ Trazabilidad Completa |
| **Cotizaciones Detectadas (`cotizaciones_ctz`)** | **79** | 96.1% | ✅ Asociadas a Paciente |
| **Servicios de Transporte (`traslados_logistica`)** | **63** | 99.2% | ✅ Conductor y Vuelo Extraídos |
| **Eventos Canónicos (`ocel_events`)** | **18602** | 100% | ✅ Timestamp ISO-8601 Válido |
| **Relaciones Evento-Objeto (`ocel_event_objects`)** | **25241** | 100% | ✅ Multi-Perspectiva (E2O) |

---

## 📈 2. Desglose de Actividades Canónicas Descubiertas

| Actividad Canónica | Total Eventos | % del Total |
| :--- | :--- | :--- |
| `MENSAJE_OPERATIVO` | 16770 | 90.15% |
| `VALORACION_MEDICA` | 811 | 4.36% |
| `ACOMPANAMIENTO_PRESENCIAL` | 269 | 1.45% |
| `SOLICITUD_COTIZACION` | 260 | 1.4% |
| `LIQUIDACION_PAGO` | 249 | 1.34% |
| `TOMA_LABORATORIOS` | 156 | 0.84% |
| `CHECK_MIG_GESTION` | 42 | 0.23% |
| `RECEPCION_AEROPUERTO` | 25 | 0.13% |
| `PROGRAMACION_TRANSPORTE` | 20 | 0.11% |

---

## ⏰ 3. Distribución Horaria de la Operación (Evidencia Empírica de 4 Años)

```text
Hora | Volumen de Mensajes / Eventos
------------------------------------------------------------
00:00 | █ (15)
01:00 | █ (1)
02:00 | █ (3)
03:00 | █ (3)
04:00 | █ (20)
05:00 | ████████ (125)
06:00 | ████████████████████ (312)
07:00 | ██████████████████████████████████████████████████ (760)
08:00 | ██████████████████████████████████████████████████████████████████████████████████████████████████████████ (1596)
09:00 | ██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ (1904)
10:00 | ███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ (1796)
11:00 | ██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ (1955)
12:00 | ████████████████████████████████████████████████████████████████████████████████████████████████████████████ (1621)
13:00 | █████████████████████████████████████████████████████████████████ (988)
14:00 | ██████████████████████████████████████████████████████████████████████████ (1120)
15:00 | ████████████████████████████████████████████████████████████████████████████ (1154)
16:00 | ████████████████████████████████████████████████████████████████████████████████████████████████ (1446)
17:00 | █████████████████████████████████████████████████████████████████████████████████████████████████ (1464)
18:00 | ██████████████████████████████████████████████████ (764)
19:00 | ███████████████████████████████████████ (589)
20:00 | ██████████████████████████ (390)
21:00 | ██████████████████ (277)
22:00 | ██████████████ (215)
23:00 | █████ (84)
```

---

## 🔒 4. Verificación de Cumplimiento PHI y Privacidad
- ✅ **Seudonimización Criptográfica**: Cada paciente cuenta con un UUID interno (`ENT-PAX-XXXX`).
- ✅ **Sanitización de Datos Médicos**: No se exponen números de pasaporte ni diagnósticos en texto plano en reportes públicos.
- ✅ **Alineamiento DTW**: Desfase de +3 a +7 días entre los chats y las sábanas de `Liquidacion_transporte.xlsx` reconciliado con éxito.
