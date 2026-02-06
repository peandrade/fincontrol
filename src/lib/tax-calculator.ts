// ============================================
// Tax Calculator — IR sobre Renda Variável
// Pure functions, no database access
// ============================================

export type TaxableAssetType = "stock" | "fii" | "etf" | "crypto";

const TAXABLE_TYPES: TaxableAssetType[] = ["stock", "fii", "etf", "crypto"];

export function isTaxableType(type: string): type is TaxableAssetType {
  return TAXABLE_TYPES.includes(type as TaxableAssetType);
}

export const TAX_RULES: Record<
  TaxableAssetType,
  {
    swingTradeRate: number;
    dayTradeRate: number;
    monthlyExemptionLimit: number; // 0 = sem isenção
    swingTradeIrrfRate: number;
    dayTradeIrrfRate: number;
    darfCode: string;
    label: string;
  }
> = {
  stock: {
    swingTradeRate: 0.15,
    dayTradeRate: 0.2,
    monthlyExemptionLimit: 20000,
    swingTradeIrrfRate: 0.00005,
    dayTradeIrrfRate: 0.01,
    darfCode: "6015",
    label: "Ações",
  },
  fii: {
    swingTradeRate: 0.2,
    dayTradeRate: 0.2,
    monthlyExemptionLimit: 0,
    swingTradeIrrfRate: 0.00005,
    dayTradeIrrfRate: 0.01,
    darfCode: "6800",
    label: "FIIs",
  },
  etf: {
    swingTradeRate: 0.15,
    dayTradeRate: 0.2,
    monthlyExemptionLimit: 0,
    swingTradeIrrfRate: 0.00005,
    dayTradeIrrfRate: 0.01,
    darfCode: "6015",
    label: "ETFs",
  },
  crypto: {
    swingTradeRate: 0.15,
    dayTradeRate: 0.15,
    monthlyExemptionLimit: 35000,
    swingTradeIrrfRate: 0,
    dayTradeIrrfRate: 0,
    darfCode: "4600",
    label: "Criptomoedas",
  },
};

// ============================================
// Input types (from DB, after decryption)
// ============================================

export interface RawOperation {
  id: string;
  investmentId: string;
  type: string; // "buy" | "sell" | "deposit" | "withdraw" | "dividend"
  date: Date | string;
  quantity: number;
  price: number;
  total: number;
  fees: number;
  notes?: string | null;
}

export interface InvestmentWithOps {
  id: string;
  name: string;
  ticker?: string | null;
  type: string;
  operations: RawOperation[];
}

// ============================================
// Output types
// ============================================

export interface TaxOperationDetail {
  investmentId: string;
  investmentName: string;
  ticker?: string;
  tradeType: "day_trade" | "swing_trade";
  assetType: TaxableAssetType;
  date: string;
  quantity: number;
  sellPrice: number;
  avgPrice: number;
  saleTotal: number;
  gain: number;
  fees: number;
}

export interface TaxByTypeDetail {
  typeName: string;
  swingTrade: {
    sales: number;
    gains: number;
    losses: number;
    net: number;
    exempt: boolean;
    taxRate: number;
    tax: number;
  };
  dayTrade: {
    sales: number;
    gains: number;
    losses: number;
    net: number;
    taxRate: number;
    tax: number;
  };
  accumulatedLossUsed: number;
  accumulatedLossRemaining: number;
  irrf: number;
  taxDue: number;
}

export interface TaxCalculationResult {
  month: string;
  summary: {
    totalSales: number;
    totalGains: number;
    totalLosses: number;
    netResult: number;
    taxDue: number;
    irrf: number;
    taxPayable: number;
    hasTaxDue: boolean;
  };
  byType: Partial<Record<TaxableAssetType, TaxByTypeDetail>>;
  operations: TaxOperationDetail[];
  accumulatedLosses: Record<TaxableAssetType, number>;
}

// ============================================
// Average price reconstruction
// ============================================

/**
 * Replay all buy/sell operations chronologically to reconstruct
 * the average price at the moment of each sell.
 * Returns a map of operationId → avgPriceAtSell.
 */
