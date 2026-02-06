"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { usePreferences } from "./preferences-context";
import {
  formatCurrency as formatCurrencyUtil,
  formatCurrencyCompact as formatCurrencyCompactUtil,
  getCurrencySymbol as getCurrencySymbolUtil,
  convertToBRL as convertToBRLUtil,
  convertFromBRL as convertFromBRLUtil,
  type DisplayCurrency,
} from "@/lib/utils";

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
}

interface CurrencyContextType {
  /** Format a BRL value in the selected display currency */
  formatCurrency: (value: number) => string;
  /** Format a BRL value in compact form (e.g., $1.2k) */
  formatCurrencyCompact: (value: number) => string;
  /** Symbol of the selected currency (R$, $, etc.) */
  currencySymbol: string;
  /** Convert a value from display currency to BRL (for form submissions) */
  convertToBRL: (value: number) => number;
  /** Convert a BRL value to display currency */
  convertFromBRL: (value: number) => number;
  /** Currently selected display currency */
  displayCurrency: DisplayCurrency;
  /** Whether exchange rates are still loading */
  isLoadingRates: boolean;
  /** Error message if rates failed to load */
  ratesError: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { general } = usePreferences();
  const displayCurrency = general.displayCurrency || "BRL";

  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    if (displayCurrency === "BRL") {
      setRates(null);
      setRatesError(null);
      return;
    }

    setIsLoadingRates(true);
    setRatesError(null);

    try {
      const response = await fetch("/api/rates/exchange");
      const data = await response.json();

      if (data.success && data.rates) {
        setRates(data.rates);
      } else {
        setRatesError("Não foi possível obter taxas de câmbio. Exibindo em BRL.");
      }
    } catch {
      setRatesError("Não foi possível obter taxas de câmbio. Exibindo em BRL.");
    } finally {
      setIsLoadingRates(false);
    }
  }, [displayCurrency]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const currentRate = useMemo(() => {
    if (displayCurrency === "BRL" || !rates) return 1;
    return rates[displayCurrency] || 1;
  }, [displayCurrency, rates]);

  const effectiveCurrency = useMemo((): DisplayCurrency => {
    // Fallback to BRL if rates aren't available
    if (displayCurrency !== "BRL" && !rates) return "BRL";
    return displayCurrency;
  }, [displayCurrency, rates]);

  const formatCurrency = useCallback(
    (value: number) => formatCurrencyUtil(value, { currency: effectiveCurrency, rate: currentRate }),
    [effectiveCurrency, currentRate]
  );

  const formatCurrencyCompact = useCallback(
    (value: number) => formatCurrencyCompactUtil(value, { currency: effectiveCurrency, rate: currentRate }),
    [effectiveCurrency, currentRate]
  );

  const currencySymbol = useMemo(
    () => getCurrencySymbolUtil(effectiveCurrency),
    [effectiveCurrency]
  );

  const convertToBRL = useCallback(
    (value: number) => convertToBRLUtil(value, currentRate),
    [currentRate]
  );

  const convertFromBRL = useCallback(
    (value: number) => convertFromBRLUtil(value, currentRate),
    [currentRate]
  );

  const contextValue = useMemo<CurrencyContextType>(
    () => ({
      formatCurrency,
      formatCurrencyCompact,
      currencySymbol,
      convertToBRL,
      convertFromBRL,
      displayCurrency: effectiveCurrency,
      isLoadingRates,
      ratesError,
    }),
    [formatCurrency, formatCurrencyCompact, currencySymbol, convertToBRL, convertFromBRL, effectiveCurrency, isLoadingRates, ratesError]
  );

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
