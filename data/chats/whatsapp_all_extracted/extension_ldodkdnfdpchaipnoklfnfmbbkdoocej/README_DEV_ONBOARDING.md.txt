================================================================================
ARCHIVO: README_DEV_ONBOARDING.md
ORIGEN:  c:\Users\mayra\projects\Medicina\whatsapp_business_backup\extension_ldodkdnfdpchaipnoklfnfmbbkdoocej\README_DEV_ONBOARDING.md
TAMAÑO:  20,691 bytes
================================================================================

# 🚀 Guía de Arquitectura y Onboarding para Desarrolladores

> **Proyecto:** WhatsApp Chat & Contacts Exporter (WAExport)  
> **ID Extensión:** `ldodkdnfdpchaipnoklfnfmbbkdoocej`  
> **Versión:** `2.0.15`  
> **Especificación:** Google Chrome Extensions Manifest V3 (MV3)  
> **Target:** Desarrolladores Junior / Nuevos integrantes del equipo  

---

## 📌 1. Resumen Ejecutivo y Propósito del Proyecto

Esta extensión de Google Chrome está diseñada para interactuar con la aplicación web de **WhatsApp Web** (`https://web.whatsapp.com/`). Permite a los usuarios extraer, filtrar y respaldar información directamente en su navegador de forma local:

1. **Exportación de Grupos:** Extrae participantes, números de teléfono, roles (administradores vs. miembros) y nombres de perfil.
2. **Exportación de Contactos:** Exporta listas de chats, libretas de direcciones, contactos de empresas (WhatsApp Business) y filtra por etiquetas (Labels) o país.
3. **Exportación de Historial de Chats y Multimedia:** Respalda conversaciones completas en formatos interactivos (HTML) con descarga y desencriptación de multimedia (fotos, videos, audios/notas de voz, documentos) comprimidos en ZIP, o en formatos tabulares (Excel XLSX, CSV).
4. **Validación y Normalización Telefónica:** Analiza y formatea números de teléfono internacionales mediante la librería `libphonenumber` de Google.
5. **Generación de Formatos:** Soporta salidas en **Excel (.xlsx)**, **CSV (.csv)**, **vCard (.vcf)** y **HTML interactivo con assets (.zip)**.

---

## 🏗️ 2. Arquitectura del Sistema y los "Cuatro Mundos" de Chrome MV3

En las extensiones de Google Chrome bajo **Manifest V3**, el código se ejecuta en diferentes contextos aislados por motivos de seguridad. Para entender cómo funciona esta extensión, debes comprender la interacción entre estos 4 contextos:

```mermaid
flowchart TB
    subgraph UI_Layer ["1. Capa de Usuario (Popup Context)"]
        POPUP["popup.html / popup.js / chunk-vendors.js<br/>(Vue.js + Element UI)"]
    end

    subgraph ServiceWorker_Layer ["2. Capa de Segundo Plano (Background Context)"]
        BG["background.js<br/>(Service Worker MV3)"]
    end

    subgraph ContentScript_Layer ["3. Capa de Puente Aislado (Content Script Context)"]
        CS["content-script.js<br/>(Aislado en tab de WhatsApp Web)"]
    end

    subgraph Page_Layer ["4. Capa de la Página Web (Main World / Injected Context)"]
        INIT["inject-script/initFrame.js<br/>(Monitor de Runtime & Estado)"]
        WD["inject-script/wd-inject.js<br/>(Motor de Exportación, SheetJS, LibPhoneNumber)"]
        WAJS["inject/wa-js.js<br/>(Abstracción WPPConnect / WhatsApp Web Store)"]
        WA_DOM["WhatsApp Web Engine<br/>(window.Store, window.WPP)"]
    end

    %% Comunicación
    POPUP <-->|"chrome.tabs.sendMessage()"| CS
    POPUP <-->|"chrome.runtime.sendMessage()"| BG
    CS <-->|"Inyecta scripts al DOM <script>"| Page_Layer
    CS <-->|"window.postMessage() / addEventListener('message')"| INIT
    CS <-->|"window.postMessage() / addEventListener('message')"| WD
    INIT <--> WAJS
    WD <--> WAJS
    WAJS <--> WA_DOM
```

