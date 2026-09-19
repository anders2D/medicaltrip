# Ejemplo Real de Extracción 1: Expediente `RVA282-5-Hernandez_George`
> **Fuente**: `data/chats/contacts/🚗RVA282-5-Hernandez_George Mr x 2/🚗RVA282-5-Hernandez_George Mr x 2.csv`

---

## 1. Datos Crudos del Evento (WhatsApp CSV)

```csv
Username,Phone Number,Sent Message,Received Message,Message Type,Message Time,Attachment Link
ACV Carolina Cortázar,@MedicaltripACV,,"@219215298621671 *Hola Buenas tardes, por favor para programar para mañana*
*RVA282-5-Hernandez/George Mr x 2*
Fecha: *Miercoles 5 de agosto 2026*
Pasajero: Sr. George
Número de Contacto: *+599 95681193 -Sr. George* - 3158100453 Carolina
Hora: 3:27 pm 
Personas: 1
*N° Vuelo *WINGO 7449*
Origen: *Aeropuerto JMC*
Destino: *Ed. Park 42 Cra. 42 #9-28 El poblado*
Método de Pago: Transferencia",chat,2026/08/04 15:26:44,

Aeroturex,+57 300 7132111,,"🚘 *Conductor Asignado:*
*Nombre:* RAMON ROSERO
*Contacto:* +573134608871",chat,2026/08/05 12:12:41,
```

---

## 2. Resultado del Proceso de Extracción e Ingeniería Inversa

### A. Objeto OCEL 2.0 Generado (JSON Fuertemente Tipado)
```json
{
  "event_id": "EVT-20260804-001",
  "activity": "PROGRAMACION_TRANSPORTE_AEROPUERTO",
  "timestamp": "2026-08-04T15:26:44Z",
  "objects": {
    "paciente": "ENT-PAX-0282",
    "reserva": "RVA282-5",
    "coordinador": "ENT-EMP-CAROLINA",
    "proveedor_transporte": "ENT-PROV-AEROTUREX",
    "conductor": "ENT-DRV-RAMON_ROSERO",
    "alojamiento": "ENT-HOT-PARK42"
  },
  "attributes": {
    "aerolinea": "WINGO",
    "numero_vuelo": "7449",
    "hora_vuelo_programada": "15:27",
    "origen": "AEROPUERTO_JMC_RIONEGRO",
    "destino_direccion": "Cra. 42 #9-28 El Poblado, Edificio Park 42",
    "pax_count": 1,
    "metodo_pago": "TRANSFERENCIA_BANCARIA"
  }
}
```

---

## 3. Reconciliación con `Liquidacion_transporte.xlsx`

| Campo | Valor Extraído de WhatsApp | Registro Reconciliado en Excel | Diferencia / Latencia |
| :--- | :--- | :--- | :--- |
| **Fecha de Operación** | `2026-08-05 15:27:00` | `2026-08-08` (Fecha de Asiento) | +3 días (Desfase absorbido por DTW) |
| **Pasajero** | `Sr. George Hernandez` | `RVA282 Hernandez x 2` | Coincidencia Splink = 0.98 |
| **Trayecto** | `Aeropuerto JMC -> Ed. Park 42` | `Traslado Aeropuerto El Poblado` | Tarifa Liquidada: `$110.000 COP` |
| **Conductor** | `Ramón Rosero` | `Ramón Rosero (Aeroturex)` | 100% Match |

---

## 4. SOP Inducido para Programación de Transporte

1. **Recepción de Itinerario**: La coordinadora verifica el número de vuelo (`WINGO 7449`) y hora estimada de aterrizaje 24 horas antes.
2. **Despacho a Aeroturex**: Envío de la plantilla estandarizada con código `RVA`, teléfono internacional del pasajero y destino en Medellín.
3. **Confirmación de Conductor**: Aeroturex asigna conductor (`Ramón Rosero`) y número de contacto directo.
4. **Enlace con Pasajero**: Se remiten los datos del vehículo y punto de encuentro (Puerta de Salida JMC) al WhatsApp del paciente antes del despegue.
