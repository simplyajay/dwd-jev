/*
  Warnings:

  - Added the required column `actor_id` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actor_id" UUID NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();

-- AlterTable
ALTER TABLE "jev_revisions" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();

-- CreateIndex
CREATE INDEX "audit_logs_created_at_id_idx" ON "audit_logs"("created_at", "id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_id_idx" ON "audit_logs"("actor_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_id_idx" ON "audit_logs"("action", "created_at", "id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
