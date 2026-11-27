-- DropForeignKey
ALTER TABLE "journal_entry_voucher" DROP CONSTRAINT "journal_entry_voucher_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_approved_by_fkey";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_voucher" ADD CONSTRAINT "journal_entry_voucher_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
