-- Migration: Single Column Encryption
-- Remove original columns (now zeroed) and rename encrypted columns to original names

-- ============================================
-- TRANSACTIONS
-- ============================================
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "value";
ALTER TABLE "transactions" RENAME COLUMN "encryptedValue" TO "value";

ALTER TABLE "transactions" DROP COLUMN IF EXISTS "description";
ALTER TABLE "transactions" RENAME COLUMN "encryptedDescription" TO "description";

-- ============================================
-- TRANSACTION TEMPLATES
-- ============================================
ALTER TABLE "transaction_templates" DROP COLUMN IF EXISTS "value";
ALTER TABLE "transaction_templates" RENAME COLUMN "encryptedValue" TO "value";

-- ============================================
-- INVESTMENTS
-- ============================================
ALTER TABLE "investments" DROP COLUMN IF EXISTS "quantity";
ALTER TABLE "investments" RENAME COLUMN "encryptedQuantity" TO "quantity";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "averagePrice";
ALTER TABLE "investments" RENAME COLUMN "encryptedAveragePrice" TO "averagePrice";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "currentPrice";
ALTER TABLE "investments" RENAME COLUMN "encryptedCurrentPrice" TO "currentPrice";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "totalInvested";
ALTER TABLE "investments" RENAME COLUMN "encryptedTotalInvested" TO "totalInvested";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "currentValue";
ALTER TABLE "investments" RENAME COLUMN "encryptedCurrentValue" TO "currentValue";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "profitLoss";
ALTER TABLE "investments" RENAME COLUMN "encryptedProfitLoss" TO "profitLoss";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "profitLossPercent";
ALTER TABLE "investments" RENAME COLUMN "encryptedProfitLossPercent" TO "profitLossPercent";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "goalValue";
ALTER TABLE "investments" RENAME COLUMN "encryptedGoalValue" TO "goalValue";

ALTER TABLE "investments" DROP COLUMN IF EXISTS "interestRate";
ALTER TABLE "investments" RENAME COLUMN "encryptedInterestRate" TO "interestRate";

-- ============================================
-- OPERATIONS
-- ============================================
ALTER TABLE "operations" DROP COLUMN IF EXISTS "quantity";
ALTER TABLE "operations" RENAME COLUMN "encryptedQuantity" TO "quantity";

ALTER TABLE "operations" DROP COLUMN IF EXISTS "price";
ALTER TABLE "operations" RENAME COLUMN "encryptedPrice" TO "price";

ALTER TABLE "operations" DROP COLUMN IF EXISTS "total";
ALTER TABLE "operations" RENAME COLUMN "encryptedTotal" TO "total";

ALTER TABLE "operations" DROP COLUMN IF EXISTS "fees";
ALTER TABLE "operations" RENAME COLUMN "encryptedFees" TO "fees";

ALTER TABLE "operations" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "operations" RENAME COLUMN "encryptedNotes" TO "notes";

-- ============================================
-- CREDIT CARDS
-- ============================================
ALTER TABLE "credit_cards" DROP COLUMN IF EXISTS "limit";
ALTER TABLE "credit_cards" RENAME COLUMN "encryptedLimit" TO "limit";

-- ============================================
-- INVOICES
-- ============================================
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "total";
ALTER TABLE "invoices" RENAME COLUMN "encryptedTotal" TO "total";

ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paidAmount";
ALTER TABLE "invoices" RENAME COLUMN "encryptedPaidAmount" TO "paidAmount";

-- ============================================
-- PURCHASES
-- ============================================
ALTER TABLE "purchases" DROP COLUMN IF EXISTS "value";
ALTER TABLE "purchases" RENAME COLUMN "encryptedValue" TO "value";

ALTER TABLE "purchases" DROP COLUMN IF EXISTS "totalValue";
ALTER TABLE "purchases" RENAME COLUMN "encryptedTotalValue" TO "totalValue";

ALTER TABLE "purchases" DROP COLUMN IF EXISTS "description";
ALTER TABLE "purchases" RENAME COLUMN "encryptedDescription" TO "description";

ALTER TABLE "purchases" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "purchases" RENAME COLUMN "encryptedNotes" TO "notes";

-- ============================================
-- BUDGETS
-- ============================================
ALTER TABLE "budgets" DROP COLUMN IF EXISTS "limit";
ALTER TABLE "budgets" RENAME COLUMN "encryptedLimit" TO "limit";

-- ============================================
-- RECURRING EXPENSES
-- ============================================
ALTER TABLE "recurring_expenses" DROP COLUMN IF EXISTS "value";
ALTER TABLE "recurring_expenses" RENAME COLUMN "encryptedValue" TO "value";

ALTER TABLE "recurring_expenses" DROP COLUMN IF EXISTS "description";
ALTER TABLE "recurring_expenses" RENAME COLUMN "encryptedDescription" TO "description";

ALTER TABLE "recurring_expenses" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "recurring_expenses" RENAME COLUMN "encryptedNotes" TO "notes";

-- ============================================
-- FINANCIAL GOALS
-- ============================================
ALTER TABLE "financial_goals" DROP COLUMN IF EXISTS "targetValue";
ALTER TABLE "financial_goals" RENAME COLUMN "encryptedTargetValue" TO "targetValue";

ALTER TABLE "financial_goals" DROP COLUMN IF EXISTS "currentValue";
ALTER TABLE "financial_goals" RENAME COLUMN "encryptedCurrentValue" TO "currentValue";

-- ============================================
-- GOAL CONTRIBUTIONS
-- ============================================
ALTER TABLE "goal_contributions" DROP COLUMN IF EXISTS "value";
ALTER TABLE "goal_contributions" RENAME COLUMN "encryptedValue" TO "value";

ALTER TABLE "goal_contributions" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "goal_contributions" RENAME COLUMN "encryptedNotes" TO "notes";
