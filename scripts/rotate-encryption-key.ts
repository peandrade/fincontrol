/**
 * Encryption Key Rotation Script
 *
 * This script migrates encrypted data from an old key to a new key.
 * Run this after updating ENCRYPTION_KEY and adding the old key to ENCRYPTION_KEYS_LEGACY.
 *
 * Usage:
 *   npx tsx scripts/rotate-encryption-key.ts [--dry-run] [--model <model>]
 *
 * Options:
 *   --dry-run       Show what would be updated without making changes
 *   --model <name>  Only migrate a specific model (e.g., Transaction, Investment)
 *   --batch <size>  Process records in batches (default: 100)
 *
 * Prerequisites:
 *   1. Add new key to ENCRYPTION_KEY (e.g., v2:new_64_hex_chars)
 *   2. Add old key to ENCRYPTION_KEYS_LEGACY (e.g., v1:old_64_hex_chars)
 *   3. Run this script
 *   4. After successful migration, remove old key from ENCRYPTION_KEYS_LEGACY
 */

import { PrismaClient } from "@prisma/client";
import {
  keyManager,
  reEncrypt,
  needsReEncryption,
  getEncryptionVersion,
  isVersionedEncrypted,
} from "../src/lib/encryption/key-management";
import { ENCRYPTED_FIELDS, type EncryptedModel } from "../src/lib/encryption/field-config";

// ============================================
// Configuration
// ============================================

const prisma = new PrismaClient();

interface MigrationOptions {
  dryRun: boolean;
  targetModel?: EncryptedModel;
  batchSize: number;
}

interface MigrationResult {
  model: string;
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ id: string; error: string }>;
}

// ============================================
// Model Handlers
// ============================================

type ModelHandler = (options: MigrationOptions) => Promise<MigrationResult>;

const modelHandlers: Record<EncryptedModel, ModelHandler> = {
  Transaction: async (options) => migrateModel("Transaction", "transaction", options),
  TransactionTemplate: async (options) => migrateModel("TransactionTemplate", "transactionTemplate", options),
  Investment: async (options) => migrateModel("Investment", "investment", options),
  Operation: async (options) => migrateModel("Operation", "operation", options),
  CreditCard: async (options) => migrateModel("CreditCard", "creditCard", options),
  Invoice: async (options) => migrateModel("Invoice", "invoice", options),
  Purchase: async (options) => migrateModel("Purchase", "purchase", options),
  Budget: async (options) => migrateModel("Budget", "budget", options),
  RecurringExpense: async (options) => migrateModel("RecurringExpense", "recurringExpense", options),
  FinancialGoal: async (options) => migrateModel("FinancialGoal", "financialGoal", options),
  GoalContribution: async (options) => migrateModel("GoalContribution", "goalContribution", options),
};

// ============================================
// Migration Logic
// ============================================

async function migrateModel(
  modelName: EncryptedModel,
  prismaModel: string,
  options: MigrationOptions
): Promise<MigrationResult> {
  const result: MigrationResult = {
    model: modelName,
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const fields = ENCRYPTED_FIELDS[modelName];
  if (!fields || fields.length === 0) {
    console.log(`  No encrypted fields for ${modelName}, skipping`);
    return result;
  }

  // Get the Prisma model dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[prismaModel];
  if (!model) {
    console.error(`  Prisma model ${prismaModel} not found`);
    return result;
  }

  // Count total records
  result.total = await model.count();
  console.log(`  Found ${result.total} ${modelName} records`);

  if (result.total === 0) {
    return result;
  }

  // Process in batches
  let cursor: string | undefined;
  let processed = 0;

  while (processed < result.total) {
    const records = await model.findMany({
      take: options.batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: "asc" },
    });

    if (records.length === 0) break;

    for (const record of records) {
      try {
        const updates: Record<string, string> = {};
        let hasUpdates = false;

        for (const field of fields) {
          const value = record[field.name];

          // Skip null/undefined values
          if (value === null || value === undefined || value === "") {
            continue;
          }

          // Check if it's encrypted and needs re-encryption
          if (isVersionedEncrypted(value) && needsReEncryption(value)) {
            const oldVersion = getEncryptionVersion(value);
            const newValue = reEncrypt(value);
            updates[field.name] = newValue;
            hasUpdates = true;

            if (options.dryRun) {
              console.log(`    Would re-encrypt ${modelName}.${field.name} (id: ${record.id}) from ${oldVersion}`);
            }
          }
        }

        if (hasUpdates) {
          if (!options.dryRun) {
            await model.update({
              where: { id: record.id },
              data: updates,
            });
          }
          result.migrated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          id: record.id,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`    Error migrating ${modelName} ${record.id}:`, error);
      }

      processed++;
    }

    cursor = records[records.length - 1]?.id;

    // Progress update
    const progress = Math.round((processed / result.total) * 100);
    process.stdout.write(`\r  Progress: ${progress}% (${processed}/${result.total})`);
  }

  console.log(); // New line after progress

  return result;
}

