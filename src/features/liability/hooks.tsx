import { useCallback } from "react";
import { GroupedLiability } from "@/features/group/types";
import { useSimulation } from "@/features/simulator/context";
import { SIMULATION_ACTION_TYPES } from "@/features/simulator/types";

/**
 * 負債データ管理用フック
 * - グループごとの負債取得
 * - 負債の追加・更新・削除
 */
export function useLiabilityManagement() {
  const { state, dispatch } = useSimulation();

  const liabilities = state.currentData.pluginData.liability;

  // グループごとの負債一覧取得
  const getLiabilitiesByGroup = useCallback(
    (groupId: string): GroupedLiability[] => {
      return liabilities.filter((liability) => liability.groupId === groupId);
    },
    [liabilities],
  );

  // 負債の一括更新
  const upsertLiabilities = useCallback(
    (groupId: string, items: GroupedLiability[]) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPSERT_PLUGIN_DATA,
        payload: { pluginType: "liability", groupId, items },
      });
    },
    [dispatch],
  );

  return {
    liabilities,
    getLiabilitiesByGroup,
    upsertLiabilities,
  };
}
