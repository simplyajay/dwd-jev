// Checks that the hand-written partial unique indexes on JEV document numbers
// still exist. schema.prisma can't express them (they only apply where
// deleted_at IS NULL), so a migration could drop them without any error and
// duplicate numbers would then be accepted. Run after every migration.
import { prisma } from "../src/lib/prisma.js";

const EXPECTED = [
  { name: "jev_jev_number_active_key", column: "jev_number" },
  { name: "jev_dv_number_active_key", column: "dv_number" },
  { name: "jev_ada_number_active_key", column: "ada_number" },
  { name: "jev_check_number_active_key", column: "check_number" },
];

const main = async () => {
  const rows = await prisma.$queryRaw<{ indexname: string; indexdef: string }[]>`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = 'journal_entry_voucher' AND indexname LIKE 'jev_%_active_key'
  `;
  const found = new Map(rows.map((row) => [row.indexname, row.indexdef]));

  const problems = EXPECTED.flatMap(({ name, column }) => {
    const def = found.get(name);
    if (!def) return [`${name} is missing`];

    const isPartialUnique =
      def.startsWith("CREATE UNIQUE INDEX") &&
      def.includes(`(${column})`) &&
      def.includes("WHERE (deleted_at IS NULL)");
    return isPartialUnique ? [] : [`${name} has an unexpected definition: ${def}`];
  });

  if (problems.length > 0) {
    console.error("JEV unique indexes check FAILED:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(`JEV unique indexes OK (${EXPECTED.length}/${EXPECTED.length}).`);
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
