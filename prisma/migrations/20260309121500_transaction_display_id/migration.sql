CREATE SEQUENCE "transactions_display_id_seq";

ALTER TABLE "transactions"
ADD COLUMN "display_id" INTEGER;

ALTER TABLE "transactions"
ALTER COLUMN "display_id" SET DEFAULT nextval('transactions_display_id_seq');

UPDATE "transactions"
SET "display_id" = nextval('transactions_display_id_seq')
WHERE "display_id" IS NULL;

SELECT setval(
  'transactions_display_id_seq',
  COALESCE((SELECT MAX("display_id") FROM "transactions"), 1),
  true
);

ALTER SEQUENCE "transactions_display_id_seq"
OWNED BY "transactions"."display_id";

ALTER TABLE "transactions"
ALTER COLUMN "display_id" SET NOT NULL;

CREATE UNIQUE INDEX "transactions_display_id_key"
ON "transactions"("display_id");
