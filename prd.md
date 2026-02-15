# PRD — BILLETO (Finanzas + Asistente IA + WhatsApp + Integraciones)
**Nombre interno:** BILLETO  
**Versión:** v0.1 (MVP + Roadmap)  
**Fecha:** 2026-02-14  
**Documento:** `prd.md`

---

## 1) Resumen
Construir una plataforma web + integraciones (WhatsApp, Email, Webhooks, bancos/wallets opcionales) para **registrar y analizar finanzas personales/pequeños negocios** con ayuda de un **Asistente IA**.  
La experiencia debe permitir:

- Registrar transacciones por **web** (formularios, tablas) y por **WhatsApp** (texto, audio, imagen, PDF).
- Analítica inmediata: gastos/ingresos, balance, categorías, comparativas mensuales.
- Automatización: reglas, transacciones recurrentes, presupuestos, metas.
- Compartir cobros/pagos: “tag” público y “vaquitas” (dividir gastos).
- Integración de modelos IA por API: **Gemini**, **OpenAI**, y proveedores **OpenAI-compatible**.
- Arquitectura de agentes consumiendo **endpoints canónicos en xMCP.dev** para herramientas y permisos (fuente única de verdad).

> Nota: este PRD describe **qué** construir y criterios de aceptación; la implementación técnica (cómo) se detalla en el “Plan de Vibecoding”.

---

## 2) Objetivos
### 2.1 Objetivos del producto
1. **Captura fricción-cero**: registrar gastos/ingresos en <15s desde WhatsApp o web.
2. **Analítica útil**: responder preguntas tipo “¿Cuánto gasté este mes?” con resumen + gráficos.
3. **Automatización progresiva**: reglas, recurrencias y alertas que se vuelven mejores con el uso.
4. **Confianza y seguridad**: auditoría, trazabilidad, control de acciones sensibles.
5. **Experiencia cliente integral**: operar finanzas, integraciones, GasTag, Vaquitas, idioma, ayuda y seguridad de cuenta desde una sola app.

### 2.2 Métricas (KPIs)
- Time-to-first-transaction (TTFT) < 2 min
- % de transacciones capturadas vía WhatsApp vs web
- Retención 7/30 días
- % de transacciones categorizadas automáticamente
- Precisión en extracción de comprobantes (recibos) y reducción de “preguntas de aclaración”
- Latencia: respuesta WhatsApp < 3–6s (p95) para consultas; < 10–20s (p95) para OCR/visión.
- % de operaciones de agentes/canales servidas vía endpoints canónicos de **xMCP.dev** (objetivo MVP: 100%).
- Tasa de activación de WhatsApp (cliente conectado / clientes activos).
- Tasa de activación de GasTag y conversión a Vaquitas.
- Tasa de éxito de integraciones por Correo/Webhook (primer intento y reintentos).
- CTR del CTA principal en Home.
- Conversión de landing a registro.
- Tasa de login exitoso en primer intento.

---

## 3) Alcance
### 3.1 Alcance del documento (rol)
- Este PRD define el producto **solo para usuarios con rol Cliente** en web y WhatsApp.
- Flujos de administrador, operador interno o soporte no forman parte de este alcance.

### 3.2 Incluido (MVP Cliente)
- Dos superficies web obligatorias:
  - **Frontend público (landing + auth):** Home, Producto, Planes, Manifiesto, Blog, FAQ, Contacto, Login y Registro.
  - **App privada cliente:** Asistente, Panel, Transacciones, Cuentas, Presupuestos, Metas, Herramientas, Perfil, Configuración, Ayuda, Idioma.
- Web app con navegación cliente: **Asistente**, **Panel**, **Transacciones**, **Cuentas**, **Presupuestos**, **Metas**, **Herramientas** (WhatsApp, Correo, Webhook, GasTag, Vaquitas, Integraciones), **Perfil**, **Configuración**, **Ayuda**.
- CRUD de transacciones, categorías, cuentas, presupuestos, metas y recurrentes para cliente.
- Integraciones cliente por canales observados: WhatsApp, email forwarding, webhook e integración guiada de banco por correo.
- GasTag público/privado y Vaquitas con prerrequisitos y flujos de reparto.
- Configuración cliente: moneda predeterminada, notificaciones, idioma, seguridad de cuenta, referidos.
- Acciones de seguridad para cliente: reseteo selectivo de datos y eliminación de cuenta con período de gracia.
- Integración WhatsApp con UX “tipo video” (ver sección 7).
- Asistente IA (web y WhatsApp) con herramientas (tool-calling) para consultar/operar datos.
- Proveedor de IA pluggable: OpenAI, Gemini, y OpenAI-compatible.
- Consumo de endpoints canónicos vía **xMCP.dev** como capa única para agentes IA y canales.
- Blog y FAQ públicos en MVP con contenido **estático en código**.

### 3.3 Excluido (no-MVP / futuro)
- Flujos de backoffice multi-rol (admin/soporte), gestión interna y paneles operativos.
- Conexión bancaria por open-banking multi-país (se deja “stubs”).
- Conciliación automática avanzada.
- Contabilidad completa (asientos, impuestos complejos).
- App móvil nativa (se usa PWA inicialmente).
- Motor avanzado de detección de fraude.

