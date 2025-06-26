import { Income } from "@/contexts/IncomeContext";
import {
  CalculatorSource,
  CashFlowChange,
  isWithinTimeRange,
} from "@/domains/shared";

/**
 * IncomeContextのIncome型をIncomeCalculatorのIncomeSource型に変換
 */
export function convertIncomeToIncomeSource(income: Income): CalculatorSource {
  return {
    id: income.id,
    name: income.name,
    type: "income",
    timeRange: income.timeRange,
    calculate: (monthIndex: number): CashFlowChange => {
      // 期間チェック
      if (!isWithinTimeRange(income.timeRange, monthIndex)) {
        return { income: 0, expense: 0 };
      }

      return { income: income.monthlyAmount, expense: 0 };
    },
    getMetadata: () => ({
      color: income.color,
      originalIncome: income,
    }),
  };
}
