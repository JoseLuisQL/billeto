# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Descripción del Proyecto

Billeto es una app SaaS de gestión de finanzas personales orientada a Perú (idioma español, moneda PEN por defecto). Incluye registro de transacciones mediante chat con IA, workspaces multi-tenant y dashboard con analíticas.

## Comandos

```bash
npm run dev        # Servidor de desarrollo (compila xmcp, luego ejecuta xmcp dev + next dev en paralelo)
npm run build      # Build de producción (xmcp build && next build)
npm run start      # Iniciar servidor de producción
npm run lint       # ESLint (flat config, Next.js core-web-vitals + TypeScript)
npx prisma migrate dev   # Ejecutar migraciones de base de datos
npx prisma generate      # Regenerar cliente de Prisma
```

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Base de datos**: PostgreSQL vía Prisma 7 con driver adapter `@prisma/adapter-pg`
- **Auth**: NextAuth v5 (beta) con estrategia JWT — Credentials (email/password) + Google OAuth
- **IA**: Vercel AI SDK (paquete `ai`) + Google Gemini 2.5 Flash vía `@ai-sdk/google`
- **UI**: Tailwind CSS v4 + shadcn/ui (estilo new-york) + Radix UI + Lucide icons + Recharts
- **MCP**: Framework xmcp para tools/prompts/resources del servidor MCP (expuesto en `/mcp`)
- **Validación**: Zod v4

## Arquitectura

### Grupos de Rutas y Layouts

- `src/app/(public)/` — Páginas públicas (home, pricing, product, FAQ, etc.) con layout público + header/footer
- `src/app/(auth)/` — Páginas de login y registro con layout de auth
- `src/app/dashboard/` — App autenticada con sidebar shell (`DashboardShell`), envuelta en `SessionProvider`
- `src/app/api/ai/chat/` — Endpoint de chat IA con streaming vía Vercel AI SDK
- `src/app/api/auth/[...nextauth]/` — Route handlers de NextAuth
- `src/app/api/cron/recurring/` — Endpoint cron para transacciones recurrentes
- `src/app/mcp/` — Handler del servidor MCP (xmcp)

### Multi-Tenancy

Los usuarios pertenecen a Workspaces mediante Memberships con roles (`owner`, `admin`, `member`). Todas las consultas están scoped al workspace activo. Usar `requireWorkspaceAccess(minRole)` de `src/lib/security/access.ts` para controlar acceso en server actions y API routes.

### Server Actions (`src/lib/actions/`)

Las mutaciones de datos usan Server Actions de Next.js con la directiva `"use server"`. Cada módulo maneja su propia validación, rate limiting, scoping por workspace y logging de auditoría. Archivos clave:
- `transactions.ts` — CRUD con actualización atómica de balance en cuentas
- `accounts.ts`, `categories.ts`, `recurring.ts`, `rules.ts`
- `charts.ts` — Agregación de datos para gráficos
- `auth.ts` — Lógica de registro

### Soft Deletes

La mayoría de entidades usan campos `deletedAt`/`deletedBy`. Siempre filtrar con `deletedAt: null` en las consultas.

### Seguridad

- **Middleware** (`src/proxy.ts`): Protección de rutas compatible con Edge vía cookie de sesión, rate limiting por IP para endpoints de auth y chat IA
- **Rate limiting**: Ventana deslizante en memoria (`src/lib/security/rate-limit.ts` para server actions, `api-rate-limit.ts` para API routes)
- **Prompt guard** (`src/lib/security/prompt-guard.ts`): Detección de inyección de prompts en el input del chat IA
- **Acceso a workspace** (`src/lib/security/access.ts`): Autorización basada en roles

### Chat IA (`src/app/api/ai/chat/route.ts`)

El endpoint de chat define tools inline (`transactions_create`, `transactions_list`, `accounts_list`, `categories_list`, `analytics_summary`, `analytics_by_category`) que el LLM invoca para gestionar finanzas. La resolución de categoría usa un fallback multi-paso: coincidencia por nombre → motor de reglas → heurísticas por keywords → default "Otros".

### Tools MCP (`src/tools/`)

Tools definidos con xmcp que replican las capacidades del chat IA para clientes MCP externos. Configuración en `xmcp.config.ts`, prompts en `src/prompts/`, resources en `src/resources/`.

### Base de Datos

- Schema: `prisma/schema.prisma` — todos los modelos usan `@@map()` para nombres de tabla en snake_case
- Config: `prisma.config.ts` — estilo Prisma 7, URL del datasource desde variable de entorno `DATABASE_URL`
- Singleton de Prisma client: `src/lib/prisma.ts` (usa adaptador `PrismaPg`, cache global para hot-reload en dev)
- Campos Decimal usan `@db.Decimal(15, 2)` — siempre convertir con `Number()` al serializar

### Alias de Rutas

- `@/*` → `./src/*`
- `@xmcp/*` → `./.xmcp/*` (auto-generado, en gitignore)

### Componentes UI

- Componentes shadcn/ui en `src/components/ui/` (no editar directamente salvo personalización)
- Componentes del dashboard en `src/components/dashboard/`
- Componentes del landing en `src/components/landing/`
- Componentes de layout (Header, Footer) en `src/components/layout/`
- La app usa dark mode por defecto (`<html className="dark">`)

## Convenciones

- Comentarios en código y texto de cara al usuario están en **español**
- La app usa locale de Perú por defecto: moneda PEN, timezone `America/Lima`, formato `es-PE`
- Los nombres de categoría se normalizan (minúsculas, sin acentos) para matching vía `normalizeCategoryName()`
- Las actualizaciones de balance de transacciones deben ser atómicas (usar `prisma.$transaction()`)
- Todas las mutaciones relevantes deben crear entradas en `AuditLog`