---

## 4) Personas / Roles
- **Cliente estándar**: registra y consulta finanzas, usa WhatsApp y módulos base.
- **Cliente power**: usa reglas, recurrentes, importaciones, multi-cuenta y multi-moneda.
- **Sistema (Agente IA)**: ejecuta acciones autorizadas consumiendo endpoints canónicos en xMCP.dev.

### 4.1 Matriz de permisos (rol Cliente)
- **Asistente/Panel/Transacciones/Cuentas/Presupuestos/Metas**: ver + crear + editar + eliminar (con validaciones de seguridad).
- **Herramientas (WhatsApp, Correo, Webhook, GasTag, Vaquitas, Integraciones)**: configurar y operar solo recursos propios del cliente.
- **Perfil/Configuración/Idioma/Referidos/Ayuda**: acceso completo del propio usuario.
- **Acciones sensibles**: requieren confirmaciones explícitas y audit log.

---

## 5) Principales Flujos
### 5.1 Frontend público (Landing + Auth)
1. **Home**: visitante llega → entiende propuesta de valor → CTA a WhatsApp o registro.
2. **Producto**: revisa funcionalidades clave (bot, presupuestos, gastos grupales) → CTA a planes o registro.
3. **Planes**: compara Free/Pro/Premium → elige plan → inicia registro/login.
4. **Manifiesto**: explora narrativa de marca y confianza.
5. **Blog**: consume contenido educativo financiero estático.
6. **FAQ + Contacto**: resuelve dudas frecuentes y obtiene canal de contacto.
7. **Auth**: login/registro por email+password o social (Google/Apple) → acceso a app privada cliente.

### 5.2 App privada (rol Cliente)
1. **Onboarding cliente guiado en chat web**: login → asistente hace diagnóstico rápido (control financiero, fricciones, objetivo, contexto personal) → muestra cards de valor personalizadas (categorías, presupuesto, metas) → elegir moneda base → crear 1 cuenta → registrar 1 gasto.
2. **Registro por WhatsApp**:
   - Texto: “Gasté 30 en almuerzo”
   - Audio: “Gasté 50 en taxi”
   - Imagen/PDF: enviar comprobante → extracción → confirmación
3. **Consulta por WhatsApp**: “¿Cuánto llevo gastado este mes?” → resumen + gráfico.
4. **Integraciones cliente**:
   - Conectar WhatsApp
   - Configurar correo forwarding
   - Configurar webhook
   - Completar flujo guiado de integración bancaria por email
5. **GasTag + Vaquita**:
   - Activar GasTag público
   - Configurar cuentas visibles
   - Crear vaquita y repartir monto entre participantes
6. **Seguridad de cuenta**:
   - Resetear datos por módulos
   - Solicitar eliminación de cuenta con período de gracia

---

## 6) Módulos Web (Requisitos funcionales)
### 6.A Frontend público (Landing + Auth)
**Objetivo:** convertir visitantes en usuarios registrados y dirigirlos al flujo de valor del producto.

**Páginas públicas obligatorias (MVP)**
- Home
- Producto
- Planes
- Manifiesto
- Blog
- FAQ
- Contacto
- Login
- Registro

**Lineamiento visual obligatorio**
- Estilo **dark-neon** coherente con las capturas de referencia.
- Consistencia obligatoria en paleta, contraste, tipografía, bordes, sombras y CTAs.

#### 6.A.1 Home
- Hero con propuesta de valor + CTA principal (iniciar/registrarse) y CTA secundario (WhatsApp).
- Bloque de prueba social y preview visual del dashboard.
- Header fijo con navegación pública y footer con enlaces clave.

#### 6.A.2 Producto
- Sección de capacidades: ingresos/gastos/balance/categorías.
- Bloques de valor: asistente, presupuestos, gastos grupales.
- CTA hacia Planes o Registro.

#### 6.A.3 Planes
- Tabla comparativa Free/Pro/Premium.
- Selector de moneda visible.
- CTA individual por plan.

#### 6.A.4 Manifiesto
- Secciones narrativas de marca en bloques legibles.
- Cierre con CTA a registro/login.

#### 6.A.5 Blog
- Listado de artículos estáticos (MVP: contenido en código).
- Cards con título, resumen, fecha y etiquetas.

#### 6.A.6 FAQ
- Acordeón de preguntas frecuentes (MVP estático en código).
- CTA de contacto cuando no se resuelve la duda.

#### 6.A.7 Contacto
- Bloque de información de contacto.
- CTA de soporte por WhatsApp.

#### 6.A.8 Auth (Login y Registro)
- Email + contraseña.
- Continuar con Google.
- Continuar con Apple.
- Enlaces de recuperar contraseña, términos y cambio login/registro.

**Criterios de aceptación Frontend público**
- Navegación correcta entre Home/Producto/Planes/Manifiesto/Blog/FAQ/Contacto/Login/Registro.
- CTAs principales y secundarios visibles y funcionales.
- Formularios de auth validan errores y muestran estados (loading/success/error).
- Blog y FAQ renderizan contenido estático sin CMS.

