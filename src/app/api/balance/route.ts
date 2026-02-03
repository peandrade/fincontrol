import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";
import { transactionRepository } from "@/repositories";

export async function GET(request: Request) {
  // Rate limit: 100 requests per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.api,
    identifier: "balance",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async (session) => {
    // Get balance using repository (handles decryption)
    const balance = await transactionRepository.getBalance(session.user.id);

    return NextResponse.json(
      {
        balance,
        formatted: new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(balance),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  });
}
