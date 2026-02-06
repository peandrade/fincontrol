"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { formatDateForInput } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import type { TransactionType, CreateTransactionInput } from "@/types";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  value: z
    .number({ message: "Digite um valor válido" })
    .positive("O valor deve ser maior que zero"),
  category: z.string().min(1, "Selecione uma categoria"),
  description: z.string().optional(),
  date: z.string().min(1, "Selecione uma data"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: TransactionFormProps) {
  const { currencySymbol } = useCurrency();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      value: undefined,
      category: "",
      description: "",
      date: formatDateForInput(new Date()),
    },
  });

  const transactionType = watch("type") as TransactionType;

  const categories =
    transactionType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleFormSubmit = async (data: TransactionFormData) => {
    await onSubmit({
      ...data,
      date: new Date(data.date),
    });
    reset();
    onOpenChange(false);
  };

  const handleTypeChange = (type: TransactionType) => {
    setValue("type", type);
    setValue("category", "");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader className="p-6 pb-2">
          <ModalTitle>Nova Transação</ModalTitle>
          <ModalDescription>
            Adicione uma nova receita ou despesa
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalBody className="p-6 space-y-6">
            {}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`
                  flex-1 py-3 px-4 rounded-xl font-medium transition-all
                  ${
                    transactionType === "expense"
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }
                `}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`
                  flex-1 py-3 px-4 rounded-xl font-medium transition-all
                  ${
                    transactionType === "income"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }
                `}
              >
                Receita
              </button>
            </div>

            {}
            <Input
              type="number"
              step="0.01"
              label="Valor"
              placeholder="0,00"
              leftIcon={<span className="text-gray-500 text-sm">{currencySymbol}</span>}
              error={errors.value?.message}
              {...register("value", { valueAsNumber: true })}
            />

            {}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Categoria
              </label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger error={errors.category?.message}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category?.message && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>

            {}
            <Input
              type="date"
              label="Data"
              error={errors.date?.message}
              {...register("date")}
            />

            {}
            <Input
              type="text"
              label="Descrição (opcional)"
              placeholder="Ex: Compras do mês"
              {...register("description")}
            />
          </ModalBody>

          <ModalFooter className="p-6 pt-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Adicionar
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}