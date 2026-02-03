/**
 * Migration script to encrypt existing data in the database.
 *
 * This script:
 * 1. Reads all records from each model that has sensitive fields
 * 2. Encrypts the sensitive values
 * 3. Stores them in the new encrypted columns
 * 4. Verifies the encryption by decrypting and comparing
 *
 * Run with: npx ts-node scripts/migrate-encryption.ts
 *
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --verify     Only verify existing encrypted data (no migration)
 *   --batch=N    Process N records at a time (default: 100)
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verifyOnly = args.includes("--verify");
const batchArg = args.find((a) => a.startsWith("--batch="));
const batchSize = batchArg ? parseInt(batchArg.split("=")[1]) : 100;

// Initialize Prisma
const prisma = new PrismaClient();

// Encryption config
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SEPARATOR = ":";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (keyHex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${keyHex.length} characters.`
    );
  }

  return Buffer.from(keyHex, "hex");
}

function encrypt(value: number | string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = String(value);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(SEPARATOR);
}

function decrypt(encrypted: string): string {
  const key = getKey();
  const [ivHex, tagHex, dataHex] = encrypted.split(SEPARATOR);

  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

  return decrypted.toString("utf8");
}

function isEncrypted(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const parts = value.split(SEPARATOR);
  if (parts.length !== 3) {
    return false;
  }

  const [iv, tag, data] = parts;

  if (iv.length !== 32 || !/^[0-9a-f]+$/i.test(iv)) {
    return false;
  }

  if (tag.length !== 32 || !/^[0-9a-f]+$/i.test(tag)) {
    return false;
  }

  if (data.length === 0 || !/^[0-9a-f]+$/i.test(data)) {
    return false;
  }

  return true;
}

// Model configurations
interface FieldConfig {
  original: string;
  encrypted: string;
  type: "number" | "string";
}

interface ModelConfig {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  fields: FieldConfig[];
}

function getModelConfigs(): ModelConfig[] {
  return [
    {
      name: "Transaction",
      model: prisma.transaction,
      fields: [
        { original: "value", encrypted: "encryptedValue", type: "number" },
        { original: "description", encrypted: "encryptedDescription", type: "string" },
      ],
    },
    {
      name: "TransactionTemplate",
      model: prisma.transactionTemplate,
      fields: [
        { original: "value", encrypted: "encryptedValue", type: "number" },
      ],
    },
    {
      name: "Investment",
      model: prisma.investment,
      fields: [
        { original: "quantity", encrypted: "encryptedQuantity", type: "number" },
        { original: "averagePrice", encrypted: "encryptedAveragePrice", type: "number" },
        { original: "currentPrice", encrypted: "encryptedCurrentPrice", type: "number" },
        { original: "totalInvested", encrypted: "encryptedTotalInvested", type: "number" },
        { original: "currentValue", encrypted: "encryptedCurrentValue", type: "number" },
        { original: "profitLoss", encrypted: "encryptedProfitLoss", type: "number" },
        { original: "profitLossPercent", encrypted: "encryptedProfitLossPercent", type: "number" },
        { original: "goalValue", encrypted: "encryptedGoalValue", type: "number" },
        { original: "interestRate", encrypted: "encryptedInterestRate", type: "number" },
      ],
    },
    {
      name: "Operation",
      model: prisma.operation,
      fields: [
        { original: "quantity", encrypted: "encryptedQuantity", type: "number" },
        { original: "price", encrypted: "encryptedPrice", type: "number" },
        { original: "total", encrypted: "encryptedTotal", type: "number" },
        { original: "fees", encrypted: "encryptedFees", type: "number" },
        { original: "notes", encrypted: "encryptedNotes", type: "string" },
      ],
    },
    {
      name: "CreditCard",
      model: prisma.creditCard,
      fields: [
        { original: "limit", encrypted: "encryptedLimit", type: "number" },
      ],
    },
    {
      name: "Invoice",
      model: prisma.invoice,
      fields: [
        { original: "total", encrypted: "encryptedTotal", type: "number" },
        { original: "paidAmount", encrypted: "encryptedPaidAmount", type: "number" },
      ],
    },
    {
      name: "Purchase",
      model: prisma.purchase,
      fields: [
        { original: "value", encrypted: "encryptedValue", type: "number" },
        { original: "totalValue", encrypted: "encryptedTotalValue", type: "number" },
        { original: "description", encrypted: "encryptedDescription", type: "string" },
        { original: "notes", encrypted: "encryptedNotes", type: "string" },
      ],
    },
    {
      name: "Budget",
      model: prisma.budget,
      fields: [
        { original: "limit", encrypted: "encryptedLimit", type: "number" },
      ],
    },
    {
      name: "RecurringExpense",
      model: prisma.recurringExpense,
      fields: [
        { original: "value", encrypted: "encryptedValue", type: "number" },
        { original: "description", encrypted: "encryptedDescription", type: "string" },
        { original: "notes", encrypted: "encryptedNotes", type: "string" },
      ],
    },
    {
      name: "FinancialGoal",
      model: prisma.financialGoal,
      fields: [
        { original: "targetValue", encrypted: "encryptedTargetValue", type: "number" },
        { original: "currentValue", encrypted: "encryptedCurrentValue", type: "number" },
      ],
    },
    {
      name: "GoalContribution",
      model: prisma.goalContribution,
      fields: [
        { original: "value", encrypted: "encryptedValue", type: "number" },
        { original: "notes", encrypted: "encryptedNotes", type: "string" },
      ],
    },
  ];
}

interface MigrationStats {
  model: string;
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  verified: number;
  verificationErrors: number;
}

async function migrateModel(config: ModelConfig): Promise<MigrationStats> {
  const stats: MigrationStats = {
    model: config.name,
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    verified: 0,
    verificationErrors: 0,
  };

  console.log(`\nProcessing ${config.name}...`);

  // Count total records
  stats.total = await config.model.count();
  console.log(`  Total records: ${stats.total}`);

  if (stats.total === 0) {
    console.log("  No records to migrate.");
    return stats;
  }

  // Process in batches
  let offset = 0;

  while (offset < stats.total) {
    const records = await config.model.findMany({
      skip: offset,
      take: batchSize,
    });

    for (const record of records) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};
        let needsUpdate = false;
        let allEncrypted = true;

        for (const field of config.fields) {
          const originalValue = record[field.original];
          const encryptedValue = record[field.encrypted];

          // Skip if already encrypted
          if (encryptedValue && isEncrypted(encryptedValue)) {
            // Verify mode: check if decryption matches original
            if (verifyOnly) {
              try {
                const decrypted = decrypt(encryptedValue);
                const expected = String(originalValue);

                if (decrypted !== expected) {
                  console.error(
                    `  Verification failed for ${config.name}.${field.original} (id: ${record.id})`
                  );
                  console.error(`    Expected: ${expected}`);
                  console.error(`    Got: ${decrypted}`);
                  stats.verificationErrors++;
                } else {
                  stats.verified++;
                }
              } catch (e) {
                console.error(
                  `  Decryption failed for ${config.name}.${field.original} (id: ${record.id}): ${e}`
                );
                stats.verificationErrors++;
              }
            }
            continue;
          }

          allEncrypted = false;

          // Skip null/undefined values
          if (originalValue === null || originalValue === undefined) {
            continue;
          }

          // Encrypt the value
          updateData[field.encrypted] = encrypt(originalValue);
          needsUpdate = true;
        }

        if (allEncrypted) {
          stats.skipped++;
          continue;
        }

        if (verifyOnly) {
          continue;
        }

        if (needsUpdate && !dryRun) {
          await config.model.update({
            where: { id: record.id },
            data: updateData,
          });
          stats.migrated++;

          // Verify the encryption
          const updated = await config.model.findUnique({
            where: { id: record.id },
          });

          for (const field of config.fields) {
            const encryptedValue = updated[field.encrypted];
            if (encryptedValue && isEncrypted(encryptedValue)) {
              const decrypted = decrypt(encryptedValue);
              const expected = String(record[field.original]);

              if (decrypted !== expected) {
                console.error(
                  `  Post-migration verification failed for ${config.name}.${field.original} (id: ${record.id})`
                );
                stats.verificationErrors++;
              } else {
                stats.verified++;
              }
            }
          }
        } else if (needsUpdate && dryRun) {
          stats.migrated++;
          console.log(`  [DRY RUN] Would encrypt record ${record.id}`);
        }
      } catch (error) {
        console.error(`  Error processing ${config.name} record ${record.id}: ${error}`);
        stats.errors++;
      }
    }

    offset += batchSize;
    process.stdout.write(`  Progress: ${Math.min(offset, stats.total)}/${stats.total}\r`);
  }

  console.log(`  Migrated: ${stats.migrated}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);

  if (stats.verified > 0 || stats.verificationErrors > 0) {
    console.log(`  Verified: ${stats.verified}, Verification Errors: ${stats.verificationErrors}`);
  }

  return stats;
}

async function main() {
  console.log("=".repeat(60));
  console.log("FinControl Encryption Migration");
  console.log("=".repeat(60));

  if (dryRun) {
    console.log("\n[DRY RUN MODE] No changes will be made to the database.\n");
  }

  if (verifyOnly) {
    console.log("\n[VERIFY MODE] Only verifying existing encrypted data.\n");
  }

  console.log(`Batch size: ${batchSize}`);

  // Verify encryption key is available
  try {
    getKey();
    console.log("Encryption key: OK");
  } catch (error) {
    console.error(`\nError: ${error}`);
    console.error("\nPlease set ENCRYPTION_KEY environment variable.");
    console.error("Generate a key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    process.exit(1);
  }

  const modelConfigs = getModelConfigs();
  const allStats: MigrationStats[] = [];

  for (const config of modelConfigs) {
    const stats = await migrateModel(config);
    allStats.push(stats);
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));

  let totalRecords = 0;
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalVerified = 0;
  let totalVerificationErrors = 0;

  console.log("\nModel                 | Total  | Migrated | Skipped | Errors");
  console.log("-".repeat(60));

  for (const stats of allStats) {
    console.log(
      `${stats.model.padEnd(21)} | ${String(stats.total).padStart(6)} | ${String(stats.migrated).padStart(8)} | ${String(stats.skipped).padStart(7)} | ${String(stats.errors).padStart(6)}`
    );
    totalRecords += stats.total;
    totalMigrated += stats.migrated;
    totalSkipped += stats.skipped;
    totalErrors += stats.errors;
    totalVerified += stats.verified;
    totalVerificationErrors += stats.verificationErrors;
  }

  console.log("-".repeat(60));
  console.log(
    `${"TOTAL".padEnd(21)} | ${String(totalRecords).padStart(6)} | ${String(totalMigrated).padStart(8)} | ${String(totalSkipped).padStart(7)} | ${String(totalErrors).padStart(6)}`
  );

  if (totalVerified > 0 || totalVerificationErrors > 0) {
    console.log(`\nVerification: ${totalVerified} OK, ${totalVerificationErrors} Errors`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] To apply changes, run without --dry-run flag.");
  }

  if (totalErrors > 0) {
    console.log("\nSome records failed to migrate. Please check the errors above.");
    process.exit(1);
  }

  console.log("\nMigration completed successfully!");
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
