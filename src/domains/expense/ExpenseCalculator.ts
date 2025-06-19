import { ExpenseSource } from "./types";
import { createCalculator, Calculator } from "@/domains/shared";

export type ExpenseCalculator = Calculator<ExpenseSource>;

/**
 * ExpenseCalculatorを作成する
 * 共通のcreateCalculatorを使用し、Expense特有のインターフェースでラップ
 */
export const createExpenseCalculator = (): ExpenseCalculator => {
  return createCalculator<ExpenseSource>();
};
