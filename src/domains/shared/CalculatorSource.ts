import { TimeRange } from "./TimeRange";

/**
 * 共通のCalculatorソースインターフェース
 * IncomeSourceとExpenseSourceの基底となる型
 */
export interface CalculatorSource {
  id: string;
  name: string;
  type: string;
  timeRange?: TimeRange;
  calculate: (year: number, month: number) => number;
  getMetadata?: () => Record<string, any>;
}

/**
 * 内訳を表す共通型
 */
export interface CalculatorBreakdown {
  [sourceName: string]: number;
}

/**
 * 計算結果を表す共通型
 */
export interface CalculationResult {
  total: number;
  breakdown: CalculatorBreakdown;
  year: number;
  month: number;
}
