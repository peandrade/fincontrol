import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";

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
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      select: {
        type: true,
        value: true,
      },
    });

    let balance = 0;
    transactions.forEach((t) => {
      if (t.type === "income") {
        balance += t.value;
      } else {
        balance -= t.value;
      }
    });

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