### 6.B Responsive obligatorio (QA)
Breakpoints obligatorios:
- **Mobile**
- **Tablet**
- **Laptop**
- **Desktop grande**

Criterios:
- Sin overflow horizontal en hero, cards, pricing y FAQ.
- Header/nav usable en todos los tamaños.
- Tipografía y espaciados adaptativos.
- CTAs visibles sin solaparse.
- Layout estable (sin saltos críticos perceptibles).

### 6.0 Mapa de navegación cliente (app privada)
- Asistente
- Panel
- Transacciones
- Cuentas
- Presupuestos
- Metas
- Herramientas:
  - WhatsApp
  - Correo (forwarding)
  - Webhook
  - GasTag
  - Vaquitas
  - Integraciones
- Perfil
- Configuración
- Ayuda (FAQ)
- Idioma

### 6.1 Asistente (Web)
**Descripción:** chat en web para consultas y acciones del cliente (crear/listar/actualizar), incluyendo onboarding inicial guiado para cuentas nuevas.  
**Funciones:**
- Prompt box + sugerencias rápidas (chips).
- Respuestas con texto, tablas, mini-gráficos y deep links.
- Acciones cliente: crear transacción, cuenta, presupuesto, meta y abrir dashboard.
- Onboarding conversacional para usuarios nuevos:
  - Preguntas de diagnóstico (ej. nivel de control, principal dificultad, objetivo, contexto).
  - Respuestas rápidas por chips/botones para minimizar fricción.
  - Cards de valor personalizadas (ej. control por categoría, presupuesto inteligente, metas de ahorro).
  - Secuencia guiada hasta primer valor: moneda base + primera cuenta + primer gasto.

**Criterios de aceptación**
- Solo opera con sesión activa del cliente.
- Toda acción retorna resumen de cambios + enlace a la entidad.
- Para usuario nuevo (`onboarding_completed = false`), el chat inicia automáticamente el onboarding guiado.
- El usuario puede omitir pasos no críticos (skip), pero no finalizar onboarding sin moneda base y primera cuenta.
- Al registrar el primer gasto exitoso, marcar onboarding como completado y mostrar confirmación final.

---

### 6.2 Panel (Dashboard)
- Filtros: rango de fechas, moneda/unificación.
- Tarjetas: balance, ingresos, gastos, últimas transacciones.
- Visualizaciones: flujo por categoría, distribución, comparativa mensual.
- Motor de gráficos principal: **EvilCharts**.
- Estrategia de render: **fallback dual con degradación automática**.

**Criterios de aceptación**
- Cambiar rango de fechas recalcula métricas y gráficos.
- Soporta multi-moneda (ver sección 8).
- Si EvilCharts interactivo falla o excede timeout, se muestra gráfico estático cacheado.
- Dashboard no bloquea navegación ante error de gráficos.

---

### 6.3 Transacciones
Submódulos:
1. **Tabla** con filtros, vistas guardadas, paginación y búsqueda.
2. **Reglas** (cliente power): condiciones por texto/monto/cuenta/categoría/origen/fecha.
3. **Recurrentes**: CRUD, estado (activa/pausada/finalizada), próximo disparo.
4. **Importar extractos**: upload PDF/CSV → parsing → preview → confirmar.

**Criterios de aceptación**
- Crear/editar/eliminar transacción con audit log.
- Reglas aplican a nuevas transacciones y opcionalmente históricas.
- Importación exige preview antes de guardar.

---

### 6.4 Cuentas
- Crear cuentas: nombre, tipo (banco, efectivo, wallet), moneda, saldo inicial.
- Historial de cambios de cuenta.
- Acciones sensibles con confirmación adicional.

**Criterios de aceptación**
- Alta/edición disponibles para cliente propietario.
- Eliminación exige doble confirmación y auditoría.

---

### 6.5 Presupuestos
- Presupuesto por categoría/grupo con alertas 80% y 100%.
- Vista de progreso + sugerencias.

### 6.6 Metas
- Meta con monto y fecha objetivo.
- Aportes periódicos opcionales + progreso.

---

### 6.7 Herramientas
#### 6.7.1 WhatsApp
- Estado de conexión, número activo, reconectar, métricas de uso.
- Acceso rápido a ayuda de configuración.

**Criterios de aceptación**
- Estados visibles: conectado, pendiente, error.
- Reintento de conexión disponible cuando hay error.

#### 6.7.2 Correo (forwarding)
- Dirección única de reenvío por cliente.
- Copiar dirección y verificar recepción.

**Criterios de aceptación**
- Dirección visible y copiable.
- Test de recepción muestra estado exitoso o error accionable.

#### 6.7.3 Webhook
- Configurar URL destino.
- Validación de formato + prueba de envío.

**Criterios de aceptación**
- No permite guardar URL inválida.
- Resultado de prueba muestra success/error con detalle.

#### 6.7.4 Integración bancaria guiada (ej. Santander AR)
- Paso a paso para regla/filtro de correo y conexión.
- Confirmación de estado al finalizar.

**Criterios de aceptación**
- El cliente puede completar el flujo sin soporte manual.
- Si falla un paso, se muestra instrucción de corrección y reintento.

