-- Hardening constraints: idempotencia transacciones + unicidad WhatsApp connected

-- 1) Idempotencia por workspace + request_id (solo cuando request_id no es null)
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_workspace_id_request_id_unique"
ON "transactions"("workspace_id", "request_id")
WHERE "request_id" IS NOT NULL;

-- 2) Unicidad global de wa_phone_e164 solo para integraciones WhatsApp conectadas
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_wa_phone_connected_unique"
ON "integrations"("wa_phone_e164")
WHERE "type" = 'whatsapp'
  AND "status" = 'connected'
  AND "deleted_at" IS NULL
  AND "wa_phone_e164" IS NOT NULL;
