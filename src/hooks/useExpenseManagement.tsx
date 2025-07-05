import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { GroupedExpense } from "@/domains/group/types";

export function useExpenseManagement() {
  const { state, dispatch } = useSimulation();

  const upsertExpenses = useCallback(
    (groupId: string, expenses: GroupedExpense[]) => {
      dispatch({
        type: "UPSERT_EXPENSES",
        payload: { groupId, expenses },
      });
    },
    [dispatch]
  );

  const setAllExpenses = useCallback(
    (expenses: GroupedExpense[]) => {
      dispatch({
        type: "SET_EXPENSES",
        payload: expenses,
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
    setAllExpenses,
    getExpensesByGroupId,
  };
}