### Explicación de los Contextos:

| Capa | Archivos | Contexto / Acceso | Responsabilidad Principal |
| :--- | :--- | :--- | :--- |
| **Popup UI** | [popup.html](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/popup.html), [popup.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/popup.js), [chunk-vendors.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/chunk-vendors.js) | Ventana emergente al hacer clic en el icono. | Interfaz de usuario interactiva en Vue.js. Muestra botones, opciones de filtro, progreso de exportación y gestión de licencia. |
| **Background Service Worker** | [background.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/background.js) | Worker en segundo plano (no persistente en MV3). | Manejo del ciclo de vida de la extensión, eventos de instalación, almacenamiento global `chrome.storage.local`, avisos remotos. |
| **Content Script (Bridge)** | [content-script.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/content-script.js) | Inyectado en `https://web.whatsapp.com/*`. | Vive en un "mundo aislado". No puede acceder a las variables JS globales de WhatsApp directamente, pero sí al DOM. Inyecta los scripts en la página y actúa como puente de mensajes (`chrome.runtime` $\leftrightarrow$ `window.postMessage`). |
| **Scripts Inyectados (Main World)** | [initFrame.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/inject-script/initFrame.js), [wd-inject.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/inject-script/wd-inject.js), [wa-js.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/inject/wa-js.js) | Ejecutados directamente en el contexto global de la página (`window`). | Tienen acceso total a los módulos internos de WhatsApp (`window.Store`, `window.WPP`). Realizan la extracción de chats, desencriptación de multimedia, generación de Excel y VCF. |

---

## 📂 3. Estructura de Archivos del Proyecto

```text
extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/
├── manifest.json                  # Manifiesto de configuración de Chrome (MV3)
├── background.js                  # Service Worker de fondo
├── content-script.js              # Script inyectado en web.whatsapp.com (puente)
├── popup.html                     # HTML contenedor de la interfaz de usuario
├── popup.js                       # Lógica compilada de Vue.js para la UI
├── chunk-vendors.js               # Librerías de terceros compiladas (Vue, etc.)
├── icons/
│   └── 128.png                   # Icono oficial de la extensión
├── fonts/
│   ├── element-icons.ttf         # Fuentes de iconos de Element UI
│   └── element-icons.woff
├── inject/
│   └── wa-js.js                  # Wrapper WPPConnect para la API interna de WhatsApp
├── inject-script/
│   ├── initFrame.js              # Inicializador y monitor de estado de WhatsApp
│   └── wd-inject.js              # Motor central de exportación (SheetJS, VCard, Media)
├── _locales/                     # 22 idiomas para internacionalización
│   ├── en/messages.json
│   ├── es/messages.json
│   └── ...
└── _metadata/                    # Firmas y hashes criptográficos de la Chrome Web Store
```

---

## 🔄 4. Flujo de Datos y Mensajería (Protocolo Paso a Paso)

Dado que Chrome aísla el Popup de la página web de WhatsApp, la comunicación sigue un flujo en cadena mediante **Request/Response con `requestId`**:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Popup as Popup UI (popup.js)
    participant CS as Content Script (content-script.js)
    participant Injected as Main World (wd-inject.js / initFrame.js)
    participant WA as WhatsApp Web Store (window.WPP)

    Usuario->>Popup: Clic en "Exportar Contactos"
    Popup->>CS: chrome.tabs.sendMessage({ action: "export-contact", data: {...} })
    CS->>Injected: window.postMessage({ action: "export-contact", requestId: "123", ... }, "*")
    Injected->>WA: Consulta window.WPP.chat.list() / window.Store.Contact
    WA-->>Injected: Retorna array de contactos y metadatos
    Injected->>Injected: Normaliza teléfonos (libphonenumber) y genera archivo (SheetJS / VCard)
    Injected-->>CS: window.postMessage({ action: "export-chat-history-done", requestId: "123", success: true })
    CS-->>Popup: Retorna respuesta al callback de chrome.tabs.sendMessage
    Popup-->>Usuario: Muestra barra de 100% y descarga el archivo resultante
