import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { FinancialAssets } from "@/components/FinancialAssetsForm";
import { SIMULATION_ACTION_TYPES } from "@/types/simulation";

export function useAssetManagement() {
  const { state, dispatch } = useSimulation();

  const setFinancialAssets = useCallback(
    (assets: FinancialAssets) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.SET_FINANCIAL_ASSETS,
        payload: assets,
      });
    },
    [dispatch]
  );

  return {
    financialAssets: state.currentData.financialAssets,
    setFinancialAssets,
  };
}
