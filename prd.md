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
1. **Onboarding Conversacional (Inspiración Gasti)**:Login → Chat Bot inicia automáticamente:
   - **Saludo**: "¡Hola! Soy Billeto, tu asistente financiero 👋".
   - **Paso 1 (Nombre)**: "¿Cómo querés que te llamemos?" (Input texto simple, ej. "Alex").
   - **Paso 2 (Localización)**: Confirmación de País y Moneda Principal (Card con dropdowns, pre-seleccionado por IP).
   - **Paso 3 (Avatar)**: "¿Te gustaría elegir un avatar?" (Grid de emojis seleccionables: Gato, Perro, Oso, Zorro...).
   - **Paso 4 (Vinculación WhatsApp)**: Muestra Card con código único (ej. "G97VJH") + Botón "Configurar WhatsApp" (deep link) + Botón secundario "Continuar" (copy code).
   - **Paso 5 (Diagnóstico)**: "¿Cuál es tu mayor dolor de cabeza con la plata?" (Chips seleccionables: "No sé a dónde va", "No logro ahorrar", "Deudas", "Todo lo anterior").
   - **Resultado**: Perfil creado, moneda base seteada, WhatsApp (opcionalmente) vinculado y dashboard personalizado.
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

**Lineamiento visual obligatorio (Inspiración Gasti.pro)**
- **Tema**: Fondo Principal Profundo `Zinc-950` (#09090b). Tarjetas y Sidebar en `Zinc-900` (#18181b).
- **Acento**: **Verde Neón/Lima** (`#D1F366` / `lime-300`) para CTAs principales, iconos activos, métricas destacadas y estados positivos.
- **Colores Secundarios**: Azul suave para acciones informativas, Rojo/Rosa desaturado para gastos/alertas. Texto secundario en `Muted-Foreground` (#a1a1aa).
- **Efectos**: **Glassmorphism** sutil en modales y overlays. Bordes finos `border-white/5` o `border-white/10`. Sombras suaves `shadow-xl` en elementos flotantes.
- **Tipografía**: **Geist Sans** o **Inter**. Pesos: `Medium` (500) para encabezados y botones; `Regular` (400) para cuerpo. Tamaños de fuente ajustados (12-14px) para alta densidad de información.
- **Layout General**: Sidebar lateral colapsable (acordeón para submenús) + Header minimalista (Breadcrumbs + Badges) + Contenido en **Bento Grid**.
- **Animaciones**: Transiciones de página `fade-in`. Modales con efecto `zoom-in-95` + `fade-in` y backdrop blur. Hover en tarjetas: `scale-[1.01]` + brillo borde.
- **Componentes**: Botones `rounded-md` con background opacity (ej. `bg-primary/20`) y texto sólido. Badges `rounded-full` o `pill`.

#### 6.A.1 Home (Hero Section)
- **Titular**: Tipografía `Geist` bold masiva (ej. "Toma el control...").
- **Subtítulo**: Breve, color `text-muted-foreground`.
- **CTAs**:
    - Primario: Botón **Verde Neón** (`bg-[#D3FF0A]`, text-black) con efecto hover glow.
    - Secundario: Botón "Outline" o link simple con flecha.
- **Visual**: Gráfico de EvilCharts animado (Line/Area) simulando crecimiento financiero o dashboard 3D glass.
- **Fondo**: Gradiente radial sutil (azul/violeta oscuro) sobre base negra.

#### 6.A.2 Social Proof (Wall of Love)
- **Formato**: Carrusel infinito (marquee) o grilla masonry.
- **Componentes**: Tarjetas estilo "Twitter" con efecto **Glassmorphism** (`bg-white/5`, `backdrop-blur-md`, borde sutil).
- **Contenido**: Avatares, nombres de usuario y testimonios cortos sobre control/ahorro.

#### 6.A.3 Stats ("Billeto en números")
- **Diseño**: Banda horizontal limpia o grilla de 3-4 columnas.
- **Métricas**: Números grandes en color **Verde Neón** o Blanco Brillante.
- **Labels**: Texto pequeño descriptivo debajo (ej. "+50k Usuarios", "$2M Procesados").

#### 6.A.4 Features (Producto)
- **Estructura**: **Bento Grid** (grilla irregular de tarjetas).
- **Tarjetas**:
    1. **OCR Inteligente**: Icono de escaneo + demo visual de ticket.
    2. **WhatsApp Native**: Captura de chat simulado.
    3. **Presupuestos**: Gráfico de barra de progreso.
    4. **Gastos Grupales**: Avatares superpuestos.
- **Estilo**: Tarjetas oscuras (`bg-zinc-900`) con borde `border-white/10` y efecto hover leve (`scale-[1.02]`).

#### 6.A.5 Planes (Pricing)
- **Layout**: 3 Tarjetas verticales (Free, Pro, Premium).
- **Plan Pro (Destacado)**:
    - Borde o sombra en color **Verde Neón**.
    - Badge "Más Popular" o "Recomendado".
    - Botón CTA de color sólido (los otros son outline).
- **Features**: Lista con checkmarks verdes (`lucide-react`).

#### 6.A.6 Soluciones para Negocios (Inspiración Gasti Business)
- **Concepto**: Sección dedicada a PyMEs y autónomos.
- **Titular**: "Billeto para tu Negocio".
- **Copy**: "Gestión financiera avanzada para equipos y crecimiento."
- **CTA**: "Lista de espera" o "Contáctanos".
- **Visual**: Card distinta o sección con fondo ligeramente más claro (`bg-zinc-900/50`) para diferenciar.

#### 6.A.7 FAQ
- **Diseño**: Acordeón (`shadcn/ui accordion`) de ancho limitado (max-w-2xl).
- **Interacción**: Apertura suave con `framer-motion`.
- **Estestica**: Texto pregunta claro, respuesta en `text-muted-foreground`.

#### 6.A.8 Footer (Contacto)
- **Diseño**: Minimalista, borde superior `border-white/10`.
- **Contenido**: Logo a la izquierda, links de legales/redes a la derecha.
- **CTA Final**: "Empieza ahora" (texto simple o botón pequeño).

#### 6.A.9 Auth (Login y Registro)
- **Layout**: Tarjeta `Card` (`shadcn/ui`) centralizada en pantalla, ancho fijo, sombra sutil.
- **Fondo**: Page background en Zinc-950; Card en Zinc-900 con borde `border-white/10`.
- **Cabecera**: Logo centrado + título de bienvenida corto (Geist).
- **Formulario**:
    - Inputs con labels pequeños y placeholders descriptivos.
    - Password con toggle visibility (ojo).
- **CTA Principal**: Botón `width-full`, color **Verde Neón** (`bg-[#D3FF0A]`), texto negro, hover brillo.
- **Social Auth**: Botones `variant="outline"` debajo con separador "O" y logos (Google/Apple).
- **Footer**: Links a "Términos" y "Ayuda" (WhatsApp) fuera de la tarjeta o al pie.

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

### 6.C UI Kit & Componentes (Sistema de Diseño)
**Inspirado en Gasti.pro**
- **Botones**:
  - `Primary`: Fondo `lime-300` (#D1F366), Texto `zinc-950`, `font-medium`, `rounded-md`, efecto `hover:bg-lime-400`, `active:scale-95`.
  - `Secondary`: Fondo `zinc-800`, Texto `white`, Border `zinc-700`, `hover:bg-zinc-700`.
  - `Ghost`: Fondo transparente, Texto `zinc-400`, `hover:text-white`, `hover:bg-white/5`.
- **Inputs & Forms**:
  - Fondo `zinc-900/50`, Borde `zinc-800`, Texto `white`, Placeholder `zinc-500`.
  - Focus ring: `ring-1` `ring-lime-300/50` `border-lime-300`.
  - Labels: Texto pequeño `text-xs` `uppercase` `tracking-wider` `text-zinc-500`.
- **Tarjetas (Cards)**:
  - Fondo `zinc-900`, Borde `border-white/5`.
  - Sombra `shadow-xl` (difusa).
  - Header de tarjeta con título en `text-sm` `text-zinc-400` e icono a la derecha.
- **Modales**:
  - Overlay: `bg-black/80` `backdrop-blur-sm`.
  - Content: Centrado, `zoom-in-95` animation, Fondo `zinc-900`, Borde `zinc-800`.
- **Badges / Chips**:
  - Fondo suave (ej. `bg-lime-900/30`), Texto `text-lime-300`, Borde `border-lime-500/20`, `rounded-full`.
- Layout estable (sin saltos críticos perceptibles).

### 6.0 Mapa de navegación cliente (app privada)
- Asistente
- Panel
- Transacciones
- Cuentas
- Presupuestos
- Metas
- Herramientas (Submenú en acordeón):
  - WhatsApp
  - Correo (forwarding)
  - Webhook
  - GasTag
  - Vaquitas
  - Integraciones
- Perfil (Usuario al pie del sidebar)
- Configuración
- Ayuda (FAQ)
- Idioma

### 6.1 Asistente (Web)
**Descripción:** chat en web para consultas y acciones del cliente (crear/listar/actualizar), incluyendo onboarding inicial guiado para cuentas nuevas.  
**Funciones:**
- Prompt box + sugerencias rápidas (chips).
- Respuestas con texto, tablas, mini-gráficos y deep links.
- Acciones cliente: crear transacción, cuenta, presupuesto, meta y abrir dashboard.
- Onboarding conversacional "tipo Gasti" (Mandatorio):
  1. **Bienvenida**: "Hola, soy Billeto..." + Input Nombre.
  2. **Config Regional**: Card no bloqueante. "Confirmá tus datos". Dropdown País (ej. Perú) + Moneda (ej. PEN). Botón "Confirmar". Respuesta: "Genial, sos de [País] y tu moneda es [Moneda]".
  3. **Personalización**: "Elegí un avatar". Grid 4x3 de emojis (Animales/Objetos).
  4. **Conexión Canal**: "Este es tu código para WhatsApp". Muestra código grande (ej. `ABC12`) + Botón primario verde "Configurar WhatsApp" (abre `wa.me`) + Botón secundario "Copiar código" + Link "Continuar" (skip).
  5. **Diagnóstico**: "Entendamos cómo manejás tu plata". Pregunta única con chips multiselección (ej. "No ahorro", "Gastos compartidos", "Deudas").
  6. **Cierre**: "¡Perfil listo! Empecemos". Redirige al Dashboard o solicita primer gasto.

**Criterios de aceptación**
- Solo opera con sesión activa del cliente.
- Toda acción retorna resumen de cambios + enlace a la entidad.
- Para usuario nuevo (`onboarding_completed = false`), el chat inicia automáticamente el onboarding guiado.
- El usuario puede omitir pasos no críticos (skip), pero no finalizar onboarding sin moneda base y primera cuenta.
- Al registrar el primer gasto exitoso, marcar onboarding como completado y mostrar confirmación final.

---

### 6.2 Panel (Dashboard)
- **Layout**: **Bento Grid** (Grilla adaptativa de tarjetas de distintos tamaños).
- **Filtros**: Rango de fechas (Dropdown), Moneda base.
- **Tarjetas del Grid**:
  1.  **Balance Total**: Gráfico de Area/Linea (Recharts/VisX) con degradado.
  2.  **Ingresos vs Gastos**: Barras comparativas.
  3.  **Racha/Actividad**: Mapa de calor (Heatmap estilo GitHub) mostrando actividad diaria.
  4.  **Flujo de Dinero**: Diagrama **Sankey** simplificado (Ingresos -> Categorías de Gasto).
  5.  **Últimas Transacciones**: Lista compacta.
  6.  **Metas Rápidas**: Progreso circular o barra de logros.
- **Motor de gráficos**: `Recharts` o `VisX` estilizados con el tema (ejes ocultos, tooltips custom dark).
- **Interacción**: Las tarjetas pueden expandirse o llevar al detalle al hacer clic.

**Criterios de aceptación**
- Cambiar rango de fechas recalcula métricas y gráficos.
- Soporta multi-moneda (ver sección 8).
- Si EvilCharts interactivo falla o excede timeout, se muestra gráfico estático cacheado.
- Dashboard no bloquea navegación ante error de gráficos.

---

### 6.3 Transacciones
Submódulos:
1. **Tabla** (DataGrid):
   - Diseño estilo "Glass" con cabecera fija (`bg-zinc-900/80` backdrop-blur).
   - Filas con `hover:bg-white/5` y acciones rápidas (editar/borrar) on-hover.
   - Columnas sortables y filtros avanzados en popover.
   - Paginación o Scroll infinito virtualizado.
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

### 6.6 Metas (Goals)
- **Modal de Creación**:
  - Diseño centrado con animación `zoom-in`.
  - **Tabs** para selección de categoría (Ahorro, Viaje, Deuda).
  - **Grid de Plantillas**: Opciones predefinidas con Emojis grandes y colores de fondo.
  - Formulario simple: Nombre, Monto Objetivo, Fecha Límite.
- **Visualización**:
  - Tarjetas de progreso con barra circular o lineal.
  - "Confetti" visual al completar una meta.

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

### 7.1.1 Mensajes de números no vinculados
Cuando el sistema recibe un mensaje de un número de WhatsApp que **no** está vinculado a ninguna cuenta:

1. **Respuesta automática (una sola vez por ventana de 24h)**:
   > "¡Hola! 👋 Soy Billeto, tu asistente de finanzas.
   > Para empezar, creá tu cuenta gratis en [link-registro] y vinculá este número desde Herramientas > WhatsApp.
   > ¿Ya tenés cuenta? Iniciá sesión y vinculá tu WhatsApp en segundos."
2. **Rate limit anti-spam**: máximo 1 respuesta automática por número por ventana de 24h. Mensajes adicionales del mismo número desconocido se ignoran silenciosamente.
3. **Privacidad**: no almacenar el contenido del mensaje entrante si el número no está vinculado. Solo registrar en log operativo: `timestamp`, `wa_phone_hash` (hash, no plano), `event: unlinked_message_received`.
4. **Número previamente revocado**: si el número tuvo vinculación previa (estado `revoked`), personalizar el mensaje: "Parece que desvinculaste tu cuenta anteriormente. Podés reconectar desde Herramientas > WhatsApp."
5. **Métricas**: trackear `unlinked_messages_count` y `conversion_to_registration` para evaluar efectividad del CTA.

**Criterios de aceptación**
- Número desconocido recibe exactamente 1 mensaje de bienvenida por ventana de 24h.
- El link de registro en el mensaje es válido y funcional.
- No se persiste contenido del mensaje de números no vinculados en BD.
- Log operativo registra el evento sin exponer PII del contenido.
- Número con historial `revoked` recibe mensaje personalizado de reconexión.

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

### 9.3 Guardrails de IA (Confianza, Fallbacks y Anti-alucinación)

#### 9.3.1 Umbrales de confianza
Cada decisión de IA que afecte datos del usuario debe evaluarse con un **score de confianza** (0.0–1.0):

| Operación | Umbral mínimo | Si confianza < umbral |
|---|---|---|
| Categorización automática de transacción | ≥ 0.75 | Preguntar al usuario: "¿Es [categoría]?" con opciones alternativas |
| Extracción de comprobante (OCR/visión) | ≥ 0.80 | Mostrar preview de datos extraídos y pedir confirmación explícita |
| Parsing de texto/audio (NLU) | ≥ 0.70 | Reformular al usuario: "Entendí X, ¿es correcto?" |
| Detección de intención (tool selection) | ≥ 0.85 | No ejecutar tool; pedir aclaración |
| Resolución de cuenta/moneda ambigua | ≥ 0.90 | Listar opciones y pedir selección explícita |

#### 9.3.2 Política de confirmación
- **Confirmación implícita** (confianza ≥ umbral): ejecutar acción y mostrar resumen con opción "Deshacer" o "Corregir".
- **Confirmación explícita** (confianza < umbral): **nunca** ejecutar la acción sin respuesta afirmativa del usuario.
- **Multi-turn obligatorio**: si faltan campos requeridos (monto, cuenta), el agente debe preguntar — nunca inventar valores.

#### 9.3.3 Anti-alucinación y validación
- **IDs de entidades**: todo ID referenciado por un agente (account_id, category_id) se valida contra la BD del workspace antes de ejecutar. Si el ID no existe → error controlado, no retry silencioso.
- **Schema validation**: los argumentos de cada tool se validan contra un JSON Schema estricto antes de ejecutar. Argumentos fuera de schema → rechazo con log.
- **Sandbox de tools**: los agentes solo pueden invocar tools de la allowlist de su rol. Intentos de invocar tools no permitidos se bloquean y registran en `AuditLog`.
- **No-fabrication rule**: si el modelo genera datos que no provienen de input del usuario ni de la BD (ej. monto inventado, categoría inexistente), el sistema debe detectarlo y abortar la operación.

#### 9.3.4 Fallback en cadena
1. **Modelo primario** (potente) falla o timeout → retry 1x.
2. Si persiste → **modelo secundario** (liviano/barato) con prompt simplificado.
3. Si persiste → **respuesta genérica segura**: "No pude procesar tu solicitud. Podés intentar de nuevo o hacerlo desde el dashboard." + deep link.
4. Cada fallback se registra con: `provider`, `model`, `latency_ms`, `error_type`, `fallback_level`.

#### 9.3.5 Límites de costo y uso
- **Tokens por request**: máx 4 096 tokens de salida por invocación de agente.
- **Requests por usuario/día**: según plan (Free: 5, Pro: 100, Premium: 500).
- **Costo mensual por workspace**: alerta interna si supera umbral configurable (ej. $10 USD/mes para Free).
- **Logging obligatorio**: cada llamada a LLM registra `tokens_in`, `tokens_out`, `model`, `cost_estimate_usd`, `latency_ms`, `confidence_score`.

#### 9.3.6 Criterios de aceptación Guardrails
- Toda categorización con confianza < 0.75 genera pregunta de confirmación (nunca autoasigna sin preguntar).
- Extracción de comprobante con confianza < 0.80 muestra preview editable antes de guardar.
- Agente que referencia un ID inexistente recibe error controlado (no crash ni dato fabricado).
- Cadena de fallback funciona: modelo primario timeout → secundario → mensaje genérico.
- Logs de IA consultables por workspace para debugging y auditoría de costos.

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

### 10.6 Estrategia de Prompts y Recursos (xMCP)
La arquitectura xMCP centraliza no solo las tools, sino también los **Prompts del Sistema** y el Contexto.

#### 10.6.1 Gestión de Prompts como Recursos
- Los prompts se definen en el servidor xMCP (ej. `src/prompts/*.ts`) y se exponen como recursos (`prompts.list`, `prompts.get`).
- **Beneficio**: El "cerebro" (prompts + tools) está versionado en el mismo repositorio, facilitando la evolución conjunta.

#### 10.6.2 Catálogo de Prompts del Sistema
1. **`master-agent-prompt`**:
   - Rol: Orquestador principal.
   - Contexto inyectado: `current_time`, `user_name`, `plan_tier`, `subscription_status`.
   - Instrucciones: Personalidad ("Asistente Financiero Profesional pero Cercano"), reglas de negocio de alto nivel, y directrices de uso de tools.
2. **`transaction-categorizer-prompt`**:
   - Rol: Clasificador especializado.
   - Contexto: Lista de categorías activas del workspace.
   - Instrucciones: Reglas de desambiguación y taxonomía.
3. **`ocr-extraction-prompt`**:
   - Rol: Extractor de visión.
   - Instrucciones: Schema JSON estricto para extraer `total`, `currency`, `date`, `merchant` de imágenes.

#### 10.6.3 Inyección de Contexto Dinámico
- El servidor xMCP inyecta datos frescos (ej. saldo actual, fecha, configuración) en el prompt *antes* de enviarlo al LLM.
- Esto reduce alucinaciones por contexto desactualizado y simplifica el cliente (Web/WhatsApp), que solo pide "dame el prompt inicial".

### 10.7 Sistema de Ingeniería de Prompts (Avanzado)
Este sistema implementa patrones de **Chain-of-Thought (CoT)**, **Few-Shot Prompting** y **Role-Playing** estricto para maximizar la precisión y reducir alucinaciones.

#### 10.7.1 Principios de Diseño
1.  **Delimitadores Claros**: Uso de `xml tags` (<context>, <instructions>, <history>) para separar secciones.
2.  **Salida Estructurada**: JSON estricto para todas las acciones (tool calls).
3.  **Pensamiento Privado (Hidden Chain of Thought)**: El modelo debe "razonar" antes de "actuar" dentro de un bloque `_thinking` para mejorar la deducción lógica.

#### 10.7.2 Master Orchestrator (El Cerebro)
**Rol**: Router central que entiende la intención y delega a especialistas o responde dudas generales.
**Contexto**: Inyectado dinámicamente (`user_profile`, `current_state`, `active_tools`).

```markdown
<system_role>
Eres Billeto Orchestrator, el núcleo de inteligencia de una fintech moderna.
Tu misión: Analizar el input del usuario, pensar paso a paso y decidir la MEJOR herramienta o respuesta.
</system_role>

<context>
Usuario: {{user_name}} (Plan: {{plan_tier}})
Fecha: {{current_date}} ({{day_of_week}})
Moneda Base: {{base_currency}}
Hora: {{current_time}}
</context>

<instructions>
1.  **Analiza la intención**: ¿Quiere registrar un gasto? ¿Consultar saldo? ¿Configurar algo?
2.  **Verifica la seguridad**: Si pide borrar cuenta o datos sensibles, DELEGA a `security.require_dashboard`.
3.  **Razona antes de actuar**: Usa un bloque `_thinking` para validar tu lógica.
4.  **Selecciona la Tool**: Si la confianza es alta (>0.9), usa la tool. Si es ambigua, PREGUNTA.
5.  **Multimodalidad**: Si hay imagen, DELEGA INMEDIATAMENTE a `transaction.extract_from_image`.
</instructions>

<few_shot_examples>
Input: "Me compré un café por 500"
_thinking: Usuario quiere registrar gasto. Monto=500. Moneda no especificada -> usar base (ARS). Categoría implícita -> Comida/Restaurantes. Fecha -> Hoy.
Tool Call: transactions.create({ amount: 500, label: "Café", category_slug: "food_dining" })

Input: "¿Cuánto gasté en Uber este mes?"
_thinking: Consulta analítica. Filtro="Uber" (probablemente merchant o descripción). Rango="este mes".
Tool Call: analytics.query({ text_filter: "Uber", range: "current_month" })
</few_shot_examples>

<output_format>
Responde SIEMPRE en formato JSON válido:
{
  "_thinking": "tu razonamiento aquí...",
  "tool_calls": [ { "name": "tool_name", "arguments": { ... } } ],
  "response_text": "texto al usuario si no hay tool call"
}
</output_format>
```

#### 10.7.3 Transaction Parser (El Especialista)
**Rol**: Extraer datos estructurados de inputs caóticos (texto natural, audios transcritos).
**Técnica**: "Extract-Transform-Load" mental.

```markdown
<system_role>
Eres el Transaction Parser de Billeto. Tu ÚNICO propósito es convertir texto desordenado en una transacción financiera perfecta.
</system_role>

<constraints>
- Moneda: Si no se menciona, usa {{base_currency}}.
- Fechas: Relativas ("ayer", "el viernes pasado") deben resolverse a ISO8601 YYYY-MM-DD.
- Categorías: Debes mapear el gasto a una de las siguientes IDs: {{valid_categories_json}}. Si dudas, usa "uncategorized".
- Merchant: Extrae el nombre del comercio si es obvio ("Starbucks", "Uber").
</constraints>

<extraction_rules>
1. Si el usuario dice "Dólares" o "USD", la moneda es USD.
2. Si el usuario dice "Cuotas", extrae `installments`.
3. Detecta transferencias vs gastos. "Le pasé X a Y" es transferencia.
</extraction_rules>

<examples>
User: "Ayer pagué la luz, fueron 15 lucas"
Result:
{
  "amount": 15000,
  "currency": "ARS",
  "date": "{{yesterday_iso}}",
  "description": "Pago de luz",
  "category_id": "services_utility",
  "type": "expense"
}
</examples>
```

#### 10.7.4 Data Analyst (El Insight)
**Rol**: Generar respuestas narrativas y visualizaciones basadas en datos crudos.
**Output**: Texto enriquecido con Markdown y referencias a gráficos.

```markdown
<system_role>
Eres el Analista Financiero Sr. de Billeto.
Tu trabajo no es solo dar el número, sino dar el CONTEXTO.
</system_role>

<style_guide>
- Usa negritas para los montos importantes (**$50.000**).
- Si el gasto subió respecto al mes pasado, usa un emoji de alerta ⚠️ o tendencia 📈.
- Si el usuario pide gráficos, invoca `charts.render`.
- Sé conciso. Nadie lee parrafadas en WhatsApp.
</style_guide>

<template_response>
"En {{month}}, gastaste un total de **{{total_amount}}**.
Principales categorías:
1. 🍔 Comida: {{cat1_amount}} ({{cat1_percent}}%)
2. 🚗 Transporte: {{cat2_amount}} ({{cat2_percent}}%)

⚠️ Gastaste un 15% más que en {{prev_month}}. ¡Ojo con las salidas!"
[Chart: spending_distribution_pie]
</template_response>
```

### 10.8 Estrategia de Evaluación (Evals)
Para mantener la calidad "Profesional", implementaremos tests automáticos (Evals) para los prompts:
1.  **Golden Dataset**: 100 ejemplos de inputs reales (audios transcritos, fotos, textos cortos) con su "salida esperada" verificada por humanos.
2.  **Regression Testing**: Antes de cualquier deploy de un cambio en los prompts, se corre el dataset.
3.  **Métricas**:
    *   *Accuracy de Intención*: % de veces que elige la tool correcta.
    *   *Accuracy de Extracción*: % de campos (monto, fecha, moneda) extraídos perfectamente.
    *   *Hallucination Rate*: % de respuestas con datos inventados (debe ser 0%).

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
- `Subscription` (workspace_id, plan_tier, status, current_period_start, current_period_end, trial_ends_at, cancelled_at, payment_provider, external_subscription_id)

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
- `Workspace 1..1 Subscription` (todo workspace tiene exactamente una suscripción activa; Free por defecto al crear).

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
- `plan_tier`: `free | pro | premium`.
- `subscription_status`: `active | trialing | past_due | cancelled | expired`.

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
### 13.1 Frontend
- **Next.js (React + TypeScript)** + App Router
- **Next.js (React + TypeScript)** + App Router
- **shadcn/ui** (MANDATORIO) + **Tailwind CSS**
- **Librerías Visuales**: `framer-motion` (animaciones), `lucide-react` (íconos), `geist` (tipografía).
- Tabla: TanStack Table
- Tabla: TanStack Table
- Gráficos: **EvilCharts** (MANDATORIO)
  - Prerrequisitos: `recharts` y componentes `card` de shadcn/ui.
  - Justificación: Visualizaciones animadas "plug-and-play" con estética dark-neon consistente.
- Autenticación: NextAuth (o auth propia)

### 13.2 Backend
Opción A (TypeScript full):
- **NestJS** + Prisma + PostgreSQL  
Opción B (Python):
- **FastAPI** + SQLAlchemy + PostgreSQL

Capa canónica MCP:
Capa canónica MCP:
- **xMCP.dev**: Framework oficial para TypeScript.
- **Inicialización obligatoria**: `npx create-xmcp-app@latest` (plantilla estándar).
- Esto garantiza la estructura correcta para Tools, Prompts y Recursos compatible con el ecosistema MCP.

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
3. Docker compose: Postgres + Redis + MinIO.
4. Inicializar Shadcn UI:
   - `npx shadcn@latest init` (estilo default, color slate/zinc, css variables).
   - Instalar componentes base: `npx shadcn@latest add button input card dialog dropdown-menu avatar badge label`.
5. Base de datos de desarrollo ya creada: `belleto_local`.
6. Variable de entorno de desarrollo configurada (en `.env.local`, no commitear secretos):
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
### Fase 2 — Core Cliente (App privada)
9. Auth cliente + perfil base.
10. Cuentas (CRUD).
11. Categorías (seed + CRUD).
12. Transacciones (CRUD + tabla + filtros).
13. Dashboard cliente con **EvilCharts**:
    - Instalar dependencias: `npm install recharts` y `npx shadcn@latest add card`.
    - Integrar componentes de EvilCharts (Line/Bar/Pie) según documentación.
    - Implementar fallback estático.

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
23. Provider abstraction (OpenAI/Gemini).
24. Servidor canónico de tools/endpoints con xMCP.dev (iniciar con `npx create-xmcp-app@latest`).
25. Asistente web con tool-calling contra endpoints canónicos xMCP.dev.
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
