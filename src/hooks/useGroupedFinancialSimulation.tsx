"use client";

import { useMemo } from "react";
import { FinancialAssets } from "@/components/FinancialAssetsForm";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { runGroupedFinancialSimulation } from "@/domains/simulation/groupedFinancialSimulation";

interface UseGroupedFinancialSimulationProps {
  assets: FinancialAssets;
  simulationYears: number;
  activeGroupIds: string[];
}

/**
 * グループ対応のファイナンシャルシミュレーションフック
 */
export function useGroupedFinancialSimulation({
  assets,
  simulationYears,
  activeGroupIds,
}: UseGroupedFinancialSimulationProps) {
  const { incomes, expenses } = useFinancialData();

  return useMemo(() => {
    return runGroupedFinancialSimulation({
      assets,
      incomes,
      expenses,
      simulationYears,
      activeGroupIds,
    });
  }, [assets, incomes, expenses, simulationYears, activeGroupIds]);
}
