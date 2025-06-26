import { Income } from "@/contexts/IncomeContext";
import {
  CalculatorSource,
  CashFlowChange,
  createTimeRange,
} from "@/domains/shared";
import { YearMonthDuration } from "@/types/YearMonth";

/**
 * IncomeContextのIncome型をIncomeCalculatorのIncomeSource型に変換
 */
export function convertIncomeToIncomeSource(income: Income): CalculatorSource {
  // 現在の年月を基準とする
  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1; // JavaScriptの月は0ベースなので+1

  return {
    id: income.id,
    name: income.name,
    type: "income",
    timeRange:
      income.startYearMonth && income.endYearMonth
        ? createTimeRange(income.startYearMonth, income.endYearMonth)
        : undefined,
    calculate: (monthsFromStart: number): CashFlowChange => {
      // 期間チェック
      if (income.startYearMonth || income.endYearMonth) {
        // 相対月数から絶対年月を計算
        const totalMonths = baseYear * 12 + baseMonth - 1 + monthsFromStart;
        const targetYear = Math.floor(totalMonths / 12);
        const targetMonth = (totalMonths % 12) + 1;
        const targetYearMonth = YearMonthDuration.from(targetYear, targetMonth);

        // 開始年月のチェック
        if (
          income.startYearMonth &&
          !targetYearMonth.isAfterOrEqual(income.startYearMonth)
        ) {
          return { income: 0, expense: 0 };
        }

        // 終了年月のチェック
        if (
          income.endYearMonth &&
          !targetYearMonth.isBeforeOrEqual(income.endYearMonth)
        ) {
          return { income: 0, expense: 0 };
        }
      }

      return { income: income.monthlyAmount, expense: 0 };
    },
    getMetadata: () => ({
      color: income.color,
      originalIncome: income,
    }),
  };
}