#### 6.7.5 GasTag
- Toggle público/privado.
- Slug público único.
- Gestión de cuentas visibles en la página pública.

**Criterios de aceptación**
- Cambiar a público requiere confirmación.
- Solo cuentas seleccionadas son visibles públicamente.

#### 6.7.6 Vaquitas
- Crear/editar vaquita.
- Cuenta receptora, monto total y participantes.
- Cálculo y reparto del aporte por persona.

**Criterios de aceptación**
- Requiere GasTag activo para operar.
- Recalcula montos al cambiar participantes o total.

---

### 6.8 Perfil
- Datos del cliente: email, nombre, país, fecha de registro.
- Acceso a facturación y programa de referidos.

### 6.9 Configuración
- Moneda predeterminada.
- Estado de integraciones (WhatsApp, GasTag).
- Notificaciones push y alertas.

### 6.10 Idioma
- Selector de idioma: ES, EN, DE, FR, IT, PT.
- Persistencia de preferencia por usuario.

### 6.11 Programa de referidos
- Link único para compartir.
- Métricas: referidos, activados, clicks.

### 6.12 Seguridad de cuenta (Zona de peligro)
- Reset selectivo de datos: transacciones, cuentas, presupuestos, categorías, configuraciones, recurrentes.
- Eliminación de cuenta completa con período de gracia de 5 días.

**Criterios de aceptación**
- Muestra impacto de cada opción antes de confirmar.
- Reseteos y eliminación quedan auditados.
- Durante período de gracia, cliente puede cancelar eliminación.

### 6.13 Ayuda (FAQ)
- Centro de ayuda con preguntas frecuentes por módulo.
- Búsqueda básica y secciones plegables.

**Criterios de aceptación**
- FAQ accesible desde navegación lateral.
- Respuestas cargan en estados: loading, empty, error, success.

---

## 7) WhatsApp (UX objetivo) — Requisitos funcionales
### 7.1 Vinculación de cuenta (1:1 usuario ↔ WhatsApp)
- Cada cliente conecta su cuenta mediante flujo en **Herramientas > WhatsApp**.
- El sistema genera código/token de vinculación de un solo uso, con expiración.
- El usuario valida desde su WhatsApp (mensaje de challenge u OTP).
- Al validar, se guarda mapping único: `workspace_id + user_id + wa_phone` en `Integration`.
- Estados de integración: `pending`, `connected`, `error`, `revoked`.
- Si el número ya está vinculado a otro workspace, bloquear y pedir revocación explícita.

### 7.2 Capacidades del canal
- Recepción de mensajes: **texto, audio (voice note), imagen, PDF**.
- Soporte multi-turn para completar datos faltantes.
- Respuestas con cards consistentes:
  - “Transacción registrada” (ID, monto, descripción, categoría, cuenta, fecha, tipo).
  - “Moneda principal actualizada”.
  - “Cuenta creada”.
  - “Acción restringida” + CTA “Ir al dashboard”.
- Para analíticas: resumen textual + imagen de gráfico (PNG) + nota de tipo de cambio.

### 7.3 Flujos objetivo (como referencia visual)
1. **Registro por comprobante (imagen/PDF)**
   - Usuario envía comprobante.
   - Pipeline: OCR/visión → extracción (`comercio`, `monto`, `fecha`, `moneda`) → categorización sugerida.
   - Se ejecuta `transactions.create` con `request_id` idempotente.
   - Se responde card “Transacción registrada” + deep link “Ver en la app”.

2. **Consulta “¿cuánto llevo gastado este mes?”**
   - Se ejecuta `analytics.summary` + `analytics.by_category`.
   - Respuesta 1: resumen (ingresos, gastos, balance), comparación vs mes anterior, recomendación breve.
   - Respuesta 2: gráfico (ej. últimos 12 meses o por categoría) como imagen PNG.
   - Si aplica FX, incluir nota “Valores unificados en X (TC: ...)”.

3. **Cambio de moneda (texto o audio)**
   - Bot detecta intención y confirma moneda actual.
   - Si el usuario confirma, ejecuta `settings.update({base_currency})`.
   - Responde card “Moneda principal actualizada: USD”.

4. **Creación de cuenta con multi-turn**
   - Usuario: “Creame una cuenta berry”.
   - Bot solicita campos faltantes: saldo inicial y moneda.
   - Al completar datos, ejecuta `accounts.create`.
   - Responde card “Cuenta creada” con saldo inicial y moneda.

5. **Acciones restringidas por seguridad**
   - Ejemplo: eliminar cuenta por WhatsApp.
   - El bot no ejecuta la acción; responde “Debés hacerlo desde el dashboard” + botón “Ir al dashboard”.
   - Registrar intento en `AuditLog`.

### 7.4 Reglas de parsing y resolución de ambigüedad
- Comandos naturales soportados:
  - “Gasté 30 en almuerzo”
  - “Ingreso 1000 sueldo”
  - “Pagué 25.50 en Uber con tarjeta”
  - “Cambiá mi moneda a USD”
  - “Creá una cuenta Nexo con saldo 0 en USD”
  - “Gastos por categoría febrero 2026”