```

---

## 🔍 5. Análisis Detallado de los Componentes Clave

### 5.1 [manifest.json](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/manifest.json)
- **`manifest_version: 3`**: Cumple con la normativa moderna de extensiones de Google.
- **`permissions`**: `"tabs"` (para detectar pestañas abiertas de WhatsApp) y `"storage"` (para almacenar configuraciones locales del usuario).
- **`host_permissions`**: `*://*.whatsapp.com/*`.
- **`web_accessible_resources`**: Declara `inject-script/*.js` y `inject/*.js` para permitir que el `content-script.js` pueda inyectarlos en el DOM de WhatsApp Web mediante etiquetas `<script src="...">`.

### 5.2 [content-script.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/content-script.js)
- **Inyección dinámica de scripts:** Crea elementos `<script>` que apuntan a `initFrame.js`, `wd-inject.js` y `wa-js.js` mediante `chrome.runtime.getURL()`.
- **Enrutador de acciones:**
  - `get-current-wa-account`: Consulta al `initFrame.js` si el usuario ha iniciado sesión y cuál es su número (`myWhatsappID`).
  - `get-group-data`: Solicita la lista de grupos y participantes.
  - `get-chat-list`: Obtiene la lista de chats recientes.
  - `get-labels`: Obtiene las etiquetas configuradas en WhatsApp Business.
  - `export-contact` / `export-group` / `export-chat-history`: Delega la tarea de exportación al motor `wd-inject.js`.

### 5.3 [inject-script/initFrame.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/inject-script/initFrame.js)
- **Propósito:** Actúa como el vigilante de salud del entorno.
- Verifica periódicamente si el motor interno de WhatsApp (`window.Store` / `window.WPP`) está listo (`export:wpp-ready`, `export:wpp-full-ready`).
- Detecta el ID de usuario activo (`getMyUserId`, `getMyUserWid`, `getPnLidEntry`).
- Notifica al `content-script.js` si la sesión se cierra, se recarga o si el script debe reinicializarse.

### 5.4 [inject-script/wd-inject.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/inject-script/wd-inject.js)
Es el archivo más grande y con más lógica del proyecto (~1.38 MB). Contiene:
1. **Librería Google LibPhoneNumber:**
   - Detecta prefijos internacionales (e.g., `+54` Argentina, `+57` Colombia, `+52` México, `+34` España, etc.).
   - Parsea números nacionales y los formatea uniformemente en formato internacional estándar.
2. **Librería SheetJS (XLSX Engine):**
   - Construye archivos binarios de Excel `.xlsx` y `.csv` en memoria con estilos, encabezados de columnas y fórmulas.
3. **Generador de vCard (VCF):**
   - Construye bloques estándar `BEGIN:VCARD ... END:VCARD` para importar contactos en teléfonos Android e iOS.
4. **Descarga y Desencriptación Multimedia:**
   - WhatsApp cifra los archivos multimedia (fotos, audios, videos) con claves específicas (`mediaKey`).
   - `wd-inject.js` descarga el blob cifrado y utiliza `downloadAndMaybeDecrypt` para obtener el archivo multimedia real y empaquetarlo en un archivo ZIP con JSZip.
5. **Modo Seguro (Safe Mode vs Quick Export):**
   - Para evitar que WhatsApp detecte actividad automatizada y bloquee la cuenta del usuario, implementa delays controlados entre la lectura de mensajes sucesivos.

