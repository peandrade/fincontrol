import { CACHE_DURATIONS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";

interface BrapiQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

interface BrapiResponse {
  results: BrapiQuote[];
  error?: boolean;
  message?: string;
}

interface CoinGeckoPrice {
  [coinId: string]: {
    brl: number;
    brl_24h_change?: number;
  };
}

export interface QuoteResult {
  ticker: string;
  price: number;
  change?: number;
  changePercent?: number;
  source: "brapi" | "coingecko" | "error";
  error?: string;
}

interface CacheEntry {
  data: QuoteResult[];
  timestamp: number;
}

const cache: {
  brapi: CacheEntry | null;
  coingecko: CacheEntry | null;
} = {
  brapi: null,
  coingecko: null,
};


const CRYPTO_TICKER_TO_COINGECKO: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  AVAX: "avalanche-2",
  ATOM: "cosmos",
  XRP: "ripple",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  ALGO: "algorand",
  VET: "vechain",
  FIL: "filecoin",
  AAVE: "aave",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AXS: "axie-infinity",
  APE: "apecoin",
  CRV: "curve-dao-token",
  LDO: "lido-dao",
  ARB: "arbitrum",
  OP: "optimism",
  NEAR: "near",
  FTM: "fantom",
  EGLD: "elrond-erd-2",
  HBAR: "hedera-hashgraph",
  ICP: "internet-computer",
  FLOW: "flow",
  EOS: "eos",
  XTZ: "tezos",
  THETA: "theta-token",
  NEO: "neo",
  KLAY: "klay-token",
  USDT: "tether",
  USDC: "usd-coin",
  BUSD: "binance-usd",
  DAI: "dai",
  BNB: "binancecoin",
};