- Ambigüedades:
  - Sin categoría/cuenta: sugerir probable; en MVP permitir autoasignación y ofrecer corrección con link.
  - Sin moneda: usar moneda predeterminada del workspace.
  - Sin fecha: usar fecha actual del workspace.
- Confianza de extracción baja (OCR/visión): pedir confirmación antes de guardar.

### 7.5 SLA, fallback y resiliencia
- p95 objetivo:
  - Consultas textuales: <6s
  - OCR/visión: <20s
- Fallback de gráficos:
  - Si `charts.render` no responde en timeout, enviar primero resumen textual.
  - Enviar gráfico en segundo mensaje asíncrono cuando esté listo.
- Idempotencia y duplicados:
  - Cada evento entrante usa `request_id`.
  - Si llega duplicado, no se vuelve a crear transacción; se retorna la confirmación existente.

### 7.6 Criterios de aceptación WhatsApp
- Vinculación 1:1 de número WhatsApp a cuenta cliente operativa y auditable.
- Registro de transacciones por texto, audio, imagen y PDF.
- Flujo multi-turn funcional para creación de cuentas cuando faltan datos.
- Consultas analíticas entregan resumen y gráfico (o fallback textual + gráfico async).
- Cambio de moneda operativo desde chat con confirmación explícita.
- Acciones sensibles se bloquean en chat y redirigen al dashboard.
- Toda mutación persiste en BD vía endpoints canónicos xMCP, con `AuditLog` y `request_id`.

---

## 8) Multi-moneda y Tipos de Cambio (FX)
### 8.1 Reglas
- Cada transacción tiene: moneda original, monto original.
- El sistema almacena monto normalizado a moneda base del workspace usando un TC (timestamped).
- Se deben guardar:
  - Fuente de TC (provider)
  - Par (ARS/USD)
  - Valor
  - Fecha/hora

### 8.2 UI/IA
- Informes por WhatsApp y web deben indicar:
  - “Valores unificados en USD (TC: ARS/USD X, EUR/USD Y)”
- Cambiar moneda base recalcula vistas (y opcionalmente recalcula históricos; MVP: recalcular on-the-fly para reportes).

---

## 9) IA: Proveedores + Agentes
### 9.1 Proveedores (Abstracción de modelos)
El backend implementa una interfaz común `LLMProvider` para:
- **OpenAI** (Responses/Chat Completions)
- **Gemini** (Google AI)
- **OpenAI-compatible** (ej: endpoints compatibles con OpenAI)

Funciones mínimas:
- `generateText()`
- `callTools()` (tool-calling estructurado)
- `transcribeAudio()` (para voice notes, con fallback)
- `visionExtract()` (para imagen/PDF; puede usar provider vision u OCR propio)

**Políticas**
- Selección dinámica del modelo (barato vs potente) según tarea:
  - Clasificación rápida: modelo liviano
  - Extracción de recibos: modelo con visión (si disponible) o pipeline OCR+LLM
  - Analítica narrativa: modelo medio

### 9.2 Agentes IA
Agentes principales:
1. **TransactionAgent**: crea/edita transacciones; extrae de recibos.
2. **AnalyticsAgent**: responde preguntas con métricas y gráficos.
3. **SettingsAgent**: cambia moneda base, preferencias.
4. **AccountsAgent**: crea cuentas (con multi-turn).
5. **AutomationAgent**: crea reglas y recurrencias.

Cada agente opera consumiendo endpoints canónicos de xMCP.dev (MCP sobre HTTP/STDIO) y jamás toca DB directo.

---

## 10) xMCP.dev como capa canónica (WhatsApp, Web y Agentes)
### 10.1 Definición (para este proyecto)
- **MCP (Model Context Protocol)**: estándar para tools de agentes.
- **xMCP.dev**: framework/capa canónica para exponer y consumir endpoints MCP del dominio BILLETO.
- Para este MVP, el enfoque es **consumo de endpoints canónicos** (sin agregar complejidad extra de gobierno fuera de lo necesario).

### 10.2 Single Source of Truth (reglas)
- Toda mutación de negocio (crear/editar transacción, cuentas, settings) entra por endpoints canónicos en **xMCP.dev**.
- Todas las lecturas operativas para asistentes y canales salen de endpoints canónicos en **xMCP.dev**.
- Ningún agente o canal (web assistant, WhatsApp adapter, jobs) escribe directo a DB.
- Eventos de entrada (webhook/WhatsApp) usan `request_id` idempotente para evitar duplicados.

### 10.3 Diseño de consumo
**Componentes**
- `xmcp-server` (sobre xMCP.dev): publica tools/endpoints canónicos del dominio.
- `xmcp-policy-layer`: autenticación/autorización multi-tenant, rate limit, auditoría, allowlist de tools.
- `whatsapp-adapter`: recibe webhook, normaliza mensaje, invoca endpoints canónicos en xMCP.dev.
- `web-assistant-orchestrator`: tool-calling contra endpoints canónicos en xMCP.dev.

