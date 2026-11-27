-- Uniqueness for jev_number, dv_number, ada_number, check_number is enforced
-- only among non-deleted rows -- Prisma can't express partial indexes in
-- schema.prisma, so these are hand-written. Names must match the `targets`
-- entries in JEV_UNIQUE_FIELDS (apps/backend/src/repositories/JevRepository.ts)
-- so P2002 errors translate to the right field.
CREATE UNIQUE INDEX "jev_jev_number_active_key" ON "journal_entry_voucher" ("jev_number") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "jev_dv_number_active_key" ON "journal_entry_voucher" ("dv_number") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "jev_ada_number_active_key" ON "journal_entry_voucher" ("ada_number") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "jev_check_number_active_key" ON "journal_entry_voucher" ("check_number") WHERE "deleted_at" IS NULL;