function isCacheValid(entry: CacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATIONS.QUOTES;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSingleBrapiQuote(
  ticker: string,
  apiKey: string
): Promise<QuoteResult> {
  const upperTicker = ticker.toUpperCase();
  const url = `https://brapi.dev/api/quote/${upperTicker}?token=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "FinControl/1.0",
      },
    });

    if (response.status === 429) {
      return {
        ticker: upperTicker,
        price: 0,
        source: "error",
        error: "Limite de requisições. Aguarde 1-2 min.",
      };
    }

    if (!response.ok) {
      return {
        ticker: upperTicker,
        price: 0,
        source: "error",
        error: `Erro ${response.status}`,
      };
    }

    const data: BrapiResponse = await response.json();

    if (data.error || !data.results || data.results.length === 0) {
      return {
        ticker: upperTicker,
        price: 0,
        source: "error",
        error: data.message || "Ticker não encontrado",
      };
    }

    const quote = data.results[0];
    return {
      ticker: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      source: "brapi",
    };
  } catch (error) {
    return {
      ticker: upperTicker,
      price: 0,
      source: "error",
      error: getErrorMessage(error),
    };
  }
}

async function fetchBrapiQuotes(tickers: string[]): Promise<QuoteResult[]> {
  if (tickers.length === 0) return [];

  if (isCacheValid(cache.brapi)) {
    const cachedTickers = new Set(cache.brapi!.data.map(q => q.ticker.toUpperCase()));
    const requestedTickers = new Set(tickers.map(t => t.toUpperCase()));

    const allInCache = [...requestedTickers].every(t => cachedTickers.has(t));
    if (allInCache) {
      console.log("[Brapi] Usando cache");
      return cache.brapi!.data.filter(q =>
        requestedTickers.has(q.ticker.toUpperCase())
      );
    }
  }

  const apiKey = process.env.BRAPI_API_KEY;
  if (!apiKey) {
    console.error("BRAPI_API_KEY não configurada");
    return tickers.map((ticker) => ({
      ticker,
      price: 0,
      source: "error" as const,
      error: "API Key não configurada",
    }));
  }

  const results: QuoteResult[] = [];

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    console.log(`[Brapi] Buscando ${i + 1}/${tickers.length}: ${ticker.toUpperCase()}`);

    const result = await fetchSingleBrapiQuote(ticker, apiKey);
    results.push(result);

    if (i < tickers.length - 1) {
      await delay(300);
    }
  }

  const successResults = results.filter(r => r.source === "brapi");
  if (successResults.length > 0) {
    cache.brapi = {
      data: successResults,
      timestamp: Date.now(),
    };
  }

  return results;
}

async function fetchCoinGeckoQuotes(tickers: string[]): Promise<QuoteResult[]> {
  if (tickers.length === 0) return [];

  const results: QuoteResult[] = [];
  const validTickers: { ticker: string; coinId: string }[] = [];

  for (const ticker of tickers) {
    const upperTicker = ticker.toUpperCase();
    const coinId = CRYPTO_TICKER_TO_COINGECKO[upperTicker];

    if (coinId) {
      validTickers.push({ ticker, coinId });
    } else {

      validTickers.push({ ticker, coinId: ticker.toLowerCase() });
    }
  }

  if (validTickers.length === 0) return results;

  if (isCacheValid(cache.coingecko)) {
    const cachedTickers = new Set(cache.coingecko!.data.map(q => q.ticker.toUpperCase()));
    const requestedTickers = new Set(tickers.map(t => t.toUpperCase()));

    const allInCache = [...requestedTickers].every(t => cachedTickers.has(t));
    if (allInCache) {
      console.log("Usando cache do CoinGecko");
      return cache.coingecko!.data.filter(q =>
        requestedTickers.has(q.ticker.toUpperCase())
      );
    }
  }

  try {
    const coinIds = validTickers.map((v) => v.coinId).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=brl&include_24hr_change=true`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (response.status === 429) {
      console.warn("Limite de requisições do CoinGecko atingido.");
      return tickers.map((ticker) => ({
        ticker,
        price: 0,
        source: "error" as const,
        error: "Limite de requisições atingido. Aguarde alguns minutos.",
      }));
    }

    if (!response.ok) {
      throw new Error(`CoinGecko error: ${response.status}`);
    }

    const data: CoinGeckoPrice = await response.json();

    for (const { ticker, coinId } of validTickers) {
      if (data[coinId]) {
        results.push({
          ticker,
          price: data[coinId].brl,
          changePercent: data[coinId].brl_24h_change,
          source: "coingecko",
        });
      } else {
        results.push({
          ticker,
          price: 0,
          source: "error",
          error: `Crypto ${ticker} não encontrada`,
        });
      }
    }

    cache.coingecko = {
      data: results,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Erro ao buscar cotações no CoinGecko:", error);
    return tickers.map((ticker) => ({
      ticker,
      price: 0,
      source: "error" as const,
      error: getErrorMessage(error),
    }));
  }

  return results;
}

function isCryptoTicker(ticker: string): boolean {
  if (!ticker) return false;
  const upper = ticker.toUpperCase();

  if (CRYPTO_TICKER_TO_COINGECKO[upper]) return true;

  const brPattern = /^[A-Z]{4,6}\d{1,2}$/;
  if (brPattern.test(upper)) return false;

  const cryptoPattern = /^[A-Z]{2,5}$/;
  return cryptoPattern.test(upper);
}

export async function fetchQuotes(
  investments: Array<{ ticker: string | null; type: string }>
): Promise<Map<string, QuoteResult>> {
  const results = new Map<string, QuoteResult>();

  const brTickers: string[] = [];
  const cryptoTickers: string[] = [];

  for (const inv of investments) {
    if (!inv.ticker) continue;

    if (["stock", "fii", "etf"].includes(inv.type)) {
      brTickers.push(inv.ticker);
    }

    else if (inv.type === "crypto") {
      cryptoTickers.push(inv.ticker);
    }

    else if (isCryptoTicker(inv.ticker)) {
      cryptoTickers.push(inv.ticker);
    } else {
      brTickers.push(inv.ticker);
    }
  }

  const [brapiResults, coinGeckoResults] = await Promise.all([
    fetchBrapiQuotes([...new Set(brTickers)]),
    fetchCoinGeckoQuotes([...new Set(cryptoTickers)]),
  ]);

  for (const result of [...brapiResults, ...coinGeckoResults]) {
    results.set(result.ticker.toUpperCase(), result);
  }

  return results;
}

export async function fetchSingleQuote(
  ticker: string,
  type: string
): Promise<QuoteResult> {
  const results = await fetchQuotes([{ ticker, type }]);
  return (
    results.get(ticker.toUpperCase()) || {
      ticker,
      price: 0,
      source: "error",
      error: "Cotação não encontrada",
    }
  );
}

export function clearQuotesCache() {
  cache.brapi = null;
  cache.coingecko = null;
}
