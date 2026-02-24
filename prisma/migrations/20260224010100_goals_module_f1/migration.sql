-- AlterTable
ALTER TABLE "goals"
ADD COLUMN "template_id" TEXT,
ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "goal_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalized_name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "emoji" TEXT,
  "target_amount" DECIMAL(15,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "suggested_months" INTEGER NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "goal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_contributions" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "goal_id" TEXT NOT NULL,
  "transaction_id" TEXT,
  "amount" DECIMAL(15,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "amount_base" DECIMAL(15,2) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'transaction',
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goal_templates_normalized_name_key"
ON "goal_templates"("normalized_name");

-- CreateIndex
CREATE INDEX "goal_templates_category_sort_order_idx"
ON "goal_templates"("category", "sort_order");

-- CreateIndex
CREATE INDEX "goals_workspace_id_status_idx"
ON "goals"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "goals_workspace_id_deadline_idx"
ON "goals"("workspace_id", "deadline");

-- CreateIndex
CREATE INDEX "goals_workspace_id_template_id_idx"
ON "goals"("workspace_id", "template_id");

-- CreateIndex
CREATE INDEX "goal_contributions_workspace_id_goal_id_created_at_idx"
ON "goal_contributions"("workspace_id", "goal_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "goal_contributions_workspace_id_transaction_id_idx"
ON "goal_contributions"("workspace_id", "transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "goal_contributions_goal_id_transaction_id_key"
ON "goal_contributions"("goal_id", "transaction_id");

-- AddForeignKey
ALTER TABLE "goals"
ADD CONSTRAINT "goals_template_id_fkey"
FOREIGN KEY ("template_id") REFERENCES "goal_templates"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions"
ADD CONSTRAINT "goal_contributions_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions"
ADD CONSTRAINT "goal_contributions_goal_id_fkey"
FOREIGN KEY ("goal_id") REFERENCES "goals"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions"
ADD CONSTRAINT "goal_contributions_transaction_id_fkey"
FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
