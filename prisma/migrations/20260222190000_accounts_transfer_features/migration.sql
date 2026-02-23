-- AlterTable
ALTER TABLE "accounts"
ADD COLUMN "icon" TEXT,
ADD COLUMN "account_number" TEXT,
ADD COLUMN "is_favorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "favorite_rank" INTEGER;

-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "transfer_group_id" TEXT,
ADD COLUMN "transfer_peer_account_id" TEXT;

-- CreateIndex
CREATE INDEX "accounts_workspace_id_is_favorite_favorite_rank_idx"
ON "accounts"("workspace_id", "is_favorite", "favorite_rank");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_transfer_group_id_idx"
ON "transactions"("workspace_id", "transfer_group_id");
