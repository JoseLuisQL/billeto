-- AlterTable
ALTER TABLE "categories"
ADD COLUMN "owner_user_id" TEXT NOT NULL DEFAULT '__SYSTEM__';

-- Backfill (safety for existing rows)
UPDATE "categories"
SET "owner_user_id" = '__SYSTEM__'
WHERE "owner_user_id" IS NULL OR "owner_user_id" = '';

-- Drop old uniqueness and add scoped uniqueness
DROP INDEX IF EXISTS "categories_workspace_id_normalized_name_key";

CREATE UNIQUE INDEX "categories_workspace_id_normalized_name_owner_user_id_key"
ON "categories"("workspace_id", "normalized_name", "owner_user_id");

CREATE INDEX "categories_workspace_id_owner_user_id_idx"
ON "categories"("workspace_id", "owner_user_id");
