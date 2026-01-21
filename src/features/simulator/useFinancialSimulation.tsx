import { useMemo } from "react";
import { PluginDataStore } from "./types";
import { runFinancialSimulation } from "./financialSimulation";

interface UseFinancialSimulationProps {
  pluginData: PluginDataStore;
  simulationYears: number;
  activeGroupIds?: string[];
}

/**
 * ファイナンシャルシミュレーションフック
 * グループフィルタリング機能をサポート
 */
export function useFinancialSimulation({
  pluginData,
  simulationYears,
  activeGroupIds,
}: UseFinancialSimulationProps) {
  return useMemo(() => {
    return runFinancialSimulation(pluginData, simulationYears, activeGroupIds);
  }, [pluginData, simulationYears, activeGroupIds]);
}
