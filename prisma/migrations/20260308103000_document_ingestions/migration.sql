CREATE TABLE "document_ingestions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "file_name" TEXT,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "signature" TEXT,
    "document_kind" TEXT,
    "merchant_name" TEXT,
    "reference_number" TEXT,
    "issue_date" TIMESTAMP(3),
    "currency" TEXT,
    "total_amount" DECIMAL(15,2),
    "transaction_type" TEXT,
    "suggested_description" TEXT,
    "suggested_category_name" TEXT,
    "suggested_account_name" TEXT,
    "confidence" DOUBLE PRECISION,
    "duplicate_of_ingestion_id" TEXT,
    "duplicate_of_transaction_id" TEXT,
    "rejection_reason" TEXT,
    "provider_slug" TEXT,
    "model_id" TEXT,
    "extracted_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_ingestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_ingestions_workspace_id_status_created_at_idx"
ON "document_ingestions"("workspace_id", "status", "created_at" DESC);

CREATE INDEX "document_ingestions_workspace_id_content_hash_idx"
ON "document_ingestions"("workspace_id", "content_hash");

CREATE INDEX "document_ingestions_workspace_id_signature_created_at_idx"
ON "document_ingestions"("workspace_id", "signature", "created_at" DESC);

CREATE INDEX "document_ingestions_workspace_id_user_id_created_at_idx"
ON "document_ingestions"("workspace_id", "user_id", "created_at" DESC);
