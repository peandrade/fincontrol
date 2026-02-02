import { CACHE_DURATIONS, CDI_DAILY_RATE_DEFAULT } from "@/lib/constants";

export interface CDIHistoryEntry {
  date: string;
  dateISO: string;
  rate: number;
}

export interface CDIHistory {
  entries: CDIHistoryEntry[];
  startDate: string;
  endDate: string;
  lastUpdate: Date;
}

let historyCache: CDIHistory | null = null;

function bcbDateToISO(bcbDate: string): string {
  const [day, month, year] = bcbDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function isoToDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function fetchCDIHistory(days: number = 365): Promise<CDIHistory | null> {

  if (historyCache && Date.now() - historyCache.lastUpdate.getTime() < CACHE_DURATIONS.RATES) {
    console.log("[CDI History] Usando cache");
    return historyCache;
  }

  try {
    console.log(`[CDI History] Buscando histórico do CDI...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startStr = `${String(startDate.getDate()).padStart(2, "0")}/${String(startDate.getMonth() + 1).padStart(2, "0")}/${startDate.getFullYear()}`;
    const endStr = `${String(endDate.getDate()).padStart(2, "0")}/${String(endDate.getMonth() + 1).padStart(2, "0")}/${endDate.getFullYear()}`;

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${startStr}&dataFinal=${endStr}`;

    console.log(`[CDI History] URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[CDI History] Erro HTTP: ${response.status}`);
      return createFallbackHistory(days);
    }

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[CDI History] Erro ao fazer parse do JSON:", parseError);
      return createFallbackHistory(days);
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("[CDI History] Resposta inválida:", data);
      return createFallbackHistory(days);
    }

    const entries: CDIHistoryEntry[] = data.map((item: { data: string; valor: string }) => ({
      date: item.data,
      dateISO: bcbDateToISO(item.data),
      rate: parseFloat(item.valor),
    }));

    const history: CDIHistory = {
      entries,
      startDate: entries[0].dateISO,
      endDate: entries[entries.length - 1].dateISO,
      lastUpdate: new Date(),
    };

    historyCache = history;
    console.log(`[CDI History] Carregado: ${entries.length} dias úteis (${history.startDate} a ${history.endDate})`);

    return history;
  } catch (error) {
    console.error("[CDI History] Erro ao buscar:", error);

    console.log("[CDI History] Usando fallback com taxa estimada...");
    return createFallbackHistory(days);
  }
}

function createFallbackHistory(days: number): CDIHistory {
  const entries: CDIHistoryEntry[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateISO = date.toISOString().split("T")[0];
    const dateBR = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

    entries.push({
      date: dateBR,
      dateISO,
      rate: CDI_DAILY_RATE_DEFAULT,
    });
  }

  return {
    entries,
    startDate: entries[0]?.dateISO || "",
    endDate: entries[entries.length - 1]?.dateISO || "",
    lastUpdate: new Date(),
  };
}

export function isBusinessDay(dateISO: string, history: CDIHistory): boolean {
  return history.entries.some(e => e.dateISO === dateISO);
}

export function getCDIRate(dateISO: string, history: CDIHistory): number | null {
  const entry = history.entries.find(e => e.dateISO === dateISO);
  return entry ? entry.rate : null;
}

const IOF_TABLE: number[] = [
  96, 93, 90, 86, 83, 80, 76, 73, 70, 66,
  63, 60, 56, 53, 50, 46, 43, 40, 36, 33,
  30, 26, 23, 20, 16, 13, 10, 6, 3, 0,
];

export function calculateIOF(daysCorridos: number): number {
  if (daysCorridos >= 30) return 0;
  if (daysCorridos < 1) return 96;
  return IOF_TABLE[daysCorridos - 1];
}

export function calculateIR(daysCorridos: number): number {
  if (daysCorridos <= 180) return 22.5;
  if (daysCorridos <= 360) return 20;
  if (daysCorridos <= 720) return 17.5;
  return 15;
}

export interface YieldCalculationResult {
  grossValue: number;
  grossYield: number;
  grossYieldPercent: number;
  iofAmount: number;
  iofPercent: number;
  irAmount: number;
  irPercent: number;
  netValue: number;
  netYield: number;
  netYieldPercent: number;
  businessDays: number;
  calendarDays: number;
  dailyRates: { date: string; rate: number; accumulated: number }[];
}

export function calculateFixedIncomeYield(
  principal: number,
  startDate: string,
  contractedRate: number,
  indexer: string,
  history: CDIHistory
): YieldCalculationResult | null {
  if (!principal || principal <= 0) return null;
  if (!startDate) return null;
  if (indexer === "NA") return null;

  const start = isoToDate(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (calendarDays < 0) {

    return {
      grossValue: principal,
      grossYield: 0,
      grossYieldPercent: 0,
      iofAmount: 0,
      iofPercent: 0,
      irAmount: 0,
      irPercent: 0,
      netValue: principal,
      netYield: 0,
      netYieldPercent: 0,
      businessDays: 0,
      calendarDays: 0,
      dailyRates: [],
    };
  }

  const relevantDays = history.entries.filter(e => {
    const entryDate = isoToDate(e.dateISO);
    return entryDate >= start && entryDate <= today;
  });

  let accumulated = principal;
  const dailyRates: { date: string; rate: number; accumulated: number }[] = [];

  for (const day of relevantDays) {
    let dailyRate = 0;

    switch (indexer) {
      case "CDI":

        dailyRate = (contractedRate / 100) * (day.rate / 100);
        break;
      case "SELIC":

        const selicDailySpread = contractedRate / 252 / 100;
        dailyRate = (day.rate / 100) + selicDailySpread;
        break;
      case "IPCA":

        const ipcaDailySpread = contractedRate / 252 / 100;
        dailyRate = (day.rate / 100) * 0.9 + ipcaDailySpread;
        break;
      case "PREFIXADO":

        dailyRate = contractedRate / 252 / 100;
        break;
      default:
        dailyRate = day.rate / 100;
    }

    accumulated = accumulated * (1 + dailyRate);
    dailyRates.push({
      date: day.dateISO,
      rate: dailyRate * 100,
      accumulated,
    });
  }

  const grossYield = accumulated - principal;
  const grossYieldPercent = (grossYield / principal) * 100;

  const iofPercent = calculateIOF(calendarDays);
  const iofAmount = grossYield * (iofPercent / 100);

  const yieldAfterIOF = grossYield - iofAmount;

  const irPercent = calculateIR(calendarDays);
  const irAmount = yieldAfterIOF * (irPercent / 100);

  const netYield = grossYield - iofAmount - irAmount;
  const netValue = principal + netYield;
  const netYieldPercent = (netYield / principal) * 100;

  return {
    grossValue: accumulated,
    grossYield,
    grossYieldPercent,
    iofAmount,
    iofPercent,
    irAmount,
    irPercent,
    netValue,
    netYield,
    netYieldPercent,
    businessDays: relevantDays.length,
    calendarDays,
    dailyRates,
  };
}

export function clearCDIHistoryCache() {
  historyCache = null;
}
