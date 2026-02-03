import { BaseRepository, calculatePagination, type PaginatedResult, type PaginationOptions } from "./base-repository";
import type { EncryptedModel } from "@/lib/encryption";
import type { Prisma, GoalCategory } from "@prisma/client";

// NOTE: Prisma extension handles encryption/decryption automatically.
// Do NOT call encryptRecord/decryptRecord manually - it causes double encryption.

/**
 * Filters for goal queries.
 */
export interface GoalFilters extends PaginationOptions {
  category?: GoalCategory;
  isCompleted?: boolean;
  includeContributions?: boolean;
}

/**
 * FinancialGoal type from Prisma.
 */
type FinancialGoal = Prisma.FinancialGoalGetPayload<{ include: { contributions: true } }>;

/**
 * Repository for financial goal data access.
 */
export class GoalRepository extends BaseRepository {
  protected readonly modelName: EncryptedModel = "FinancialGoal";

  /**
   * @deprecated Prisma extension handles decryption automatically.
   * This method now returns data unchanged.
   */
  private decryptGoalWithContributions<T>(goal: T): T {
    // Prisma extension handles decryption automatically - return as-is
    return goal;
  }

  /**
   * Find a goal by ID with ownership check.
   */
  async findById(id: string, userId: string, includeContributions = false) {
    const result = await this.db.financialGoal.findFirst({
      where: { id, userId },
      include: includeContributions ? { contributions: { orderBy: { date: "desc" } } } : undefined,
    });

    if (!result) return null;

    return this.decryptGoalWithContributions(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Find all goals for a user.
   */
  async findByUser(userId: string, filters: GoalFilters = {}) {
    const { category, isCompleted, includeContributions = false } = filters;

    const where: Prisma.FinancialGoalWhereInput = {
      userId,
      ...(category && { category }),
      ...(isCompleted !== undefined && { isCompleted }),
    };

    const results = await this.db.financialGoal.findMany({
      where,
      include: includeContributions ? { contributions: { orderBy: { date: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return results.map((r) =>
      this.decryptGoalWithContributions(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
  }

  /**
   * Find goals with pagination.
   */
  async findByUserPaginated(
    userId: string,
    filters: GoalFilters = {}
  ): Promise<PaginatedResult<FinancialGoal>> {
    const { category, isCompleted, includeContributions = false, page = 1, pageSize = 50 } = filters;

    const where: Prisma.FinancialGoalWhereInput = {
      userId,
      ...(category && { category }),
      ...(isCompleted !== undefined && { isCompleted }),
    };

    const total = await this.db.financialGoal.count({ where });
    const { skip, take, pagination } = calculatePagination(page, pageSize, total);

    const goals = await this.db.financialGoal.findMany({
      where,
      include: includeContributions ? { contributions: { orderBy: { date: "desc" } } } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    const decrypted = goals.map((r) =>
      this.decryptGoalWithContributions(r as unknown as Record<string, unknown>)
    );

    return {
      data: decrypted as unknown as FinancialGoal[],
      pagination,
    };
  }

  /**
   * Get active (incomplete) goals for a user.
   */
  async getActive(userId: string, includeContributions = false) {
    const results = await this.db.financialGoal.findMany({
      where: { userId, isCompleted: false },
      include: includeContributions ? { contributions: { orderBy: { date: "desc" } } } : undefined,
      orderBy: { targetDate: "asc" },
    });

    return results.map((r) =>
      this.decryptGoalWithContributions(r as unknown as Record<string, unknown>)
    ) as unknown as typeof results;
  }

  /**
   * Create a new goal.
   */
  async create(data: {
    userId: string;
    name: string;
    description?: string;
    category: GoalCategory;
    targetValue: number;
    currentValue?: number;
    targetDate?: Date;
    icon?: string;
    color?: string;
  }) {
    const encryptedData = this.encryptData(data as unknown as Record<string, unknown>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.db.financialGoal.create({ data: encryptedData as any });

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Update a goal by ID (with ownership check).
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      category: GoalCategory;
      targetValue: number;
      currentValue: number;
      targetDate: Date | null;
      icon: string;
      color: string;
      isCompleted: boolean;
      completedAt: Date | null;
    }>
  ) {
    const encryptedData = this.encryptUpdateData(
      data as Record<string, unknown>,
      Object.keys(data)
    );

    return this.db.financialGoal.updateMany({
      where: { id, userId },
      data: encryptedData,
    });
  }

  /**
   * Delete a goal by ID (with ownership check).
   */
  async delete(id: string, userId: string) {
    return this.db.financialGoal.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Add a contribution to a goal.
   * Note: Prisma extension handles encryption/decryption automatically.
   */
  async addContribution(
    goalId: string,
    userId: string,
    data: {
      value: number;
      date: Date;
      notes?: string;
    }
  ) {
    // Verify ownership - Prisma extension handles decryption automatically
    const goal = await this.db.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new Error("Goal not found");
    }

    // Values are already decrypted by Prisma extension
    const currentValue = goal.currentValue as unknown as number;
    const targetValue = goal.targetValue as unknown as number;

    return this.transaction(async (tx) => {
      // Create contribution - Prisma extension handles encryption automatically
      const contribution = await tx.goalContribution.create({
        data: { goalId, ...data } as any,
      });

      // Update goal current value
      const newCurrentValue = currentValue + data.value;
      const isCompleted = newCurrentValue >= targetValue;

      // Prisma extension handles encryption automatically
      await tx.financialGoal.update({
        where: { id: goalId },
        data: {
          currentValue: newCurrentValue,
          isCompleted,
          ...(isCompleted && { completedAt: new Date() }),
        } as any,
      });

      // Prisma extension handles decryption automatically
      return contribution;
    });
  }

  /**
   * Get contributions for a goal.
   * Note: Prisma extension handles decryption automatically.
   */
  async getContributions(goalId: string, userId: string) {
    // Verify ownership
    const goal = await this.db.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new Error("Goal not found");
    }

    // Prisma extension handles decryption automatically
    const contributions = await this.db.goalContribution.findMany({
      where: { goalId },
      orderBy: { date: "desc" },
    });

    return contributions;
  }

  /**
   * Delete a contribution.
   * Note: Prisma extension handles encryption/decryption automatically.
   */
  async deleteContribution(contributionId: string, userId: string) {
    // Verify ownership through goal - Prisma extension handles decryption automatically
    const contribution = await this.db.goalContribution.findUnique({
      where: { id: contributionId },
      include: { goal: true },
    });

    if (!contribution || contribution.goal.userId !== userId) {
      throw new Error("Contribution not found");
    }

    // Values are already decrypted by Prisma extension
    const contribValue = contribution.value as unknown as number;
    const goalCurrentValue = contribution.goal.currentValue as unknown as number;

    return this.transaction(async (tx) => {
      // Delete contribution
      await tx.goalContribution.delete({
        where: { id: contributionId },
      });

      // Update goal current value
      const newCurrentValue = Math.max(0, goalCurrentValue - contribValue);

      // Prisma extension handles encryption automatically
      await tx.financialGoal.update({
        where: { id: contribution.goalId },
        data: {
          currentValue: newCurrentValue,
          isCompleted: false,
          completedAt: null,
        } as any,
      });
    });
  }

  /**
   * Find emergency goal for a user.
   */
  async findEmergencyGoal(userId: string) {
    const result = await this.db.financialGoal.findFirst({
      where: { userId, category: "emergency" },
    });

    if (!result) return null;

    return this.decryptData(result as unknown as Record<string, unknown>) as unknown as typeof result;
  }

  /**
   * Get summary of all goals for a user.
   */
  async getSummary(userId: string) {
    const goals = await this.db.financialGoal.findMany({
      where: { userId },
    });

    // Decrypt values
    const decrypted = this.decryptMany(goals as unknown as Record<string, unknown>[]) as unknown as typeof goals;

    const totalTarget = decrypted.reduce((sum, g) => sum + (g.targetValue as unknown as number), 0);
    const totalSaved = decrypted.reduce((sum, g) => sum + (g.currentValue as unknown as number), 0);
    const completedCount = decrypted.filter((g) => g.isCompleted).length;

    return {
      totalGoals: goals.length,
      totalTarget,
      totalSaved,
      completedCount,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    };
  }
}

// Singleton instance
export const goalRepository = new GoalRepository();
