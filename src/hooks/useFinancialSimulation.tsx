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
  activeGroupIds?: string[];
}

/**
 * ファイナンシャルシミュレーションフック
 * グループフィルタリング機能をサポート
 */
export function useFinancialSimulation({
  assets,
  expenses = [],
  incomes = [],
  simulationYears,
  activeGroupIds,
}: UseFinancialSimulationProps) {
  return useMemo(() => {
    return runFinancialSimulation(
      assets,
      expenses,
      incomes,
      simulationYears,
      activeGroupIds
    );
  }, [assets, expenses, incomes, simulationYears, activeGroupIds]);
}
