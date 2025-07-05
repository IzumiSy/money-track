import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { GroupedIncome } from "@/domains/group/types";

export function useIncomeManagement() {
  const { state, dispatch } = useSimulation();

  const upsertIncomes = useCallback(
    (groupId: string, incomes: GroupedIncome[]) => {
      dispatch({
        type: "UPSERT_INCOMES",
        payload: { groupId, incomes },
      });
    },
    [dispatch]
  );

  const getIncomesByGroupId = useCallback(
    (groupId: string) => {
      return state.currentData.incomes.filter(
        (income) => income.groupId === groupId
      );
    },
    [state.currentData.incomes]
  );

  return {
    incomes: state.currentData.incomes,
    upsertIncomes,
    getIncomesByGroupId,
  };
}
