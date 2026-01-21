import { useCallback } from "react";
import { useSimulation } from "@/features/simulator/context";
import { GroupedExpense } from "@/features/group/types";
import { SIMULATION_ACTION_TYPES } from "@/features/simulator/types";

export function useExpenseManagement() {
  const { state, dispatch } = useSimulation();

  const expenses = state.currentData.pluginData.expense;

  const upsertExpenses = useCallback(
    (groupId: string, items: GroupedExpense[]) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPSERT_PLUGIN_DATA,
        payload: { pluginType: "expense", groupId, items },
      });
    },
    [dispatch],
  );

  const getExpensesByGroupId = useCallback(
    (groupId: string) => {
      return expenses.filter((expense) => expense.groupId === groupId);
    },
    [expenses],
  );

  return {
    expenses,
    upsertExpenses,
    getExpensesByGroupId,
  };
}
