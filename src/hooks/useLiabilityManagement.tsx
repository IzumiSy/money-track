import { useCallback } from "react";
import { GroupedLiability } from "@/domains/group/types";
import { useSimulation } from "@/contexts/SimulationContext";

/**
 * 負債データ管理用フック
 * - グループごとの負債取得
 * - 負債の追加・更新・削除
 */
export function useLiabilityManagement() {
  const { state, dispatch } = useSimulation();

  // グループごとの負債一覧取得
  const getLiabilitiesByGroup = useCallback(
    (groupId: string): GroupedLiability[] => {
      return state.currentData.liabilities
        ? state.currentData.liabilities.filter(
            (liability: GroupedLiability) => liability.groupId === groupId
          )
        : [];
    },
    [state.currentData.liabilities]
  );

  // 負債の一括更新
  const upsertLiabilities = useCallback(
    (groupId: string, liabilities: GroupedLiability[]) => {
      dispatch({
        type: "UPSERT_LIABILITIES",
        payload: { groupId, liabilities },
      });
    },
    [dispatch]
  );

  // 全負債データ
  const liabilities = state.currentData.liabilities || [];

  return {
    liabilities,
    getLiabilitiesByGroup,
    upsertLiabilities,
  };
}
