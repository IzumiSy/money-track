import {
  ExpenseSource,
  ExpenseBreakdown,
  ExpenseCalculationResult,
} from "./types";
import { createCalculator, Calculator } from "@/domains/shared";

export interface ExpenseCalculator {
  addExpenseSource: (source: ExpenseSource) => void;
  removeExpenseSource: (id: string) => void;
  calculateTotalExpense: (year: number, month: number) => number;
  getExpenseBreakdown: (year: number, month: number) => ExpenseBreakdown;
  calculateExpenseForPeriod: (
    year: number,
    month: number
  ) => ExpenseCalculationResult;
  getSources: () => readonly ExpenseSource[];
  getSourceById: (id: string) => ExpenseSource | undefined;
}

/**
 * ExpenseCalculatorを作成する
 * 共通のcreateCalculatorを使用し、Expense特有のインターフェースでラップ
 */
export const createExpenseCalculator = (): ExpenseCalculator => {
  const calculator = createCalculator<ExpenseSource>();

  return {
    addExpenseSource: calculator.addSource,
    removeExpenseSource: calculator.removeSource,
    calculateTotalExpense: calculator.calculateTotal,
    getExpenseBreakdown: (year: number, month: number) => {
      return calculator.getBreakdown(year, month) as ExpenseBreakdown;
    },
    calculateExpenseForPeriod: (year: number, month: number) => {
      const result = calculator.calculateForPeriod(year, month);
      return {
        totalExpense: result.total,
        breakdown: result.breakdown as ExpenseBreakdown,
        year: result.year,
        month: result.month,
      } as ExpenseCalculationResult;
    },
    getSources: calculator.getSources,
    getSourceById: calculator.getSourceById,
  };
};
