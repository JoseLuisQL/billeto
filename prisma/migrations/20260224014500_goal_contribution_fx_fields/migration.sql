-- AlterTable
ALTER TABLE "goal_contributions"
ADD COLUMN "source_amount" DECIMAL(15,2),
ADD COLUMN "sourceCurrency" TEXT,
ADD COLUMN "exchange_rate" DECIMAL(18,8);
