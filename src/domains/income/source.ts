import { Income } from "@/contexts/IncomeContext";
import {
  CalculatorSource,
  CashFlowChange,
  createTimeRange,
} from "@/domains/shared";
import { YearMonthDuration } from "@/types/YearMonth";

interface IncomeSource extends CalculatorSource {
  type: "salary" | "investment" | "business" | "rental";
}

/**
 * IncomeContextのIncome型をIncomeCalculatorのIncomeSource型に変換
 */
export function convertIncomeToIncomeSource(income: Income): IncomeSource {
  return {
    id: income.id,
    name: income.name,
    type: "salary", // デフォルトでsalaryタイプとする
    timeRange:
      income.startYearMonth && income.endYearMonth
        ? createTimeRange(income.startYearMonth, income.endYearMonth)
        : undefined,
    calculate: (year: number, month: number): CashFlowChange => {
      // 期間チェック
      if (income.startYearMonth || income.endYearMonth) {
        const targetYearMonth = YearMonthDuration.from(year, month);

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
