import { Prisma } from "@prisma/client";
import { DOCUMENT_CODE_LABELS } from "@dwd-jev/shared";
import { prisma } from "../lib/prisma.js";
import type { Tx } from "../lib/transaction.js";
import { toJsonSafe } from "../utils/jsonSafe.js";
import { withUniqueConflict, type UniqueFieldMap } from "../utils/prismaErrors.js";
import type { CreateJevInput, JournalType } from "@dwd-jev/shared";

const JEV_FULL_INCLUDE = {
  accountingEntries: {
    include: { externalDocumentEntries: true },
    orderBy: { sortOrder: "asc" },
  },
  supportingDocumentEntries: {
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.JevInclude;

export type JevWithRelations = Prisma.JevGetPayload<{ include: typeof JEV_FULL_INCLUDE }>;

// jevDate is still a Date here; JevService formats it.
export interface JevListItemRow {
  id: string;
  jevNumber: string;
  journalType: JournalType;
  jevDate: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

const centsFromPesos = (pesos: number): bigint => BigInt(Math.round(pesos * 100));

// Partial unique indexes (deleted_at IS NULL); targets lists their names.
const JEV_UNIQUE_FIELDS: UniqueFieldMap = {
  jevNumber: {
    label: "JEV number",
    targets: ["jev_number", "jev_jev_number_active_key"],
  },
  dvNumber: {
    label: "DV number",
    targets: ["dv_number", "jev_dv_number_active_key"],
  },
  adaNumber: {
    label: "ADA number",
    targets: ["ada_number", "jev_ada_number_active_key"],
  },
  checkNumber: {
    label: "Check number",
    targets: ["check_number", "jev_check_number_active_key"],
  },
};

type ValidatedAccountingEntry = CreateJevInput["accountingEntries"][number];

// Optional in the schema only because superRefine enforces them; always
// present after validation.
const buildAccountingEntriesCreate = (entries: ValidatedAccountingEntry[]) =>
  entries.map((entry, index) => {
    const entryType = entry.entryType!;
    const amount = entry.amount!;

    return {
      sortOrder: index,
      accountCode: entry.accountCode,
      accountName: entry.accountName,
      entryType,
      amount: centsFromPesos(amount),
      // External documents inherit the parent's entryType.
      externalDocumentEntries: {
        create: entry.externalDocumentEntries.map((doc) => ({
          documentNumber: doc.documentNumber,
          documentName: doc.documentName,
          entryType,
          amount: centsFromPesos(doc.amount!),
        })),
      },
    };
  });

const buildSupportingDocumentsCreate = (docs: CreateJevInput["supportingDocuments"]) =>
  (docs ?? []).map((doc, index) => ({
    sortOrder: index,
    documentNumber: doc.documentNumber,
    documentCode: doc.documentCode,
    documentName: DOCUMENT_CODE_LABELS[doc.documentCode],
    documentDate: doc.documentDate,
  }));

const buildJevScalarData = (data: CreateJevInput) => ({
  journalType: data.journalType,
  jevNumber: data.jevNumber,
  jevDate: data.jevDate,
  dvNumber: "dvNumber" in data ? data.dvNumber : null,
  dvDate: "dvDate" in data ? data.dvDate : null,
  adaNumber: "adaNumber" in data ? data.adaNumber : null,
  adaDate: "adaDate" in data ? data.adaDate : null,
  checkNumber: "checkNumber" in data ? data.checkNumber : null,
  checkDate: "checkDate" in data ? data.checkDate : null,
  payeeName: ("payeeName" in data ? data.payeeName : null) ?? null,
  description: data.description,
});

export interface IJevRepository {
  create(data: CreateJevInput, createdBy: string): Promise<JevWithRelations>;
  findById(id: string): Promise<JevWithRelations | null>;
  findMany(
    range: DateRange,
    pagination: Pagination,
    searchKeyword?: string,
  ): Promise<{ items: JevListItemRow[]; total: number }>;
  // Locks the active row until tx ends; false if missing or deleted.
  lockActive(id: string, tx: Tx): Promise<boolean>;
  // update and softDelete expect the caller to hold lockActive's lock.
  update(
    id: string,
    data: CreateJevInput,
    updatedBy: string,
    tx: Tx,
  ): Promise<JevWithRelations>;
  softDelete(id: string, deletedBy: string, tx: Tx): Promise<JevWithRelations>;
}

export class PrismaJevRepository implements IJevRepository {
  create(data: CreateJevInput, createdBy: string): Promise<JevWithRelations> {
    return withUniqueConflict(JEV_UNIQUE_FIELDS, () =>
      prisma.jev.create({
        data: {
          ...buildJevScalarData(data),
          createdBy,
          lastUpdatedBy: createdBy,
          accountingEntries: {
            create: buildAccountingEntriesCreate(data.accountingEntries),
          },
          supportingDocumentEntries: {
            create: buildSupportingDocumentsCreate(data.supportingDocuments),
          },
        },
        include: JEV_FULL_INCLUDE,
      }),
    );
  }

  findById(id: string): Promise<JevWithRelations | null> {
    return prisma.jev.findFirst({
      where: { id, deletedAt: null },
      include: JEV_FULL_INCLUDE,
    });
  }

  async findMany(
    range: DateRange,
    pagination: Pagination,
    searchKeyword?: string,
  ): Promise<{ items: JevListItemRow[]; total: number }> {
    const where: Prisma.JevWhereInput = {
      deletedAt: null,
      jevDate: { gte: range.startDate, lte: range.endDate },
      ...(searchKeyword
        ? {
            OR: [
              { jevNumber: { contains: searchKeyword, mode: "insensitive" } },
              { description: { contains: searchKeyword, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.jev.findMany({
        where,
        select: { id: true, jevNumber: true, journalType: true, jevDate: true },
        orderBy: { jevDate: "desc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.jev.count({ where }),
    ]);

    return { items, total };
  }

  async lockActive(id: string, tx: Tx): Promise<boolean> {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM journal_entry_voucher
      WHERE id = ${id}::uuid AND deleted_at IS NULL
      FOR UPDATE
    `;
    return rows.length > 0;
  }

  update(
    id: string,
    data: CreateJevInput,
    updatedBy: string,
    tx: Tx,
  ): Promise<JevWithRelations> {
    return withUniqueConflict(JEV_UNIQUE_FIELDS, async () => {
      const before = await tx.jev.findUniqueOrThrow({
        where: { id },
        include: JEV_FULL_INCLUDE,
      });

      // Cascades to externalDocumentEntries via the FK's onDelete: Cascade.
      await tx.accountingEntry.deleteMany({ where: { jevId: id } });
      await tx.supportingDocumentEntry.deleteMany({ where: { jevId: id } });

      const after = await tx.jev.update({
        where: { id },
        data: {
          ...buildJevScalarData(data),
          lastUpdatedBy: updatedBy,
          accountingEntries: {
            create: buildAccountingEntriesCreate(data.accountingEntries),
          },
          supportingDocumentEntries: {
            create: buildSupportingDocumentsCreate(data.supportingDocuments),
          },
        },
        include: JEV_FULL_INCLUDE,
      });

      await tx.jevRevision.create({
        data: {
          jevId: id,
          beforeData: toJsonSafe(before) as Prisma.InputJsonValue,
          afterData: toJsonSafe(after) as Prisma.InputJsonValue,
          updatedBy,
        },
      });

      return after;
    });
  }

  softDelete(id: string, deletedBy: string, tx: Tx): Promise<JevWithRelations> {
    return tx.jev.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
      include: JEV_FULL_INCLUDE,
    });
  }
}