// ============================================
// Main Script
// ============================================

async function main() {
  console.log("========================================");
  console.log("Encryption Key Rotation Script");
  console.log("========================================\n");

  // Parse arguments
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: args.includes("--dry-run"),
    batchSize: 100,
  };

  // Parse --model option
  const modelIndex = args.indexOf("--model");
  if (modelIndex !== -1 && args[modelIndex + 1]) {
    const modelName = args[modelIndex + 1] as EncryptedModel;
    if (modelName in ENCRYPTED_FIELDS) {
      options.targetModel = modelName;
    } else {
      console.error(`Unknown model: ${modelName}`);
      console.error(`Valid models: ${Object.keys(ENCRYPTED_FIELDS).join(", ")}`);
      process.exit(1);
    }
  }

  // Parse --batch option
  const batchIndex = args.indexOf("--batch");
  if (batchIndex !== -1 && args[batchIndex + 1]) {
    const batchSize = parseInt(args[batchIndex + 1]);
    if (!isNaN(batchSize) && batchSize > 0) {
      options.batchSize = batchSize;
    }
  }

  if (options.dryRun) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  // Verify key configuration
  console.log("Checking key configuration...");
  if (!keyManager.hasAnyKey()) {
    console.error("ERROR: No encryption keys configured");
    console.error("Set ENCRYPTION_KEY environment variable");
    process.exit(1);
  }

  const versions = keyManager.getAvailableVersions();
  console.log(`  Available key versions: ${versions.join(", ")}`);

  try {
    const { version } = keyManager.getCurrentKey();
    console.log(`  Current key version: ${version}`);
  } catch (error) {
    console.error("ERROR: Failed to get current key");
    process.exit(1);
  }

  console.log();

  // Run migration
  const results: MigrationResult[] = [];
  const modelsToMigrate = options.targetModel
    ? [options.targetModel]
    : (Object.keys(ENCRYPTED_FIELDS) as EncryptedModel[]);

  for (const model of modelsToMigrate) {
    console.log(`Migrating ${model}...`);
    const handler = modelHandlers[model];
    if (handler) {
      const result = await handler(options);
      results.push(result);
    }
    console.log();
  }

  // Print summary
  console.log("========================================");
  console.log("Migration Summary");
  console.log("========================================");

  let totalMigrated = 0;
  let totalErrors = 0;

  for (const result of results) {
    console.log(`\n${result.model}:`);
    console.log(`  Total: ${result.total}`);
    console.log(`  Migrated: ${result.migrated}`);
    console.log(`  Skipped: ${result.skipped}`);
    console.log(`  Errors: ${result.errors}`);

    totalMigrated += result.migrated;
    totalErrors += result.errors;

    if (result.errorDetails.length > 0) {
      console.log("  Error details:");
      for (const detail of result.errorDetails.slice(0, 5)) {
        console.log(`    - ${detail.id}: ${detail.error}`);
      }
      if (result.errorDetails.length > 5) {
        console.log(`    ... and ${result.errorDetails.length - 5} more errors`);
      }
    }
  }

  console.log("\n========================================");
  console.log(`Total migrated: ${totalMigrated}`);
  console.log(`Total errors: ${totalErrors}`);

  if (options.dryRun) {
    console.log("\nThis was a DRY RUN. Run without --dry-run to apply changes.");
  } else if (totalErrors > 0) {
    console.log("\nMigration completed with errors. Review the errors above.");
    process.exit(1);
  } else {
    console.log("\nMigration completed successfully!");
    console.log("You can now remove the old key from ENCRYPTION_KEYS_LEGACY.");
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
