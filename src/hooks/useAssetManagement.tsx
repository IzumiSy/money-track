import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { FinancialAssets } from "@/components/FinancialAssetsForm";

export function useAssetManagement() {
  const { state, dispatch } = useSimulation();

  const setFinancialAssets = useCallback(
    (assets: FinancialAssets) => {
      dispatch({
        type: "SET_FINANCIAL_ASSETS",
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
