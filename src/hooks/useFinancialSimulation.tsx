"use client";

import { useMemo } from "react";
import { FinancialAssets } from "@/components/FinancialAssetsForm";
import { GroupedExpense, GroupedIncome } from "@/domains/group/types";
import { runFinancialSimulation } from "@/domains/simulation/financialSimulation";

interface UseFinancialSimulationProps {
  assets: FinancialAssets;
  expenses?: GroupedExpense[];
  incomes?: GroupedIncome[];
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
