import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { GroupedExpense } from "@/domains/group/types";
import { SIMULATION_ACTION_TYPES } from "@/types/simulation";

export function useExpenseManagement() {
  const { state, dispatch } = useSimulation();

  const upsertExpenses = useCallback(
    (groupId: string, expenses: GroupedExpense[]) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPSERT_EXPENSES,
        payload: { groupId, expenses },
      });
    },
    [dispatch]
  );

  const getExpensesByGroupId = useCallback(
    (groupId: string) => {
      return state.currentData.expenses.filter(
        (expense) => expense.groupId === groupId
      );
    },
    [state.currentData.expenses]
  );

  return {
    expenses: state.currentData.expenses,
    upsertExpenses,
    getExpensesByGroupId,
  };
}
