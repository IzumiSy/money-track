import { Expense } from "@/contexts/ExpensesContext";
import { YearMonthDuration } from "@/types/YearMonth";
import { CalculatorSource, createTimeRange, CashFlowChange } from "../shared";

/**
 * ExpenseContextのExpense型をExpenseCalculatorのExpenseSource型に変換
 */
export function convertExpenseToExpenseSource(
  expense: Expense
): CalculatorSource {
  // 現在の年月を基準とする
  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1; // JavaScriptの月は0ベースなので+1

  return {
    id: expense.id,
    name: expense.name,
    type: "expense",
    timeRange:
      expense.startYearMonth && expense.endYearMonth
        ? createTimeRange(expense.startYearMonth, expense.endYearMonth)
        : undefined,
    calculate: (monthsFromStart: number): CashFlowChange => {
      // 期間チェック
      if (expense.startYearMonth || expense.endYearMonth) {
        // 相対月数から絶対年月を計算
        const totalMonths = baseYear * 12 + baseMonth - 1 + monthsFromStart;
        const targetYear = Math.floor(totalMonths / 12);
        const targetMonth = (totalMonths % 12) + 1;
        const targetYearMonth = YearMonthDuration.from(targetYear, targetMonth);

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
