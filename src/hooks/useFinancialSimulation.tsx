"use client";

import { useMemo } from "react";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { calculateFinancialSimulation } from "@/utils/financialSimulation";

interface UseFinancialSimulationProps {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomes?: Income[];
  simulationYears: number;
}

export function useFinancialSimulation({
  assets,
  expenses = [],
  incomes = [],
  simulationYears,
}: UseFinancialSimulationProps) {
  return useMemo(() => {
    return calculateFinancialSimulation({
      assets,
      expenses,
      incomes,
      simulationYears,
    });
  }, [assets, expenses, incomes, simulationYears]);
}
