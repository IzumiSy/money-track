import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { GroupedAsset } from "@/domains/group/types";
import { SIMULATION_ACTION_TYPES } from "@/types/simulation";

export function useAssetManagement() {
  const { state, dispatch } = useSimulation();

  const upsertAssets = useCallback(
    (groupId: string, assets: GroupedAsset[]) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPSERT_ASSETS,
        payload: { groupId, assets },
      });
    },
    [dispatch]
  );

  const getAssetsByGroupId = useCallback(
    (groupId: string) => {
      return state.currentData.financialAssets.filter(
        (asset) => asset.groupId === groupId
      );
    },
    [state.currentData.financialAssets]
  );

  return {
    assets: state.currentData.financialAssets,
    upsertAssets,
    getAssetsByGroupId,
  };
}
