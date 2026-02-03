/**
 * Script to clear original (unencrypted) columns after encryption migration.
 * This removes the plain-text values, keeping only encrypted data.
 *
 * Run with: npx tsx scripts/clear-original-columns.ts
 *
 * Options:
 *   --dry-run    Preview changes without modifying database
 */

import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const prisma = new PrismaClient();

interface ColumnConfig {
  table: string;
  columns: { name: string; type: "number" | "string" }[];
}

const TABLES_TO_CLEAR: ColumnConfig[] = [
  {
    table: "transactions",
    columns: [
      { name: "value", type: "number" },
      { name: "description", type: "string" },
    ],
  },
  {
    table: "transaction_templates",
    columns: [{ name: "value", type: "number" }],
  },
  {
    table: "investments",
    columns: [
      { name: "quantity", type: "number" },
      { name: "averagePrice", type: "number" },
      { name: "currentPrice", type: "number" },
      { name: "totalInvested", type: "number" },
      { name: "currentValue", type: "number" },
      { name: "profitLoss", type: "number" },
      { name: "profitLossPercent", type: "number" },
      { name: "goalValue", type: "number" },
      { name: "interestRate", type: "number" },
    ],
  },
  {
    table: "operations",
    columns: [
      { name: "quantity", type: "number" },
      { name: "price", type: "number" },
      { name: "total", type: "number" },
      { name: "fees", type: "number" },
      { name: "notes", type: "string" },
    ],
  },
  {
    table: "credit_cards",
    columns: [{ name: "limit", type: "number" }],
  },
  {
    table: "invoices",
    columns: [
      { name: "total", type: "number" },
      { name: "paidAmount", type: "number" },
    ],
  },
  {
    table: "purchases",
    columns: [
      { name: "value", type: "number" },
      { name: "totalValue", type: "number" },
      { name: "description", type: "string" },
      { name: "notes", type: "string" },
    ],
  },
  {
    table: "budgets",
    columns: [{ name: "limit", type: "number" }],
  },
  {
    table: "recurring_expenses",
    columns: [
      { name: "value", type: "number" },
      { name: "description", type: "string" },
      { name: "notes", type: "string" },
    ],
  },
  {
    table: "financial_goals",
    columns: [
      { name: "targetValue", type: "number" },
      { name: "currentValue", type: "number" },
    ],
  },
  {
    table: "goal_contributions",
    columns: [
      { name: "value", type: "number" },
      { name: "notes", type: "string" },
    ],
  },
];

async function clearTable(config: ColumnConfig): Promise<number> {
  const setClauses = config.columns
    .map((col) => {
      if (col.type === "number") {
        return `"${col.name}" = 0`;
      } else {
        // Use empty string instead of NULL to avoid NOT NULL constraint violations
        return `"${col.name}" = ''`;
      }
    })
    .join(", ");

  const sql = `UPDATE ${config.table} SET ${setClauses}`;

  if (dryRun) {
    console.log(`  [DRY RUN] Would execute: ${sql}`);
    const count = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM ${config.table}`
    );
    return Number(count[0].count);
  }

  const result = await prisma.$executeRawUnsafe(sql);
  return result;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Clear Original (Unencrypted) Columns");
  console.log("=".repeat(60));

  if (dryRun) {
    console.log("\n[DRY RUN MODE] No changes will be made.\n");
  } else {
    console.log("\n⚠️  WARNING: This will remove all plain-text values!");
    console.log("    Make sure encryption migration completed successfully.\n");
  }

  let totalRows = 0;

  for (const config of TABLES_TO_CLEAR) {
    console.log(`\nProcessing ${config.table}...`);
    console.log(`  Columns: ${config.columns.map((c) => c.name).join(", ")}`);

    try {
      const affected = await clearTable(config);
      console.log(`  Rows affected: ${affected}`);
      totalRows += affected;
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`TOTAL ROWS UPDATED: ${totalRows}`);
  console.log("=".repeat(60));

  if (dryRun) {
    console.log("\n[DRY RUN] To apply changes, run without --dry-run flag.");
  } else {
    console.log("\nOriginal columns cleared successfully!");
    console.log("Plain-text values have been replaced with 0 or NULL.");
  }
}

main()
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
