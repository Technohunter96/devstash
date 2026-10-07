-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "stripe_price_id" TEXT;
