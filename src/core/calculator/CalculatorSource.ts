import { CashFlowChange } from "./CashFlowChange";

/**
 * 共通のCalculatorソースインターフェース
 * IncomeSourceとExpenseSourceの基底となる型
 */
export interface CalculatorSource {
  id: string;
  name: string;
  type: string;
  calculate: (monthIndex: number) => CashFlowChange;
  getMetadata?: () => Record<string, unknown>;
}

/**
 * 内訳を表す共通型
 * 各ソースのCashFlowChangeを保持
 */
export interface CalculatorBreakdown {
  [sourceId: string]: CashFlowChange;
}

/**
 * 計算結果を表す共通型
 */
export interface CalculationResult {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number; // totalIncome - totalExpense
  breakdown: CalculatorBreakdown;
  monthIndex: number;
}
