"use client";

import { useMemo } from "react";
import {
  GroupedExpense,
  GroupedIncome,
  GroupedAsset,
  GroupedLiability,
} from "@/domains/group/types";
import { runFinancialSimulation } from "@/domains/simulation/financialSimulation";

interface UseFinancialSimulationProps {
  assets: GroupedAsset[];
  expenses?: GroupedExpense[];
  incomes?: GroupedIncome[];
  liabilities?: GroupedLiability[];
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
  liabilities = [],
  simulationYears,
  activeGroupIds,
}: UseFinancialSimulationProps) {
  return useMemo(() => {
    return runFinancialSimulation(
      assets,
      expenses,
      incomes,
      liabilities,
      simulationYears,
      activeGroupIds
    );
  }, [assets, expenses, incomes, liabilities, simulationYears, activeGroupIds]);
}