export function reconstructAveragePrices(
  operations: RawOperation[]
): Map<string, number> {
  const sorted = [...operations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let totalCost = 0;
  let totalQty = 0;
  const avgPriceMap = new Map<string, number>();

  for (const op of sorted) {
    if (op.type === "buy" || op.type === "deposit") {
      const cost = op.quantity * op.price + (op.fees || 0);
      totalCost += cost;
      totalQty += op.quantity;
    } else if (op.type === "sell" || op.type === "withdraw") {
      const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;
      avgPriceMap.set(op.id, avgPrice);

      totalQty -= op.quantity;
      totalCost -= op.quantity * avgPrice;

      // Prevent floating point drift below zero
      if (totalQty <= 0) {
        totalQty = 0;
        totalCost = 0;
      }
    }
  }

  return avgPriceMap;
}

// ============================================
// Day trade classification
// ============================================

function getDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * For each sell operation, checks if there was a buy of the same
 * investmentId on the same calendar day.
 * Returns a Set of operationIds that are day trades.
 */
export function classifyDayTrades(
  sellOps: RawOperation[],
  allOps: RawOperation[]
): Set<string> {
  const dayTradeIds = new Set<string>();

  // Build a map: investmentId+dateKey → has buy?
  const buyDayMap = new Set<string>();
  for (const op of allOps) {
    if (op.type === "buy" || op.type === "deposit") {
      buyDayMap.add(`${op.investmentId}:${getDateKey(op.date)}`);
    }
  }

  for (const sell of sellOps) {
    const key = `${sell.investmentId}:${getDateKey(sell.date)}`;
    if (buyDayMap.has(key)) {
      dayTradeIds.add(sell.id);
    }
  }

  return dayTradeIds;
}

// ============================================
// Monthly tax calculation
// ============================================

export function calculateMonthTax(
  investments: InvestmentWithOps[],
  targetMonth: string, // "YYYY-MM"
  accumulatedLosses: Record<TaxableAssetType, number>
): TaxCalculationResult {
  // Collect all operations and sell ops for the target month
  const allOps: (RawOperation & { investmentName: string; ticker?: string; assetType: TaxableAssetType })[] = [];
  const monthSellOps: (RawOperation & { investmentName: string; ticker?: string; assetType: TaxableAssetType; avgPrice: number })[] = [];

  for (const inv of investments) {
    if (!isTaxableType(inv.type)) continue;
    const assetType = inv.type as TaxableAssetType;

    // Reconstruct average prices for this investment
    const avgPrices = reconstructAveragePrices(inv.operations);

    for (const op of inv.operations) {
      allOps.push({
        ...op,
        investmentName: inv.name,
        ticker: inv.ticker || undefined,
        assetType,
      });

      // Filter sells in the target month
      const opMonth = getDateKey(op.date).slice(0, 7); // "YYYY-MM"
      if ((op.type === "sell" || op.type === "withdraw") && opMonth === targetMonth) {
        monthSellOps.push({
          ...op,
          investmentName: inv.name,
          ticker: inv.ticker || undefined,
          assetType,
          avgPrice: avgPrices.get(op.id) || 0,
        });
      }
    }
  }

  // Classify day trades
  const dayTradeIds = classifyDayTrades(monthSellOps, allOps);

  // Build operation details
  const operations: TaxOperationDetail[] = monthSellOps.map((op) => {
    const tradeType: "day_trade" | "swing_trade" = dayTradeIds.has(op.id)
      ? "day_trade"
      : "swing_trade";
    const saleTotal = op.quantity * op.price;
    const gain = (op.price - op.avgPrice) * op.quantity - (op.fees || 0);

    return {
      investmentId: op.investmentId,
      investmentName: op.investmentName,
      ticker: op.ticker,
      tradeType,
      assetType: op.assetType,
      date: getDateKey(op.date),
      quantity: op.quantity,
      sellPrice: op.price,
      avgPrice: op.avgPrice,
      saleTotal,
      gain,
      fees: op.fees || 0,
    };
  });

  // Group by asset type
  const losses = { ...accumulatedLosses };
  const byType: Partial<Record<TaxableAssetType, TaxByTypeDetail>> = {};

  let totalSales = 0;
  let totalGains = 0;
  let totalLosses = 0;
  let totalTaxDue = 0;
  let totalIrrf = 0;

  for (const assetType of TAXABLE_TYPES) {
    const typeOps = operations.filter((op) => op.assetType === assetType);
    if (typeOps.length === 0) continue;

    const rules = TAX_RULES[assetType];

    // Separate swing trade and day trade
    const swingOps = typeOps.filter((op) => op.tradeType === "swing_trade");
    const dayOps = typeOps.filter((op) => op.tradeType === "day_trade");

    // Swing trade totals
    const swingSales = swingOps.reduce((sum, op) => sum + op.saleTotal, 0);
    const swingGains = swingOps.reduce((sum, op) => sum + Math.max(0, op.gain), 0);
    const swingLosses = swingOps.reduce((sum, op) => sum + Math.min(0, op.gain), 0);
    const swingNet = swingOps.reduce((sum, op) => sum + op.gain, 0);

    // Day trade totals
    const daySales = dayOps.reduce((sum, op) => sum + op.saleTotal, 0);
    const dayGains = dayOps.reduce((sum, op) => sum + Math.max(0, op.gain), 0);
    const dayLosses = dayOps.reduce((sum, op) => sum + Math.min(0, op.gain), 0);
    const dayNet = dayOps.reduce((sum, op) => sum + op.gain, 0);

    // Check exemption (swing trade only)
    // For stocks: exempt if total swing trade SALES < R$ 20.000
    // For crypto: exempt if ALL sales (swing+day) < R$ 35.000
    let swingExempt = false;
    if (rules.monthlyExemptionLimit > 0) {
      if (assetType === "crypto") {
        swingExempt = (swingSales + daySales) < rules.monthlyExemptionLimit;
      } else {
        swingExempt = swingSales < rules.monthlyExemptionLimit;
      }
    }

    // Calculate net after accumulated loss compensation
    let swingTaxableNet = swingExempt ? 0 : swingNet;
    let dayTaxableNet = dayNet;
    let lossUsed = 0;

    // Apply accumulated losses (only if there's a positive net)
    const currentLoss = losses[assetType] || 0;

    if (swingTaxableNet > 0 && currentLoss < 0) {
      const compensation = Math.min(swingTaxableNet, Math.abs(currentLoss));
      swingTaxableNet -= compensation;
      lossUsed += compensation;
      losses[assetType] = currentLoss + compensation;
    }

    if (dayTaxableNet > 0 && (losses[assetType] || 0) < 0) {
      const compensation = Math.min(dayTaxableNet, Math.abs(losses[assetType] || 0));
      dayTaxableNet -= compensation;
      lossUsed += compensation;
      losses[assetType] = (losses[assetType] || 0) + compensation;
    }

    // Add new losses to accumulated
    const monthNetLoss = (swingExempt ? 0 : Math.min(0, swingNet)) + Math.min(0, dayNet);
    if (monthNetLoss < 0) {
      losses[assetType] = (losses[assetType] || 0) + monthNetLoss;
    }

    // Calculate taxes
    const swingTax = Math.max(0, swingTaxableNet) * rules.swingTradeRate;
    const dayTax = Math.max(0, dayTaxableNet) * rules.dayTradeRate;
    const typeTaxDue = swingTax + dayTax;

    // IRRF
    const swingIrrf = swingSales * rules.swingTradeIrrfRate;
    const dayIrrf = daySales * rules.dayTradeIrrfRate;
    const typeIrrf = swingIrrf + dayIrrf;

    totalSales += swingSales + daySales;
    totalGains += swingGains + dayGains;
    totalLosses += swingLosses + dayLosses;
    totalTaxDue += typeTaxDue;
    totalIrrf += typeIrrf;

    byType[assetType] = {
      typeName: rules.label,
      swingTrade: {
        sales: swingSales,
        gains: swingGains,
        losses: swingLosses,
        net: swingNet,
        exempt: swingExempt,
        taxRate: rules.swingTradeRate,
        tax: swingTax,
      },
      dayTrade: {
        sales: daySales,
        gains: dayGains,
        losses: dayLosses,
        net: dayNet,
        taxRate: rules.dayTradeRate,
        tax: dayTax,
      },
      accumulatedLossUsed: lossUsed,
      accumulatedLossRemaining: losses[assetType] || 0,
      irrf: typeIrrf,
      taxDue: typeTaxDue,
    };
  }

  const netResult = totalGains + totalLosses;
  const taxPayable = Math.max(0, totalTaxDue - totalIrrf);

  return {
    month: targetMonth,
    summary: {
      totalSales,
      totalGains,
      totalLosses,
      netResult,
      taxDue: totalTaxDue,
      irrf: totalIrrf,
      taxPayable,
      hasTaxDue: taxPayable > 0,
    },
    byType,
    operations: operations.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    accumulatedLosses: { ...losses },
  };
}

// ============================================
// Accumulated losses replay
// ============================================

/**
 * Replay all months from the first sell to `upToMonth` (exclusive)
 * to compute accumulated losses for each asset type.
 */
export function computeAccumulatedLosses(
  investments: InvestmentWithOps[],
  upToMonth: string // "YYYY-MM" — exclusive (we calculate up to the month before)
): Record<TaxableAssetType, number> {
  // Collect all sell months
  const sellMonths = new Set<string>();

  for (const inv of investments) {
    if (!isTaxableType(inv.type)) continue;
    for (const op of inv.operations) {
      if (op.type === "sell" || op.type === "withdraw") {
        sellMonths.add(getDateKey(op.date).slice(0, 7));
      }
    }
  }

  // Sort months and filter those before upToMonth
  const sortedMonths = Array.from(sellMonths)
    .filter((m) => m < upToMonth)
    .sort();

  // Replay each month
  let losses: Record<TaxableAssetType, number> = {
    stock: 0,
    fii: 0,
    etf: 0,
    crypto: 0,
  };

  for (const month of sortedMonths) {
    const result = calculateMonthTax(investments, month, losses);
    losses = result.accumulatedLosses;
  }

  return losses;
}
