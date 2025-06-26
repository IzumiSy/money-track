import { Income } from "@/contexts/IncomeContext";
import { CalculatorSource, CashFlowChange } from "@/domains/shared";

/**
 * IncomeContextのIncome型をIncomeCalculatorのIncomeSource型に変換
 */
export function convertIncomeToIncomeSource(income: Income): CalculatorSource {
  return {
    id: income.id,
    name: income.name,
    type: "income",
    calculate: (monthsFromStart: number): CashFlowChange => {
      // 期間チェック
      if (
        income.startMonthsFromNow !== undefined ||
        income.endMonthsFromNow !== undefined
      ) {
        // 開始時期のチェック
        if (
          income.startMonthsFromNow !== undefined &&
          monthsFromStart < income.startMonthsFromNow
        ) {
          return { income: 0, expense: 0 };
        }

        // 終了時期のチェック
        if (
          income.endMonthsFromNow !== undefined &&
          monthsFromStart > income.endMonthsFromNow
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