### 10.4 Catálogo inicial de endpoints/tools canónicos (MVP)
- `transactions.create({amount, currency, date, description, category_id?, account_id?, source, attachments?, request_id})`
- `transactions.list({date_from, date_to, filters...})`
- `transactions.update({id, patch, request_id})`
- `accounts.create({name, type, currency, initial_balance, request_id})`
- `accounts.list({filters?})`
- `settings.update({base_currency, request_id})`
- `analytics.summary({range, base_currency})`
- `analytics.by_category({range})`
- `charts.render({provider:"evilcharts", type, data, format:"png"})` → URL/asset-id
- `links.deep_link({entity:"transaction", id})` → URL
- `security.require_dashboard({reason, deep_link})` → plantilla de respuesta

### 10.5 Acciones sensibles (policy)
- Eliminar cuenta / borrar históricos / exportaciones masivas → require dashboard + confirmación extra.
- Cambiar moneda base → permitido con audit log obligatorio.
- Límite: N acciones por minuto por usuario/workspace.

---

## 11) Modelo de datos (mínimo)
### 11.1 Entidades base
- `User`
- `Workspace`
- `Membership` (roles)
- `Account` (currency, balance, type)
- `Category`
- `Transaction` (amount_original, currency_original, amount_base, base_currency, fx_rate_id, date, description, account_id, category_id, source)
- `Attachment` (file_url, type: image/pdf)
- `Rule` (conditions JSON, actions JSON)
- `RecurringTransaction`
- `Budget`
- `Goal`
- `Integration` (whatsapp, email, webhook)
- `WhatsAppMessage` (raw payload, normalized text, media refs)
- `AuditLog` (actor, action, entity, before/after, timestamp)
- `FXRate`

### 11.2 Cardinalidades (MVP)
- `User 1..N Membership`, `Workspace 1..N Membership`.
- `Workspace 1..N Account`, `Workspace 1..N Category`, `Workspace 1..N Transaction`.
- `Account 1..N Transaction`.
- `Category 1..N Transaction` (nullable en MVP si no se pudo categorizar al crear).
- `Transaction 0..N Attachment`.
- `Workspace 1..N Integration`.
- `Integration(whatsapp) 1..N WhatsAppMessage`.
- `Workspace 1..N Rule`, `Workspace 1..N RecurringTransaction`, `Workspace 1..N Budget`, `Workspace 1..N Goal`.
- `Workspace 1..N AuditLog`.

### 11.3 Constraints y reglas de integridad (críticas)
- Todas las tablas de negocio deben incluir `workspace_id` obligatorio (multi-tenant estricto).
- Claves foráneas obligatorias:
  - `Transaction.account_id -> Account.id`
  - `Transaction.category_id -> Category.id` (nullable)
  - `Transaction.fx_rate_id -> FXRate.id` (nullable solo si currency_original == base_currency)
  - `Attachment.transaction_id -> Transaction.id`
  - `WhatsAppMessage.integration_id -> Integration.id`
- Idempotencia de mutaciones:
  - `request_id` obligatorio en operaciones canónicas mutables.
  - Constraint único recomendado: `(workspace_id, request_id, action_name)`.
- Unicidad de vínculo WhatsApp:
  - En `Integration` para tipo `whatsapp`, `wa_phone_e164` único global mientras estado `connected`.
  - Un workspace no puede tener dos integraciones `whatsapp` en estado `connected` al mismo tiempo.
- Unicidad funcional adicional:
  - `Membership`: único `(workspace_id, user_id)`.
  - `Category`: único `(workspace_id, normalized_name)`.
  - `Account`: único `(workspace_id, normalized_name)`.

### 11.4 Índices mínimos recomendados (MVP)
- `Transaction(workspace_id, date DESC)`.
- `Transaction(workspace_id, category_id, date DESC)`.
- `Transaction(workspace_id, account_id, date DESC)`.
- `RecurringTransaction(workspace_id, status, next_run_at)`.
- `AuditLog(workspace_id, created_at DESC)`.
- `Integration(workspace_id, type, status)`.
- `WhatsAppMessage(integration_id, wa_message_id)` con `wa_message_id` único por integración.

### 11.5 Enums/estados exactos (MVP)
- `transaction_type`: `expense | income | transfer`.
- `transaction_status`: `posted | pending | voided`.
- `integration_type`: `whatsapp | email_forwarding | webhook | bank_email`.
- `integration_status`: `pending | connected | error | paused | revoked`.
- `recurring_status`: `active | paused | finished`.
- `account_type`: `bank | cash | wallet`.
- `message_direction` (WhatsAppMessage): `inbound | outbound`.
- `message_processing_status`: `received | parsed | requires_confirmation | applied | failed`.
- `rule_status`: `active | paused`.
- `budget_period`: `weekly | monthly`.
- `goal_status`: `active | reached | paused | cancelled`.

### 11.6 Política de borrado (soft/hard delete)
- **Soft delete obligatorio** (`deleted_at`, `deleted_by`) para:
  - `Account`, `Category`, `Transaction`, `Rule`, `RecurringTransaction`, `Budget`, `Goal`, `Integration`.
- **Hard delete permitido** para:
  - `WhatsAppMessage` y `Attachment` expirados por política de retención.
  - datos temporales de procesamiento (staging/import previews).
- **Nunca hard delete inmediato** para:
  - `AuditLog`, `FXRate` usado por transacciones, y registros requeridos por trazabilidad.
