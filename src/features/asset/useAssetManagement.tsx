import { useCallback } from "react";
import { useSimulation } from "@/features/simulator/context";
import { GroupedAsset } from "@/features/group/types";
import { SIMULATION_ACTION_TYPES } from "@/features/simulator/types";

export function useAssetManagement() {
  const { state, dispatch } = useSimulation();

  const assets = state.currentData.pluginData.asset;

  const upsertAssets = useCallback(
    (groupId: string, items: GroupedAsset[]) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPSERT_PLUGIN_DATA,
        payload: { pluginType: "asset", groupId, items },
      });
    },
    [dispatch],
  );

  const getAssetsByGroupId = useCallback(
    (groupId: string) => {
      return assets.filter((asset) => asset.groupId === groupId);
    },
    [assets],
  );

  return {
    assets,
    upsertAssets,
    getAssetsByGroupId,
  };
}
