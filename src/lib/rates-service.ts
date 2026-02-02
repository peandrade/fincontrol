import { CACHE_DURATIONS } from "@/lib/constants";

export interface RateResult {
  code: string;
  name: string;
  value: number;
  date: string;
  unit: string;
  error?: string;
}

export interface AllRates {
  cdi: RateResult | null;
  selic: RateResult | null;
  ipca: RateResult | null;
  lastUpdate: Date;
}

const RATE_CODES = {
  CDI: "12",
  SELIC: "432",
  IPCA: "433",
};

let ratesCache: AllRates | null = null;

async function fetchBCBSeries(code: string): Promise<RateResult | null> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Erro ao buscar série ${code}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const latest = data[0];

    return {
      code,
      name: getSeriesName(code),
      value: parseFloat(latest.valor),
      date: latest.data,
      unit: getSeriesUnit(code),
    };
  } catch (error) {
    console.error(`Erro ao buscar série ${code}:`, error);
    return null;
  }
}

function getSeriesName(code: string): string {
  switch (code) {
    case RATE_CODES.CDI:
      return "CDI";
    case RATE_CODES.SELIC:
      return "SELIC";
    case RATE_CODES.IPCA:
      return "IPCA";
    default:
      return "Desconhecido";
  }
}

function getSeriesUnit(code: string): string {
  switch (code) {
    case RATE_CODES.CDI:
      return "% a.a.";
    case RATE_CODES.SELIC:
      return "% a.a.";
    case RATE_CODES.IPCA:
      return "% a.m.";
    default:
      return "%";
  }
}

function isCacheValid(): boolean {
  if (!ratesCache) return false;
  return Date.now() - ratesCache.lastUpdate.getTime() < CACHE_DURATIONS.RATES;
}

export async function fetchAllRates(): Promise<AllRates> {

  if (isCacheValid() && ratesCache) {
    console.log("[Rates] Usando cache");
    return ratesCache;
  }

  console.log("[Rates] Buscando taxas do BCB...");

  const [cdi, selic, ipca] = await Promise.all([
    fetchBCBSeries(RATE_CODES.CDI),
    fetchBCBSeries(RATE_CODES.SELIC),
    fetchBCBSeries(RATE_CODES.IPCA),
  ]);

  const result: AllRates = {
    cdi,
    selic,
    ipca,
    lastUpdate: new Date(),
  };

  ratesCache = result;

  return result;
}

export async function fetchRate(type: "CDI" | "SELIC" | "IPCA"): Promise<RateResult | null> {
  const code = RATE_CODES[type];
  return fetchBCBSeries(code);
}

export function clearRatesCache() {
  ratesCache = null;
}

export function calculateEstimatedReturn(
  principal: number,
  rate: number,
  indexer: string,
  currentRates: AllRates,
  days: number = 365
): { grossReturn: number; annualRate: number } {

  if (indexer === "NA") {
    return { grossReturn: 0, annualRate: 0 };
  }

  let annualRate = 0;

  switch (indexer) {
    case "CDI":

      if (currentRates.cdi) {
        annualRate = (rate / 100) * currentRates.cdi.value;
      }
      break;
    case "IPCA":

      if (currentRates.ipca) {

        const ipcaAnual = Math.pow(1 + currentRates.ipca.value / 100, 12) - 1;
        annualRate = (ipcaAnual * 100) + rate;
      }
      break;
    case "SELIC":

      if (currentRates.selic) {
        annualRate = currentRates.selic.value + rate;
      }
      break;
    case "PREFIXADO":

      annualRate = rate;
      break;
    default:
      annualRate = rate;
  }

  const dailyRate = annualRate / 365 / 100;
  const grossReturn = principal * Math.pow(1 + dailyRate, days) - principal;

  return { grossReturn, annualRate };
}

export function formatRateDescription(rate: number | null, indexer: string | null): string {
  if (indexer === "NA") return "N/A";
  if (!rate || !indexer) return "-";

  switch (indexer) {
    case "CDI":
      return `${rate}% do CDI`;
    case "IPCA":
      return `IPCA + ${rate}%`;
    case "SELIC":
      return `SELIC + ${rate}%`;
    case "PREFIXADO":
      return `${rate}% a.a.`;
    default:
      return `${rate}%`;
  }
}
