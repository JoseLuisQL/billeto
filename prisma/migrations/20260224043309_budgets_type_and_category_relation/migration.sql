-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "budget_type" TEXT NOT NULL DEFAULT 'fixed';

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
