import { GroupedExpense } from "@/features/group/types";
import {
  CalculatorSource,
  CashFlowChange,
  calculateCyclesForMonth,
} from "@/core/calculator";

/**
 * GroupedExpense型をExpenseCalculatorのExpenseSource型に変換
 */
export function convertExpenseToExpenseSource(
  expense: GroupedExpense,
): CalculatorSource {
  return {
    id: expense.id,
    name: expense.name,
    type: "expense",
    calculate: (monthIndex: number): CashFlowChange => {
      const amount = calculateCyclesForMonth(expense.cycles, monthIndex);
      return { income: 0, expense: amount };
    },
    getMetadata: () => ({
      color: expense.color,
      originalExpense: expense,
      assetSourceId: expense.assetSourceId,
    }),
  };
}
