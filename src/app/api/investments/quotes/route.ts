import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/quotes-service";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { InvestmentType } from "@prisma/client";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";
import { investmentRepository } from "@/repositories";

const QUOTABLE_TYPES: InvestmentType[] = [
  InvestmentType.stock,
  InvestmentType.fii,
  InvestmentType.etf,
  InvestmentType.crypto,
];

export async function POST(request: Request) {
  // Rate limit: 20 external API requests per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.externalApi,
    identifier: "quotes-update",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async (session) => {
    try {
      // Use repository for proper decryption of encrypted fields
      const investments = await investmentRepository.findByType(
        session.user.id,
        QUOTABLE_TYPES,
        { withTicker: true }
      );

      if (investments.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Nenhum investimento para atualizar",
          updated: 0,
          errors: [],
        });
      }

      const quotes = await fetchQuotes(
        investments.map((inv) => ({ ticker: inv.ticker!, type: inv.type }))
      );

      const updated: string[] = [];
      const errors: Array<{ ticker: string; error: string }> = [];

      for (const investment of investments) {
        const ticker = investment.ticker!.toUpperCase();
        const quote = quotes.get(ticker);

        if (!quote || quote.source === "error") {
          errors.push({
            ticker: investment.ticker!,
            error: quote?.error || "Cotação não encontrada",
          });
          continue;
        }

        const currentPrice = quote.price;
        const quantity = investment.quantity as unknown as number;
        const totalInvested = investment.totalInvested as unknown as number;
        const currentValue = quantity * currentPrice;
        const profitLoss = currentValue - totalInvested;
        const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

        // Use repository for update with encryption
        await investmentRepository.updateById(investment.id, {
          currentPrice,
          currentValue,
          profitLoss,
          profitLossPercent,
        });

        updated.push(investment.ticker!);
      }

      return NextResponse.json({
        success: true,
        message: `${updated.length} cotações atualizadas`,
        updated: updated.length,
        updatedTickers: updated,
        errors,
      });
    } catch (error) {
      console.error("Erro ao atualizar cotações:", error);
      return errorResponse("Erro ao atualizar cotações", 500, "UPDATE_QUOTES_ERROR");
    }
  });
}

export async function GET(request: Request) {
  // Rate limit: 20 external API requests per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.externalApi,
    identifier: "quotes-fetch",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async (session) => {
    try {
      // Use repository for proper decryption of encrypted fields
      const investments = await investmentRepository.findByType(
        session.user.id,
        QUOTABLE_TYPES,
        { withTicker: true }
      );

      if (investments.length === 0) {
        return NextResponse.json({
          success: true,
          quotes: [],
        });
      }

      const quotes = await fetchQuotes(
        investments.map((inv) => ({ ticker: inv.ticker!, type: inv.type }))
      );

      const results = investments.map((inv) => {
        const quote = quotes.get(inv.ticker!.toUpperCase());
        return {
          id: inv.id,
          ticker: inv.ticker,
          name: inv.name,
          type: inv.type,
          oldPrice: inv.currentPrice,
          newPrice: quote?.price || null,
          change: quote?.change,
          changePercent: quote?.changePercent,
          source: quote?.source || "error",
          error: quote?.error,
        };
      });

      return NextResponse.json({
        success: true,
        quotes: results,
      });
    } catch (error) {
      console.error("Erro ao buscar cotações:", error);
      return errorResponse("Erro ao buscar cotações", 500, "FETCH_QUOTES_ERROR");
    }
  });
}
