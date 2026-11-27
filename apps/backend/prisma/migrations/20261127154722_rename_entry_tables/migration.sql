-- Hand-written: renames only, so existing rows are kept. Prisma's generated
-- version dropped and re-created both tables.
BEGIN;

-- supporting_document_entries -> supporting_documents
ALTER TABLE "supporting_document_entries" RENAME TO "supporting_documents";
ALTER TABLE "supporting_documents" RENAME CONSTRAINT "supporting_document_entries_pkey" TO "supporting_documents_pkey";
ALTER TABLE "supporting_documents" RENAME CONSTRAINT "supporting_document_entries_jev_id_fkey" TO "supporting_documents_jev_id_fkey";

-- external_document_entries -> explanations
ALTER TABLE "external_document_entries" RENAME TO "explanations";
ALTER TABLE "explanations" RENAME CONSTRAINT "external_document_entries_pkey" TO "explanations_pkey";
ALTER TABLE "explanations" RENAME CONSTRAINT "external_document_entries_accounting_entry_id_fkey" TO "explanations_accounting_entry_id_fkey";
ALTER TABLE "explanations" RENAME COLUMN "document_number" TO "reference";
ALTER TABLE "explanations" RENAME COLUMN "document_name" TO "description";

-- Postgres 18+ names NOT NULL constraints {table}_{column}_not_null; renaming a
-- table or column doesn't rename them. Older versions have none, so this is a no-op.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conrelid::regclass::text AS tbl, con.conname, a.attname
    FROM pg_constraint con
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
    WHERE con.contype = 'n'
      AND con.conrelid IN ('supporting_documents'::regclass, 'explanations'::regclass)
  LOOP
    EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
      c.tbl, c.conname, c.tbl || '_' || c.attname || '_not_null');
  END LOOP;
END $$;

-- Stored revision snapshots use the API's JSON keys; rename them to match.
CREATE FUNCTION "rename_jev_snapshot_keys"(snapshot jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN snapshot IS NULL THEN NULL ELSE
    (snapshot - 'supportingDocumentEntries' - 'accountingEntries')
    || CASE WHEN snapshot ? 'supportingDocumentEntries'
         THEN jsonb_build_object('supportingDocuments', snapshot -> 'supportingDocumentEntries')
         ELSE '{}'::jsonb END
    || CASE WHEN snapshot ? 'accountingEntries'
         THEN jsonb_build_object('accountingEntries', (
           SELECT coalesce(jsonb_agg(
             (entry - 'externalDocumentEntries')
             || jsonb_build_object('explanations', (
               SELECT coalesce(jsonb_agg(
                 (doc - 'documentNumber' - 'documentName')
                 || jsonb_build_object(
                   'reference', doc -> 'documentNumber',
                   'description', doc -> 'documentName')
                 ORDER BY doc_ord), '[]'::jsonb)
               FROM jsonb_array_elements(coalesce(entry -> 'externalDocumentEntries', '[]'::jsonb))
                 WITH ORDINALITY AS d(doc, doc_ord)))
             ORDER BY entry_ord), '[]'::jsonb)
           FROM jsonb_array_elements(snapshot -> 'accountingEntries')
             WITH ORDINALITY AS e(entry, entry_ord)))
         ELSE '{}'::jsonb END
  END
$$;

UPDATE "jev_revisions" SET
  "before_data" = "rename_jev_snapshot_keys"("before_data"),
  "after_data" = "rename_jev_snapshot_keys"("after_data");

DROP FUNCTION "rename_jev_snapshot_keys"(jsonb);

COMMIT;
