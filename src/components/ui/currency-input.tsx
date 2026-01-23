"use client";

import { useState, useEffect, useRef } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  min?: number;
}

/**
 * Formata número para moeda brasileira (1.234,56)
 */
function formatToCurrency(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  if (!numbers) return "";

  // Converte para número e divide por 100 (para ter 2 casas decimais)
  const numValue = parseInt(numbers, 10) / 100;

  // Formata com separadores brasileiros
  return numValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte valor formatado para número (para salvar)
 */
function parseFromCurrency(formatted: string): string {
  if (!formatted) return "";

  // Remove pontos e troca vírgula por ponto
  const cleaned = formatted.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);

  if (isNaN(num)) return "";
  return num.toString();
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  required = false,
  disabled = false,
  autoFocus = false,
  min,
}: CurrencyInputProps) {
  // Estado interno para o valor formatado
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Quando o value externo muda, atualiza o display
  useEffect(() => {
    if (value) {
      // Converte o valor numérico para formatado
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setDisplayValue(
          numValue.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Formata o valor
    const formatted = formatToCurrency(inputValue);
    setDisplayValue(formatted);

    // Converte para número e passa para o onChange
    const numericValue = parseFromCurrency(formatted);
    onChange(numericValue);
  };

  const handleFocus = () => {
    // Seleciona todo o texto ao focar
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      min={min}
    />
  );
}
