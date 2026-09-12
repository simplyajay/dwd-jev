-- CreateEnum
CREATE TYPE "role" AS ENUM ('administrator', 'user');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "entry_type" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "journal_type" AS ENUM ('crj', 'cdj', 'gj', 'ckdj', 'msij');

-- CreateEnum
CREATE TYPE "document_code" AS ENUM ('po', 'bur', 'or', 'inv', 'ar', 'rcd', 'ris', 'lr');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "role" "role" NOT NULL,
    "position" TEXT NOT NULL,
    "status" "status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_users" (
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "journal_entry_voucher" (
    "id" UUID NOT NULL,
    "journal_type" "journal_type" NOT NULL,
    "jev_number" TEXT NOT NULL,
    "jev_date" DATE NOT NULL,
    "dv_number" TEXT,
    "dv_date" DATE,
    "ada_number" TEXT,
    "ada_date" DATE,
    "check_number" TEXT,
    "check_date" DATE,
    "payee_name" TEXT,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_by" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "journal_entry_voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" UUID NOT NULL,
    "jev_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "entry_type" "entry_type" NOT NULL,
    "amount" BIGINT NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supporting_document_entries" (
    "id" UUID NOT NULL,
    "jev_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "document_number" TEXT NOT NULL,
    "document_code" "document_code" NOT NULL,
    "document_name" TEXT NOT NULL,
    "document_date" DATE NOT NULL,

    CONSTRAINT "supporting_document_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_document_entries" (
    "id" UUID NOT NULL,
    "accounting_entry_id" UUID NOT NULL,
    "document_number" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "entry_type" "entry_type" NOT NULL,
    "amount" BIGINT NOT NULL,

    CONSTRAINT "external_document_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "gso" TEXT,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "pending_users" ADD CONSTRAINT "pending_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_voucher" ADD CONSTRAINT "journal_entry_voucher_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_voucher" ADD CONSTRAINT "journal_entry_voucher_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_voucher" ADD CONSTRAINT "journal_entry_voucher_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_jev_id_fkey" FOREIGN KEY ("jev_id") REFERENCES "journal_entry_voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supporting_document_entries" ADD CONSTRAINT "supporting_document_entries_jev_id_fkey" FOREIGN KEY ("jev_id") REFERENCES "journal_entry_voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_document_entries" ADD CONSTRAINT "external_document_entries_accounting_entry_id_fkey" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
