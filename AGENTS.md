# AGENTS.md — BILLETO

Este archivo define cómo debe trabajar cualquier agente de IA en este proyecto durante el vibecoding del MVP.
Fuente funcional principal: `./prd.md`.

## 1) Objetivo del proyecto (MVP)
Construir BILLETO para rol **Cliente** con:
- Frontend público (landing + auth)
- App privada cliente (asistente, dashboard, transacciones, cuentas, presupuestos, metas, herramientas)
- Integración WhatsApp, correo forwarding, webhook, GasTag, Vaquitas
- IA multi-proveedor (OpenAI/Gemini/OpenAI-compatible)
- Capa canónica xMCP como única vía de operaciones de dominio

## 2) Reglas de alcance (NO romper)
- Implementar solo alcance Cliente definido en `prd.md`.
- No construir backoffice/admin en MVP.
- No escribir directo a DB desde agentes/canales; todo vía endpoints canónicos xMCP.
- Mantener diseño dark-neon consistente en frontend.

## 3) Arquitectura obligatoria
- Canales: Web Assistant + WhatsApp Adapter.
- Orquestación IA: agentes especializados (transactions, analytics, settings, accounts, automation).
- Capa canónica: `xmcp-server` + `xmcp-policy-layer`.
- Persistencia: PostgreSQL (+ Redis + storage S3-compatible según fase).

## 4) Contratos funcionales críticos
- WhatsApp:
  - Vinculación 1:1 `workspace/user <-> wa_phone`.
  - Mensajes soportados: texto, audio, imagen, PDF.
  - Multi-turn para datos faltantes.
  - Acciones sensibles: redirigir a dashboard.
- Idempotencia:
  - Toda mutación usa `request_id`.
  - Duplicados deben retornar respuesta idempotente, no duplicar filas.

## 5) Modelo de datos y seguridad de datos (obligatorio)
- Multi-tenant estricto: todas las tablas de negocio con `workspace_id` obligatorio.
- Constraints críticos:
  - Unicidad `(workspace_id, request_id, action_name)` para mutaciones.
  - Unicidad de vínculo WhatsApp conectado por número.
  - FK de transacciones/cuentas/categorías/integraciones válidas.
- Soft delete: `Account`, `Category`, `Transaction`, `Rule`, `RecurringTransaction`, `Budget`, `Goal`, `Integration`.
- Hard delete solo para expirados temporales (attachments/mensajes según retención).
- `AuditLog` obligatorio en toda mutación.

## 6) Enums mínimos (mantener consistencia)
- `transaction_type`: `expense | income | transfer`
- `transaction_status`: `posted | pending | voided`
- `integration_type`: `whatsapp | email_forwarding | webhook | bank_email`
- `integration_status`: `pending | connected | error | paused | revoked`
- `recurring_status`: `active | paused | finished`
- `account_type`: `bank | cash | wallet`

## 7) Orden recomendado de implementación (por fases)
1. Setup base (repo, lint, typecheck, test, CI)
2. Frontend público + auth
3. Core cliente (cuentas, categorías, transacciones, dashboard)
4. Automatización (reglas, recurrentes, presupuestos, metas)
5. Herramientas (WhatsApp/correo/webhook/GasTag/Vaquitas)
6. IA + xMCP + WhatsApp NLU
7. Perfil/config/seguridad/pulido

## 8) Convenciones de desarrollo
- Cambios pequeños y atómicos por tarea.
- No mezclar refactors no solicitados con features.
- Mantener naming y estructura coherentes con código existente.
- No agregar librerías nuevas sin justificar necesidad.

## 9) Criterio de calidad obligatorio antes de cerrar tareas
Si existen scripts/proyecto ejecutable, correr siempre:
- Lint
- Typecheck
- Tests unitarios/integración relevantes
Corregir errores antes de marcar tarea como terminada.

## 10) Criterio de Done (MVP por feature)
Una feature se considera done solo si:
- Cumple criterios de aceptación del `prd.md`
- Respeta seguridad, auditoría e idempotencia
- Tiene validación funcional (tests o evidencia de ejecución)
- No rompe flujos existentes

## 11) Reglas de seguridad para agentes
- Nunca exponer secretos/tokens/keys en logs o commits.
- No almacenar PII innecesaria de WhatsApp.
- Acciones sensibles requieren confirmación explícita y/o dashboard.
- Aplicar límites/rate-limit donde corresponda.

## 12) Instrucciones de ejecución para agentes
- Antes de codificar: leer `./prd.md` y este `AGENTS.md`.
- Si hay ambigüedad de producto, priorizar `prd.md`.
- Si una decisión cambia alcance o seguridad, detener y pedir confirmación.
- Entregar siempre resumen breve: qué se cambió, cómo se validó, riesgos pendientes.
