import { useCallback } from "react";
import { useSimulation } from "@/features/simulator/context";
import { GroupedIncome } from "@/features/group/types";
import { SIMULATION_ACTION_TYPES } from "@/features/simulator/types";

export function useIncomeManagement() {
  const { state, dispatch } = useSimulation();

  const incomes = state.currentData.pluginData.income;

  const upsertIncomes = useCallback(
    (groupId: string, items: GroupedIncome[]) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPSERT_PLUGIN_DATA,
        payload: { pluginType: "income", groupId, items },
      });
    },
    [dispatch],
  );

  const getIncomesByGroupId = useCallback(
    (groupId: string) => {
      return incomes.filter((income) => income.groupId === groupId);
    },
    [incomes],
  );

  return {
    incomes,
    upsertIncomes,
    getIncomesByGroupId,
  };
}
