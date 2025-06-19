import {
  IncomeSource,
  IncomeBreakdown,
  IncomeCalculationResult,
} from "./types";
import { createCalculator, Calculator } from "@/domains/shared";

export interface IncomeCalculator {
  addIncomeSource: (source: IncomeSource) => void;
  removeIncomeSource: (id: string) => void;
  calculateTotalIncome: (year: number, month: number) => number;
  getIncomeBreakdown: (year: number, month: number) => IncomeBreakdown;
  calculateIncomeForPeriod: (
    year: number,
    month: number
  ) => IncomeCalculationResult;
  getSources: () => readonly IncomeSource[];
  getSourceById: (id: string) => IncomeSource | undefined;
}

/**
 * IncomeCalculatorを作成する
 * 共通のcreateCalculatorを使用し、Income特有のインターフェースでラップ
 */
export const createIncomeCalculator = (): IncomeCalculator => {
  const calculator = createCalculator<IncomeSource>();

  return {
    addIncomeSource: calculator.addSource,
    removeIncomeSource: calculator.removeSource,
    calculateTotalIncome: calculator.calculateTotal,
    getIncomeBreakdown: (year: number, month: number) => {
      return calculator.getBreakdown(year, month) as IncomeBreakdown;
    },
    calculateIncomeForPeriod: (year: number, month: number) => {
      const result = calculator.calculateForPeriod(year, month);
      return {
        totalIncome: result.total,
        breakdown: result.breakdown as IncomeBreakdown,
        year: result.year,
        month: result.month,
      } as IncomeCalculationResult;
    },
    getSources: calculator.getSources,
    getSourceById: calculator.getSourceById,
  };
};