- En eliminación de cuenta de usuario con período de gracia:
  - marcar `User`/`Workspace` como `scheduled_for_deletion_at`.
  - durante gracia: acceso restringido con opción cancelar.
  - al vencer: ejecutar job de purge según política legal/configurada.

### 11.7 Reglas transaccionales mínimas
- Toda mutación de negocio crea entrada en `AuditLog` en la misma transacción lógica.
- Creación de `Transaction`:
  - guardar monto original + moneda original.
  - resolver y persistir `amount_base`, `base_currency`, `fx_rate_id`.
- Eventos duplicados (mismo `request_id`) deben devolver respuesta idempotente sin duplicar filas.

---

## 12) APIs (alto nivel)
### 12.1 API de la app (BFF Web)
- `POST /auth/*`
- `GET/POST /transactions`
- `GET/POST /accounts`
- `GET/POST /rules`
- `GET/POST /recurring`
- `GET/POST /budgets`
- `GET/POST /goals`
- `GET /analytics/*`
- `POST /uploads` (presigned URL o multipart)
- `GET/POST /integrations/*`

### 12.2 API canónica xMCP.dev (consumo de agentes/canales)
- `transactions.create`
- `transactions.list`
- `transactions.update`
- `accounts.create`
- `accounts.list`
- `settings.update`
- `analytics.summary`
- `analytics.by_category`
- `charts.render` (provider: evilcharts)
- `links.deep_link`
- `security.require_dashboard`

### 12.3 WhatsApp Webhook
- `POST /webhooks/whatsapp` (verificación + recepción)
- `GET /webhooks/whatsapp` (challenge verify)
- Internamente, el adapter traduce cada evento a llamadas canónicas de xMCP.dev con `request_id` idempotente.

---

## 13) Recomendación de Stack (para construirlo rápido y serio)
### 13.1 Frontend
- **Next.js (React + TypeScript)** + App Router
- **Tailwind CSS** + **shadcn/ui**
- Tabla: TanStack Table
- Gráficos: **EvilCharts** (principal) + fallback estático cacheado
- Autenticación: NextAuth (o auth propia)

### 13.2 Backend
Opción A (TypeScript full):
- **NestJS** + Prisma + PostgreSQL  
Opción B (Python):
- **FastAPI** + SQLAlchemy + PostgreSQL

Capa canónica MCP:
- **xMCP.dev** para publicar endpoints/tools del dominio y consumo por agentes/canales.

Infra común:
- Redis (cache + rate limit + jobs)
- Queue: BullMQ (Node) / Celery (Python)
- Storage: S3 compatible (MinIO / R2)
- Observabilidad: Sentry + OpenTelemetry

### 13.3 WhatsApp
- WhatsApp Business Platform (Cloud API) o proveedor (Twilio) según país/costo.
- Render de gráficos como PNG (servidor) vía EvilCharts y envío como media.
- Fallback dual: si chart no está listo en timeout, responder primero texto + enviar gráfico en segundo mensaje async.

### 13.4 IA
- Provider abstraction (OpenAI / Gemini / OpenAI-compatible)
- Guardrails: allowlist de tools (MCP), límites de tokens, control de costos.
- Todos los agentes invocan operaciones de dominio exclusivamente vía endpoints canónicos en xMCP.dev.

---

## 14) Seguridad, Privacidad y Cumplimiento
- Cifrado en tránsito (TLS) y en reposo (DB + storage).
- RBAC orientado a **rol Cliente** (solo recursos propios del cliente).
- Audit log obligatorio para acciones mutables.
- Manejo de PII: minimizar almacenamiento de contenido de WhatsApp (guardar solo lo necesario).
- Retención de media: configurable.
- Protección anti prompt-injection: el modelo no puede ejecutar acciones sin tools; tool args validan schema.

### 14.1 NFRs de experiencia (Cliente)
- Pantallas de configuración/herramientas deben responder en <2s p95 para lectura de estado.
- Flujos de prueba de integración (correo/webhook) deben devolver resultado en <8s p95.
- Vistas clave deben soportar estados `loading/empty/error/success` sin bloquear navegación.

### 14.2 NFRs Frontend público (Landing)
- Responsive obligatorio en Mobile, Tablet, Laptop y Desktop grande.
- Home/Producto/Planes/Manifiesto/Blog/FAQ/Contacto deben mantener consistencia dark-neon sin pérdida de legibilidad.
- Páginas públicas deben cargar sin bloqueo visual crítico y mantener CTAs visibles en primer viewport.

---

## 15) Plan de Vibecoding (serie paso a paso)
> Objetivo: construir el MVP end-to-end de **frontend público + rol Cliente** con entregables verificables por episodio.

### Fase 0 — Setup
1. Repo monorepo (pnpm + turborepo) o mono (Next.js + API).
2. CI básico (lint, typecheck, tests).
3. Docker compose: Postgres + Redis + MinIO.
4. Base de datos de desarrollo ya creada: `belleto_local`.
5. Variable de entorno de desarrollo configurada (en `.env.local`, no commitear secretos):
   - `DATABASE_URL=postgresql+asyncpg://postgres:luis789JLQL%40@localhost:5432/belleto_local`

