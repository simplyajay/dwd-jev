-- CreateTable
CREATE TABLE "jev_revisions" (
    "id" UUID NOT NULL,
    "jev_id" UUID NOT NULL,
    "before_data" JSONB NOT NULL,
    "after_data" JSONB NOT NULL,
    "updated_by" UUID NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jev_revisions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "jev_revisions" ADD CONSTRAINT "jev_revisions_jev_id_fkey" FOREIGN KEY ("jev_id") REFERENCES "journal_entry_voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jev_revisions" ADD CONSTRAINT "jev_revisions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
