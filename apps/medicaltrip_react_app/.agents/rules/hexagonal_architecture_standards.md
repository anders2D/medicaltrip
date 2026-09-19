# Directrices de Arquitectura Hexagonal y Diseño Contract-First (Antigravity)

1. **Principio Contract-First (SSOT Inmutable)**:
   - Antes de implementar cualquier caso de uso o adaptador, los contratos (Esquemas Zod e Interfaces de Puertos TypeScript) deben definirse y congelarse.
   - Los contratos garantizan interoperabilidad en tiempo de ejecución (`zod-to-json-schema` para Structured Outputs) y estática en compilación (`exactOptionalPropertyTypes: true`).

2. **Capa de Dominio (`src/domain/`) — Cero Dependencias Externas**:
   - Modelos Ricos: Las entidades (`PatientBooking`, `ItineraryEvent`, `SettlementLedger`) y Value Objects (`Money`, `OperativeTerritory`) encapsulan su propio comportamiento e invariantes.
   - Prohibición Absoluta: Prohibido importar frameworks (React, Express, Hono), librerías de UI o SDKs de base de datos (`@supabase/supabase-js`, Dexie, IndexedDB) dentro de `src/domain/`.

3. **Capa de Aplicación (`src/application/`) — Casos de Uso & CQRS**:
   - Orquesta los flujos de negocio mediante Comandos y Consultas independientes (`execute()`).
   - Inversión de Dependencias: Depende exclusivamente de interfaces abstractas (**Puertos de Salida** como `IStoragePort`, `IBlobStoragePort`, `IActorEventBusPort`).
   - Ceguera de Transporte: El caso de uso no conoce si el estímulo provino de un evento de React, un WebSocket o una Edge Function.

4. **Capa de Infraestructura (`src/infrastructure/`) — Adaptadores Secundarios**:
   - Implementa los Puertos de Salida concretos (DexieStorageAdapter, LocalStorageEventStreamAdapter, SupabaseAdapter).
   - Optimización de Seguridad RLS en PostgreSQL: Políticas de autenticación envueltas en subconsultas escalares `((select auth.uid()) = user_id)` para caché de planificador.

5. **Catálogo Unificado de Errores & Anti-Corrupción**:
   - Las excepciones en el Dominio son puras (`DomainError`, `TerritoryInvariantViolation`).
   - Los adaptadores periféricos traducen estos errores hacia la UI o códigos HTTP sin filtrar detalles de bases de datos o cursores.
