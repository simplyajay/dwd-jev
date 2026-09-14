/*
  Warnings:

  - You are about to drop the `pending_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pending_users" DROP CONSTRAINT "pending_users_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" UUID,
ALTER COLUMN "status" SET DEFAULT 'awaiting_approval';

-- DropTable
DROP TABLE "pending_users";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
