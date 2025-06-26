import { Expense } from "@/contexts/ExpensesContext";
import { CalculatorSource, CashFlowChange, isWithinTimeRange } from "../shared";

/**
 * ExpenseContextのExpense型をExpenseCalculatorのExpenseSource型に変換
 */
export function convertExpenseToExpenseSource(
  expense: Expense
): CalculatorSource {
  return {
    id: expense.id,
    name: expense.name,
    type: "expense",
    timeRange: expense.timeRange,
    calculate: (monthIndex: number): CashFlowChange => {
      // 期間チェック
      if (!isWithinTimeRange(expense.timeRange, monthIndex)) {
        return { income: 0, expense: 0 };
      }

      return { income: 0, expense: expense.monthlyAmount };
    },
    getMetadata: () => ({
      color: expense.color,
      originalExpense: expense,
    }),
  };
}