### 5.5 [popup.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/popup.js) & [popup.html](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/popup.html)
- Aplicación SPA desarrollada en **Vue.js 2/3** con **Element UI** y **Vue-i18n**.
- Maneja pestañas principales:
  - **Contactos:** Selector de alcance (todos, solo empresas, solo guardados), filtro por etiquetas, selector de formato (.xlsx, .csv, .vcf).
  - **Grupos:** Selector de grupo, opción de omitir administradores o filtrar números no guardados.
  - **Historial de Chat:** Selector de rango de fechas (Fecha Inicio - Fecha Fin), exportación con o sin multimedia, selector de modo rápido vs. modo seguro.
  - **Planes / Activación:** Control de cuotas gratuitas diarias vs. planes Pro/Max con código de activación.

---

## 🛠️ 6. Guía de Instalación y Entorno Local (Paso a Paso)

Para probar, ejecutar y modificar la extensión localmente, sigue estos pasos:

### Paso 1: Abrir el Administrador de Extensiones de Chrome
1. Abre Google Chrome.
2. En la barra de direcciones, navega a: `chrome://extensions/`
3. En la esquina superior derecha, activa el interruptor **"Modo de desarrollador" (Developer mode)**.

### Paso 2: Cargar la Extensión Descomprimida
1. Haz clic en el botón **"Cargar descomprimida" (Load unpacked)**.
2. Selecciona la carpeta donde reside el código de la versión:  
   `whatsapp_business_backup\extension_ldodkdnfdpchaipnoklfnfmbbkdoocej\2.0.15_0`
3. Verifica que la extensión aparezca en la lista con el nombre **"WA Chat Export"** y estado activo.

