import { Expense } from "@/contexts/ExpensesContext";
import { CalculatorSource, CashFlowChange } from "../shared";

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
    calculate: (monthsFromStart: number): CashFlowChange => {
      // 期間チェック
      if (
        expense.startMonthsFromNow !== undefined ||
        expense.endMonthsFromNow !== undefined
      ) {
        // 開始時期のチェック
        if (
          expense.startMonthsFromNow !== undefined &&
          monthsFromStart < expense.startMonthsFromNow
        ) {
          return { income: 0, expense: 0 };
        }

        // 終了時期のチェック
        if (
          expense.endMonthsFromNow !== undefined &&
          monthsFromStart > expense.endMonthsFromNow
        ) {
          return { income: 0, expense: 0 };
        }
      }

      return { income: 0, expense: expense.monthlyAmount };
    },
    getMetadata: () => ({
      color: expense.color,
      originalExpense: expense,
    }),
  };
}