### Fase 1 — Frontend público (Landing + Auth)
4. Header/footer globales + estilo dark-neon.
5. Home + Producto + Planes.
6. Manifiesto + Blog (estático) + FAQ (estático) + Contacto.
7. Login + Registro (email/password + Google/Apple).
8. QA responsive (Mobile/Tablet/Laptop/Desktop grande).

### Fase 2 — Core Cliente (App privada)
9. Auth cliente + perfil base.
10. Cuentas (CRUD).
11. Categorías (seed + CRUD).
12. Transacciones (CRUD + tabla + filtros).
13. Dashboard cliente con EvilCharts + fallback.

### Fase 3 — Automatización Cliente
14. Reglas (modelo + UI básico).
15. Recurrentes (worker + scheduler).
16. Presupuestos y metas (MVP funcional).

### Fase 4 — Herramientas Cliente
17. WhatsApp (estado, reconexión, health).
18. Correo forwarding (dirección única + test).
19. Webhook (config + test entrega).
20. Integración bancaria guiada por correo (flujo asistido).
21. GasTag (público/privado + cuentas visibles).
22. Vaquitas (crear/editar/reparto, prerequisito GasTag).

### Fase 5 — IA + WhatsApp
23. Provider abstraction (OpenAI/Gemini).
24. Servidor canónico de tools/endpoints con xMCP.dev.
25. Asistente web con tool-calling contra endpoints canónicos xMCP.dev.
26. WhatsApp NLU (texto/audio/imagen/PDF) + `transactions.create`.
27. Analíticas por WhatsApp + render de gráficos con EvilCharts + fallback dual.

### Fase 6 — Perfil, Config y Seguridad
28. Configuración cliente (moneda, notificaciones, idioma).
29. Programa de referidos (link + métricas).
30. Centro de ayuda (FAQ).
31. Zona de peligro (reset selectivo + eliminación con 5 días de gracia).

### Fase 7 — Pulido y release
32. Auditoría, rate limits, logs.
33. Performance y costos.
34. Deploy (Vercel/Fly/Render) + dominio + monitoreo.

---

## 16) Criterios de “MVP listo”
- Alcance:
  - Frontend público (landing + auth) y app privada de rol Cliente habilitados.
- Frontend público:
  - Páginas operativas: Home, Producto, Planes, Manifiesto, Blog, FAQ, Contacto, Login y Registro.
  - Responsive validado en Mobile, Tablet, Laptop y Desktop grande.
  - Estilo dark-neon aplicado de forma consistente.
  - Blog/FAQ funcionando con contenido estático en código.
- Web Cliente:
  - Transacciones, cuentas, dashboard, reglas, recurrentes, presupuestos y metas operativos.
  - Dashboard funcional con EvilCharts y fallback estático sin bloqueo de UI.
  - Herramientas cliente operativas: WhatsApp, Correo, Webhook, Integración guiada, GasTag y Vaquitas.
  - Perfil/Configuración con moneda, notificaciones, idioma, referidos y ayuda.
  - Zona de peligro operativa: reset selectivo + eliminación de cuenta con 5 días de gracia.
- IA:
  - Asistente web funcional con tool-calling y permisos.
  - 100% de operaciones de agentes vía endpoints canónicos de xMCP.dev.
- WhatsApp:
  - Registrar transacción por texto, audio, imagen y PDF.
  - Consultas de gastos con gráfico.
  - Cambiar moneda base.
  - Crear cuenta con preguntas de seguimiento.
  - Acciones sensibles redirigen a dashboard con botón.
  - Si falla el render del chart, responde resumen textual y envía gráfico en segundo mensaje.

---

## 17) Riesgos y mitigaciones
- **WhatsApp policy/rate**: usar colas + reintentos + backoff; mensajes idempotentes.
- **Extracción de recibos**: fallback OCR + heurísticas; pedir confirmación si baja confianza.
- **Costos de IA**: routing por tarea + caching + límites de tokens.
- **Multi-moneda**: guardar FXRate por transacción para reproducibilidad.
- **Dependencia de endpoint canónico (xMCP.dev)**: aplicar timeouts, retries, circuit breaker y monitoreo p95/p99.
- **Dependencia de charts (EvilCharts)**: fallback dual (interactivo→estático en web, PNG→texto+async en WhatsApp).
- **Seguridad**: policy layer + audit log + restricciones de acciones.

---

## 18) Apéndice — Plantillas WhatsApp (MVP)
### 18.1 “Transacción registrada”
- Título: “✅ Transacción registrada”
- Campos:
  - ID
  - Monto (original + moneda)
  - Descripción
  - Categoría
  - Cuenta
  - Fecha
  - Tipo (Gasto/Ingreso)
- Botón: “Ver en la app” (deep link)

### 18.2 “Acción restringida”
- Mensaje: “Para X, necesitás hacerlo desde el dashboard (confirmación extra por seguridad).”
- Botón: “Ir al dashboard”

### 18.3 “Resumen mensual”
- Ingresos, gastos, balance
- comparación vs mes anterior
- recomendación 1–2 líneas
- Imagen adjunta: gráfico
