import { NextResponse } from "next/server";
import { serverCache, CacheTTL } from "@/lib/server-cache";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
}

const CACHE_KEY = "global:exchange-rates";

async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  // Try Open Exchange Rates (free tier with app_id)
  // Fallback: use exchangerate.host or Banco Central do Brasil
  try {
    // Using exchangerate.host (free, no key required)
    const response = await fetch(
      "https://api.exchangerate.host/latest?base=BRL&symbols=USD,EUR,GBP",
      { cache: "no-store" }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success !== false && data.rates) {
        return {
          USD: data.rates.USD,
          EUR: data.rates.EUR,
          GBP: data.rates.GBP,
        };
      }
    }
  } catch (error) {
    console.error("[Exchange] exchangerate.host failed:", error);
  }

  // Fallback: Banco Central do Brasil PTAX
  try {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}-${today.getFullYear()}`;

    const usdResponse = await fetch(
      `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dateStr}'&$format=json`,
      { cache: "no-store" }
    );

    if (usdResponse.ok) {
      const usdData = await usdResponse.json();
      if (usdData.value && usdData.value.length > 0) {
        const usdRate = usdData.value[usdData.value.length - 1].cotacaoVenda;
        // Approximate EUR and GBP from USD
        // These are rough estimates; in production you'd fetch each individually
        return {
          USD: 1 / usdRate,
          EUR: 1 / (usdRate * 1.08), // approximate EUR/USD
          GBP: 1 / (usdRate * 0.79), // approximate GBP/USD
        };
      }
    }
  } catch (error) {
    console.error("[Exchange] BCB PTAX failed:", error);
  }

  return null;
}

export async function GET(request: Request) {
  // Rate limit
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.externalApi,
    identifier: "exchange-rates",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Muitas requisições. Tente novamente em breve." },
      { status: 429 }
    );
  }

  // Check cache first
  const cached = serverCache.get<{ rates: ExchangeRates; lastUpdate: string }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({
      success: true,
      rates: cached.rates,
      lastUpdate: cached.lastUpdate,
    });
  }

  // Fetch fresh rates
  const rates = await fetchExchangeRates();

  if (!rates) {
    return NextResponse.json({
      success: false,
      error: "Não foi possível obter taxas de câmbio",
    });
  }

  const lastUpdate = new Date().toISOString();

  // Cache for 1 hour
  serverCache.set(CACHE_KEY, { rates, lastUpdate }, {
    ttl: CacheTTL.VERY_LONG,
    tags: ["exchange-rates"],
  });

  return NextResponse.json({
    success: true,
    rates,
    lastUpdate,
  });
}
