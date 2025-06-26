import { Income } from "@/contexts/IncomeContext";
import {
  CalculatorSource,
  CashFlowChange,
  createTimeRange,
  shouldOccurInMonth,
} from "@/domains/shared";
import { YearMonthDuration } from "@/types/YearMonth";

/**
 * IncomeContextのIncome型をIncomeCalculatorのIncomeSource型に変換
 * 注：year, monthは以下のいずれかの値として扱う：
 * - 相対的な値（1, 2, 3...）：シミュレーション開始からの年数
 * - 絶対的な値（2025, 2026...）：実際の年
 */
export function convertIncomeToIncomeSource(income: Income): CalculatorSource {
  return {
    id: income.id,
    name: income.name,
    type: "income",
    timeRange:
      income.startYearMonth && income.endYearMonth
        ? createTimeRange(income.startYearMonth, income.endYearMonth)
        : undefined,
    calculate: (year: number, month: number): CashFlowChange => {
      // 期間チェック（相対年月で比較）
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

      // サイクル設定のチェック
      if (income.cycleSetting?.enabled && income.startYearMonth) {
        const targetYearMonth = YearMonthDuration.from(year, month);
        if (
          !shouldOccurInMonth(
            income.startYearMonth,
            targetYearMonth,
            income.cycleSetting
          )
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
