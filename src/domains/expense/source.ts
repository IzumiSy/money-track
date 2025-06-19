import { Expense } from "@/contexts/ExpensesContext";
import { YearMonthDuration } from "@/types/YearMonth";
import { CalculatorSource, createTimeRange, CashFlowChange } from "../shared";

interface ExpenseSource extends CalculatorSource {
  type: "living" | "housing" | "transport" | "entertainment" | "other";
}

/**
 * ExpenseContextのExpense型をExpenseCalculatorのExpenseSource型に変換
 */
export function convertExpenseToExpenseSource(expense: Expense): ExpenseSource {
  return {
    id: expense.id,
    name: expense.name,
    type: "living", // デフォルトでlivingタイプとする
    timeRange:
      expense.startYearMonth && expense.endYearMonth
        ? createTimeRange(expense.startYearMonth, expense.endYearMonth)
        : undefined,
    calculate: (year: number, month: number): CashFlowChange => {
      // 期間チェック
      if (expense.startYearMonth || expense.endYearMonth) {
        const targetYearMonth = YearMonthDuration.from(year, month);

        // 開始年月のチェック
        if (
          expense.startYearMonth &&
          !targetYearMonth.isAfterOrEqual(expense.startYearMonth)
        ) {
          return { income: 0, expense: 0 };
        }

        // 終了年月のチェック
        if (
          expense.endYearMonth &&
          !targetYearMonth.isBeforeOrEqual(expense.endYearMonth)
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
