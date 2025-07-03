"use client";

import { useMemo } from "react";
import { FinancialAssets } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { runFinancialSimulation } from "@/domains/simulation/financialSimulation";

interface UseFinancialSimulationProps {
  assets: FinancialAssets;
  expenses?: Expense[];
  incomes?: Income[];
  simulationYears: number;
}

/**
 * 新しいIncomeCalculatorを使用したファイナンシャルシミュレーションフック
 * 既存のuseFinancialSimulationと同じインターフェースを維持
 */
export function useFinancialSimulation({
  assets,
  expenses = [],
  incomes = [],
  simulationYears,
}: UseFinancialSimulationProps) {
  return useMemo(() => {
    return runFinancialSimulation(assets, expenses, incomes, simulationYears);
  }, [assets, expenses, incomes, simulationYears]);
}
