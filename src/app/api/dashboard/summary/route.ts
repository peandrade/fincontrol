import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { analyticsService } from "@/services";
import { serverCache, CacheTags, CacheTTL } from "@/lib/server-cache";

/**
 * GET /api/dashboard/summary
 *
 * Returns a comprehensive dashboard summary including:
 * - Current balance and monthly transactions
 * - Investment totals and performance
 * - Credit card usage
 * - Goals progress
 * - Total wealth calculation
 *
 * Cached for 30 seconds per user.
 */
export async function GET() {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
      const cacheKey = serverCache.userKey(userId, "dashboard-summary");

      const summary = await serverCache.getOrSet(
        cacheKey,
        () => analyticsService.getDashboardSummary(userId),
        {
          ttl: CacheTTL.SHORT,
          tags: [CacheTags.DASHBOARD, CacheTags.TRANSACTIONS, CacheTags.INVESTMENTS, CacheTags.CARDS, CacheTags.GOALS],
        }
      );

      return NextResponse.json(summary, {
        headers: {
          "Cache-Control": "private, no-cache",
        },
      });
    } catch (error) {
      console.error("Erro ao buscar resumo do dashboard:", error);
      return errorResponse("Erro ao buscar resumo", 500, "DASHBOARD_SUMMARY_ERROR");
    }
  });
}
