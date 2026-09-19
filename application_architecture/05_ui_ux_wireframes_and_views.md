# 05. Diseño de Interfaces, Vistas y Wireframes (UI/UX)

Esta especificación detalla las 3 interfaces principales requeridas para la plataforma web de **Medical Trip Colombia**:
1. **Centro de Control de Coordinación (Desktop Web Dashboard)** para [COORD] Carolina Cortázar y [DIR-MED] Jenny Acosta.
2. **Portal Móvil del Conductor (PWA / Responsive)** para choferes de Aeroturex.
3. **Portal del Paciente Internacional (Web / Multilingüe)** para los viajeros de Curazao/Caribe.

---

## 🖥️ 1. Centro de Control de Coordinación (Dashboard Web)

### Layout Maestro (Sidebar + Main Board):
```
+-----------------------------------------------------------------------------------------------+
| MEDICAL TRIP OPERATIVE CLOUD    [🔔 Alertas: 2] [🌐 TRM: $4.050] [👤 [COORD] Carolina Cortázar]|
+-----------------+-----------------------------------------------------------------------------+
| 📊 Dashboard    | 🛫 VUELOS Y LLEGADAS DE HOY                                                 |
| 👥 Pacientes    | --------------------------------------------------------------------------- |
| 📋 Cotizaciones | [15:27] WINGO 7449 | Curazao -> MDE | Pax: [PAX] George Hernandez (RVA282)   |
| ✈️ Logística     | 🚘 Conductor: [DRV] Ramón Rosero (+57 3134608871) | Destino: Ed. Park 42    |
| 🏥 Citas & Labs |                                                                             |
| 🏨 Hospedaje    | --------------------------------------------------------------------------- |
| 💰 Liquidación  | 🏥 CITAS MÉDICAS Y PROCEDIMIENTOS DE HOY                                    |
| ⚙️ Ajustes      | --------------------------------------------------------------------------- |
|                 | [09:00 AM] HPTU | Pax: [PAX] Zulaica Giterson | [MED] Dr. Marcos Yepes (Val)  |
|                 | [11:30 AM] CARDIO VID | Pax: [PAX] Carlos Marcano | Chequeo Cardiovascular  |
|                 |                                                                             |
|                 | 📋 ACCIONES PENDIENTES DEL DÍA (16:30 PM)                                    |
|                 | [ ] Despachar programación de mañana a Aeroturex (5 traslados pendientes)   |
|                 | [ ] Emitir Check-Mig de salida para 2 pacientes que viajan mañana            |
+-----------------+-----------------------------------------------------------------------------+
```

---

## 📱 2. Portal Móvil del Conductor (PWA / Aeroturex)

Diseñado para uso rápido con una sola mano en smartphones de los conductores:

```
+------------------------------------------+
| 🚘 AEROTUREX - MIS VIAJES DE HOY         |
| Conductor: [DRV] Ramón Rosero            |
+------------------------------------------+
| 📍 SERVICIO #1 (15:27 PM)                |
| Pasajero: Sr. [PAX] George Hernandez     |
| Teléfono: +599 95681193 [📞 Llamar]      |
| Vuelo: WINGO 7449 (Aterrizaje en 15 min) |
| Origen: Aeropuerto JMC - Puerta Salida 2 |
| Destino: Ed. Park 42 Cra. 42 #9-28 Poblado|
|                                          |
| [ ▶ INICIAR VIAJE ]  [ ✅ FINALIZAR VIAJE ]|
+------------------------------------------+
| 📍 SERVICIO #2 (18:30 PM)                |
| Pasajero: [PAX] Zulaica Giterson         |
| Origen: HPTU Torre Médica                |
| Destino: Hotel Poblado Plaza             |
+------------------------------------------+
```

---

## 🌍 3. Portal del Paciente Internacional (Papiamento / English / Español)

```
+-------------------------------------------------------------+
| 🇨🇴 MEDICAL TRIP COLOMBIA             [Idioma: Papiamento 🇨🇼]|
| Bon bini, [PAX] George Hernandez! (Reserva: RVA282-5)        |
+-------------------------------------------------------------+
| ✈️ BO VIAHE PA COLOMBIA                                      |
| • Vuelo di Yegada: WINGO 7449 (5 di Ougùstù, 15:27 PM)       |
| • Bo Chauffeur: [DRV] Ramón Rosero (+57 3134608871)         |
| • Bo Hotel: Edificio Park 42, El Poblado, Medellín          |
|                                                             |
| 📄 BO DOKUMENTONAN DI VIAHE                                 |
| [ 📥 Download Check-Mig Entrada PDF ]                       |
| [ 📥 Download Seguro Medico Internacional ]                  |
|                                                             |
| 🏥 BO AFSPRAAKNAN MEDICO                                     |
| • 06 Oug: 09:00 AM - Cita di Consulta - Hospital Pablo Tobón |
| • 07 Oug: 08:30 AM - Laboratorio y Chekeo                    |
|                                                             |
| [ 💬 Chat cu [COORD] Carolina riba WhatsApp ]               |
+-------------------------------------------------------------+
```
