import { GroupedIncome } from "@/domains/group/types";
import {
  CalculatorSource,
  CashFlowChange,
  calculateCyclesForMonth,
} from "@/domains/shared";

/**
 * GroupedIncome型をIncomeCalculatorのIncomeSource型に変換
 */
export function convertIncomeToIncomeSource(
  income: GroupedIncome
): CalculatorSource {
  return {
    id: income.id,
    name: income.name,
    type: "income",
    calculate: (monthIndex: number): CashFlowChange => {
      const amount = calculateCyclesForMonth(income.cycles, monthIndex);
      return { income: amount, expense: 0 };
    },
    getMetadata: () => ({
      color: income.color,
      originalIncome: income,
      assetSourceId: income.assetSourceId,
    }),
  };
}
