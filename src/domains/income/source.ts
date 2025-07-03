import { Income } from "@/contexts/IncomeContext";
import {
  CalculatorSource,
  CashFlowChange,
  calculateCyclesForMonth,
} from "@/domains/shared";

/**
 * IncomeContextのIncome型をIncomeCalculatorのIncomeSource型に変換
 */
export function convertIncomeToIncomeSource(income: Income): CalculatorSource {
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
    }),
  };
}