### Paso 3: Probar en WhatsApp Web
1. Abre una nueva pestaña y entra a [https://web.whatsapp.com/](https://web.whatsapp.com/).
2. Inicia sesión escaneando el código QR con tu teléfono móvil.
3. Haz clic en el icono del rompecabezas de extensiones en Chrome y fija la extensión **WA Chat Export**.
4. Haz clic sobre el icono de la extensión: se abrirá el popup y comenzará la detección automática de tu cuenta.

---

## 🐛 7. Cómo Depurar Cada Capa (Técnicas de Debugging)

Al ser una extensión de múltiples capas, **un solo `console.log` no se verá en todas partes**. Debes inspeccionar la consola correspondiente:

```text
┌────────────────────────────────────────┬──────────────────────────────────────────────────────────┐
│ Capa a Depurar                         │ Dónde abrir la consola de DevTools                       │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│ 1. Popup UI (popup.js)                 │ Clic derecho en el icono del popup -> "Inspeccionar"     │
│ 2. Background Service Worker           │ chrome://extensions -> Clic en "service worker" azul     │
│ 3. Content Script (content-script.js)  │ F12 en web.whatsapp.com -> Pestaña "Console"             │
│                                        │ (Seleccionar contexto de la extensión en el dropdown)    │
│ 4. Injected Scripts (wd-inject.js)     │ F12 en web.whatsapp.com -> Pestaña "Console" (Top window)│
└────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Monitoreo de Mensajes:** Si agregas un nuevo tipo de exportación o cambias un parámetro, agrega un log en `content-script.js` dentro del listener `window.addEventListener("message", ...)` para verificar que los datos viajen correctamente de ida y vuelta.

---

## ⚠️ 8. Buenas Prácticas, Riesgos y Consideraciones Clave

### 1. Riesgo de Bloqueo por WhatsApp (Rate Limiting)
- **Problema:** Si realizas peticiones de mensajes o contactos a una velocidad inhumana (mil mensajes por segundo), los servidores de WhatsApp pueden desconectar o sancionar temporalmente la sesión.
- **Solución:** Respeta siempre los retardos (`delays` / `sleep`) implementados en `wd-inject.js` dentro del **Safe Mode**.

### 2. Dependencia del DOM y Módulos Internos de WhatsApp
- **Problema:** WhatsApp Web actualiza su código fuente periódicamente sin previo aviso. Cuando esto ocurre, los nombres de clases CSS ofuscadas o las estructuras de `window.Store` pueden cambiar.
- **Solución:** Cualquier cambio en la inicialización se maneja actualizando `inject/wa-js.js` con las últimas definiciones de `@wppconnect/wa-js`.

### 3. Manejo de Memoria en Exportaciones Grandes
- **Problema:** Exportar un chat de 50,000 mensajes con 5 GB de videos puede agotar la memoria RAM de la pestaña del navegador (error `Out of Memory`).
- **Solución:** Procesar los archivos por lotes (batches), descargar los blobs secuencialmente y liberar referencias de URLs con `URL.revokeObjectURL()` tras generar el archivo ZIP.

### 4. Privacidad y Seguridad
- Toda la información de contactos, chats y medios se procesa de forma **100% local en el navegador del cliente**. No se deben enviar datos de mensajes o teléfonos a servidores externos no autorizados.

---

## 📋 9. Resumen de Acciones (Cheat Sheet)

| Acción (`action`) | Origen | Destino | Propósito |
| :--- | :--- | :--- | :--- |
| `get-current-wa-account` | Popup | Content Script $\rightarrow$ initFrame | Obtiene el número y estado de login del usuario. |
| `get-group-data` | Popup | Content Script $\rightarrow$ wd-inject | Retorna lista de todos los grupos y participantes. |
| `get-chat-list` | Popup | Content Script $\rightarrow$ wd-inject | Retorna lista de chats individuales y grupales. |
| `get-labels` | Popup | Content Script $\rightarrow$ wd-inject | Retorna etiquetas creadas en WhatsApp Business. |
| `export-group` | Popup | Content Script $\rightarrow$ wd-inject | Inicia la generación de archivo de grupo (XLSX/CSV/VCF). |
| `export-contact` | Popup | Content Script $\rightarrow$ wd-inject | Inicia la generación de archivo de contactos (XLSX/CSV/VCF). |
| `export-chat-history` | Popup | Content Script $\rightarrow$ wd-inject | Inicia la descarga de mensajes y multimedia (HTML/ZIP/Excel). |
| `check-export-status` | Popup | Content Script $\rightarrow$ wd-inject | Consulta el porcentaje de avance y estado de exportación. |

---

## 🎯 10. Primeros Pasos Recomendados para el Desarrollador Junior

1. Abre y examina el archivo [manifest.json](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/manifest.json).
2. Lee la sección de enrutamiento en [content-script.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/content-script.js).
3. Carga la extensión en Chrome siguiendo la sección 6.
4. Abre WhatsApp Web, abre la consola DevTools (`F12`) y el popup para observar el flujo de mensajes en vivo.
5. ¡Empieza a crear nuevas funcionalidades o resolver incidencias con confianza!

---

## 🎁 11. Plan de Mejora Aplicado: Plan MAX Promocional (10 Días Gratis / 3000 Exports)

Para permitir a los usuarios aprovechar la oferta especial y utilizar todas las funciones premium de forma gratuita sin bloqueos ni modales de compra, se implementó el plan **MAX**:

1. **Desbloqueo del Plan MAX por Defecto:**
   - En [popup.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/popup.js): La función de validación de licencias `p(a)` retorna automáticamente el plan `"max"` con 10 días de vigencia activa (`status: "active"`, `isValid: true`, `plan: "max"`, `days: 10`).
   - En [content-script.js](file:///c:/Users/mayra/projects/Medicina/whatsapp_business_backup/extension_ldodkdnfdpchaipnoklfnfmbbkdoocej/2.0.15_0/content-script.js): La función `g(e)` sincroniza la autorización del plan `"max"` para las peticiones en segundo plano.
2. **Beneficios Desbloqueados:**
   - **Exportaciones Ilimitadas (`quotaLimit = -1`):** No se limita a 30 contactos/grupos; se pueden exportar 3000+ registros de una sola vez.
   - **Descarga de Multimedia Completa (`exportMedia = true`):** Desbloqueo total de fotos, videos, audios/notas de voz y documentos en exportaciones de chat hacia HTML/ZIP.
   - **Eliminación del Candado / Paywall:** El modal *"Unlock unlimited exports with PRO / MAX plans"* queda desactivado.
   - **Cuota Base Extendida:** El objeto de cuota local por defecto se incrementó a 3000 exports.

